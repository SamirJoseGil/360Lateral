"""
Servicios para autenticación
"""
import secrets
import logging
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)
User = get_user_model()


class PasswordResetService:
    """Servicio para gestionar restablecimiento de contraseñas"""
    
    def __init__(self):
        self.token_expiry = getattr(settings, 'PASSWORD_RESET_TOKEN_EXPIRY', 24)  # horas
        
    def generate_reset_token(self):
        """Genera un token seguro"""
        return secrets.token_urlsafe(32)
    
    def send_password_reset_email(self, email):
        """Envía email con enlace para restablecer contraseña"""
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                # No revelamos si el usuario existe o no
                logger.info(f"Password reset requested for non-existent email: {email}")
                return True
            
            # Generar token
            token = self.generate_reset_token()
            
            # Guardar token en DB o cache
            self._store_token(user, token)
            
            # Generar URL para reset (frontend debería manejar esto)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            
            # Enviar email
            self._send_email(user, reset_url)
            
            logger.info(f"Password reset email sent to: {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending password reset email: {str(e)}")
            return False
    
    def _store_token(self, user, token):
        """Almacena token en DB o cache con expiración"""
        # Este es un ejemplo básico, en producción usar JWT o un modelo dedicado
        from django.core.cache import cache
        
        # Guardar token con relación al usuario
        cache_key = f"pwd_reset_{token}"
        expiry = self.token_expiry * 3600  # convertir a segundos
        cache.set(cache_key, str(user.id), timeout=expiry)
    
    def _send_email(self, user, reset_url):
        """Envía el email con enlace de reset"""
        subject = "Restablecimiento de contraseña - Lateral 360°"
        
        # Contexto para la plantilla
        context = {
            'user': user,
            'reset_url': reset_url,
            'expiry_hours': self.token_expiry,
            'site_name': 'Lateral 360°',
        }
        
        # Renderizar mensaje desde plantilla
        try:
            message_html = render_to_string('authentication/password_reset_email.html', context)
            message_text = render_to_string('authentication/password_reset_email.txt', context)
        except Exception:
            # Si la plantilla no existe, usar mensaje plano
            message_text = f"""
            Hola {user.get_full_name() or user.email},
            
            Has solicitado restablecer tu contraseña en Lateral 360°.
            
            Haz clic en el siguiente enlace para crear una nueva contraseña:
            {reset_url}
            
            Este enlace expirará en {self.token_expiry} horas.
            
            Si no solicitaste este cambio, puedes ignorar este correo.
            
            Saludos,
            Equipo Lateral 360°
            """
            message_html = message_text.replace('\n', '<br>')
        
        # Enviar email
        send_mail(
            subject=subject,
            message=message_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=message_html,
            fail_silently=False,
        )
    
    def reset_password_with_token(self, token, new_password):
        """Restablece contraseña usando un token"""
        try:
            # Verificar token en DB o cache
            user_id = self._verify_token(token)
            if not user_id:
                logger.warning(f"Invalid or expired password reset token used: {token[:8]}...")
                return False
            
            # Obtener usuario
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                logger.error(f"User not found for password reset token: {token[:8]}...")
                return False
            
            # Cambiar contraseña
            user.set_password(new_password)
            user.save()
            
            # Invalidar token
            self._invalidate_token(token)
            
            logger.info(f"Password reset successful for user: {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}")
            return False
    
    def _verify_token(self, token):
        """Verifica token y devuelve ID del usuario si es válido"""
        from django.core.cache import cache
        
        # Recuperar token de cache
        cache_key = f"pwd_reset_{token}"
        user_id = cache.get(cache_key)
        
        return user_id
    
    def _invalidate_token(self, token):
        """Invalida un token para que no pueda volver a usarse"""
        from django.core.cache import cache
        
        # Eliminar token de cache
        cache_key = f"pwd_reset_{token}"
        cache.delete(cache_key)
