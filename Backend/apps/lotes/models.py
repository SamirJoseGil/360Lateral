"""
Modelos para el módulo de lotes
Define Lote, LoteDocument, LoteHistory, Favorite, Tratamiento
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import uuid
import logging
from django.utils import timezone

User = get_user_model()
logger = logging.getLogger(__name__)


class Lote(models.Model):
    """
    Modelo simplificado de Lote - CORREGIDO sin campo comuna
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # ✅ CAMPOS ESENCIALES (obligatorios)
    nombre = models.CharField(
        max_length=200,
        help_text="Nombre identificativo del lote"
    )
    direccion = models.CharField(
        max_length=500,
        help_text="Dirección completa del lote"
    )
    area = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Área del lote en metros cuadrados"
    )
    
    # ✅ CAMPOS IMPORTANTES (opcionales)
    cbml = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Código CBML del lote"
    )
    matricula = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Matrícula inmobiliaria"
    )
    codigo_catastral = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Código catastral"
    )
    descripcion = models.TextField(
        blank=True, 
        null=True,
        help_text="Descripción detallada del lote"
    )
    barrio = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Barrio donde se ubica el lote"
    )
    estrato = models.IntegerField(
        blank=True, 
        null=True,
        choices=[
            (1, 'Estrato 1'),
            (2, 'Estrato 2'),
            (3, 'Estrato 3'),
            (4, 'Estrato 4'),
            (5, 'Estrato 5'),
            (6, 'Estrato 6'),
        ],
        help_text="Estrato socioeconómico"
    )
    
    # ✅ CAMPOS AUTOMÁTICOS (se llenan después, todos opcionales)
    latitud = models.DecimalField(
        max_digits=10, 
        decimal_places=8, 
        blank=True, 
        null=True,
        help_text="Coordenada de latitud"
    )
    longitud = models.DecimalField(
        max_digits=11, 
        decimal_places=8, 
        blank=True, 
        null=True,
        help_text="Coordenada de longitud"
    )
    clasificacion_suelo = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Clasificación del suelo según POT"
    )
    uso_suelo = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Uso permitido del suelo"
    )
    tratamiento_pot = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Tratamiento urbanístico según POT"
    )
    
    # ✅ CAMPOS DE SISTEMA (automáticos)
    owner = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='lotes_owned',
        help_text="Propietario del lote"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pendiente'),
            ('active', 'Activo'),
            ('archived', 'Archivado'),
        ],
        default='pending',
        help_text="Estado del lote en el sistema"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Si el lote ha sido verificado por un administrador"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ✅ METADATOS ADICIONALES (opcional)
    metadatos = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Información adicional en formato JSON"
    )

    class Meta:
        db_table = 'lotes'
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['status', 'is_verified']),
            models.Index(fields=['cbml']),
            models.Index(fields=['matricula']),
        ]

    def __str__(self):
        return f"{self.nombre} - {self.direccion}"

    def clean(self):
        """Validaciones del modelo"""
        super().clean()
        
        # Validar que nombre no esté vacío
        if not self.nombre or not self.nombre.strip():
            raise ValidationError({'nombre': 'El nombre del lote es requerido'})
        
        # Validar que dirección no esté vacía
        if not self.direccion or not self.direccion.strip():
            raise ValidationError({'direccion': 'La dirección es requerida'})
        
        # Validar área si se proporciona
        if self.area is not None and self.area <= 0:
            raise ValidationError({'area': 'El área debe ser mayor a 0'})
        
        # Validar estrato si se proporciona
        if self.estrato is not None and (self.estrato < 1 or self.estrato > 6):
            raise ValidationError({'estrato': 'El estrato debe estar entre 1 y 6'})

    def save(self, *args, **kwargs):
        """Limpiar datos antes de guardar"""
        # Limpiar strings
        if self.nombre:
            self.nombre = self.nombre.strip()
        if self.direccion:
            self.direccion = self.direccion.strip()
        if self.cbml:
            self.cbml = self.cbml.strip()
        if self.matricula:
            self.matricula = self.matricula.strip()
        if self.barrio:
            self.barrio = self.barrio.strip()
            
        super().save(*args, **kwargs)

    # ✅ MÉTODOS ÚTILES SIMPLIFICADOS
    @property
    def tiene_coordenadas(self):
        """Verificar si tiene coordenadas"""
        return self.latitud is not None and self.longitud is not None

    @property
    def informacion_completa(self):
        """Verificar si tiene información básica completa"""
        return all([
            self.nombre,
            self.direccion,
            self.area,
        ])

    def actualizar_desde_mapgis(self, datos_mapgis):
        """Actualizar lote con datos de MapGIS"""
        if not datos_mapgis:
            return False
            
        actualizado = False
        
        # Mapear campos de MapGIS
        if datos_mapgis.get('area') and not self.area:
            self.area = datos_mapgis['area']
            actualizado = True
            
        if datos_mapgis.get('cbml') and not self.cbml:
            self.cbml = datos_mapgis['cbml']
            actualizado = True
            
        if datos_mapgis.get('clasificacion_suelo') and not self.clasificacion_suelo:
            self.clasificacion_suelo = datos_mapgis['clasificacion_suelo']
            actualizado = True
            
        if datos_mapgis.get('uso_suelo') and not self.uso_suelo:
            self.uso_suelo = datos_mapgis['uso_suelo']
            actualizado = True
            
        if datos_mapgis.get('tratamiento_pot') and not self.tratamiento_pot:
            self.tratamiento_pot = datos_mapgis['tratamiento_pot']
            actualizado = True
            
        if datos_mapgis.get('barrio') and not self.barrio:
            self.barrio = datos_mapgis['barrio']
            actualizado = True
            
        # Guardar metadatos de MapGIS
        if not self.metadatos.get('mapgis_data'):
            self.metadatos['mapgis_data'] = datos_mapgis
            self.metadatos['mapgis_imported_at'] = timezone.now().isoformat()
            actualizado = True
            
        if actualizado:
            self.save()
            
        return actualizado


class LoteDocument(models.Model):
    """
    Documentos asociados a un lote (escrituras, planos, fotos, etc.)
    """
    DOCUMENT_TYPE_CHOICES = [
        ('escritura', 'Escritura Pública'),
        ('cedula_catastral', 'Cédula Catastral'),
        ('plano', 'Plano'),
        ('foto', 'Fotografía'),
        ('levantamiento', 'Levantamiento Topográfico'),
        ('certificado', 'Certificado'),
        ('otro', 'Otro'),
    ]
    
    id = models.AutoField(primary_key=True)
    lote = models.ForeignKey(
        Lote,
        on_delete=models.CASCADE,
        related_name='documentos',
        verbose_name='Lote'
    )
    tipo = models.CharField(
        max_length=50,
        choices=DOCUMENT_TYPE_CHOICES,
        verbose_name='Tipo de Documento'
    )
    titulo = models.CharField(max_length=255, verbose_name='Título')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    archivo = models.FileField(
        upload_to='lotes/documentos/',
        verbose_name='Archivo'
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='documentos_subidos',
        verbose_name='Subido por'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Subida')
    
    class Meta:
        verbose_name = 'Documento de Lote'
        verbose_name_plural = 'Documentos de Lote'
        ordering = ['-uploaded_at']
        db_table = 'lotes_lotedocument'
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.titulo}"


class LoteHistory(models.Model):
    """
    Historial de cambios de un lote para auditoría
    """
    id = models.AutoField(primary_key=True)
    lote = models.ForeignKey(
        Lote,
        on_delete=models.CASCADE,
        related_name='historial',
        verbose_name='Lote'
    )
    campo_modificado = models.CharField(max_length=100, verbose_name='Campo Modificado')
    valor_anterior = models.TextField(blank=True, null=True, verbose_name='Valor Anterior')
    valor_nuevo = models.TextField(blank=True, null=True, verbose_name='Valor Nuevo')
    
    modificado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='modificaciones_lotes',
        verbose_name='Modificado por'
    )
    fecha_modificacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Modificación')
    motivo = models.TextField(blank=True, null=True, verbose_name='Motivo')
    
    class Meta:
        verbose_name = 'Historial de Lote'
        verbose_name_plural = 'Historiales de Lote'
        ordering = ['-fecha_modificacion']
        db_table = 'lotes_lotehistory'
    
    def __str__(self):
        return f"{self.lote.cbml} - {self.campo_modificado} ({self.fecha_modificacion})"


class Favorite(models.Model):
    """
    Lotes favoritos de los usuarios (para desarrolladores)
    """
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favoritos',
        verbose_name='Usuario'
    )
    lote = models.ForeignKey(
        Lote,
        on_delete=models.CASCADE,
        related_name='favoritos',
        verbose_name='Lote'
    )
    notas = models.TextField(blank=True, null=True, verbose_name='Notas Personales')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Agregado')
    
    class Meta:
        verbose_name = 'Favorito'
        verbose_name_plural = 'Favoritos'
        ordering = ['-created_at']
        unique_together = ['user', 'lote']
        db_table = 'lotes_favorite'
    
    def __str__(self):
        return f"{self.user.email} - {self.lote.cbml}"


class Tratamiento(models.Model):
    """
    Modelo para tratamientos urbanísticos del POT
    Define los parámetros normativos para cada tipo de tratamiento
    """
    codigo = models.CharField(max_length=10, unique=True, verbose_name='Código')
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    
    # Índices urbanísticos
    indice_ocupacion = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Índice de Ocupación'
    )
    indice_construccion = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Índice de Construcción'
    )
    altura_maxima = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Altura Máxima (m)'
    )
    
    # Retiros
    retiro_frontal = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Retiro Frontal (m)'
    )
    retiro_lateral = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Retiro Lateral (m)'
    )
    retiro_posterior = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Retiro Posterior (m)'
    )
    
    activo = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Tratamiento Urbanístico'
        verbose_name_plural = 'Tratamientos Urbanísticos'
        ordering = ['codigo']
        db_table = 'lotes_tratamiento'
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"