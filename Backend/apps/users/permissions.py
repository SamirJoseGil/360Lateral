from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model

User = get_user_model()


class CanManageUsers(BasePermission):
    """
    Permiso personalizado para gestión de usuarios.
    - Admin: Acceso completo a todos los usuarios
    - Usuario normal: Solo acceso a su propio perfil
    """
    
    def has_permission(self, request, view):
        """Verificar permisos a nivel de vista"""
        # Requerir autenticación
        if not request.user.is_authenticated:
            return False
        
        # Admin tiene acceso completo
        if hasattr(request.user, 'role') and request.user.role == 'admin':
            return True
        
        # Usuario normal solo en ciertas acciones
        if view.action in ['list', 'retrieve', 'update', 'partial_update']:
            return True
        
        # Denegar creación y eliminación para usuarios normales
        return False
    
    def has_object_permission(self, request, view, obj):
        """Verificar permisos a nivel de objeto"""
        # Admin tiene acceso completo
        if hasattr(request.user, 'role') and request.user.role == 'admin':
            return True
        
        # Usuario normal solo puede acceder a su propio perfil
        return obj == request.user


class IsOwnerOrAdmin(BasePermission):
    """
    Permiso personalizado para permitir acceso solo al propietario o admin.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin tiene acceso completo
        if hasattr(request.user, 'role') and request.user.role == 'admin':
            return True
        
        # Verificar si el objeto tiene un campo 'propietario' o 'user'
        if hasattr(obj, 'propietario'):
            return obj.propietario == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        # Para modelos User, verificar si es el mismo usuario
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if isinstance(obj, User):
            return obj == request.user
        
        return False


class IsAdminOnly(BasePermission):
    """
    Permiso que solo permite acceso a administradores.
    """
    
    def has_permission(self, request, view):
        """Verificar si el usuario es administrador"""
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'admin'
        )


class IsOwnerOrReadOnly(BasePermission):
    """
    Permiso personalizado para permitir lectura a todos,
    pero escritura solo al propietario.
    """
    
    def has_object_permission(self, request, view, obj):
        # Permisos de lectura para cualquier request
        if request.method in SAFE_METHODS:
            return True
        
        # Admin tiene acceso completo
        if hasattr(request.user, 'role') and request.user.role == 'admin':
            return True
        
        # Permisos de escritura solo para el propietario
        if hasattr(obj, 'propietario'):
            return obj.propietario == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsAuthenticatedAndOwner(BasePermission):
    """
    Combina autenticación requerida con verificación de propietario.
    """
    
    def has_permission(self, request, view):
        """Requerir autenticación"""
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Verificar propietario o admin"""
        # Admin tiene acceso completo
        if hasattr(request.user, 'role') and request.user.role == 'admin':
            return True
        
        # Verificar propietario
        if hasattr(obj, 'propietario'):
            return obj.propietario == request.user
        elif hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        
        return False


class CanCreateUsers(BasePermission):
    """
    Permiso para crear usuarios - solo admin o durante registro.
    """
    
    def has_permission(self, request, view):
        # Permitir registro público
        if view.action == 'register':
            return True
        
        # Solo admin puede crear usuarios desde admin
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'admin'
        )