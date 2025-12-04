"""
Modelos de usuario para Lateral 360°
Define el usuario personalizado y modelos relacionados
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
import logging
import secrets
from datetime import timedelta
from django.utils import timezone
import uuid

logger = logging.getLogger(__name__)


class User(AbstractUser):
    """
    Modelo de usuario personalizado para Lateral 360°
    Extiende AbstractUser con campos específicos para la plataforma
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('owner', 'Property Owner'),
        ('developer', 'Developer'),
    ]
    
    DOCUMENT_TYPE_CHOICES = [
        ('CC', 'Cédula de Ciudadanía'),
        ('NIT', 'NIT'),
        ('CE', 'Cédula de Extranjería'),
        ('PASSPORT', 'Pasaporte'),
        ('TI', 'Tarjeta de Identidad')
    ]
    
    # ✅ NUEVO: Tipos de desarrollador
    DEVELOPER_TYPE_CHOICES = [
        ('constructora', 'Constructora'),
        ('fondo_inversion', 'Fondo de Inversión'),
        ('inversionista', 'Inversionista'),
        ('otro', 'Otro'),
    ]
    
    # ✅ NUEVO: Tipo de persona
    PERSON_TYPE_CHOICES = [
        ('natural', 'Persona Natural'),
        ('juridica', 'Persona Jurídica'),
    ]

    # Campos base
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name='Email')
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name='Teléfono')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='owner')
    
    # ===== CAMPOS DE DESARROLLADOR =====
    developer_type = models.CharField(
        max_length=50,
        choices=DEVELOPER_TYPE_CHOICES,
        null=True,
        blank=True,
        help_text="Tipo de desarrollador"
    )
    
    person_type = models.CharField(
        max_length=10,
        choices=PERSON_TYPE_CHOICES,
        null=True,
        blank=True,
        verbose_name='Tipo de Persona',
        help_text='Natural o Jurídica'
    )
    
    document_type = models.CharField(
        max_length=10,
        choices=DOCUMENT_TYPE_CHOICES,
        null=True,
        blank=True,
        verbose_name='Tipo de Documento'
    )
    
    document_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Número de Documento',
        help_text='Solo números'
    )
    
    # ✅ ACTUALIZADO: Campo nombre/empresa
    legal_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Nombre Legal/Empresa',
        help_text='Nombre completo si es natural, Nombre de empresa si es jurídica'
    )
    
    # ✅ Campo de verificación
    is_verified = models.BooleanField(default=False, verbose_name='Email Verificado')
    is_phone_verified = models.BooleanField(default=False, verbose_name='Teléfono Verificado')
    
    email_verified_at = models.DateTimeField(null=True, blank=True, verbose_name='Email Verificado En')
    phone_verified_at = models.DateTimeField(null=True, blank=True, verbose_name='Teléfono Verificado En')
    
    # ✅ NUEVO: Campo para tracking de primera sesión
    first_login_completed = models.BooleanField(
        default=False,
        help_text="Indica si el usuario ha completado su primera sesión y visto el mensaje de bienvenida"
    )
    
    # ✅ NUEVO: PERFIL DE INVERSIÓN
    ciudades_interes = models.JSONField(
        default=list, 
        blank=True,
        help_text="Lista de ciudades de interés (para desarrolladores)"
    )
    
    usos_preferidos = models.JSONField(
        default=list,
        blank=True,
        help_text="Usos de suelo preferidos: ['residencial', 'comercial', 'industrial', 'logistico']"
    )
    
    modelos_pago = models.JSONField(
        default=list,
        blank=True,
        help_text="Modelos de pago: ['contado', 'aporte', 'hitos']"
    )
    
    volumen_ventas_min = models.CharField(
        max_length=20,
        choices=[
            ('menos_150', '< 150.000.000.000'),
            ('entre_150_350', 'Entre 150.000.000.000 y 350.000.000.000'),
            ('mas_350', 'Más de 350.000.000.000'),
        ],
        null=True,
        blank=True,
        help_text="Volumen mínimo de ventas esperado"
    )
    
    ticket_inversion_min = models.CharField(
        max_length=20,
        choices=[
            ('menos_150', '< 150.000.000.000'),
            ('entre_150_350', 'Entre 150.000.000.000 y 350.000.000.000'),
            ('mas_350', 'Más de 350.000.000.000'),
        ],
        null=True,
        blank=True,
        help_text="Ticket mínimo de inversión (solo para fondos e inversionistas)"
    )
    
    perfil_completo = models.BooleanField(
        default=False,
        help_text="Indica si el perfil de inversión está completo"
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado')
    
    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ['-created_at']
        # ✅ NUEVO: Índices para mejorar performance
        indexes = [
            models.Index(fields=['email'], name='user_email_idx'),
            models.Index(fields=['role', 'is_active'], name='user_role_active_idx'),
            models.Index(fields=['created_at'], name='user_created_at_idx'),
            models.Index(fields=['is_verified'], name='user_verified_idx'),
        ]
        
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def clean(self):
        """Validaciones personalizadas"""
        super().clean()
        
        # ✅ NUEVO: Validar campos según rol developer
        if self.role == 'developer':
            if not self.developer_type:
                raise ValidationError({
                    'developer_type': 'El tipo de desarrollador es obligatorio'
                })
            
            if not self.person_type:
                raise ValidationError({
                    'person_type': 'El tipo de persona es obligatorio'
                })
            
            # Validar documento según tipo de persona
            if self.person_type == 'juridica' and self.document_type != 'NIT':
                raise ValidationError({
                    'document_type': 'Personas jurídicas deben usar NIT'
                })
            
            if self.person_type == 'natural' and self.document_type == 'NIT':
                raise ValidationError({
                    'document_type': 'Personas naturales no pueden usar NIT'
                })
            
            if not self.document_number:
                raise ValidationError({
                    'document_number': 'El número de documento es obligatorio para desarrolladores'
                })
            
            # Validar que document_number sea numérico
            if not self.document_number.isdigit():
                raise ValidationError({
                    'document_number': 'El número de documento debe contener solo números'
                })
            
            if not self.legal_name:
                raise ValidationError({
                    'legal_name': 'El nombre legal o empresa es obligatorio para desarrolladores'
                })
    
    def save(self, *args, **kwargs):
        """Override save para validar y loggear"""
        # ✅ CRÍTICO: Solo validar si NO es creación O si ya tiene password hasheada
        is_new = self.pk is None
        
        # ✅ Solo hacer full_clean si:
        # 1. NO es nuevo usuario (está actualizando)
        # 2. O es nuevo PERO ya tiene password hasheada (viene de set_password)
        should_validate = not is_new or (is_new and self.password and self.password.startswith('pbkdf2_'))
        
        if should_validate:
            self.full_clean()
        
        super().save(*args, **kwargs)
        
        if is_new:
            logger.info(f"New user created: {self.email} (role: {self.role})")
        else:
            logger.debug(f"User updated: {self.email}")
    
    def get_full_name(self):
        """Retorna nombre completo del usuario"""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    def get_short_name(self):
        """Retorna nombre corto"""
        return self.first_name or self.username
    
    @property
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == 'admin'
    
    @property
    def is_owner(self):
        """Verifica si el usuario es propietario"""
        return self.role == 'owner'
    
    @property
    def is_developer(self):
        """Verifica si el usuario es desarrollador"""
        return self.role == 'developer'
    
    def has_permission(self, permission_name):
        """
        Verifica si el usuario tiene un permiso específico
        
        Args:
            permission_name: Nombre del permiso a verificar
            
        Returns:
            bool: True si tiene el permiso, False en caso contrario
        """
        if self.is_admin:
            return True
        
        permissions_by_role = {
            'owner': [
                'view_own_profile',
                'edit_own_profile',
                'view_own_lotes',
                'create_lote',
                'edit_own_lote',
                'delete_own_lote',
                'upload_documents',
                'request_analysis'
            ],
            'developer': [
                'view_own_profile',
                'edit_own_profile',
                'view_all_lotes',
                'view_reports',
                'view_statistics',
                'contact_owners'
            ]
        }
        
        user_permissions = permissions_by_role.get(self.role, [])
        return permission_name in user_permissions
    
    def soft_delete(self, reason=None):
        """
        Desactivar usuario en lugar de eliminarlo
        """
        from django.utils import timezone
        self.is_active = False
        self.deleted_at = timezone.now()
        self.deletion_reason = reason or "Usuario eliminado por administrador"
        self.save()
        logger.info(f"User {self.email} soft deleted: {reason}")
    
    def reactivate(self):
        """Reactivar usuario desactivado"""
        self.is_active = True
        self.deleted_at = None
        self.deletion_reason = None
        self.save()
        logger.info(f"User {self.email} reactivated")
    
    @property
    def is_deleted(self):
        """Verifica si el usuario está eliminado (soft delete)"""
        return not self.is_active and self.deleted_at is not None


class VerificationCode(models.Model):
    """
    Modelo para códigos de verificación (email y WhatsApp)
    ⚠️ PREPARADO para futura integración con SMTP/WhatsApp
    """
    CODE_TYPE_CHOICES = [
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('sms', 'SMS'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='verification_codes',
        verbose_name='Usuario'
    )
    
    code = models.CharField(
        max_length=6,
        verbose_name='Código',
        help_text='Código de 6 dígitos'
    )
    
    code_type = models.CharField(
        max_length=10,
        choices=CODE_TYPE_CHOICES,
        verbose_name='Tipo de Código'
    )
    
    is_used = models.BooleanField(
        default=False,
        verbose_name='Usado'
    )
    
    expires_at = models.DateTimeField(
        verbose_name='Expira en'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Creado'
    )
    
    used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Usado en'
    )
    
    class Meta:
        verbose_name = 'Código de Verificación'
        verbose_name_plural = 'Códigos de Verificación'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'code_type', 'is_used']),
            models.Index(fields=['code', 'expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.code_type} - {self.code}"
    
    @staticmethod
    def generate_code():
        """Genera un código de 6 dígitos"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    def is_valid(self):
        """Verifica si el código es válido"""
        if self.is_used:
            return False
        
        if timezone.now() > self.expires_at:
            return False
        
        return True
    
    def mark_as_used(self):
        """Marca el código como usado"""
        self.is_used = True
        self.used_at = timezone.now()
        self.save(update_fields=['is_used', 'used_at'])
        
        logger.info(f"Verification code {self.code} marked as used for {self.user.email}")


class UserProfile(models.Model):
    """
    Perfil extendido del usuario con información adicional
    """
    LANGUAGE_CHOICES = [
        ('es', 'Español'),
        ('en', 'English')
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name='Usuario'
    )
    
    # Información adicional
    avatar = models.ImageField(
        upload_to='avatars/', 
        null=True, 
        blank=True,
        verbose_name='Avatar'
    )
    bio = models.TextField(
        max_length=500, 
        blank=True, 
        null=True, 
        verbose_name='Biografía'
    )
    website = models.URLField(blank=True, null=True, verbose_name='Sitio Web')
    linkedin = models.URLField(blank=True, null=True, verbose_name='LinkedIn')
    location = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        verbose_name='Ubicación'
    )
    
    # Preferencias
    email_notifications = models.BooleanField(
        default=True, 
        verbose_name='Notificaciones por Email'
    )
    sms_notifications = models.BooleanField(
        default=False, 
        verbose_name='Notificaciones por SMS'
    )
    
    # Configuración regional
    language = models.CharField(
        max_length=10, 
        choices=LANGUAGE_CHOICES, 
        default='es',
        verbose_name='Idioma'
    )
    timezone = models.CharField(
        max_length=50, 
        default='America/Bogota',
        verbose_name='Zona Horaria'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuario'
        db_table = 'users_userprofile'
    
    def __str__(self):
        return f"Perfil de {self.user.get_full_name()}"


class UserRequest(models.Model):
    """
    Modelo para rastrear solicitudes de usuario y sus estados.
    ✅ EXTENDIDO: Soporte para lotes y tipos específicos
    """
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_review', 'En Revisión'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('completed', 'Completado')
    ]
    
    # ✅ MEJORADO: Tipos más específicos
    REQUEST_TYPE_CHOICES = [
        ('soporte_tecnico', 'Soporte Técnico'),
        ('analisis_urbanistico', 'Análisis Urbanístico'),
        ('consulta_general', 'Consulta General'),
        ('validacion_documentos', 'Validación de Documentos'),
        ('correccion_datos', 'Corrección de Datos'),
        ('access', 'Solicitud de Acceso'),
        ('feature', 'Solicitud de Característica'),
        ('other', 'Otro')
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='requests',
        verbose_name='Usuario'
    )
    
    # ✅ CORREGIDO: Sin caracteres extra
    lote = models.ForeignKey(
        'lotes.Lote',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requests',
        verbose_name='Lote Relacionado',
        help_text='Lote al que hace referencia la solicitud (si aplica)'
    )
    
    request_type = models.CharField(
        max_length=50, 
        choices=REQUEST_TYPE_CHOICES,
        default='consulta_general',  # ✅ Cambiado de 'other'
        verbose_name='Tipo de Solicitud',
        db_index=True
    )
    title = models.CharField(max_length=255, verbose_name='Título')
    description = models.TextField(verbose_name='Descripción')
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name='Estado',
        db_index=True
    )
    
    # ✅ NUEVO: Prioridad de la solicitud
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('normal', 'Normal'),
        ('high', 'Alta'),
        ('urgent', 'Urgente')
    ]
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal',
        verbose_name='Prioridad'
    )
    
    reference_id = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name='ID de Referencia'
    )
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        verbose_name='Metadatos'
    )
    reviewer = models.ForeignKey(
        User,
        null=True, 
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_requests',
        verbose_name='Revisor'
    )
    review_notes = models.TextField(
        blank=True, 
        null=True,
        verbose_name='Notas de Revisión'
    )
    
    # ✅ NUEVO: Fecha de resolución
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Resolución'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    
    class Meta:
        ordering = ['-priority', '-updated_at']  # ✅ Ordenar por prioridad primero
        verbose_name = 'Solicitud de Usuario'
        verbose_name_plural = 'Solicitudes de Usuario'
        db_table = 'users_userrequest'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['request_type', 'status']),
            models.Index(fields=['lote', 'status']),  # ✅ NUEVO índice
            models.Index(fields=['priority', '-updated_at']),  # ✅ NUEVO índice
            models.Index(fields=['-updated_at']),
        ]
    
    def __str__(self):
        lote_info = f" - Lote {self.lote.nombre}" if self.lote else ""
        return f"{self.get_request_type_display()} - {self.title}{lote_info} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """Override save para loggear cambios de estado"""
        if self.pk:
            old_instance = UserRequest.objects.get(pk=self.pk)
            if old_instance.status != self.status:
                logger.info(
                    f"UserRequest {self.pk} status changed: "
                    f"{old_instance.status} -> {self.status} "
                    f"(user: {self.user.email})"
                )
                # ✅ NUEVO: Marcar fecha de resolución
                if self.status in ['completed', 'rejected']:
                    from django.utils import timezone
                    self.resolved_at = timezone.now()
        super().save(*args, **kwargs)
    
    # ✅ NUEVO: Métodos útiles
    @property
    def is_resolved(self):
        """Verifica si la solicitud está resuelta"""
        return self.status in ['completed', 'rejected']
    
    @property
    def is_pending(self):
        """Verifica si está pendiente"""
        return self.status == 'pending'
    
    @property
    def response_time(self):
        """Calcula tiempo de respuesta (si está resuelta)"""
        if self.resolved_at:
            delta = self.resolved_at - self.created_at
            return delta
        return None


class PasswordResetToken(models.Model):
    """
    Tokens para recuperación de contraseña.
    Se generan cuando el usuario solicita resetear su contraseña.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
        verbose_name='Usuario'
    )
    token = models.CharField(max_length=255, unique=True, verbose_name='Token')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    expires_at = models.DateTimeField(verbose_name='Fecha de Expiración')
    is_used = models.BooleanField(default=False, verbose_name='Token Usado')
    used_at = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Uso')
    
    class Meta:
        verbose_name = 'Token de Recuperación'
        verbose_name_plural = 'Tokens de Recuperación'
        ordering = ['-created_at']
        db_table = 'users_passwordresettoken'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"Reset token for {self.user.email} - {'Used' if self.is_used else 'Active'}"
    
    def is_valid(self):
        """Verifica si el token es válido (no usado y no expirado)"""
        from django.utils import timezone
        return not self.is_used and self.expires_at > timezone.now()
    
    def mark_as_used(self):
        """Marca el token como usado"""
        from django.utils import timezone
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
        logger.info(f"Password reset token marked as used for {self.user.email}")