"""
Modelos para la aplicación de estadísticas.
"""
from django.db import models
from django.utils import timezone
import uuid

class Stat(models.Model):
    """
    Modelo base para registrar eventos estadísticos en el sistema.
    Puede ser extendido para tipos específicos de estadísticas.
    """
    STAT_TYPES = [
        ('view', 'Vista de página'),
        ('search', 'Búsqueda'),
        ('action', 'Acción de usuario'),
        ('api', 'Llamada a API'),
        ('error', 'Error'),
        ('other', 'Otro'),
    ]
    
    id = models.AutoField(primary_key=True)
    type = models.CharField("Tipo", max_length=20, choices=STAT_TYPES, db_index=True)
    name = models.CharField("Nombre", max_length=100, db_index=True)
    value = models.JSONField("Valor", default=dict, blank=True)
    timestamp = models.DateTimeField("Marca de tiempo", auto_now_add=True, db_index=True)
    # Relación con el usuario (opcional, puede ser anónimo)
    user_id = models.UUIDField("ID de Usuario", null=True, blank=True, db_index=True)
    # Datos adicionales para tracking
    session_id = models.CharField("ID de Sesión", max_length=100, blank=True, null=True, db_index=True)
    ip_address = models.GenericIPAddressField("Dirección IP", blank=True, null=True)
    
    class Meta:
        verbose_name = "Estadística"
        verbose_name_plural = "Estadísticas"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['type', 'timestamp']),
            models.Index(fields=['name', 'timestamp']),
            models.Index(fields=['user_id', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.type}/{self.name} ({self.timestamp.strftime('%Y-%m-%d %H:%M:%S')})"

class DailySummary(models.Model):
    """
    Resumen diario de estadísticas para optimizar consultas.
    """
    date = models.DateField("Fecha", unique=True)
    metrics = models.JSONField("Métricas", default=dict)
    created_at = models.DateTimeField("Fecha de creación", auto_now_add=True)
    updated_at = models.DateTimeField("Fecha de actualización", auto_now=True)
    
    class Meta:
        verbose_name = "Resumen Diario"
        verbose_name_plural = "Resúmenes Diarios"
        ordering = ['-date']
        
    def __str__(self):
        return f"Resumen del {self.date.strftime('%Y-%m-%d')}"