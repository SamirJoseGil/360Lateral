"""
Señales para notificaciones relacionadas con lotes
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Lote
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=Lote)
def notificar_lote_match(sender, instance, created, **kwargs):
    """
    ✅ NUEVO: Notificar a developers cuando un lote coincida con su perfil
    """
    # Solo para lotes nuevos y verificados
    if not (created or instance.is_verified):
        return
    
    try:
        from apps.notifications.services import NotificationService
        
        # Obtener developers con perfil completo
        developers = User.objects.filter(
            role='developer',
            perfil_completo=True,
            is_active=True
        )
        
        logger.info(f"🔍 Buscando matches para lote {instance.id} entre {developers.count()} developers")
        
        for developer in developers:
            # Verificar si hay match (al menos 1 criterio)
            has_match = False
            match_reasons = []
            
            # Match por ciudad
            if developer.ciudades_interes:
                for ciudad in developer.ciudades_interes:
                    if (ciudad.lower() in (instance.barrio or '').lower() or 
                        ciudad.lower() in (instance.direccion or '').lower()):
                        has_match = True
                        match_reasons.append(f"ciudad ({ciudad})")
                        break
            
            # Match por uso de suelo
            if developer.usos_preferidos and instance.uso_suelo:
                for uso in developer.usos_preferidos:
                    if uso.lower() in instance.uso_suelo.lower():
                        has_match = True
                        match_reasons.append(f"uso ({uso})")
                        break
            
            # Match por modelo de pago (si está en metadatos)
            if developer.modelos_pago and instance.metadatos:
                modelo_lote = instance.metadatos.get('modelo_pago', '')
                for modelo in developer.modelos_pago:
                    if modelo.lower() in modelo_lote.lower():
                        has_match = True
                        match_reasons.append(f"modelo de pago ({modelo})")
                        break
            
            # ✅ Si hay match, crear notificación
            if has_match:
                match_text = ', '.join(match_reasons)
                NotificationService.notify_lote_recomendado(
                    user=developer,
                    lote=instance,
                    match_reasons=match_text
                )
                logger.info(f"✅ Notificación enviada a {developer.email} - Match: {match_text}")
    
    except ImportError:
        logger.warning("NotificationService no disponible")
    except Exception as e:
        logger.error(f"❌ Error notificando matches: {str(e)}")
