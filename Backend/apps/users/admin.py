"""
Configuración del admin para usuarios
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Admin personalizado para el modelo User
    """
    list_display = ('email', 'full_name', 'role', 'is_verified', 'is_active', 'created_at')
    list_filter = ('role', 'is_verified', 'is_active', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'company')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'phone', 'company'),
        }),
        ('Permisos', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_verified'),
        }),
        ('Fechas Importantes', {
            'fields': ('last_login', 'created_at', 'updated_at'),
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin para el perfil de usuario
    """
    list_display = ('user', 'location', 'website', 'created_at')
    search_fields = ('user__email', 'location')
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')
