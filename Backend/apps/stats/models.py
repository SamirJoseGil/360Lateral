"""
Modelos para el módulo de estadísticas.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Stat(models.Model):
    """Modelo para registrar eventos estadísticos"""
    
    STAT_TYPES = [
        ('view', 'Vista'),
        ('search', 'Búsqueda'),
        ('action', 'Acción'),
        ('api', 'API'),
        ('error', 'Error'),
        ('other', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # ✅ CORREGIDO: Solo usar el campo user (ForeignKey), eliminar user_id duplicado
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stats'
    )
    
    # Información de sesión
    session_id = models.CharField(max_length=255, blank=True, default='')
    
    # Tipo y nombre del evento
    event_type = models.CharField(
        max_length=50, 
        choices=STAT_TYPES, 
        default='other',
        null=True,  # Temporal para migración
        blank=True
    )
    event_name = models.CharField(
        max_length=255,
        null=True,  # Temporal para migración
        blank=True
    )
    
    # Valor del evento (JSON)
    event_value = models.JSONField(
        default=dict, 
        blank=True,
        null=True  # Temporal para migración
    )
    
    # Metadata
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    user_agent = models.TextField(blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['event_type', '-timestamp']),
        ]
        verbose_name = 'Estadística'
        verbose_name_plural = 'Estadísticas'
    
    def __str__(self):
        return f"{self.event_type or 'unknown'}:{self.event_name or 'unnamed'} - {self.timestamp}"
    
    @property
    def user_id(self):
        """Propiedad para obtener user_id como string para compatibilidad"""
        return str(self.user.id) if self.user else None


class DailySummary(models.Model):
    """Modelo para resúmenes diarios de estadísticas"""
    date = models.DateField(unique=True, verbose_name="Fecha")
    metrics = models.JSONField(default=dict, verbose_name="Métricas")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha de actualización")

    class Meta:
        ordering = ['-date']
        verbose_name = "Resumen Diario"
        verbose_name_plural = "Resúmenes Diarios"

    def __str__(self):
        return f"Resumen {self.date}"

    def refresh_from_db(self, using=None, fields=None):
        """Actualizar métricas desde la base de datos"""
        super().refresh_from_db(using=using, fields=fields)