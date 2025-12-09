"""
Admin para documentos
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """
    Admin mejorado para Document
    ✅ Nuevo: Mejor organización y visualización
    """
    list_display = [
        'get_title_display',
        'document_type',
        'get_lote_link',
        'get_user_link',
        'get_size_display',
        'get_status_badge',
        'created_at'
    ]
    
    list_filter = [
        'document_type',
        'is_active',
        'created_at',
        ('metadata__validation_status', admin.EmptyFieldListFilter),
    ]
    
    search_fields = [
        'title',
        'description',
        'user__email',
        'user__first_name',
        'user__last_name',
        'lote__nombre',
        'lote__direccion'
    ]
    
    readonly_fields = [
        'id',
        'file_size',
        'mime_type',
        'created_at',
        'updated_at',
        'get_file_preview'
    ]
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'description', 'document_type')
        }),
        ('Archivo', {
            'fields': ('file', 'get_file_preview', 'file_size', 'mime_type')
        }),
        ('Relaciones', {
            'fields': ('user', 'lote')
        }),
        ('Metadatos', {
            'fields': ('tags', 'metadata', 'is_active'),
            'classes': ('collapse',)
        }),
        ('Sistema', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimizar queries"""
        return super().get_queryset(request).select_related('user', 'lote')
    
    def get_title_display(self, obj):
        """Mostrar título con ícono"""
        icon = '📄'
        if obj.document_type == 'ctl':
            icon = '📜'
        elif obj.document_type == 'planos':
            icon = '📐'
        elif obj.document_type in ['escritura_publica', 'certificado_libertad']:
            icon = '📋'
        
        return format_html(
            '{} <strong>{}</strong>',
            icon,
            obj.title or f'Documento {obj.id}'
        )
    get_title_display.short_description = 'Título'
    
    def get_lote_link(self, obj):
        """Link al lote"""
        if obj.lote:
            url = reverse('admin:lotes_lote_change', args=[obj.lote.id])
            return format_html('<a href="{}">{}</a>', url, obj.lote.nombre or obj.lote.id)
        return '-'
    get_lote_link.short_description = 'Lote'
    
    def get_user_link(self, obj):
        """Link al usuario"""
        if obj.user:
            url = reverse('admin:users_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.email)
        return '-'
    get_user_link.short_description = 'Usuario'
    
    def get_size_display(self, obj):
        """Tamaño legible"""
        return obj.get_size_display()
    get_size_display.short_description = 'Tamaño'
    
    def get_status_badge(self, obj):
        """Badge de estado de validación"""
        status = obj.validation_status
        colors = {
            'pendiente': '#ffc107',
            'validado': '#28a745',
            'rechazado': '#dc3545'
        }
        color = colors.get(status, '#6c757d')
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color,
            status.upper()
        )
    get_status_badge.short_description = 'Estado'
    
    def get_file_preview(self, obj):
        """Preview del archivo"""
        if obj.file:
            ext = obj.file_extension
            if ext in ['.jpg', '.jpeg', '.png']:
                return format_html(
                    '<img src="{}" style="max-width: 200px; max-height: 200px;" />',
                    obj.file.url
                )
            else:
                return format_html(
                    '<a href="{}" target="_blank">Ver archivo ({})</a>',
                    obj.file.url,
                    ext
                )
        return 'Sin archivo'
    get_file_preview.short_description = 'Preview'
