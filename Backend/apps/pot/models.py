"""
Modelos para gestionar los datos del Plan de Ordenamiento Territorial (POT).
"""
from django.db import models
from django.utils import timezone

class TratamientoPOT(models.Model):
    """
    Modelo principal para los tratamientos urbanísticos del POT.
    """
    TIPOS_TRATAMIENTO = [
        ('CN1', 'Consolidación Nivel 1'),
        ('CN2', 'Consolidación Nivel 2'),
        ('CN3', 'Consolidación Nivel 3'),
        ('CN4', 'Consolidación Nivel 4'),
        ('RD', 'Redesarrollo'),
        ('D', 'Desarrollo'),
        ('C', 'Conservación'),
    ]
    
    codigo = models.CharField("Código", max_length=10, unique=True, help_text="Código único del tratamiento (ej: CN1)")
    nombre = models.CharField("Nombre", max_length=100, help_text="Nombre del tratamiento")
    descripcion = models.TextField("Descripción", blank=True, null=True, help_text="Descripción detallada del tratamiento")
    
    # Índices de aprovechamiento
    indice_ocupacion = models.DecimalField("Índice de ocupación", max_digits=3, decimal_places=2, null=True, blank=True, help_text="Relación área ocupada / área del lote (0-1)")
    indice_construccion = models.DecimalField("Índice de construcción", max_digits=3, decimal_places=1, null=True, blank=True, help_text="Relación área construida / área del lote")
    altura_maxima = models.PositiveSmallIntegerField("Altura máxima (pisos)", null=True, blank=True, help_text="Número máximo de pisos permitidos")
    
    # Retiros
    retiro_frontal = models.DecimalField("Retiro frontal (m)", max_digits=4, decimal_places=1, null=True, blank=True)
    retiro_lateral = models.DecimalField("Retiro lateral (m)", max_digits=4, decimal_places=1, null=True, blank=True)
    retiro_posterior = models.DecimalField("Retiro posterior (m)", max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Campos adicionales
    metadatos = models.JSONField("Metadatos adicionales", default=dict, blank=True, help_text="Otros detalles específicos del tratamiento")
    fecha_creacion = models.DateTimeField("Fecha de creación", auto_now_add=True)
    fecha_actualizacion = models.DateTimeField("Última actualización", auto_now=True)
    activo = models.BooleanField("Activo", default=True, help_text="Indica si este tratamiento sigue vigente")
    
    class Meta:
        app_label = 'pot'
        verbose_name = "Tratamiento POT"
        verbose_name_plural = "Tratamientos POT"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class FrenteMinimoPOT(models.Model):
    """
    Frentes mínimos para diferentes tipos de vivienda según el tratamiento POT.
    """
    TIPOS_VIVIENDA = [
        ('unifamiliar', 'Unifamiliar'),
        ('bifamiliar_pisos_diferentes', 'Bifamiliar en pisos diferentes'),
        ('bifamiliar_mismo_piso', 'Bifamiliar en el mismo piso'),
        ('trifamiliar', 'Trifamiliar'),
        ('multifamiliar', 'Multifamiliar'),
    ]
    
    tratamiento = models.ForeignKey(TratamientoPOT, on_delete=models.CASCADE, related_name='frentes_minimos')
    tipo_vivienda = models.CharField("Tipo de vivienda", max_length=30, choices=TIPOS_VIVIENDA)
    frente_minimo = models.DecimalField("Frente mínimo (m)", max_digits=5, decimal_places=2)
    
    class Meta:
        app_label = 'pot'
        verbose_name = "Frente Mínimo POT"
        verbose_name_plural = "Frentes Mínimos POT"
        unique_together = ['tratamiento', 'tipo_vivienda']
    
    def __str__(self):
        return f"{self.tratamiento.nombre} - {self.get_tipo_vivienda_display()}: {self.frente_minimo}m"


class AreaMinimaLotePOT(models.Model):
    """
    Áreas mínimas de lote para diferentes tipos de vivienda según el tratamiento POT.
    """
    TIPOS_VIVIENDA = [
        ('unifamiliar', 'Unifamiliar'),
        ('bifamiliar_pisos_diferentes', 'Bifamiliar en pisos diferentes'),
        ('bifamiliar_mismo_piso', 'Bifamiliar en el mismo piso'),
        ('trifamiliar', 'Trifamiliar'),
        ('multifamiliar', 'Multifamiliar'),
    ]
    
    tratamiento = models.ForeignKey(TratamientoPOT, on_delete=models.CASCADE, related_name='areas_minimas_lote')
    tipo_vivienda = models.CharField("Tipo de vivienda", max_length=30, choices=TIPOS_VIVIENDA)
    area_minima = models.DecimalField("Área mínima (m²)", max_digits=8, decimal_places=2)
    
    class Meta:
        app_label = 'pot'
        verbose_name = "Área Mínima de Lote POT"
        verbose_name_plural = "Áreas Mínimas de Lote POT"
        unique_together = ['tratamiento', 'tipo_vivienda']
    
    def __str__(self):
        return f"{self.tratamiento.nombre} - {self.get_tipo_vivienda_display()}: {self.area_minima}m²"


class AreaMinimaViviendaPOT(models.Model):
    """
    Áreas mínimas de vivienda según el tratamiento POT.
    """
    TIPOS_VIVIENDA = [
        ('1_alcoba', '1 Alcoba'),
        ('2_alcobas', '2 Alcobas'),
        ('3_alcobas_vip', '3 Alcobas VIP'),
        ('3_alcobas_vis', '3 Alcobas VIS'),
        ('4_alcobas_vip', '4 Alcobas VIP'),
        ('4_alcobas_vis', '4 Alcobas VIS'),
    ]
    
    tratamiento = models.ForeignKey(TratamientoPOT, on_delete=models.CASCADE, related_name='areas_minimas_vivienda')
    tipo_vivienda = models.CharField("Tipo de vivienda", max_length=30, choices=TIPOS_VIVIENDA)
    area_minima = models.DecimalField("Área mínima (m²)", max_digits=8, decimal_places=2)
    
    class Meta:
        app_label = 'pot'
        verbose_name = "Área Mínima de Vivienda POT"
        verbose_name_plural = "Áreas Mínimas de Vivienda POT"
        unique_together = ['tratamiento', 'tipo_vivienda']
    
    def __str__(self):
        return f"{self.tratamiento.nombre} - {self.get_tipo_vivienda_display()}: {self.area_minima}m²"