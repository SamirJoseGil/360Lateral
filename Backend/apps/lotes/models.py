"""
Modelos para la aplicación de lotes
"""
from django.db import models
from django.conf import settings

class Lote(models.Model):
    """
    Modelo para almacenar información de lotes
    """
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(null=True, blank=True)
    direccion = models.CharField(max_length=255)
    area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    codigo_catastral = models.CharField(max_length=30, unique=True, null=True, blank=True)
    matricula = models.CharField(max_length=30, unique=True, null=True, blank=True)
    cbml = models.CharField(max_length=20, null=True, blank=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    ESTRATOS = [
        (1, '1'),
        (2, '2'),
        (3, '3'),
        (4, '4'),
        (5, '5'),
        (6, '6'),
    ]
    estrato = models.IntegerField(choices=ESTRATOS, null=True, blank=True)
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lotes',
        verbose_name='Propietario'
    )
    
    tratamiento_pot = models.CharField(max_length=100, null=True, blank=True)
    uso_suelo = models.CharField(max_length=100, null=True, blank=True)
    
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('pending', 'Pendiente'),
        ('archived', 'Archivado'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.nombre} ({self.direccion})"