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
    """
    DOCUMENT_TYPES = [
        ('general', 'General'),
        ('plano', 'Plano'),
        ('contrato', 'Contrato'),
        ('licencia', 'Licencia'),
        ('factura', 'Factura'),
        ('otro', 'Otro'),
    ]
    
    title = models.CharField("Título", max_length=255)
    description = models.TextField("Descripción", blank=True, null=True)
    file = models.FileField("Archivo", upload_to=document_upload_path)
    document_type = models.CharField("Tipo de documento", max_length=50, choices=DOCUMENT_TYPES, default='general')
    
    # Campos para relaciones
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    lote = models.ForeignKey('lotes.Lote', on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    
    # Campos de metadatos y control
    created_at = models.DateTimeField("Fecha de creación", auto_now_add=True)
    updated_at = models.DateTimeField("Última actualización", auto_now=True)
    file_size = models.PositiveIntegerField("Tamaño del archivo (bytes)", default=0)
    mime_type = models.CharField("Tipo MIME", max_length=100, blank=True, null=True)
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
        # Si es un objeto nuevo, calcular el tamaño del archivo
        if self.pk is None and self.file:
            self.file_size = self.file.size
            
            # Detectar el tipo MIME basado en la extensión
            filename = self.file.name
            ext = os.path.splitext(filename)[1].lower()
            mime_map = {
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.dwg': 'application/acad',
                '.dxf': 'application/dxf',
            }
            self.mime_type = mime_map.get(ext, 'application/octet-stream')
        
        super().save(*args, **kwargs)
