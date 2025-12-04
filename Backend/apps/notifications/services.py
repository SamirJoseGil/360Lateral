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
    
    # ✅ NUEVO: Notificaciones para Análisis Urbanístico
    
    @staticmethod
    def notify_nueva_solicitud_analisis(analisis):
        """
        Notifica a los admins sobre una nueva solicitud de análisis
        """
        from apps.users.models import User
        
        try:
            # Notificar a todos los admins
            admins = User.objects.filter(role='admin', is_active=True)
            
            for admin in admins:
                NotificationService.create_notification(
                    user=admin,
                    type='analisis_solicitado',
                    title='Nueva Solicitud de Análisis',
                    message=f"Nueva solicitud de análisis {analisis.get_tipo_analisis_display()} "
                            f"para el lote {analisis.lote.nombre} por {analisis.solicitante.get_full_name()}",
                    priority='high',
                    action_url=f'/admin/analisis/{analisis.id}',
                    data={
                        'analisis_id': str(analisis.id),
                        'tipo': analisis.tipo_analisis,
                        'lote_id': str(analisis.lote.id),
                        'solicitante': analisis.solicitante.email
                    }
                )
            
            logger.info(f"✅ Admins notificados sobre nueva solicitud de análisis {analisis.id}")
            
        except Exception as e:
            logger.error(f"Error notificando nueva solicitud de análisis: {str(e)}")
    
    @staticmethod
    def notify_analisis_completado(analisis):
        """
        Notifica al propietario que su análisis está completado
        """
        try:
            NotificationService.create_notification(
                user=analisis.solicitante,
                type='analisis_completado',
                title='¡Análisis Completado! 🎉',
                message=f"Tu análisis {analisis.get_tipo_analisis_display()} "
                        f"para el lote {analisis.lote.nombre} está listo para revisar.",
                priority='high',
                action_url=f'/owner/analisis/{analisis.id}',
                data={
                    'analisis_id': str(analisis.id),
                    'tipo': analisis.tipo_analisis,
                    'lote_id': str(analisis.lote.id),
                    'fecha_completado': analisis.fecha_completado.isoformat() if analisis.fecha_completado else None
                }
            )
            
            logger.info(f"✅ Propietario notificado: análisis {analisis.id} completado")
            
        except Exception as e:
            logger.error(f"Error notificando análisis completado: {str(e)}")
    
    @staticmethod
    def notify_analisis_rechazado(analisis, motivo):
        """
        Notifica al propietario que su análisis fue rechazado
        """
        try:
            NotificationService.create_notification(
                user=analisis.solicitante,
                type='analisis_rechazado',
                title='Análisis Rechazado',
                message=f"Tu solicitud de análisis {analisis.get_tipo_analisis_display()} "
                        f"para el lote {analisis.lote.nombre} fue rechazada.\n\n"
                        f"Motivo: {motivo}",
                priority='high',
                action_url=f'/owner/analisis/{analisis.id}',
                data={
                    'analisis_id': str(analisis.id),
                    'tipo': analisis.tipo_analisis,
                    'lote_id': str(analisis.lote.id),
                    'motivo': motivo
                }
            )
            
            logger.info(f"✅ Propietario notificado: análisis {analisis.id} rechazado")
            
        except Exception as e:
            logger.error(f"Error notificando análisis rechazado: {str(e)}")
    
    @staticmethod
    def notify_lote_recomendado(user, lote, match_reasons):
        """
        ✅ NUEVO: Notificar recomendación de lote
        
        Args:
            user: Usuario developer
            lote: Lote que coincide
            match_reasons: String con razones del match
        """
        from .models import Notification
        
        notification = Notification.objects.create(
            user=user,
            tipo='lote_recomendado',
            titulo=f'🎯 Nuevo lote recomendado: {lote.nombre or lote.cbml}',
            mensaje=f'Encontramos un lote que coincide con tu perfil por: {match_reasons}.',
            link=f'/developer/lote/{lote.id}',
            metadata={
                'lote_id': str(lote.id),
                'lote_nombre': lote.nombre,
                'lote_direccion': lote.direccion,
                'lote_area': str(lote.area),
                'match_reasons': match_reasons,
                'accion': 'ver_lote'
            }
        )
        
        logger.info(f"✅ Notificación de recomendación creada para {user.email}")
        return notification
