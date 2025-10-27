"""
Filtros para lotes - CORREGIDO sin campo comuna
"""
import django_filters
from .models import Lote

class LoteFilter(django_filters.FilterSet):
    """
    Filtro para lotes con campos que realmente existen
    """
    # Filtros de texto
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    direccion = django_filters.CharFilter(lookup_expr='icontains')
    barrio = django_filters.CharFilter(lookup_expr='icontains')
    cbml = django_filters.CharFilter(lookup_expr='icontains')
    matricula = django_filters.CharFilter(lookup_expr='icontains')
    
    # Filtros numéricos
    area_min = django_filters.NumberFilter(field_name='area', lookup_expr='gte')
    area_max = django_filters.NumberFilter(field_name='area', lookup_expr='lte')
    estrato = django_filters.NumberFilter()
    
    # Filtros de estado
    status = django_filters.ChoiceFilter(choices=Lote._meta.get_field('status').choices)
    is_verified = django_filters.BooleanFilter()
    
    # Filtros de clasificación
    clasificacion_suelo = django_filters.CharFilter(lookup_expr='icontains')
    uso_suelo = django_filters.CharFilter(lookup_expr='icontains')
    tratamiento_pot = django_filters.CharFilter(lookup_expr='icontains')
    
    # Filtros de fecha
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Lote
        fields = [
            'nombre', 'direccion', 'barrio', 'cbml', 'matricula',
            'area_min', 'area_max', 'estrato', 'status', 'is_verified',
            'clasificacion_suelo', 'uso_suelo', 'tratamiento_pot',
            'created_after', 'created_before'
        ]