"""
Modelos para criterios de inversión de desarrolladores
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid
import logging

logger = logging.getLogger(__name__)


class InvestmentCriteria(models.Model):
    """
    Criterios de búsqueda de lotes para desarrolladores.
    Permite guardar preferencias de inversión.
    """
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('archived', 'Archivado'),
    ]
    
    # Campos básicos
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    developer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='investment_criteria',
        verbose_name='Desarrollador'
    )
    
    name = models.CharField(
        max_length=200,
        verbose_name='Nombre del Criterio',
        help_text='Nombre descriptivo para identificar este criterio'
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del criterio'
    )
    
    # Criterios de área
    area_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Área Mínima (m²)',
        help_text='Área mínima del lote en metros cuadrados'
    )
    
    area_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Área Máxima (m²)',
        help_text='Área máxima del lote en metros cuadrados'
    )
    
    # Criterios de presupuesto
    budget_min = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Presupuesto Mínimo (COP)',
        help_text='Presupuesto mínimo de inversión'
    )
    
    budget_max = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Presupuesto Máximo (COP)',
        help_text='Presupuesto máximo de inversión'
    )
    
    # Ubicaciones de interés (JSON array)
    zones = models.JSONField(
        default=list,
        verbose_name='Zonas de Interés',
        help_text='Lista de zonas o barrios de interés'
    )
    
    # Tratamientos urbanísticos de interés
    treatments = models.JSONField(
        default=list,
        verbose_name='Tratamientos de Interés',
        help_text='Lista de tratamientos urbanísticos preferidos'
    )
    
    # Estratos de interés
    estratos = models.JSONField(
        default=list,
        verbose_name='Estratos de Interés',
        help_text='Lista de estratos preferidos'
    )
    
    # Usos de suelo preferidos
    uso_suelo_preferido = models.JSONField(
        default=list,
        verbose_name='Usos de Suelo Preferidos',
        help_text='Lista de usos de suelo preferidos (residencial, comercial, etc.)'
    )
    
    # Estado
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Estado',
        db_index=True
    )
    
    # Notificaciones
    enable_notifications = models.BooleanField(
        default=True,
        verbose_name='Habilitar Notificaciones',
        help_text='Recibir notificaciones cuando haya lotes que coincidan'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    
    # Metadatos adicionales
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadatos Adicionales'
    )
    
    class Meta:
        verbose_name = 'Criterio de Inversión'
        verbose_name_plural = 'Criterios de Inversión'
        ordering = ['-created_at']
        db_table = 'investment_criteria'
        indexes = [
            models.Index(fields=['developer', 'status']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.developer.email}"
    
    def save(self, *args, **kwargs):
        """Override para validar y loggear"""
        # Validar que area_max >= area_min
        if self.area_max < self.area_min:
            raise ValueError("El área máxima debe ser mayor o igual al área mínima")
        
        # Validar que budget_max >= budget_min
        if self.budget_max < self.budget_min:
            raise ValueError("El presupuesto máximo debe ser mayor o igual al presupuesto mínimo")
        
        super().save(*args, **kwargs)
        logger.info(f"Investment criteria saved: {self.id} - {self.name}")
    
    @property
    def is_active(self):
        """Verifica si el criterio está activo"""
        return self.status == 'active'
    
    def get_matching_lotes_count(self):
        """
        Cuenta cuántos lotes coinciden con este criterio.
        Método de ejemplo, se puede optimizar.
        """
        from apps.lotes.models import Lote
        from django.db.models import Q
        
        queryset = Lote.objects.filter(
            status='active',
            is_verified=True,
            area__gte=self.area_min,
            area__lte=self.area_max
        )
        
        # Filtrar por zonas si hay
        if self.zones:
            zone_filters = Q()
            for zone in self.zones:
                zone_filters |= Q(barrio__icontains=zone)
            queryset = queryset.filter(zone_filters)
        
        # Filtrar por estratos si hay
        if self.estratos:
            queryset = queryset.filter(estrato__in=self.estratos)
        
        return queryset.count()


class CriteriaMatch(models.Model):
    """
    Registro de lotes que coinciden con un criterio.
    Útil para notificaciones y seguimiento.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    criteria = models.ForeignKey(
        InvestmentCriteria,
        on_delete=models.CASCADE,
        related_name='matches',
        verbose_name='Criterio'
    )
    
    lote = models.ForeignKey(
        'lotes.Lote',
        on_delete=models.CASCADE,
        related_name='criteria_matches',
        verbose_name='Lote'
    )
    
    match_score = models.IntegerField(
        default=0,
        verbose_name='Puntuación de Coincidencia',
        help_text='Puntuación de 0-100 indicando qué tan bien coincide'
    )
    
    notified = models.BooleanField(
        default=False,
        verbose_name='Notificado',
        help_text='Si el desarrollador fue notificado sobre este match'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Coincidencia de Criterio'
        verbose_name_plural = 'Coincidencias de Criterios'
        ordering = ['-match_score', '-created_at']
        unique_together = ['criteria', 'lote']
        db_table = 'investment_criteria_match'
    
    def __str__(self):
        return f"{self.criteria.name} - {self.lote.nombre} (Score: {self.match_score})"
