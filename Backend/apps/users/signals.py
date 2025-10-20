"""
Signals para el módulo de usuarios
Maneja eventos automáticos relacionados con usuarios
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from .models import User, UserProfile

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crea automáticamente un perfil cuando se crea un nuevo usuario.
    
    Args:
        sender: Modelo que envía la señal (User)
        instance: Instancia del usuario creado
        created: Boolean indicando si es una creación nueva
    """
    if created:
        try:
            UserProfile.objects.create(user=instance)
            logger.info(f"Profile created for user: {instance.email}")
        except Exception as e:
            logger.error(f"Error creating profile for user {instance.email}: {str(e)}")


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Guarda el perfil del usuario cuando el usuario se actualiza.
    
    Args:
        sender: Modelo que envía la señal (User)
        instance: Instancia del usuario
    """
    try:
        # Verificar si el perfil existe antes de guardarlo
        if hasattr(instance, 'profile'):
            instance.profile.save()
            logger.debug(f"Profile saved for user: {instance.email}")
    except UserProfile.DoesNotExist:
        # Si no existe el perfil, crearlo
        logger.warning(f"Profile didn't exist for user {instance.email}, creating it")
        UserProfile.objects.create(user=instance)
    except Exception as e:
        logger.error(f"Error saving profile for user {instance.email}: {str(e)}")
