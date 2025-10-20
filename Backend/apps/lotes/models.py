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

User = get_user_model()
logger = logging.getLogger(__name__)


class Lote(models.Model):
    """
    Modelo principal para lotes urbanos.
    Almacena información catastral, urbanística y de valoración.
    """
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('sold', 'Vendido'),
        ('in_negotiation', 'En Negociación'),
        ('reserved', 'Reservado'),
    ]
    
    TRATAMIENTO_CHOICES = [
        ('consolidacion_1', 'Consolidación Nivel 1'),
        ('consolidacion_2', 'Consolidación Nivel 2'),
        ('consolidacion_3', 'Consolidación Nivel 3'),
        ('desarrollo', 'Desarrollo'),
        ('mejoramiento', 'Mejoramiento Integral'),
        ('conservacion', 'Conservación'),
    ]
    
    USO_SUELO_CHOICES = [
        ('residencial', 'Residencial'),
        ('comercial', 'Comercial'),
        ('mixto', 'Mixto'),
        ('industrial', 'Industrial'),
        ('dotacional', 'Dotacional'),
        ('otro', 'Otro'),
    ]
    
    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cbml = models.CharField(
        max_length=14, 
        unique=True, 
        verbose_name='CBML',
        db_index=True,
        help_text='Código Base Municipal de Lote (14 dígitos)'
    )
    matricula = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name='Matrícula Inmobiliaria',
        db_index=True
    )
    
    # Propietario
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='lotes',
        verbose_name='Propietario'
    )
    
    # Ubicación
    direccion = models.CharField(max_length=255, verbose_name='Dirección')
    barrio = models.CharField(max_length=100, blank=True, null=True, verbose_name='Barrio')
    comuna = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(16)],
        blank=True,
        null=True,
        verbose_name='Comuna'
    )
    estrato = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(6)],
        blank=True,
        null=True,
        verbose_name='Estrato'
    )
    
    # Geometría (coordenadas)
    latitud = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        blank=True, 
        null=True,
        verbose_name='Latitud'
    )
    longitud = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        blank=True, 
        null=True,
        verbose_name='Longitud'
    )
    
    # Dimensiones
    area = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Área (m²)'
    )
    area_construida = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Área Construida (m²)'
    )
    frente = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Frente (m)'
    )
    fondo = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Fondo (m)'
    )
    
    # Normativa urbanística
    tratamiento_urbanistico = models.CharField(
        max_length=50,
        choices=TRATAMIENTO_CHOICES,
        blank=True,
        null=True,
        verbose_name='Tratamiento Urbanístico'
    )
    uso_suelo = models.CharField(
        max_length=50,
        choices=USO_SUELO_CHOICES,
        blank=True,
        null=True,
        verbose_name='Uso del Suelo'
    )
    altura_maxima = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Altura Máxima (m)'
    )
    indice_ocupacion = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        verbose_name='Índice de Ocupación'
    )
    indice_construccion = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Índice de Construcción'
    )
    
    # Valoración
    avaluo_catastral = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Avalúo Catastral'
    )
    valor_comercial = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Valor Comercial'
    )
    valor_m2 = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name='Valor por m²'
    )
    
    # Estado
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Estado',
        db_index=True
    )
    
    # Metadatos
    notas = models.TextField(blank=True, null=True, verbose_name='Notas')
    datos_mapgis = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Datos de MapGIS'
    )
    
    # Verificación
    is_verified = models.BooleanField(
        default=False,
        verbose_name='Verificado'
    )
    verified_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha de Verificación'
    )
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lotes_verificados',
        verbose_name='Verificado por'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    
    class Meta:
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        ordering = ['-created_at']
        db_table = 'lotes_lote'
        indexes = [
            models.Index(fields=['cbml']),
            models.Index(fields=['matricula']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['barrio', 'comuna']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Lote {self.cbml} - {self.direccion}"
    
    def clean(self):
        """Validación del modelo"""
        super().clean()
        
        # Validar CBML
        if self.cbml:
            if len(self.cbml) != 14:
                raise ValidationError({
                    'cbml': 'El CBML debe tener exactamente 14 dígitos'
                })
            if not self.cbml.isdigit():
                raise ValidationError({
                    'cbml': 'El CBML debe contener solo números'
                })
        
        # Validar área construida no mayor que área del lote
        if self.area_construida and self.area:
            if self.area_construida > self.area * 10:  # Considerando múltiples pisos
                raise ValidationError({
                    'area_construida': 'El área construida es demasiado grande para el área del lote'
                })
    
    def save(self, *args, **kwargs):
        """Override save para validar y calcular valores"""
        self.full_clean()
        
        # Calcular valor por m² si no existe
        if self.valor_comercial and self.area and not self.valor_m2:
            self.valor_m2 = self.valor_comercial / self.area
        
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            logger.info(f"New lote created: {self.cbml} by {self.owner.email}")
        else:
            logger.debug(f"Lote updated: {self.cbml}")
    
    @property
    def esta_disponible(self):
        """Verifica si el lote está disponible"""
        return self.status == 'active'
    
    def calcular_potencial_constructivo(self):
        """Calcula el potencial constructivo del lote"""
        if not self.area or not self.indice_construccion:
            return None
        
        area_maxima = float(self.area) * float(self.indice_construccion)
        
        potencial = {
            'area_maxima_construccion': round(area_maxima, 2),
            'area_lote': float(self.area),
            'indice_construccion': float(self.indice_construccion),
        }
        
        if self.altura_maxima and self.indice_ocupacion:
            area_por_piso = float(self.area) * float(self.indice_ocupacion)
            pisos_maximos = int(float(self.altura_maxima) / 3)  # Asumiendo 3m por piso
            
            potencial.update({
                'pisos_maximos': pisos_maximos,
                'area_por_piso': round(area_por_piso, 2),
            })
        
        return potencial


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