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
        super().clean()
        # ✅ ELIMINADO: NO exigir document_type/document_number para propietarios
        
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
        self.full_clean()
        
        is_new = self.pk is None
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
    Usado para varios tipos de solicitudes incluyendo solicitudes de acceso,
    solicitudes de características, etc.
    """
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_review', 'En Revisión'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('completed', 'Completado')
    ]
    
    REQUEST_TYPE_CHOICES = [
        ('access', 'Solicitud de Acceso'),
        ('feature', 'Solicitud de Característica'),
        ('support', 'Solicitud de Soporte'),
        ('developer', 'Aplicación de Desarrollador'),
        ('project', 'Solicitud de Proyecto'),
        ('other', 'Otro')
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='requests',
        verbose_name='Usuario'
    )
    request_type = models.CharField(
        max_length=50, 
        choices=REQUEST_TYPE_CHOICES,
        default='other',
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
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Solicitud de Usuario'
        verbose_name_plural = 'Solicitudes de Usuario'
        db_table = 'users_userrequest'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['request_type', 'status']),
            models.Index(fields=['-updated_at']),
        ]
    
    def __str__(self):
        return f"{self.get_request_type_display()} - {self.title} ({self.get_status_display()})"
    
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
        super().save(*args, **kwargs)