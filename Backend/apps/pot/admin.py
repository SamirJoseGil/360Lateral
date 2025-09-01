"""
Configuración del panel de administración para la aplicación POT
"""
from django.contrib import admin
from .models import TratamientoPOT, FrenteMinimoPOT, AreaMinimaLotePOT, AreaMinimaViviendaPOT


class FrenteMinimoInline(admin.TabularInline):
    model = FrenteMinimoPOT
    extra = 1


class AreaMinimaLoteInline(admin.TabularInline):
    model = AreaMinimaLotePOT
    extra = 1


class AreaMinimaViviendaInline(admin.TabularInline):
    model = AreaMinimaViviendaPOT
    extra = 1


@admin.register(TratamientoPOT)
class TratamientoPOTAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'descripcion', 'indice_ocupacion', 'indice_construccion', 'altura_maxima', 'activo')
    list_filter = ('activo',)
    search_fields = ('codigo', 'nombre', 'descripcion')
    inlines = [FrenteMinimoInline, AreaMinimaLoteInline, AreaMinimaViviendaInline]
    fieldsets = (
        (None, {
            'fields': ('codigo', 'nombre', 'descripcion', 'activo')
        }),
        ('Índices de Aprovechamiento', {
            'fields': ('indice_ocupacion', 'indice_construccion', 'altura_maxima')
        }),
        ('Retiros', {
            'fields': ('retiro_frontal', 'retiro_lateral', 'retiro_posterior')
        }),
        ('Metadatos', {
            'fields': ('metadatos',),
            'classes': ('collapse',)
        }),
    )


@admin.register(FrenteMinimoPOT)
class FrenteMinimoPOTAdmin(admin.ModelAdmin):
    list_display = ('tratamiento', 'tipo_vivienda', 'frente_minimo')
    list_filter = ('tratamiento',)
    search_fields = ('tratamiento__nombre', 'tipo_vivienda')


@admin.register(AreaMinimaLotePOT)
class AreaMinimaLotePOTAdmin(admin.ModelAdmin):
    list_display = ('tratamiento', 'tipo_vivienda', 'area_minima')
    list_filter = ('tratamiento',)
    search_fields = ('tratamiento__nombre', 'tipo_vivienda')


@admin.register(AreaMinimaViviendaPOT)
class AreaMinimaViviendaPOTAdmin(admin.ModelAdmin):
    list_display = ('tratamiento', 'tipo_vivienda', 'area_minima')
    list_filter = ('tratamiento',)
    search_fields = ('tratamiento__nombre', 'tipo_vivienda')