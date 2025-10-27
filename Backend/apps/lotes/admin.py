"""
Configuración del admin para el módulo de lotes
"""
from django.contrib import admin
from .models import Lote, Favorite


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    """
    Configuración del admin para Lote - CORREGIDA sin campo comuna
    """
    list_display = [
        'nombre', 
        'direccion', 
        'area', 
        'barrio',  # ✅ Usar barrio en lugar de comuna
        'estrato',
        'owner', 
        'status', 
        'is_verified',
        'created_at'
    ]
    
    list_filter = [
        'status', 
        'is_verified', 
        'estrato',  # ✅ CORREGIDO: usar 'estrato' en lugar de 'comuna'
        'barrio',   # ✅ Agregar barrio como filtro
        'created_at',
        'updated_at'
    ]
    
    search_fields = [
        'nombre', 
        'direccion', 
        'cbml', 
        'matricula', 
        'barrio',  # ✅ Usar barrio en lugar de comuna
        'owner__email',
        'owner__first_name',
        'owner__last_name'
    ]
    
    readonly_fields = [
        'id',
        'created_at', 
        'updated_at'  # ✅ CORREGIDO: solo campos que existen
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'nombre',
                'direccion',
                'area',
                'owner'
            )
        }),
        ('Identificación Catastral', {
            'fields': (
                'cbml',
                'matricula',
                'codigo_catastral'
            )
        }),
        ('Ubicación', {
            'fields': (
                'barrio',
                'estrato',
                'latitud',
                'longitud'
            )
        }),
        ('Normativa Urbanística', {
            'fields': (
                'clasificacion_suelo',
                'uso_suelo',
                'tratamiento_pot'
            )
        }),
        ('Estado y Verificación', {
            'fields': (
                'status',
                'is_verified',
                'descripcion'
            )
        }),
        ('Metadatos', {
            'fields': (
                'metadatos',
            ),
            'classes': ('collapse',)
        }),
        ('Sistema', {
            'fields': (
                'id',
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        """Optimizar queries con select_related"""
        return super().get_queryset(request).select_related('owner')
    
    def save_model(self, request, obj, form, change):
        """Guardar modelo con validaciones adicionales"""
        if not change:  # Si es un objeto nuevo
            if not obj.owner:
                obj.owner = request.user
        super().save_model(request, obj, form, change)


# Si hay otros modelos relacionados, agregarlos aquí
try:
    from .models import Favorite
    
    @admin.register(Favorite)
    class FavoriteAdmin(admin.ModelAdmin):
        """Admin para favoritos"""
        list_display = ['user', 'lote', 'created_at']
        list_filter = ['created_at']
        search_fields = [
            'user__email', 
            'lote__nombre', 
            'lote__direccion'
        ]
        readonly_fields = ['created_at']
        
        def get_queryset(self, request):
            return super().get_queryset(request).select_related('user', 'lote')

except ImportError:
    # El modelo Favorite no existe, continuar
    pass

try:
    from .models import Tratamiento
    
    @admin.register(Tratamiento)
    class TratamientoAdmin(admin.ModelAdmin):
        """Admin para tratamientos"""
        list_display = ['codigo', 'nombre', 'activo']
        list_filter = ['activo']
        search_fields = ['codigo', 'nombre']
        readonly_fields = ['created_at', 'updated_at']

except ImportError:
    # El modelo Tratamiento no existe, continuar
    pass
