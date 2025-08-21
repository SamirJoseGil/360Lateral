from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin personalizado para el modelo User"""
    
    # Campos mostrados en la lista
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name', 'username')
    ordering = ('-date_joined',)
    
    # Campos en el formulario de edición
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Información Personal'), {'fields': ('first_name', 'last_name', 'username', 'phone', 'company')}),
        (_('Permisos'), {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Fechas importantes'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # Campos al crear un nuevo usuario
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')
    filter_horizontal = ('groups', 'user_permissions')


# Registrar otros modelos si existen
try:
    from .models import Lote, Documento, SecurityLog, UserSession
    
    @admin.register(SecurityLog)
    class SecurityLogAdmin(admin.ModelAdmin):
        list_display = ('event_type', 'user', 'ip_address', 'timestamp')
        list_filter = ('event_type', 'timestamp')
        search_fields = ('user__email', 'ip_address')
        readonly_fields = ('timestamp',)
        date_hierarchy = 'timestamp'
        
    @admin.register(UserSession) 
    class UserSessionAdmin(admin.ModelAdmin):
        list_display = ('user', 'ip_address', 'created_at', 'last_activity', 'is_active')
        list_filter = ('is_active', 'created_at')
        search_fields = ('user__email', 'ip_address')
        readonly_fields = ('session_key', 'created_at')
        
except ImportError:
    # Los modelos adicionales no están disponibles aún
    pass