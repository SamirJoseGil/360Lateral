from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Modelo de usuario personalizado con campos adicionales
    """
    
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('owner', 'Propietario'),
        ('developer', 'Desarrollador'),
    ]
    
    # Usar email como campo principal
    email = models.EmailField(
        _('Email'),
        unique=True,
        help_text=_('Email único del usuario')
    )
    
    # Campos adicionales
    phone = models.CharField(
        _('Teléfono'),
        max_length=20,
        blank=True,
        null=True,
        help_text=_('Número telefónico del usuario')
    )
    
    company = models.CharField(
        _('Empresa'),
        max_length=200,
        blank=True,
        null=True,
        help_text=_('Empresa del usuario')
    )
    
    role = models.CharField(
        _('Rol'),
        max_length=20,
        choices=ROLE_CHOICES,
        default='owner',
        help_text=_('Rol del usuario en el sistema')
    )
    
    # Usar email como username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    def get_full_name(self):
        """Retorna el nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def save(self, *args, **kwargs):
        """Override save para normalizar email"""
        if self.email:
            self.email = self.email.lower().strip()
        
        super().save(*args, **kwargs)