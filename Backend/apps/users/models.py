"""
Modelos de usuario para Lateral 360°
Define el usuario personalizado y modelos relacionados
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError
import uuid
import logging

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
    
    FOCUS_AREA_CHOICES = [
        ('residential', 'Residencial'),
        ('commercial', 'Comercial'),
        ('mixed', 'Mixto'),
        ('vis', 'VIS (Vivienda de Interés Social)'),
        ('industrial', 'Industrial'),
        ('other', 'Otro')
    ]
    
    DEPARTMENT_CHOICES = [
        ('normativa', 'Normativa'),
        ('soporte_tecnico', 'Soporte Técnico'),
        ('gestion_usuarios', 'Gestión de Usuarios'),
        ('desarrollo', 'Desarrollo'),
        ('comercial', 'Comercial'),
        ('legal', 'Legal'),
        ('general', 'General')
    ]
    
    PERMISSIONS_SCOPE_CHOICES = [
        ('full', 'Administrador Completo'),
        ('limited', 'Administrador Limitado'),
        ('readonly', 'Solo Lectura'),
        ('department', 'Solo Departamento')
    ]
    
    # Campos base
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name='Email', db_index=True)
    username = models.CharField(max_length=150, unique=True, verbose_name='Username', db_index=True)
    first_name = models.CharField(max_length=150, verbose_name='Nombre')
    last_name = models.CharField(max_length=150, verbose_name='Apellido')
    
    # Campos comunes
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    company = models.CharField(max_length=200, blank=True, null=True, verbose_name='Empresa')
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='owner',
        verbose_name='Rol',
        db_index=True
    )
    is_verified = models.BooleanField(default=False, verbose_name='Email Verificado')
    
    # ✅ NUEVO: Campos para soft delete
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Eliminación'
    )
    deletion_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='Razón de Eliminación'
    )
    
    # Campos específicos para Owner
    document_type = models.CharField(
        max_length=20, 
        choices=DOCUMENT_TYPE_CHOICES,
        blank=True, 
        null=True,
        verbose_name='Tipo de Documento'
    )
    document_number = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        verbose_name='Número de Documento',
        db_index=True
    )
    address = models.TextField(blank=True, null=True, verbose_name='Dirección de Residencia')
    id_verification_file = models.FileField(
        upload_to='documents/id_verification/', 
        blank=True, 
        null=True,
        verbose_name='Archivo de Verificación de Identidad'
    )
    lots_count = models.PositiveIntegerField(default=0, verbose_name='Cantidad de Lotes')
    
    # Campos específicos para Developer
    company_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nombre de la Empresa')
    company_nit = models.CharField(max_length=50, blank=True, null=True, verbose_name='NIT de la Empresa')
    position = models.CharField(max_length=100, blank=True, null=True, verbose_name='Cargo')
    experience_years = models.PositiveIntegerField(blank=True, null=True, verbose_name='Años de Experiencia')
    portfolio_url = models.URLField(blank=True, null=True, verbose_name='URL del Portafolio')
    focus_area = models.CharField(
        max_length=50,
        choices=FOCUS_AREA_CHOICES,
        blank=True,
        null=True,
        verbose_name='Área de Enfoque'
    )
    
    # Campos específicos para Admin
    department = models.CharField(
        max_length=100,
        choices=DEPARTMENT_CHOICES,
        blank=True,
        null=True,
        verbose_name='Departamento'
    )
    permissions_scope = models.CharField(
        max_length=20,
        choices=PERMISSIONS_SCOPE_CHOICES,
        default='limited',
        blank=True,
        null=True,
        verbose_name='Alcance de Permisos'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']
        db_table = 'users_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['role']),
            models.Index(fields=['created_at']),
        ]
        
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def clean(self):
        """Validación del modelo"""
        # ✅ CRÍTICO: NO llamar super().clean() porque valida password
        # super().clean()  # ❌ ELIMINAR ESTA LÍNEA
        
        # ✅ SOLO validar campos específicos de nuestro modelo
        if self.role == 'developer':
            if not self.company_name:
                raise ValidationError({
                    'company_name': 'Requerido para desarrolladores'
                })
        
        elif self.role == 'admin':
            if not self.department:
                raise ValidationError({
                    'department': 'Requerido para administradores'
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