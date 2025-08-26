"""
Configuración del admin para la app de documentos
"""
from django.contrib import admin
from .models import Documento

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    """Configuración para el admin de documentos"""
    list_display = (
        'nombre', 'tipo', 'propietario', 'lote', 
        'status', 'fecha_subida', 'tamano_mb'
    )
    list_filter = ('tipo', 'status', 'fecha_subida')
    search_fields = ('nombre', 'descripcion', 'propietario__email', 'lote__nombre')
    date_hierarchy = 'fecha_subida'
    readonly_fields = ('fecha_subida', 'fecha_modificacion', 'tamano', 'tipo_mime')
    
    def tamano_mb(self, obj):
        """Muestra el tamaño en MB"""
        if obj.tamano:
            return f"{obj.tamano / (1024 * 1024):.2f} MB"
        return "Desconocido"
    tamano_mb.short_description = "Tamaño (MB)"
