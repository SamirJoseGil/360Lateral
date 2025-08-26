"""
Modelos para la aplicación de documentos.
"""
import os
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from apps.users.models import User
from apps.lotes.models import Lote

def documento_upload_path(instance, filename):
    """
    Genera la ruta donde se guardarán los documentos subidos.
    
    Args:
        instance: Instancia del documento que se está guardando
        filename: Nombre original del archivo
    
    Returns:
        Ruta relativa donde se guardará el documento
    """
    # Formato: documentos/tipo_documento/año/mes/lote_id_filename
    lote_id = instance.lote.id if instance.lote else 'sin_lote'
    extension = os.path.splitext(filename)[1]
    safe_filename = f"{instance.tipo.lower()}_{timezone.now().strftime('%Y%m%d%H%M%S')}{extension}"
    
    return f'documentos/{instance.tipo}/{timezone.now().year}/{timezone.now().month}/{lote_id}_{safe_filename}'

class Documento(models.Model):
    """
    Modelo para documentos relacionados con lotes.
    """
    
    # Opciones para el tipo de documento
    TIPO_CHOICES = (
        ('contrato', 'Contrato'),
        ('escritura', 'Escritura'),
        ('plano', 'Plano'),
        ('impuesto', 'Impuesto Predial'),
        ('avaluo', 'Avalúo'),
        ('estudio', 'Estudio de Suelos'),
        ('ambiental', 'Certificado Ambiental'),
        ('otro', 'Otro'),
    )
    
    # Opciones para el estado del documento
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('archived', 'Archivado'),
    )
    
    # Relaciones
    lote = models.ForeignKey(
        Lote, 
        on_delete=models.CASCADE,
        related_name='documentos',
        verbose_name=_("Lote asociado"),
        null=True,
        blank=True,
    )
    
    propietario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='documentos',
        verbose_name=_("Propietario"),
    )
    
    # Metadatos del documento
    nombre = models.CharField(
        _("Nombre del documento"),
        max_length=255,
    )
    
    tipo = models.CharField(
        _("Tipo de documento"),
        max_length=20,
        choices=TIPO_CHOICES,
        default='otro',
    )
    
    descripcion = models.TextField(
        _("Descripción"),
        blank=True,
        null=True,
    )
    
    # Archivo
    archivo = models.FileField(
        _("Archivo"),
        upload_to=documento_upload_path,
        max_length=500,
    )
    
    tamano = models.IntegerField(
        _("Tamaño en bytes"),
        null=True,
        blank=True,
    )
    
    tipo_mime = models.CharField(
        _("Tipo MIME"),
        max_length=100,
        null=True,
        blank=True,
    )
    
    # Estado del documento
    status = models.CharField(
        _("Estado"),
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending',
    )
    
    # Fechas
    fecha_subida = models.DateTimeField(
        _("Fecha de subida"),
        auto_now_add=True,
    )
    
    fecha_modificacion = models.DateTimeField(
        _("Fecha de última modificación"),
        auto_now=True,
    )
    
    fecha_aprobacion = models.DateTimeField(
        _("Fecha de aprobación"),
        null=True,
        blank=True,
    )
    
    # Metadatos adicionales
    notas = models.TextField(
        _("Notas adicionales"),
        blank=True,
        null=True,
    )
    
    # Campos para trazabilidad
    aprobado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='documentos_aprobados',
        verbose_name=_("Aprobado por"),
        null=True,
        blank=True,
    )
    
    class Meta:
        verbose_name = _("Documento")
        verbose_name_plural = _("Documentos")
        ordering = ['-fecha_subida']
    
    def __str__(self):
        return f"{self.nombre} - {self.get_tipo_display()} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """Sobrescribe el método save para establecer tamaño y tipo MIME."""
        if self.archivo and not self.tamano:
            try:
                self.tamano = self.archivo.size
                # Intentar determinar el tipo MIME
                import mimetypes
                mime_type, _ = mimetypes.guess_type(self.archivo.name)
                if mime_type:
                    self.tipo_mime = mime_type
            except:
                # Si hay algún error al obtener el tamaño, continuamos sin establecerlo
                pass
            
        # Si cambia el estado a aprobado, establecer la fecha de aprobación
        if self.status == 'approved' and not self.fecha_aprobacion:
            self.fecha_aprobacion = timezone.now()
            
        super().save(*args, **kwargs)
    
    def get_file_extension(self):
        """Devuelve la extensión del archivo."""
        return os.path.splitext(self.archivo.name)[1].lower() if self.archivo else ''
    
    def is_image(self):
        """Determina si el documento es una imagen."""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
        return self.get_file_extension() in image_extensions
    
    def is_pdf(self):
        """Determina si el documento es un PDF."""
        return self.get_file_extension() == '.pdf'
