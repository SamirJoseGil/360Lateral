# users/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    """
    Modelo de usuario personalizado para Lateral 360°
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('owner', 'Property Owner'),
        ('developer', 'Developer'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name='Email')
    username = models.CharField(max_length=150, unique=True, verbose_name='Username')
    first_name = models.CharField(max_length=150, verbose_name='Nombre')
    last_name = models.CharField(max_length=150, verbose_name='Apellido')
    
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    company = models.CharField(max_length=200, blank=True, null=True, verbose_name='Empresa')
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='owner',
        verbose_name='Rol'
    )
    is_verified = models.BooleanField(default=False, verbose_name='Email Verificado')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']
        db_table = 'users_user'  # Asegurar que la tabla tenga el nombre correcto
        
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_owner(self):
        return self.role == 'owner'
    
    @property
    def is_developer(self):
        return self.role == 'developer'
    
    def has_permission(self, permission_name):
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
                'upload_documents'
            ],
            'developer': [
                'view_own_profile',
                'edit_own_profile',
                'view_all_lotes',
                'view_reports',
                'view_statistics'
            ]
        }
        
        user_permissions = permissions_by_role.get(self.role, [])
        return permission_name in user_permissions


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True, null=True, verbose_name='Biografía')
    website = models.URLField(blank=True, null=True, verbose_name='Sitio Web')
    linkedin = models.URLField(blank=True, null=True, verbose_name='LinkedIn')
    location = models.CharField(max_length=200, blank=True, null=True, verbose_name='Ubicación')
    
    email_notifications = models.BooleanField(default=True, verbose_name='Notificaciones por Email')
    sms_notifications = models.BooleanField(default=False, verbose_name='Notificaciones por SMS')
    
    language = models.CharField(
        max_length=10, 
        choices=[('es', 'Español'), ('en', 'English')], 
        default='es',
        verbose_name='Idioma'
    )
    timezone = models.CharField(
        max_length=50, 
        default='America/Bogota',
        verbose_name='Zona Horaria'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuario'
    
    def __str__(self):
        return f"Perfil de {self.user.get_full_name()}"
    

class UserRequest(models.Model):
    """
    Model to track user requests and their statuses.
    This can be used for various types of requests including 
    access requests, feature requests, etc.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed')
    ]
    
    REQUEST_TYPE_CHOICES = [
        ('access', 'Access Request'),
        ('feature', 'Feature Request'),
        ('support', 'Support Request'),
        ('developer', 'Developer Application'),
        ('project', 'Project Request'),
        ('other', 'Other')
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    request_type = models.CharField(
        max_length=50, 
        choices=REQUEST_TYPE_CHOICES,
        default='other'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    reviewer = models.ForeignKey(
        User,
        null=True, 
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_requests'
    )
    review_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_request_type_display()} - {self.title} ({self.get_status_display()})"
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'User Request'
        verbose_name_plural = 'User Requests'