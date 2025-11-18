"""
Admin para solicitudes
"""
from django.contrib import admin
from .models import Solicitud


@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    """Admin para solicitudes"""
    list_display = [
        'id', 'tipo', 'titulo', 'usuario', 'estado', 
        'prioridad', 'created_at'
    ]
    list_filter = ['tipo', 'estado', 'prioridad', 'created_at']
    search_fields = ['titulo', 'descripcion', 'usuario__email']
    readonly_fields = ['created_at', 'updated_at', 'resuelta_at']
    raw_id_fields = ['usuario', 'revisor', 'lote']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('usuario', 'tipo', 'titulo', 'descripcion', 'lote')
        }),
        ('Estado', {
            'fields': ('estado', 'prioridad', 'revisor', 'notas_revision')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at', 'resuelta_at')
        }),
        ('Metadatos', {
            'fields': ('metadatos',),
            'classes': ('collapse',)
        }),
    )
