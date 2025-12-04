"""
Modelo de notificaciones
"""
from django.db import models
from django.conf import settings
import uuid
import logging

logger = logging.getLogger(__name__)


class Notification(models.Model):
    """
    Notificaciones del sistema para usuarios
    """
    TIPO_CHOICES = [
        ('lote_aprobado', 'Lote Aprobado'),
        ('lote_rechazado', 'Lote Rechazado'),
        ('documento_validado', 'Documento Validado'),
        ('solicitud_respondida', 'Solicitud Respondida'),
        ('lote_recomendado', 'Lote Recomendado'),  # ✅ NUEVO
        ('mensaje', 'Mensaje'),
        ('sistema', 'Sistema'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('normal', 'Normal'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Usuario destinatario
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Usuario'
    )
    
    # Contenido
    type = models.CharField(
        max_length=50,
        choices=TIPO_CHOICES,
        verbose_name='Tipo',
        db_index=True
    )
    title = models.CharField(max_length=255, verbose_name='Título')
    message = models.TextField(verbose_name='Mensaje')
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal',
        verbose_name='Prioridad'
    )
    
    # Relaciones opcionales
    lote_id = models.UUIDField(null=True, blank=True, verbose_name='ID Lote')
    document_id = models.UUIDField(null=True, blank=True, verbose_name='ID Documento')
    solicitud_id = models.IntegerField(null=True, blank=True, verbose_name='ID Solicitud')
    
    # Metadata adicional
    data = models.JSONField(default=dict, blank=True, verbose_name='Datos Adicionales')
    action_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL de Acción'
    )
    
    # Estados
    is_read = models.BooleanField(default=False, verbose_name='Leída', db_index=True)
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Lectura')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    
    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
        db_table = 'notifications_notification'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email} ({'leída' if self.is_read else 'no leída'})"
    
    def mark_as_read(self):
        """Marcar notificación como leída"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
            logger.info(f"Notification {self.id} marked as read by {self.user.email}")
    
    def mark_as_unread(self):
        """Marcar notificación como no leída"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save()
            logger.info(f"Notification {self.id} marked as unread by {self.user.email}")
