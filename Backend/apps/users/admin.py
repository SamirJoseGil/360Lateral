"""
Configuración del admin para usuarios
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile, UserRequest


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Admin personalizado para usuarios"""
    
    # Campos mostrados en la lista
    list_display = ('email', 'get_full_name', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'username')
    ordering = ('-created_at',)
    
    # Campos en el formulario de edición
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Información Personal'), {
            'fields': ('first_name', 'last_name', 'username', 'phone', 'company')
        }),
        (_('Permisos'), {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_verified')
        }),
        (_('Fechas importantes'), {
            'fields': ('last_login', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Campos al crear un nuevo usuario
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    filter_horizontal = ()
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin para el perfil de usuario"""
    
    list_display = ('user', 'location', 'language', 'created_at')
    list_filter = ('language', 'email_notifications', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'location')
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Usuario', {'fields': ('user',)}),
        ('Información Personal', {
            'fields': ('bio', 'location', 'website', 'linkedin')
        }),
        ('Configuración', {
            'fields': ('language', 'timezone', 'email_notifications', 'sms_notifications')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserRequest)
class UserRequestAdmin(admin.ModelAdmin):
    """Admin para las solicitudes de usuario"""
    
    list_display = ('id', 'request_type', 'title', 'user', 'status', 'created_at', 'updated_at')
    list_filter = ('request_type', 'status', 'created_at')
    search_fields = ('title', 'description', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('user', 'request_type', 'title', 'description', 'status')
        }),
        ('Review Information', {
            'fields': ('reviewer', 'review_notes')
        }),
        ('Additional Information', {
            'fields': ('reference_id', 'metadata', 'created_at', 'updated_at')
        }),
    )