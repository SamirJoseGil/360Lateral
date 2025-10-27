"""
Modelos para la gestión de documentos en el sistema.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
import os
import uuid

def document_upload_path(instance, filename):
    """Determina la ruta de subida para los documentos"""
    # Generar una ruta basada en la fecha y un UUID
    ymd = timezone.now().strftime('%Y/%m/%d')
    uuid_name = uuid.uuid4().hex
    extension = os.path.splitext(filename)[1].lower()
    return f'documents/{ymd}/{uuid_name}{extension}'

class Document(models.Model):
    """
    Modelo para representar documentos subidos al sistema
    ✅ CORREGIDO: Tipos de documento actualizados
    """
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
    
    # ✅ CRÍTICO: Usar UUIDField como primary key
    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False
    )
    
    title = models.CharField("Título", max_length=255)
    description = models.TextField("Descripción", blank=True, null=True)
    file = models.FileField("Archivo", upload_to=document_upload_path)
    document_type = models.CharField("Tipo de documento", max_length=50, choices=DOCUMENT_TYPES, default='otros')
    
    # Campos para relaciones
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    lote = models.ForeignKey('lotes.Lote', on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    
    # Campos de metadatos y control
    created_at = models.DateTimeField("Fecha de creación", auto_now_add=True)
    updated_at = models.DateTimeField("Última actualización", auto_now=True)
    file_size = models.PositiveIntegerField("Tamaño del archivo (bytes)", default=0)
    mime_type = models.CharField("Tipo MIME", max_length=100, blank=True, null=True)
    # ✅ CORREGIDO: Usar models.JSONField en lugar de models.models.JSONField
    tags = models.JSONField("Etiquetas", default=list, blank=True)
    metadata = models.JSONField("Metadatos adicionales", default=dict, blank=True)
    is_active = models.BooleanField("Activo", default=True)
    
    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"
        ordering = ['-created_at']
        
    def __str__(self):
        return self.title
        
    def save(self, *args, **kwargs):
        """Guardar metadata adicional al crear"""
        if self.file and not self.file_size:
            self.file_size = self.file.size
        
        if self.file and not self.mime_type:
            # Intentar detectar MIME type
            import mimetypes
            self.mime_type = mimetypes.guess_type(self.file.name)[0] or 'application/octet-stream'
        
        super().save(*args, **kwargs)
