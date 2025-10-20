"""
Configuración del admin para lotes
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Lote, LoteDocument, LoteHistory, Favorite


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    """Admin para Lote"""
    list_display = [
        'cbml',
        'direccion',
        'owner',
        'get_status_badge',
        'is_verified',
        'area',
        'created_at'
    ]
    list_filter = ['status', 'is_verified', 'comuna', 'estrato', 'created_at']
    search_fields = ['cbml', 'matricula', 'direccion', 'owner__email']
    readonly_fields = ['created_at', 'updated_at', 'verified_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Identificación', {
            'fields': ('cbml', 'matricula', 'owner')
        }),
        ('Ubicación', {
            'fields': ('direccion', 'barrio', 'comuna', 'estrato', 'latitud', 'longitud')
        }),
        ('Dimensiones', {
            'fields': ('area', 'area_construida', 'frente', 'fondo')
        }),
        ('Normativa', {
            'fields': (
                'tratamiento_urbanistico',
                'uso_suelo',
                'altura_maxima',
                'indice_ocupacion',
                'indice_construccion'
            )
        }),
        ('Valoración', {
            'fields': ('avaluo_catastral', 'valor_comercial', 'valor_m2')
        }),
        ('Estado', {
            'fields': ('status', 'is_verified', 'verified_by', 'verified_at')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_status_badge(self, obj):
        """Badge visual para el estado"""
        colors = {
            'pending': '#ffc107',
            'active': '#28a745',
            'archived': '#6c757d',
            'rejected': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    get_status_badge.short_description = 'Estado'
    
    actions = ['verify_lotes', 'reject_lotes']
    
    def verify_lotes(self, request, queryset):
        """Verificar lotes seleccionados"""
        count = 0
        for lote in queryset:
            lote.verify(request.user)
            count += 1
        self.message_user(request, f'{count} lote(s) verificado(s)')
    verify_lotes.short_description = 'Verificar lotes seleccionados'
    
    def reject_lotes(self, request, queryset):
        """Rechazar lotes seleccionados"""
        count = 0
        for lote in queryset:
            lote.reject(request.user, 'Rechazado desde admin')
            count += 1
        self.message_user(request, f'{count} lote(s) rechazado(s)')
    reject_lotes.short_description = 'Rechazar lotes seleccionados'


# Comentar o remover el admin de Tratamiento si no existe el modelo
# @admin.register(Tratamiento)
# class TratamientoAdmin(admin.ModelAdmin):
#     """Admin para tratamientos"""
#     list_display = ['codigo', 'nombre', 'activo', 'indice_construccion', 'altura_maxima']
#     list_filter = ['activo']
#     search_fields = ['codigo', 'nombre', 'descripcion']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    """Admin para favoritos"""
    list_display = ['user', 'lote', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'lote__cbml']
    readonly_fields = ['created_at']


# Registrar otros modelos
admin.site.register(LoteDocument)
admin.site.register(LoteHistory)
