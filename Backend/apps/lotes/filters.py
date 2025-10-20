"""
Filtros personalizados para lotes
"""
import django_filters
from .models import Lote

class LoteFilter(django_filters.FilterSet):
    """
    Filtro para lotes con múltiples opciones de búsqueda
    """
    # Filtros de rango
    area_min = django_filters.NumberFilter(field_name='area', lookup_expr='gte')
    area_max = django_filters.NumberFilter(field_name='area', lookup_expr='lte')
    
    valor_min = django_filters.NumberFilter(field_name='valor_comercial', lookup_expr='gte')
    valor_max = django_filters.NumberFilter(field_name='valor_comercial', lookup_expr='lte')
    
    # Filtros de texto
    barrio = django_filters.CharFilter(field_name='barrio', lookup_expr='icontains')
    direccion = django_filters.CharFilter(field_name='direccion', lookup_expr='icontains')
    
    # Filtros exactos
    comuna = django_filters.NumberFilter(field_name='comuna')
    estrato = django_filters.NumberFilter(field_name='estrato')
    status = django_filters.CharFilter(field_name='status')
    tratamiento = django_filters.CharFilter(field_name='tratamiento_urbanistico')
    uso_suelo = django_filters.CharFilter(field_name='uso_suelo')
    
    # Filtro booleano
    is_verified = django_filters.BooleanFilter(field_name='is_verified')
    
    class Meta:
        model = Lote
        fields = [
            'area_min', 'area_max',
            'valor_min', 'valor_max',
            'barrio', 'direccion',
            'comuna', 'estrato',
            'status', 'tratamiento', 'uso_suelo',
            'is_verified'
        ]