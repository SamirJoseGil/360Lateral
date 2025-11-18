"""
Admin para notificaciones
"""
from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin para notificaciones"""
    list_display = ['title', 'user', 'type', 'priority', 'is_read', 'created_at']
    list_filter = ['type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__email']
    readonly_fields = ['id', 'created_at', 'read_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información', {
            'fields': ('user', 'type', 'title', 'message', 'priority')
        }),
        ('Relaciones', {
            'fields': ('lote_id', 'document_id', 'solicitud_id', 'action_url'),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('is_read', 'read_at', 'data')
        }),
        ('Sistema', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        }),
    )
