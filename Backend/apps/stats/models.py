"""
Modelos para la aplicación de estadísticas.
"""
from django.db import models
from django.utils import timezone

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
    
    type = models.CharField("Tipo", max_length=20, choices=STAT_TYPES)
    name = models.CharField("Nombre", max_length=100)
    value = models.JSONField("Valor", default=dict)
    timestamp = models.DateTimeField("Marca de tiempo", default=timezone.now)
    user_id = models.IntegerField("ID de Usuario", null=True, blank=True)
    session_id = models.CharField("ID de Sesión", max_length=100, null=True, blank=True)
    ip_address = models.GenericIPAddressField("Dirección IP", null=True, blank=True)
    
    class Meta:
        verbose_name = "Estadística"
        verbose_name_plural = "Estadísticas"
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.type} - {self.name} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"

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