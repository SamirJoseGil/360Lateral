"""
Permisos personalizados comunes para toda la aplicación
"""
from rest_framework import permissions
import logging

logger = logging.getLogger(__name__)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite lectura a todos, modificación solo a admin.
    """
    
    def has_permission(self, request, view):
        # Lectura permitida para todos autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Modificación solo para admin
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or 
            getattr(request.user, 'role', None) == 'admin'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permite acceso al propietario del objeto o al admin.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin tiene acceso completo
        if request.user.is_staff or getattr(request.user, 'role', None) == 'admin':
            return True
        
        # Verificar propiedad del objeto
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        
        return False


class IsAdminUser(permissions.BasePermission):
    """
    Permite acceso solo a administradores.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or 
            getattr(request.user, 'role', None) == 'admin'
        )


class IsVerified(permissions.BasePermission):
    """
    Requiere que el usuario tenga email verificado.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin siempre tiene acceso
        if request.user.is_staff:
            return True
        
        # Verificar email verificado
        return getattr(request.user, 'is_verified', False)


class AllowPublicEndpoints(permissions.BasePermission):
    """
    Clase de permiso personalizada que permite algunos endpoints específicos para acceso público,
    mientras mantiene la autenticación para el resto.
    """
    
    def has_permission(self, request, view):
        # Lista de endpoints públicos (en formato: método_http-path)
        public_endpoints = [
            'POST-/api/lotes/scrap/cbml/',
            'POST-/api/lotes/scrap/matricula/',
            'POST-/api/lotes/scrap/direccion/',
        ]
        
        # Obtener path y método de la solicitud actual
        path = request.path
        method = request.method
        
        # Construir identificador de endpoint
        endpoint_id = f"{method}-{path}"
        
        # Si el endpoint es público, permitir sin autenticación
        if endpoint_id in public_endpoints:
            return True
            
        # Para todos los demás endpoints, verificar autenticación
        return bool(request.user and request.user.is_authenticated)