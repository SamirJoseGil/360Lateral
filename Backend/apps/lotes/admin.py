"""
Configuración del admin para el módulo de lotes
"""
from django.contrib import admin
from .models import Lote, LoteDocument, Tratamiento, Favorite, LoteHistory


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    """
    Configuración del admin para Lote
    """
    list_display = [
        'nombre', 
        'ciudad',
        'cbml',  # ✅ Campo correcto (11 dígitos)
        'direccion', 
        'area', 
        'valor',
        'barrio', 
        'estrato',
        'status', 
        'es_comisionista',
        'owner', 
        'created_at'
    ]
    
    list_filter = [
        'status', 
        'is_verified',
        'estrato', 
        'ciudad',
        'forma_pago', 
        'es_comisionista',
        'created_at',
        'updated_at'
    ]
    
    search_fields = [
        'nombre', 
        'cbml',  # ✅ 11 dígitos para búsqueda
        'direccion', 
        'barrio', 
        'matricula', 
        'codigo_catastral'
    ]
    
    readonly_fields = [
        'id',
        'created_at', 
        'updated_at',  # ✅ CORREGIDO: solo campos que existen
        'verified_at',  # ✅ NUEVO: campo existente
        'rejected_at'  # ✅ NUEVO: campo existente
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'owner',
                'nombre',
                'descripcion',
                'direccion',
                'ciudad',
                'barrio'
            )
        }),
        ('Identificación Catastral', {
            'fields': (
                'cbml',  # ✅ 11 dígitos
                'matricula',
                'codigo_catastral'
            )
        }),
        ('Características', {
            'fields': (
                'area',
                'estrato',
                'uso_suelo',
                'clasificacion_suelo',
                'tratamiento_pot'
            )
        }),
        # ✅ NUEVO: Sección Comercial
        ('Información Comercial', {
            'fields': (
                'valor',
                'forma_pago',
                'es_comisionista',
                'carta_autorizacion'
            )
        }),
        ('Geolocalización', {
            'fields': (
                'latitud',
                'longitud'
            ),
            'classes': ('collapse',)
        }),
        ('Estado y Validación', {
            'fields': (
                'status',
                'is_verified',
                'rejection_reason',
                'verified_at',
                'rejected_at'
            )
        }),
        ('Metadatos', {
            'fields': (
                'metadatos',
            ),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': (
                'id',
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimizar queries con select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('owner')


@admin.register(LoteDocument)
class LoteDocumentAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'lote', 'tipo', 'uploaded_at']
    list_filter = ['tipo', 'uploaded_at']
    search_fields = ['titulo', 'lote__nombre', 'lote__cbml']
    readonly_fields = ['uploaded_at']


@admin.register(Tratamiento)
class TratamientoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'activo']
    list_filter = ['activo']
    search_fields = ['codigo', 'nombre']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'lote', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'lote__nombre']
    readonly_fields = ['created_at']


@admin.register(LoteHistory)
class LoteHistoryAdmin(admin.ModelAdmin):
    list_display = ['lote', 'campo_modificado', 'fecha_modificacion']
    list_filter = ['fecha_modificacion']
    search_fields = ['lote__nombre', 'campo_modificado']
    readonly_fields = ['fecha_modificacion']
