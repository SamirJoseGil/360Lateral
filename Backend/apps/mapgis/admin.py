"""
Admin panel para MapGIS
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import MapGISCache


@admin.register(MapGISCache)
class MapGISCacheAdmin(admin.ModelAdmin):
    """Admin para el cache de MapGIS"""
    
    list_display = [
        'cbml',
        'consulted_at',
        'expiry_date',
        'is_valid_display',
        'hit_count',
        'area_display',
        'actions_display'
    ]
    
    list_filter = [
        'is_valid',
        'consulted_at',
        'expiry_date'
    ]
    
    search_fields = [
        'cbml',
        'data'
    ]
    
    readonly_fields = [
        'cbml',
        'consulted_at',
        'hit_count',
        'data_preview'
    ]
    
    fieldsets = (
        ('Información del Lote', {
            'fields': ('cbml', 'hit_count')
        }),
        ('Datos Completos', {
            'fields': ('data_preview',),
            'classes': ('collapse',)
        }),
        ('Cache Info', {
            'fields': ('consulted_at', 'expiry_date', 'is_valid')
        }),
    )
    
    def is_valid_display(self, obj):
        """Mostrar estado del cache con colores"""
        if obj.is_expired():
            return format_html(
                '<span style="color: red; font-weight: bold;">❌ Expirado</span>'
            )
        elif obj.is_valid:
            return format_html(
                '<span style="color: green; font-weight: bold;">✅ Válido</span>'
            )
        else:
            return format_html(
                '<span style="color: orange; font-weight: bold;">⚠️ Inválido</span>'
            )
    is_valid_display.short_description = 'Estado'
    
    def area_display(self, obj):
        """Mostrar área del lote si está disponible"""
        area = obj.data.get('area_lote_m2')
        if area:
            return f"{area} m²"
        return "N/A"
    area_display.short_description = 'Área'
    
    def actions_display(self, obj):
        """Botones de acción"""
        return format_html(
            '<a class="button" href="{}">🔍 Ver</a> '
            '<a class="button" style="background: #dc3545; color: white;" '
            'onclick="return confirm(\'¿Invalidar cache?\')" href="{}">🗑️ Invalidar</a>',
            reverse('admin:mapgis_mapgiscache_change', args=[obj.pk]),
            reverse('admin:mapgis_mapgiscache_delete', args=[obj.pk])
        )
    actions_display.short_description = 'Acciones'
    
    def data_preview(self, obj):
        """Vista previa de los datos JSON"""
        import json
        formatted_json = json.dumps(obj.data, indent=2, ensure_ascii=False)
        return format_html(
            '<pre style="background: #f5f5f5; padding: 10px; '
            'border-radius: 5px; max-height: 400px; overflow: auto;">{}</pre>',
            formatted_json
        )
    data_preview.short_description = 'Datos Completos'
    
    actions = ['invalidate_cache', 'refresh_cache']
    
    def invalidate_cache(self, request, queryset):
        """Invalidar cache seleccionado"""
        count = queryset.count()
        queryset.update(is_valid=False)
        self.message_user(request, f'{count} registros invalidados')
    invalidate_cache.short_description = '🗑️ Invalidar cache seleccionado'
    
    def refresh_cache(self, request, queryset):
        """Refrescar cache (marcar para re-consulta)"""
        count = queryset.count()
        queryset.update(
            is_valid=False,
            expiry_date=timezone.now()
        )
        self.message_user(request, f'{count} registros marcados para actualización')
    refresh_cache.short_description = '🔄 Marcar para actualizar'
