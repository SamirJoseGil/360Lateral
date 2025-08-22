"""
Permisos personalizados para la gestión de usuarios
"""
from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permite acceso solo al propietario del objeto o a administradores.
    """
    
    def has_permission(self, request, view):
        # Para generación de esquema, permitir
        if getattr(view, 'swagger_fake_view', False):
            return True
        
        # Verificar si el usuario está autenticado
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Para generación de esquema, permitir
        if getattr(view, 'swagger_fake_view', False):
            return True
            
        # Permitir si es admin
        if hasattr(request.user, 'is_admin') and request.user.is_admin:
            return True
            
        # Permitir si es el propietario del objeto
        return hasattr(obj, 'user') and obj.user == request.user


class CanManageUsers(permissions.BasePermission):
    """
    Permite acceso según el rol del usuario.
    """
    
    def has_permission(self, request, view):
        # Para generación de esquema, permitir
        if getattr(view, 'swagger_fake_view', False):
            return True
            
        # Verificar si el usuario está autenticado
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Para listado o visualización, permitir a todos los autenticados
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Para modificaciones, solo admin puede crear/modificar otros usuarios
        return hasattr(request.user, 'is_admin') and request.user.is_admin
        
    def has_object_permission(self, request, view, obj):
        # Para generación de esquema, permitir
        if getattr(view, 'swagger_fake_view', False):
            return True
            
        # Admin puede hacer todo
        if hasattr(request.user, 'is_admin') and request.user.is_admin:
            return True
            
        # Usuarios normales solo pueden ver/editar su propio perfil
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Para edición, verificar si es el mismo usuario
        return obj.id == request.user.id