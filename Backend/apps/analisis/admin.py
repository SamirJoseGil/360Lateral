"""
Admin para análisis urbanístico
"""
from django.contrib import admin
from .models import AnalisisUrbanistico


@admin.register(AnalisisUrbanistico)
class AnalisisUrbanisticoAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'lote', 'tipo_analisis', 'solicitante',
        'estado', 'analista', 'created_at'
    ]
    list_filter = ['estado', 'tipo_analisis', 'incluir_vis', 'created_at']
    search_fields = [
        'lote__nombre', 'lote__direccion',
        'solicitante__email', 'analista__email'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at',
        'fecha_inicio_proceso', 'fecha_completado'
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'lote', 'solicitante', 'tipo_analisis', 'incluir_vis')
        }),
        ('Estado', {
            'fields': ('estado', 'analista')
        }),
        ('Solicitud', {
            'fields': ('comentarios_solicitante',)
        }),
        ('Resultados', {
            'fields': ('resultados', 'observaciones_analista', 'archivo_informe')
        }),
        ('Fechas', {
            'fields': (
                'created_at', 'updated_at',
                'fecha_inicio_proceso', 'fecha_completado'
            )
        }),
    )
