"""
Modelos para la gestión de documentos en el sistema.
"""
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
import os
import uuid
import logging

logger = logging.getLogger(__name__)

def document_upload_path(instance, filename):
    """Determina la ruta de subida para los documentos"""
    ymd = timezone.now().strftime('%Y/%m/%d')
    uuid_name = uuid.uuid4().hex
    extension = os.path.splitext(filename)[1].lower()
    
    # ✅ MEJORADO: Organizar por tipo de documento
    doc_type = instance.document_type or 'otros'
    return f'documents/{doc_type}/{ymd}/{uuid_name}{extension}'


class Document(models.Model):
    """
    Modelo para documentos del sistema
    ✅ ESTADOS en metadata: pendiente, validado, rechazado
    """
    # ✅ CRÍTICO: Definir DOCUMENT_TYPES ANTES de usarlo en el campo
    DOCUMENT_TYPES = [
        ('ctl', 'Certificado de Tradición y Libertad'),
        ('planos', 'Planos Arquitectónicos'),
        ('topografia', 'Levantamiento Topográfico'),
        ('licencia_construccion', 'Licencia de Construcción'),
        ('escritura_publica', 'Escritura Pública'),
        ('certificado_libertad', 'Certificado de Libertad'),
        ('avaluo_comercial', 'Avalúo Comercial'),
        ('estudio_suelos', 'Estudio de Suelos'),
        ('otros', 'Otros Documentos'),
    ]
    
    VALIDATION_STATUS_CHOICES = [
        ('pendiente', 'Pendiente de Validación'),
        ('validado', 'Validado'),
        ('rechazado', 'Rechazado'),
    ]
    
    # ✅ Primary Key
    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False
    )
    
    # ✅ Campos básicos - título ahora es opcional
    title = models.CharField(
        "Título", 
        max_length=255, 
        blank=True,  # ✅ Opcional
        help_text="Título del documento (se genera automáticamente si no se proporciona)"
    )
    description = models.TextField(
        "Descripción", 
        blank=True, 
        null=True
    )
    
    # ✅ Archivo
    file = models.FileField(
        "Archivo", 
        upload_to=document_upload_path,
        help_text="Archivo del documento (máx. 10MB)"
    )
    
    # ✅ Tipo de documento - AHORA SÍ puede usar DOCUMENT_TYPES
    document_type = models.CharField(
        "Tipo de documento", 
        max_length=50, 
        choices=DOCUMENT_TYPES,  # ✅ CORREGIDO: Sin prefijo Document.
        default='otros',
        db_index=True
    )
    
    # ✅ RELACIONES - OneToMany con Lote
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='documents',
        verbose_name="Usuario"
    )
    
    lote = models.ForeignKey(
        'lotes.Lote', 
        on_delete=models.CASCADE,
        related_name='documents',
        null=True, 
        blank=True,
        verbose_name="Lote",
        db_index=True
    )
    
    # ✅ Metadatos
    created_at = models.DateTimeField("Fecha de creación", auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField("Última actualización", auto_now=True)
    file_size = models.PositiveIntegerField("Tamaño (bytes)", default=0)
    mime_type = models.CharField("Tipo MIME", max_length=100, blank=True, null=True)
    
    # ✅ Campos adicionales
    tags = models.JSONField("Etiquetas", default=list, blank=True)
    metadata = models.JSONField("Metadatos", default=dict, blank=True)
    is_active = models.BooleanField("Activo", default=True, db_index=True)
    
    # ✅ NUEVO: Campos para rastrear validación/rechazo
    validated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de Validación"
    )
    validated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents_validated',
        verbose_name="Validado por"
    )
    
    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"
        ordering = ['-created_at']
        db_table = 'documents_document'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['lote', '-created_at']),
            models.Index(fields=['document_type', 'is_active']),
        ]
    
    def __str__(self):
        return self.title or f"Documento {self.id}"
    
    def clean(self):
        """Validaciones del modelo"""
        super().clean()
        
        # ✅ Validar tamaño de archivo
        if self.file:
            max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024)
            if self.file.size > max_size:
                raise ValidationError({
                    'file': f'El archivo es demasiado grande. Máximo: {max_size / (1024 * 1024):.0f}MB'
                })
            
            # ✅ Validar extensión
            ext = os.path.splitext(self.file.name)[1].lower()
            allowed = getattr(settings, 'ALLOWED_DOCUMENT_EXTENSIONS', ['.pdf'])
            if ext not in allowed:
                raise ValidationError({
                    'file': f'Extensión no permitida. Permitidas: {", ".join(allowed)}'
                })
    
    def save(self, *args, **kwargs):
        """Override save para agregar metadatos automáticos"""
        # ✅ Generar título automáticamente si no se proporciona
        if not self.title:
            type_label = dict(self.DOCUMENT_TYPES).get(self.document_type, 'Documento')
            if self.lote:
                self.title = f"{type_label} - Lote {self.lote.nombre or self.lote.id}"
            else:
                self.title = f"{type_label} - {timezone.now().strftime('%Y-%m-%d')}"
        
        # ✅ Guardar tamaño del archivo
        if self.file and not self.file_size:
            self.file_size = self.file.size
        
        # ✅ Detectar MIME type
        if self.file and not self.mime_type:
            import mimetypes
            self.mime_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
        
        # ✅ Inicializar metadata si no existe
        if not self.metadata:
            self.metadata = {
                'validation_status': 'pendiente',
                'uploaded_at': timezone.now().isoformat(),
                'file_extension': os.path.splitext(self.file.name)[1].lower() if self.file else None
            }
        
        # ✅ Asegurar que validation_status existe
        if 'validation_status' not in self.metadata:
            self.metadata['validation_status'] = 'pendiente'
        
        super().save(*args, **kwargs)
        logger.info(f"Documento guardado: {self.id} - {self.title}")
    
    # ✅ MÉTODOS ÚTILES MEJORADOS
    def soft_delete(self):
        """Marcar como inactivo en lugar de eliminar"""
        self.is_active = False
        if not self.metadata:
            self.metadata = {}
        self.metadata['deleted_at'] = timezone.now().isoformat()
        self.save()
        logger.info(f"Documento {self.id} archivado (soft delete)")
    
    def validate_document(self, validated_by=None, comments=None):
        """Validar el documento"""
        if not self.metadata:
            self.metadata = {}
        
        self.metadata['validation_status'] = 'validado'
        self.metadata['validation_date'] = timezone.now().isoformat()
        if comments:
            self.metadata['validation_comments'] = comments
        
        self.validated_at = timezone.now()
        self.validated_by = validated_by
        
        self.save()
        logger.info(f"Documento {self.id} validado")
    
    def reject_document(self, reason, rejected_by=None):
        """Rechazar el documento"""
        if not self.metadata:
            self.metadata = {}
        
        self.metadata['validation_status'] = 'rechazado'
        self.metadata['validation_date'] = timezone.now().isoformat()
        self.metadata['rejection_reason'] = reason
        if rejected_by:
            self.metadata['rejected_by'] = str(rejected_by.id)
        
        self.save()
        logger.info(f"Documento {self.id} rechazado: {reason}")
    
    def reactivate(self):
        """Reactivar documento archivado"""
        self.is_active = True
        if self.metadata and 'deleted_at' in self.metadata:
            del self.metadata['deleted_at']
        self.save()
        logger.info(f"Documento {self.id} reactivado")
    
    @property
    def file_extension(self):
        """Retorna la extensión del archivo"""
        if self.file:
            return os.path.splitext(self.file.name)[1].lower()
        return None
    
    @property
    def validation_status(self):
        """Retorna el estado de validación"""
        return self.metadata.get('validation_status', 'pendiente') if self.metadata else 'pendiente'
    
    @property
    def is_validated(self):
        """Verifica si está validado"""
        return self.validation_status == 'validado'
    
    @property
    def is_rejected(self):
        """Verifica si está rechazado"""
        return self.validation_status == 'rechazado'
    
    @property
    def is_pending(self):
        """Verifica si está pendiente"""
        return self.validation_status == 'pendiente'
    
    def get_size_display(self):
        """Retorna el tamaño en formato legible"""
        if self.file_size == 0:
            return '0 Bytes'
        
        size = self.file_size
        for unit in ['Bytes', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.2f} {unit}"
            size /= 1024.0
        return f"{size:.2f} TB"
