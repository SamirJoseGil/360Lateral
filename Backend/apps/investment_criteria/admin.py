"""
Admin para criterios de inversión
"""
from django.contrib import admin
from .models import InvestmentCriteria, CriteriaMatch


@admin.register(InvestmentCriteria)
class InvestmentCriteriaAdmin(admin.ModelAdmin):
    """Admin para criterios de inversión"""
    list_display = [
        'name', 'developer', 'status', 'area_range', 
        'budget_range', 'created_at'
    ]
    list_filter = ['status', 'enable_notifications', 'created_at']
    search_fields = ['name', 'developer__email', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['developer']
    
    def area_range(self, obj):
        return f"{obj.area_min} - {obj.area_max} m²"
    area_range.short_description = 'Rango de Área'
    
    def budget_range(self, obj):
        return f"${obj.budget_min:,.0f} - ${obj.budget_max:,.0f}"
    budget_range.short_description = 'Rango de Presupuesto'


@admin.register(CriteriaMatch)
class CriteriaMatchAdmin(admin.ModelAdmin):
    """Admin para matches de criterios"""
    list_display = ['criteria', 'lote', 'match_score', 'notified', 'created_at']
    list_filter = ['notified', 'created_at']
    search_fields = ['criteria__name', 'lote__nombre']
    readonly_fields = ['created_at']
