"""
Modelos para el módulo de lotes
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
import uuid
import logging
from django.utils import timezone

User = get_user_model()
logger = logging.getLogger(__name__)


class Lote(models.Model):
    """
    Modelo simplificado de Lote
    ✅ ESTADOS CLAROS Y DOCUMENTADOS
    """
    STATUS_CHOICES = [
        ('pending', 'Pendiente de Revisión'),
        ('active', 'Activo y Verificado'),
        ('rejected', 'Rechazado'),
        ('archived', 'Archivado'),
    ]
    
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
        max_length=11,  # ✅ CORREGIDO: 11 caracteres (antes era 14)
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Código de identificación catastral (CBML) - 11 dígitos para MapGIS Medellín",
        verbose_name="CBML",
        validators=[
            RegexValidator(
                regex=r'^\d{11}$',
                message='El CBML debe tener exactamente 11 dígitos numéricos',
                code='invalid_cbml'
            )
        ]
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
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Estado del lote en el sistema",
        db_index=True
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Si el lote ha sido verificado por un administrador"
    )
    
    # ✅ NUEVO: Campos para rastrear rechazo
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name="Razón de Rechazo",
        help_text="Motivo por el cual el lote fue rechazado"
    )
    rejected_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Fecha de Rechazo"
    )
    rejected_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lotes_rejected',
        verbose_name="Rechazado por"
    )
    
    # ✅ NUEVO: Campos para verificación
    verified_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Fecha de Verificación"
    )
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lotes_verified',
        verbose_name="Verificado por"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ✅ METADATOS ADICIONALES (opcional)
    metadatos = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Información adicional en formato JSON"
    )

    # ✅ NUEVOS CAMPOS COMERCIALES
    ciudad = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Ciudad",
        help_text="Ciudad donde se ubica el lote"
    )
    
    valor = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name="Valor del Lote",
        help_text="Valor comercial del lote en COP"
    )
    
    FORMA_PAGO_CHOICES = [
        ('contado', 'De Contado'),
        ('financiado', 'Financiado'),
        ('permuta', 'Permuta'),
        ('mixto', 'Mixto'),
    ]
    
    forma_pago = models.CharField(
        max_length=20,
        choices=FORMA_PAGO_CHOICES,
        blank=True,
        null=True,
        verbose_name="Forma de Pago",
        help_text="Forma de pago preferida para la transacción"
    )
    
    es_comisionista = models.BooleanField(
        default=False,
        verbose_name="Es Comisionista",
        help_text="Indica si el registro lo hace un comisionista en representación del propietario"
    )
    
    carta_autorizacion = models.FileField(
        upload_to='lotes/autorizaciones/',
        blank=True,
        null=True,
        verbose_name="Carta de Autorización",
        help_text="Carta de autorización del propietario (requerida si es comisionista)"
    )
    
    # ✅ NUEVO: Relación con desarrolladores
    desarrolladores = models.ManyToManyField(
        'users.User',
        related_name='lotes_as_developer',
        blank=True,
        limit_choices_to={'role': 'developer'},
        verbose_name='Desarrolladores Autorizados',
        help_text='Desarrolladores que tienen acceso a este lote'
    )
    
    class Meta:
        db_table = 'lotes'
        verbose_name = "Lote"
        verbose_name_plural = "Lotes"
        ordering = ['-created_at']
        # ✅ NUEVO: Índices para mejorar performance
        indexes = [
            models.Index(fields=['owner', 'status'], name='lote_owner_status_idx'),
            models.Index(fields=['status', 'is_verified'], name='lote_status_verified_idx'),
            models.Index(fields=['created_at'], name='lote_created_at_idx'),
            models.Index(fields=['cbml'], name='lote_cbml_idx'),
            models.Index(fields=['uso_suelo'], name='lote_uso_suelo_idx'),
            models.Index(fields=['tratamiento_pot'], name='lote_tratamiento_idx'),
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
        
        # Validar CBML si está presente
        if self.cbml:
            if len(self.cbml) != 11:
                raise ValidationError({
                    'cbml': f'El CBML debe tener exactamente 11 dígitos (tiene {len(self.cbml)})'
                })
            if not self.cbml.isdigit():
                raise ValidationError({
                    'cbml': 'El CBML debe contener solo números'
                })

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

    # ✅ MÉTODOS ÚTILES MEJORADOS
    def soft_delete(self):
        """
        ✅ Archivar el lote (soft delete)
        - Cambia status a 'archived'
        - Mantiene is_verified sin cambios
        """
        self.status = 'archived'
        self.save()
        logger.info(f"Lote {self.id} archivado (soft delete)")
    
    def reject(self, reason, rejected_by=None):
        """
        ✅ Rechazar el lote
        - Cambia status a 'rejected'
        - Marca is_verified como False
        - Guarda razón del rechazo
        """
        from django.utils import timezone
        self.status = 'rejected'
        self.is_verified = False
        self.rejection_reason = reason
        self.rejected_at = timezone.now()
        self.rejected_by = rejected_by
        self.save()
        logger.info(f"Lote {self.id} rechazado por {rejected_by}: {reason}")
    
    def verify(self, verified_by=None):
        """
        ✅ Verificar y activar el lote
        - Cambia status a 'active'
        - Marca is_verified como True
        - Registra quién verificó
        """
        from django.utils import timezone
        self.status = 'active'
        self.is_verified = True
        self.verified_at = timezone.now()
        self.verified_by = verified_by
        # Limpiar datos de rechazo previo si existían
        self.rejection_reason = None
        self.rejected_at = None
        self.rejected_by = None
        self.save()
        logger.info(f"Lote {self.id} verificado y activado por {verified_by}")
    
    def reactivate(self):
        """
        ✅ Reactivar un lote archivado o rechazado
        - Si fue verificado, vuelve a 'active'
        - Si no fue verificado, vuelve a 'pending'
        """
        if self.is_verified:
            self.status = 'active'
        else:
            self.status = 'pending'
        self.save()
        logger.info(f"Lote {self.id} reactivado a estado {self.status}")
    
    @property
    def can_be_shown(self):
        """✅ Solo mostrar a developers si está activo y verificado"""
        return self.status == 'active' and self.is_verified
    
    @property
    def can_be_edited(self):
        """Determina si el lote puede ser editado"""
        return self.status in ['pending', 'active']
    
    @property
    def is_rejected(self):
        """✅ Verifica si el lote está rechazado"""
        return self.status == 'rejected'
    
    @property
    def is_archived(self):
        """✅ Verifica si el lote está archivado"""
        return self.status == 'archived'
    
    @property
    def is_pending(self):
        """✅ Verifica si el lote está pendiente"""
        return self.status == 'pending'
    
    @property
    def is_active(self):
        """✅ Verifica si el lote está activo"""
        return self.status == 'active' and self.is_verified


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
    # ✅ CORREGIDO: Agregar default para evitar prompts
    campo_modificado = models.CharField(
        max_length=100, 
        verbose_name='Campo Modificado',
        default='',  # ✅ Default vacío
        blank=True
    )
    # ✅ NUEVO: Campo action con default
    action = models.CharField(
        max_length=20,
        choices=[
            ('created', 'Creado'),
            ('updated', 'Actualizado'),
            ('verified', 'Verificado'),
            ('rejected', 'Rechazado'),
            ('deleted', 'Eliminado'),
        ],
        default='updated',  # ✅ Default para evitar prompts
        verbose_name='Acción'
    )
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
        return f"{self.lote.nombre if self.lote else 'Lote'} - {self.action} ({self.fecha_modificacion})"


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