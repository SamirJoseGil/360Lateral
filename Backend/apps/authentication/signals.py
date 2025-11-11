"""
Signals para autenticación
"""
import logging
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.conf import settings
from django.core.exceptions import ValidationError

logger = logging.getLogger('security')


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log cuando un usuario inicia sesión exitosamente"""
    if not request:
        return
    
    ip = _get_client_ip(request)
    logger.info(
        f"Successful login: User '{user.email}' from IP {ip}"
    )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log cuando un usuario cierra sesión"""
    if not user or not request:
        return
    
    ip = _get_client_ip(request)
    logger.info(
        f"User logged out: '{user.email}' from IP {ip}"
    )


@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs):
    """Log cuando falla un intento de inicio de sesión"""
    if not request:
        return
        
    # No incluimos credenciales completas por seguridad
    username = credentials.get('username', '')
    username_safe = f"{username[:3]}{'*' * (len(username) - 3)}" if len(username) > 3 else "***"
    
    ip = _get_client_ip(request)
    logger.warning(
        f"Failed login attempt for '{username_safe}' from IP {ip}"
    )


@receiver(pre_save, sender='users.User')
def handle_user_company_validation(sender, instance, **kwargs):
    """Handle company_name validation to make it optional during registration"""
    
    # Skip company validation if flag is set
    if hasattr(instance, '_skip_company_validation') and instance._skip_company_validation:
        # Set default values for company fields to prevent validation errors
        if hasattr(instance, 'company_name') and not instance.company_name:
            instance.company_name = ""
        if hasattr(instance, 'company') and not instance.company:
            instance.company = ""
        
        # Temporarily override the clean method to skip company validation
        original_clean = instance.clean
        
        def skip_company_clean():
            try:
                original_clean()
            except ValidationError as e:
                # Filter out company_name validation errors during registration
                if hasattr(e, 'error_dict') and 'company_name' in e.error_dict:
                    error_dict = e.error_dict.copy()
                    del error_dict['company_name']
                    if error_dict:  # If there are other validation errors, raise them
                        raise ValidationError(error_dict)
                else:
                    raise e
        
        instance.clean = skip_company_clean


def _get_client_ip(request):
    """Obtener IP del cliente de forma segura"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')
    return ip
