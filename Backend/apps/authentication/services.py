"""
Servicios para el módulo de autenticación
"""
import secrets
import string
from datetime import datetime, timedelta
import token
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class PasswordResetService:
    """Servicio para manejar el restablecimiento de contraseñas"""
    
    def __init__(self):
        self.token_expiry_hours = getattr(settings, 'PASSWORD_RESET_TIMEOUT_HOURS', 1)
    
    def generate_reset_token(self) -> str:
        """Genera un token seguro para restablecimiento de contraseña"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))
    
    def send_password_reset_email(self, email: str) -> bool:
        """
        Envía un correo de restablecimiento de contraseña
        
        Args:
            email: Dirección de correo electrónico
            
        Returns:
            bool: True si el correo se envió exitosamente
        """
        try:
            # Verificar si el usuario existe
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Por seguridad, no revelamos si el email existe
                logger.warning(f"Password reset requested for non-existent email: {email}")
                return True  # Devolvemos True para no revelar si el email existe
            
            # Generar token
            token = self.generate_reset_token()
            
            # Guardar token en cache con expiración
            cache_key = f"password_reset_{token}"
            cache.set(cache_key, {
                'user_id': user.id,
                'email': email,
                'created_at': datetime.now().isoformat()
            }, timeout=self.token_expiry_hours * 3600)
            
            # Construir URL de restablecimiento
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            
            # Preparar contenido del correo
            subject = "Restablecimiento de contraseña - 360Lateral"
            message = f"""
            Hola {user.first_name or user.username},
            
            Has solicitado restablecer tu contraseña en 360Lateral.
            
            Haz clic en el siguiente enlace para restablecer tu contraseña:
            {reset_url}
            
            Este enlace expirará en {self.token_expiry_hours} hora(s).
            
            Si no solicitaste este restablecimiento, puedes ignorar este correo.
            
            Saludos,
            El equipo de 360Lateral
            """
            
            # Enviar correo
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False
            )
            
            logger.info(f"Password reset email sent to: {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending password reset email to {email}: {str(e)}")
            return False
    
    def reset_password_with_token(self, token: str, new_password: str) -> bool:
        """
        Restablece la contraseña usando un token
        
        Args:
            token: Token de restablecimiento
            new_password: Nueva contraseña
            
        Returns:
            bool: True si el restablecimiento fue exitoso
        """
        try:
            # Verificar token en cache
            cache_key = f"password_reset_{token}"
            token_data = cache.get(cache_key)
            
            if not token_data:
                logger.warning(f"Invalid or expired password reset token: {token}")
                return False
            
            # Obtener usuario
            try:
                user = User.objects.get(id=token_data['user_id'])
            except User.DoesNotExist:
                logger.error(f"User not found for password reset: {token_data['user_id']}")
                return False
            
            # Cambiar contraseña
            user.set_password(new_password)
            user.save()
            
            # Eliminar token del cache
            cache.delete(cache_key)
            
            logger.info(f"Password reset successful for user: {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error resetting password with token {token}: {str(e)}")
            return False
    
    def cleanup_expired_tokens(self):
        """Limpia tokens expirados (para ser llamado por un cron job)"""
        # Esta función sería implementada según el backend de cache usado
        # Redis, Memcached, etc. tienen diferentes formas de limpiar claves expiradas
        logger.info("Token cleanup requested (implementation depends on cache backend)")
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
