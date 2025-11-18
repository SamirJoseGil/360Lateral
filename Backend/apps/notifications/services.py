"""
Servicio para crear y gestionar notificaciones
"""
from django.utils import timezone
from .models import Notification
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Servicio centralizado para crear notificaciones
    """
    
    @staticmethod
    def create_notification(user, type, title, message, **kwargs):
        """
        Crea una notificación para un usuario
        
        Args:
            user: Usuario destinatario
            type: Tipo de notificación
            title: Título de la notificación
            message: Mensaje de la notificación
            **kwargs: Campos opcionales (priority, lote_id, document_id, etc.)
        
        Returns:
            Notification: Notificación creada
        """
        try:
            notification = Notification.objects.create(
                user=user,
                type=type,
                title=title,
                message=message,
                priority=kwargs.get('priority', 'normal'),
                lote_id=kwargs.get('lote_id'),
                document_id=kwargs.get('document_id'),
                solicitud_id=kwargs.get('solicitud_id'),
                data=kwargs.get('data', {}),
                action_url=kwargs.get('action_url')
            )
            
            logger.info(f"✅ Notification created: {type} for {user.email}")
            return notification
            
        except Exception as e:
            logger.error(f"❌ Error creating notification: {str(e)}")
            return None
    
    # ✅ Métodos específicos para cada tipo de evento - RUTAS CORREGIDAS
    
    @staticmethod
    def notify_lote_aprobado(lote):
        """Notificar cuando un lote es aprobado"""
        return NotificationService.create_notification(
            user=lote.owner,
            type='lote_aprobado',
            title='🎉 Lote Aprobado',
            message=f'Tu lote "{lote.nombre}" ha sido aprobado y ya está activo en el sistema.',
            priority='high',
            lote_id=lote.id,
            action_url=f'/owner/lote/{lote.id}',  # ✅ CORREGIDO: /owner/lote/{id}
            data={
                'lote_nombre': lote.nombre,
                'lote_direccion': lote.direccion
            }
        )
    
    @staticmethod
    def notify_lote_rechazado(lote, reason):
        """Notificar cuando un lote es rechazado"""
        return NotificationService.create_notification(
            user=lote.owner,
            type='lote_rechazado',
            title='❌ Lote Rechazado',
            message=f'Tu lote "{lote.nombre}" fue rechazado. Razón: {reason}',
            priority='high',
            lote_id=lote.id,
            action_url=f'/owner/lote/{lote.id}',  # ✅ CORREGIDO: /owner/lote/{id}
            data={
                'lote_nombre': lote.nombre,
                'razon_rechazo': reason
            }
        )
    
    @staticmethod
    def notify_documento_validado(document):
        """Notificar cuando un documento es validado"""
        # ✅ Determinar la ruta según el lote asociado
        action_url = None
        if document.lote_id:
            action_url = f'/owner/lote/{document.lote_id}/documentos'  # ✅ CORREGIDO: con /documentos
        
        return NotificationService.create_notification(
            user=document.user,
            type='documento_validado',
            title='✅ Documento Validado',
            message=f'Tu documento "{document.title}" ha sido validado.',
            priority='normal',
            document_id=document.id,
            lote_id=document.lote_id,
            action_url=action_url,
            data={
                'documento_titulo': document.title,
                'documento_tipo': document.document_type
            }
        )
    
    @staticmethod
    def notify_documento_rechazado(document, reason):
        """Notificar cuando un documento es rechazado"""
        # ✅ Determinar la ruta según el lote asociado
        action_url = None
        if document.lote_id:
            action_url = f'/owner/lote/{document.lote_id}/documentos'  # ✅ CORREGIDO: con /documentos
        
        return NotificationService.create_notification(
            user=document.user,
            type='documento_rechazado',
            title='❌ Documento Rechazado',
            message=f'Tu documento "{document.title}" fue rechazado. Razón: {reason}',
            priority='high',
            document_id=document.id,
            lote_id=document.lote_id,
            action_url=action_url,
            data={
                'documento_titulo': document.title,
                'razon_rechazo': reason
            }
        )
    
    @staticmethod
    def notify_solicitud_respondida(solicitud):
        """Notificar cuando una solicitud es respondida"""
        return NotificationService.create_notification(
            user=solicitud.user,
            type='solicitud_respondida',
            title='💬 Solicitud Respondida',
            message=f'Tu solicitud "{solicitud.title}" ha sido actualizada a: {solicitud.get_status_display()}.',
            priority='normal',
            solicitud_id=solicitud.id,
            action_url='/owner/solicitudes',  # ✅ CORREGIDO: /owner/solicitudes
            data={
                'solicitud_titulo': solicitud.title,
                'nuevo_estado': solicitud.status,
                'estado_display': solicitud.get_status_display()
            }
        )
    
    @staticmethod
    def get_unread_count(user):
        """Obtener conteo de notificaciones no leídas"""
        return Notification.objects.filter(user=user, is_read=False).count()
    
    @staticmethod
    def mark_all_as_read(user):
        """Marcar todas las notificaciones como leídas"""
        updated = Notification.objects.filter(
            user=user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        logger.info(f"Marked {updated} notifications as read for {user.email}")
        return updated
