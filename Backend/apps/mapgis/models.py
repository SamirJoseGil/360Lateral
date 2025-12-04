"""
Modelos para cache de consultas MapGIS
"""
from django.db import models
from django.utils import timezone
from datetime import timedelta


class MapGISCache(models.Model):
    """
    Cache de consultas a MapGIS
    """
    cbml = models.CharField(
        max_length=11,  # ✅ CORREGIDO: 11 dígitos (antes era 14)
        unique=True, 
        db_index=True,
        help_text="Código Base de Manzana Lote (11 dígitos para MapGIS Medellín)",
        verbose_name="CBML"
    )
    data = models.JSONField(
        help_text="Información completa del lote desde MapGIS",
        verbose_name="Datos"
    )
    consulted_at = models.DateTimeField(
        auto_now=True, 
        verbose_name="Fecha de Consulta"
    )
    expiry_date = models.DateTimeField(
        help_text="Fecha en que expira el cache (24 horas por defecto)",
        verbose_name="Fecha de Expiración"
    )
    is_valid = models.BooleanField(
        default=True,
        db_index=True,
        help_text="False si el cache debe invalidarse",
        verbose_name="¿Es Válido?"
    )
    hit_count = models.IntegerField(
        default=0,
        help_text="Cuántas veces se ha usado este cache",
        verbose_name="Número de Hits"
    )
    
    class Meta:
        verbose_name = "Cache MapGIS"
        verbose_name_plural = "Cache MapGIS"
        db_table = "mapgis_cache"
        ordering = ["-consulted_at"]
        indexes = [
            models.Index(fields=['cbml', 'is_valid'], name='mapgis_cach_cbml_idx'),
            models.Index(fields=['expiry_date'], name='mapgis_cach_expiry_idx'),
            models.Index(fields=['consulted_at'], name='mapgis_cach_consult_idx'),
        ]
    
    def save(self, *args, **kwargs):
        # Establecer fecha de expiración si no existe (24 horas)
        if not self.expiry_date:
            self.expiry_date = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Cache MapGIS - CBML: {self.cbml}"
    
    def is_expired(self) -> bool:
        """Verificar si el cache ha expirado"""
        return timezone.now() > self.expiry_date or not self.is_valid
    
    def invalidate(self):
        """Invalidar este cache"""
        self.is_valid = False
        self.save(update_fields=['is_valid'])
    
    def increment_hit(self):
        """Incrementar contador de hits"""
        self.hit_count += 1
        self.save(update_fields=['hit_count'])
    
    @classmethod
    def cleanup_expired(cls):
        """Limpiar registros expirados"""
        expired = cls.objects.filter(expiry_date__lt=timezone.now())
        count = expired.count()
        expired.delete()
        return count
