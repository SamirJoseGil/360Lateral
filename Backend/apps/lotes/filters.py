"""
Filtros para la aplicación de lotes.
"""
import django_filters
from django.db.models import Q
from .models import Lote

class LoteFilterSet(django_filters.FilterSet):
    """
    Conjunto de filtros para el modelo Lote.
    
    Permite filtrar lotes por:
    - area_min, area_max: Rango de áreas
    - estrato: Estrato socioeconómico
    - status: Estado del lote (activo, pendiente, archivado)
    - owner: Propietario del lote
    - created_after, created_before: Fechas de creación
    - search: Búsqueda en varios campos
    """
    # Rangos numéricos
    area_min = django_filters.NumberFilter(field_name='area', lookup_expr='gte')
    area_max = django_filters.NumberFilter(field_name='area', lookup_expr='lte')
    
    # Filtros por fecha
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    # Búsqueda en múltiples campos
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = Lote
        fields = [
            'estrato', 'status', 'owner', 
            'area_min', 'area_max', 
            'created_after', 'created_before',
            'search'
        ]
    
    def filter_search(self, queryset, name, value):
        """
        Filtra por término de búsqueda en múltiples campos.
        """
        return queryset.filter(
            Q(nombre__icontains=value) |
            Q(direccion__icontains=value) |
            Q(codigo_catastral__icontains=value) |
            Q(matricula__icontains=value) |
            Q(cbml__icontains=value)
        )