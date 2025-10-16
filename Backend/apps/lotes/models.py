"""
Modelos para la aplicación de lotes
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core import validators
from django.conf import settings  # ✅ AGREGADO: Import de settings

User = get_user_model()

class Lote(models.Model):
    """
    Modelo para representar un lote urbano
    """
    
    # Campos básicos de identificación
    nombre = models.CharField(
        "Nombre",
        max_length=255,
        help_text="Nombre o identificador del lote"
    )
    
    cbml = models.CharField(
        "CBML",
        max_length=50,
        unique=False,  # ✅ Permitir duplicados temporalmente
        null=True,
        blank=True,
        help_text="Código de Bien de Medellín"
    )
    
    direccion = models.CharField(
        "Dirección",
        max_length=255,
        null=True,  # ✅ Permitir null
        blank=True,
        help_text="Dirección física del lote"
    )
    
    # ✅ CRÍTICO: Mantener área como nullable
    area = models.DecimalField(
        "Área (m²)",
        max_digits=12,
        decimal_places=2,
        null=True,  # ✅ Permitir null
        blank=True,
        help_text="Área del terreno en metros cuadrados"
    )
    
    descripcion = models.TextField(
        "Descripción",
        blank=True,
        null=True,
        help_text="Descripción detallada del lote"
    )
    
    # Información catastral
    matricula = models.CharField(
        "Matrícula inmobiliaria",
        max_length=50,
        unique=False,  # ✅ Permitir duplicados temporalmente
        null=True,
        blank=True,
        help_text="Número de matrícula inmobiliaria"
    )
    
    codigo_catastral = models.CharField(
        "Código Catastral",
        max_length=100,
        null=True,
        blank=True,
        help_text="Código catastral del predio"
    )
    
    barrio = models.CharField(
        "Barrio",
        max_length=100,
        null=True,
        blank=True,
        help_text="Barrio donde se ubica el lote"
    )
    
    estrato = models.PositiveSmallIntegerField(
        "Estrato",
        null=True,
        blank=True,
        validators=[
            validators.MinValueValidator(1),  # ✅ CORREGIDO
            validators.MaxValueValidator(6)   # ✅ CORREGIDO
        ],
        help_text="Estrato socioeconómico (1-6)"
    )
    
    # Coordenadas
    latitud = models.DecimalField(
        "Latitud",
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Coordenada de latitud del lote"
    )
    
    longitud = models.DecimalField(
        "Longitud",
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Coordenada de longitud del lote"
    )
    
    # Información POT
    tratamiento_pot = models.CharField(
        "Tratamiento POT",
        max_length=100,
        null=True,
        blank=True,
        help_text="Tratamiento según Plan de Ordenamiento Territorial"
    )
    
    uso_suelo = models.CharField(
        "Uso del Suelo",
        max_length=100,
        null=True,
        blank=True,
        help_text="Clasificación del uso del suelo"
    )
    
    clasificacion_suelo = models.CharField(
        "Clasificación del Suelo",
        max_length=100,
        null=True,
        blank=True,
        help_text="Clasificación del suelo (urbano, rural, etc.)"
    )
    
    # Metadatos adicionales
    metadatos = models.JSONField(
        "Metadatos adicionales",
        default=dict,
        blank=True,
        help_text="Información adicional en formato JSON"
    )
    
    # Relación con usuario (propietario del lote en la plataforma)
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lotes',
        verbose_name="Usuario propietario",
        null=True,  # ✅ Permitir null temporalmente
        blank=True
    )
    
    # Campos de auditoría
    fecha_creacion = models.DateTimeField(
        "Fecha de creación",
        auto_now_add=True
    )
    
    fecha_actualizacion = models.DateTimeField(
        "Fecha de actualización",
        auto_now=True
    )
    
    # Estado del lote
    ESTADO_CHOICES = [
        ('pending', 'Pendiente de Revisión'),
        ('active', 'Activo'),
        ('archived', 'Archivado'),
        ('rejected', 'Rechazado'),
    ]
    
    estado = models.CharField(
        "Estado",
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pending',
        help_text="Estado actual del lote"
    )
    
    # Campos de verificación administrativa
    is_verified = models.BooleanField(
        default=False,
        help_text="Indica si el lote ha sido verificado por un administrador"
    )
    
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lotes_verificados',
        help_text="Administrador que verificó el lote"
    )
    
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora de verificación"
    )
    
    rejection_reason = models.TextField(
        null=True,
        blank=True,
        help_text="Razón de rechazo si el estado es rejected"
    )
    
    class Meta:
        verbose_name = "Lote"
        verbose_name_plural = "Lotes"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'estado']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['cbml']),
            models.Index(fields=['fecha_creacion']),
        ]
    
    def __str__(self):
        return f"{self.nombre} - {self.cbml or 'Sin CBML'}"
    
    def clean(self):
        """Validación personalizada"""
        super().clean()
        
        # Al menos CBML o matrícula debe estar presente
        if not self.cbml and not self.matricula:
            raise ValidationError(
                'Debe proporcionar al menos el CBML o la matrícula del lote'
            )
    
    def save(self, *args, **kwargs):
        # Limpiar el CBML (eliminar espacios, guiones, etc.)
        if self.cbml:
            self.cbml = re.sub(r'[^0-9]', '', self.cbml)
        self.full_clean()
        super().save(*args, **kwargs)
    
    def verify(self, admin_user):
        """Marca el lote como verificado"""
        from django.utils import timezone
        
        self.is_verified = True
        self.verified_by = admin_user
        self.verified_at = timezone.now()
        self.estado = 'active'
        self.save()
    
    def reject(self, admin_user, reason=''):
        """Marca el lote como rechazado"""
        from django.utils import timezone
        
        self.is_verified = False
        self.verified_by = admin_user
        self.verified_at = timezone.now()
        self.estado = 'rejected'
        self.rejection_reason = reason
        self.save()
    
    def archive(self, admin_user):
        """Archiva el lote"""
        from django.utils import timezone
        
        self.estado = 'archived'
        self.verified_by = admin_user
        self.verified_at = timezone.now()
        self.save()

class Tratamiento(models.Model):
    """
    Modelo para representar los tratamientos urbanísticos definidos en el POT.
    """
    TIPOS_TRATAMIENTO = [
        ('CN1', 'Consolidación Nivel 1'),
        ('CN2', 'Consolidación Nivel 2'),
        ('CN3', 'Consolidación Nivel 3'),
        ('CN4', 'Consolidación Nivel 4'),
        ('CN5', 'Consolidación Nivel 5'),
        ('RU', 'Redesarrollo'),
        ('D', 'Desarrollo'),
        ('C', 'Conservación'),
    ]
    
    codigo = models.CharField("Código", max_length=10, unique=True, help_text="Código único del tratamiento (ej: CN1)")
    nombre = models.CharField("Nombre", max_length=100, choices=TIPOS_TRATAMIENTO, help_text="Nombre del tratamiento")
    descripcion = models.TextField("Descripción", blank=True, null=True, help_text="Descripción detallada del tratamiento")
    
    # Índices de aprovechamiento
    indice_ocupacion = models.DecimalField("Índice de ocupación", max_digits=3, decimal_places=2, null=True, blank=True, help_text="Relación área ocupada / área del lote (0-1)")
    indice_construccion = models.DecimalField("Índice de construcción", max_digits=3, decimal_places=1, null=True, blank=True, help_text="Relación área construida / área del lote")
    altura_maxima = models.PositiveSmallIntegerField("Altura máxima (pisos)", null=True, blank=True, help_text="Número máximo de pisos permitidos")
    
    # Retiros
    retiro_frontal = models.DecimalField("Retiro frontal (m)", max_digits=4, decimal_places=1, null=True, blank=True)
    retiro_lateral = models.DecimalField("Retiro lateral (m)", max_digits=4, decimal_places=1, null=True, blank=True)
    retiro_posterior = models.DecimalField("Retiro posterior (m)", max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Campos adicionales
    detalles = models.JSONField("Detalles adicionales", default=dict, blank=True, help_text="Otros detalles específicos del tratamiento")
    fecha_actualizacion = models.DateTimeField("Última actualización", auto_now=True)
    activo = models.BooleanField("Activo", default=True, help_text="Indica si este tratamiento sigue vigente")
    
    class Meta:
        verbose_name = "Tratamiento Urbanístico"
        verbose_name_plural = "Tratamientos Urbanísticos"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TratamientoNormativaLote(models.Model):
    """
    Modelo para almacenar las normativas de dimensiones mínimas de lotes según el tratamiento.
    """
    TIPOS_VIVIENDA = [
        ('unifamiliar', 'Unifamiliar'),
        ('bifamiliar_pisos_diferentes', 'Bifamiliar en pisos diferentes'),
        ('bifamiliar_mismo_piso', 'Bifamiliar en el mismo piso'),
        ('trifamiliar', 'Trifamiliar'),
        ('multifamiliar', 'Multifamiliar'),
    ]
    
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE, related_name='normativas_lote')
    tipo_vivienda = models.CharField("Tipo de vivienda", max_length=30, choices=TIPOS_VIVIENDA)
    frente_minimo = models.DecimalField("Frente mínimo (m)", max_digits=5, decimal_places=2)
    area_minima = models.DecimalField("Área mínima (m²)", max_digits=8, decimal_places=2)
    
    class Meta:
        verbose_name = "Normativa de Lote por Tratamiento"
        verbose_name_plural = "Normativas de Lotes por Tratamiento"
        unique_together = ['tratamiento', 'tipo_vivienda']
        ordering = ['tratamiento', 'tipo_vivienda']
    
    def __str__(self):
        return f"{self.tratamiento.nombre} - {self.get_tipo_vivienda_display()}"


class TratamientoAreaMinimaVivienda(models.Model):
    """
    Modelo para almacenar las áreas mínimas de vivienda según el tratamiento.
    """
    TIPOS_VIVIENDA = [
        ('1_alcoba', '1 Alcoba'),
        ('2_alcobas', '2 Alcobas'),
        ('3_alcobas_vip', '3 Alcobas VIP'),
        ('3_alcobas_vis', '3 Alcobas VIS'),
        ('4_alcobas_vip', '4 Alcobas VIP'),
        ('4_alcobas_vis', '4 Alcobas VIS'),
    ]
    
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE, related_name='areas_minimas_vivienda')
    tipo_vivienda = models.CharField("Tipo de vivienda", max_length=30, choices=TIPOS_VIVIENDA)
    area_minima = models.DecimalField("Área mínima (m²)", max_digits=8, decimal_places=2)
    
    class Meta:
        verbose_name = "Área Mínima de Vivienda por Tratamiento"
        verbose_name_plural = "Áreas Mínimas de Vivienda por Tratamiento"
        unique_together = ['tratamiento', 'tipo_vivienda']
        ordering = ['tratamiento', 'tipo_vivienda']
    
    def __str__(self):
        return f"{self.tratamiento.nombre} - {self.get_tipo_vivienda_display()}"


class Favorite(models.Model):
    """Modelo para lotes favoritos de usuarios"""
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # ✅ Ahora funciona correctamente
        on_delete=models.CASCADE,
        related_name='lotes_favoritos',
        help_text="Usuario que marcó el lote como favorito"
    )
    lote = models.ForeignKey(
        'Lote',
        on_delete=models.CASCADE,
        related_name='favoritos',
        help_text="Lote marcado como favorito"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(
        blank=True,
        null=True,
        help_text="Notas personales sobre el lote"
    )
    
    class Meta:
        db_table = 'lotes_favoritos'
        verbose_name = "Lote Favorito"
        verbose_name_plural = "Lotes Favoritos"
        ordering = ['-created_at']
        unique_together = [['usuario', 'lote']]
        indexes = [
            models.Index(fields=['usuario', 'created_at'], name='lotes_fav_usuario_idx'),
            models.Index(fields=['lote', 'created_at'], name='lotes_fav_lote_idx'),
        ]
    
    def __str__(self):
        return f"{self.usuario.email} - {self.lote.nombre}"