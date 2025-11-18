"""
Modelos para el módulo de solicitudes
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class Solicitud(models.Model):
    """
    Modelo para solicitudes de usuario (soporte, análisis, consultas)
    """
    
    TIPO_CHOICES = [
        ('soporte_tecnico', 'Soporte Técnico'),
        ('analisis_urbanistico', 'Análisis Urbanístico'),
        ('consulta_general', 'Consulta General'),
        ('validacion_documentos', 'Validación de Documentos'),
        ('correccion_datos', 'Corrección de Datos'),
        ('acceso', 'Solicitud de Acceso'),
        ('funcionalidad', 'Solicitud de Funcionalidad'),
        ('otro', 'Otro')
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_revision', 'En Revisión'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('completado', 'Completado')
    ]
    
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('normal', 'Normal'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente')
    ]
    
    # Campos principales
    id = models.AutoField(primary_key=True)
    
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solicitudes',
        verbose_name='Usuario'
    )
    
    lote = models.ForeignKey(
        'lotes.Lote',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes',
        verbose_name='Lote Relacionado'
    )
    
    tipo = models.CharField(
        max_length=50,
        choices=TIPO_CHOICES,
        default='consulta_general',
        verbose_name='Tipo de Solicitud',
        db_index=True
    )
    
    titulo = models.CharField(
        max_length=255,
        verbose_name='Título'
    )
    
    descripcion = models.TextField(
        verbose_name='Descripción'
    )
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado',
        db_index=True
    )
    
    prioridad = models.CharField(
        max_length=10,
        choices=PRIORIDAD_CHOICES,
        default='normal',
        verbose_name='Prioridad'
    )
    
    # Revisión
    revisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_revisadas',
        verbose_name='Revisor'
    )
    
    notas_revision = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas de Revisión'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )
    
    resuelta_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Resolución'
    )
    
    # Metadatos
    metadatos = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadatos Adicionales'
    )
    
    class Meta:
        verbose_name = 'Solicitud'
        verbose_name_plural = 'Solicitudes'
        ordering = ['-prioridad', '-created_at']
        db_table = 'solicitudes_solicitud'
        indexes = [
            models.Index(fields=['usuario', 'estado']),
            models.Index(fields=['tipo', 'estado']),
            models.Index(fields=['lote', 'estado']),
            models.Index(fields=['prioridad', '-created_at']),
        ]
    
    def __str__(self):
        lote_info = f" - {self.lote.nombre}" if self.lote else ""
        return f"{self.get_tipo_display()} - {self.titulo}{lote_info}"
    
    def save(self, *args, **kwargs):
        """Override para marcar fecha de resolución"""
        if self.pk:
            old = Solicitud.objects.get(pk=self.pk)
            if old.estado != self.estado and self.estado in ['completado', 'rechazado']:
                self.resuelta_at = timezone.now()
        
        super().save(*args, **kwargs)
        logger.info(f"Solicitud {self.pk} guardada: {self.titulo}")
    
    @property
    def esta_resuelta(self):
        """Verifica si está resuelta"""
        return self.estado in ['completado', 'rechazado']
    
    @property
    def esta_pendiente(self):
        """Verifica si está pendiente"""
        return self.estado == 'pendiente'
