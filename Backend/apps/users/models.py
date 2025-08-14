"""
Modelos de usuarios para Lateral 360°
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    def _create_user(self, email, password=None, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)

class User(AbstractUser):
    """Modelo de usuario extendido"""
    
    # Roles disponibles
    ADMIN = 'admin'
    OWNER = 'owner'
    DEVELOPER = 'developer'
    
    ROLE_CHOICES = [
        (ADMIN, _('Administrador')),
        (OWNER, _('Propietario')),
        (DEVELOPER, _('Desarrollador')),
    ]
    
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=OWNER)
    
    # Campos adicionales que se referencian en el admin
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    company = models.CharField(max_length=100, blank=True, null=True, verbose_name='Empresa')
    is_verified = models.BooleanField(default=False, verbose_name='Verificado')
    
    # Campos de timestamp
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    class Meta:
        db_table = 'users_user'  # Esta línea es importante
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def is_admin(self):
        return self.role == self.ADMIN
    
    @property
    def is_owner(self):
        return self.role == self.OWNER
    
    @property
    def is_developer(self):
        return self.role == self.DEVELOPER


class UserProfile(models.Model):
    """
    Perfil extendido del usuario
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='Usuario'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name='Avatar'
    )
    bio = models.TextField(
        blank=True,
        null=True,
        max_length=500,
        verbose_name='Biografía'
    )
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name='Sitio Web'
    )
    location = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Ubicación'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuario'
    
    def __str__(self):
        return f"Perfil de {self.user.email}"
        return f"Perfil de {self.user.email}"
