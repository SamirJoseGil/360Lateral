"""
Configuración del admin para usuarios
Proporciona interfaces de administración personalizadas para los modelos de usuarios
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count

from .models import User, UserProfile, UserRequest, PasswordResetToken


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """
    Admin personalizado para el modelo User.
    Incluye campos específicos por rol y mejoras en la visualización.
    """
    
    # Campos mostrados en la lista
    list_display = (
        'email',
        'get_full_name',
        'role',
        'is_active',
        'is_verified',
        'created_at',
        'get_requests_count'
    )
    list_filter = ('role', 'is_active', 'is_verified', 'is_staff', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'username')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    # Campos en el formulario de edición
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        (_('Información Personal'), {
            'fields': ('first_name', 'last_name', 'username', 'phone', 'company')
        }),
        (_('Permisos'), {
            'fields': (
                'role',
                'is_active',
                'is_staff',
                'is_superuser',
                'is_verified',
                'groups',
                'user_permissions'
            )
        }),
        (_('Campos Específicos - Propietario'), {
            'fields': ('document_type', 'document_number', 'address', 'lots_count'),
            'classes': ('collapse',),
        }),
        (_('Campos Específicos - Desarrollador'), {
            'fields': (
                'company_name',
                'company_nit',
                'position',
                'experience_years',
                'portfolio_url',
                'focus_area'
            ),
            'classes': ('collapse',),
        }),
        (_('Campos Específicos - Admin'), {
            'fields': ('department', 'permissions_scope'),
            'classes': ('collapse',),
        }),
        (_('Fechas Importantes'), {
            'fields': ('last_login', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Campos al crear un nuevo usuario
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'username',
                'first_name',
                'last_name',
                'role',
                'password1',
                'password2'
            ),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    filter_horizontal = ('groups', 'user_permissions')
    
    def get_queryset(self, request):
        """Override para optimizar queries"""
        queryset = super().get_queryset(request)
        return queryset.annotate(
            requests_count=Count('requests')
        )
    
    def get_requests_count(self, obj):
        """Mostrar conteo de solicitudes del usuario"""
        count = obj.requests_count if hasattr(obj, 'requests_count') else obj.requests.count()
        url = reverse('admin:users_userrequest_changelist') + f'?user__id__exact={obj.id}'
        return format_html(
            '<a href="{}">{} solicitudes</a>',
            url,
            count
        )
    get_requests_count.short_description = 'Solicitudes'
    get_requests_count.admin_order_field = 'requests_count'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin para el perfil de usuario.
    Gestiona configuraciones y preferencias personales.
    """
    
    list_display = (
        'user',
        'location',
        'language',
        'email_notifications',
        'created_at'
    )
    list_filter = (
        'language',
        'email_notifications',
        'sms_notifications',
        'created_at'
    )
    search_fields = (
        'user__email',
        'user__first_name',
        'user__last_name',
        'location',
        'bio'
    )
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Información Personal', {
            'fields': ('avatar', 'bio', 'location', 'website', 'linkedin')
        }),
        ('Configuración', {
            'fields': (
                'language',
                'timezone',
                'email_notifications',
                'sms_notifications'
            )
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserRequest)
class UserRequestAdmin(admin.ModelAdmin):
    """
    Admin para las solicitudes de usuario.
    Permite gestionar y revisar solicitudes de manera eficiente.
    """
    
    list_display = (
        'id',
        'get_request_type_display',
        'title',
        'get_user_link',
        'get_status_badge',
        'created_at',
        'updated_at'
    )
    list_filter = (
        'request_type',
        'status',
        'created_at',
        'updated_at'
    )
    search_fields = (
        'title',
        'description',
        'user__username',
        'user__email',
        'reference_id'
    )
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    raw_id_fields = ('user', 'reviewer')
    list_per_page = 25
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('user', 'request_type', 'title', 'description', 'reference_id')
        }),
        ('Estado', {
            'fields': ('status',)
        }),
        ('Revisión', {
            'fields': ('reviewer', 'review_notes'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Información Adicional', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_approved', 'mark_as_rejected', 'mark_as_in_review']
    
    def get_user_link(self, obj):
        """Link al usuario en el admin"""
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html(
            '<a href="{}">{}</a>',
            url,
            obj.user.email
        )
    get_user_link.short_description = 'Usuario'
    
    def get_status_badge(self, obj):
        """Badge visual para el estado"""
        colors = {
            'pending': '#ffc107',
            'in_review': '#17a2b8',
            'approved': '#28a745',
            'rejected': '#dc3545',
            'completed': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    get_status_badge.short_description = 'Estado'
    
    def mark_as_approved(self, request, queryset):
        """Acción para aprobar solicitudes"""
        updated = queryset.update(status='approved', reviewer=request.user)
        self.message_user(
            request,
            f'{updated} solicitud(es) aprobada(s) exitosamente.'
        )
    mark_as_approved.short_description = 'Marcar como aprobado'
    
    def mark_as_rejected(self, request, queryset):
        """Acción para rechazar solicitudes"""
        updated = queryset.update(status='rejected', reviewer=request.user)
        self.message_user(
            request,
            f'{updated} solicitud(es) rechazada(s).'
        )
    mark_as_rejected.short_description = 'Marcar como rechazado'
    
    def mark_as_in_review(self, request, queryset):
        """Acción para poner en revisión"""
        updated = queryset.update(status='in_review', reviewer=request.user)
        self.message_user(
            request,
            f'{updated} solicitud(es) puesta(s) en revisión.'
        )
    mark_as_in_review.short_description = 'Marcar como en revisión'


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """
    Admin para tokens de recuperación de contraseña
    """
    list_display = [
        'id',
        'get_user_email',
        'token_preview',
        'get_status_badge',
        'created_at',
        'expires_at',
        'is_used',
        'used_at'
    ]
    list_filter = ['is_used', 'created_at', 'expires_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['id', 'token', 'created_at', 'used_at']
    raw_id_fields = ['user']
    date_hierarchy = 'created_at'
    
    def get_user_email(self, obj):
        """Email del usuario"""
        return obj.user.email
    get_user_email.short_description = 'Usuario'
    
    def token_preview(self, obj):
        """Preview del token"""
        return f"{obj.token[:10]}...{obj.token[-10:]}"
    token_preview.short_description = 'Token'
    
    def get_status_badge(self, obj):
        """Badge de estado del token"""
        if obj.is_used:
            color = '#6c757d'
            text = 'USADO'
        elif obj.is_valid():
            color = '#28a745'
            text = 'VÁLIDO'
        else:
            color = '#dc3545'
            text = 'EXPIRADO'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            text
        )
    get_status_badge.short_description = 'Estado'
    
    def has_add_permission(self, request):
        """No permitir creación manual de tokens"""
        return False


# Personalización del sitio de admin
admin.site.site_header = "Lateral 360° - Administración"
admin.site.site_title = "Lateral 360°"
admin.site.index_title = "Panel de Administración"