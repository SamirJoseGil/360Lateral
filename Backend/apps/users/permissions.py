"""
Permisos personalizados para la gestión de usuarios.
Define políticas de acceso basadas en roles y propietarios.
"""
from rest_framework import permissions
import logging

logger = logging.getLogger(__name__)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permite acceso solo al propietario del objeto o a administradores.
    Útil para recursos que pertenecen a un usuario específico.
    """
    
    def has_permission(self, request, view):
        """Verificar permisos a nivel de vista"""
        # Para esquemas de Swagger, permitir
        if getattr(view, 'swagger_fake_view', False):
            return True
        
        # Verificar autenticación
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Verificar permisos a nivel de objeto"""
        # Para esquemas de Swagger, permitir
        if getattr(view, 'swagger_fake_view', False):
            return True
        
        # Admin tiene acceso completo
        if hasattr(request.user, 'is_admin') and request.user.is_admin:
            logger.debug(f"Admin access granted to {request.user.username}")
            return True
        
        # Verificar propiedad del objeto
        if hasattr(obj, 'user'):
            is_owner = obj.user == request.user
            if not is_owner:
                logger.warning(
                    f"Access denied: {request.user.username} "
                    f"tried to access resource owned by {obj.user.username}"
                )
            return is_owner
        
        # Si no tiene campo 'user', verificar si el objeto ES el usuario
        if hasattr(obj, 'id'):
            is_self = obj.id == request.user.id
            if not is_self:
                logger.warning(
                    f"Access denied: {request.user.username} "
                    f"tried to access user {obj.username}"
                )
            return is_self
        
        return False


class CanManageUsers(permissions.BasePermission):
    """
    Permite gestión de usuarios según el rol.
    - Admin: Puede crear, modificar y eliminar usuarios
    - Otros: Solo pueden ver usuarios
    """
    
    def has_permission(self, request, view):
        """Verificar permisos a nivel de vista"""
        # Para esquemas de Swagger, permitir
        if getattr(view, 'swagger_fake_view', False):
            return True
        
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            logger.warning("Unauthenticated access attempt to user management")
            return False
        
        # Para métodos seguros (GET, HEAD, OPTIONS), permitir a autenticados
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Para modificaciones, solo admin
        is_admin = hasattr(request.user, 'is_admin') and request.user.is_admin
        if not is_admin:
            logger.warning(
                f"Non-admin user {request.user.username} "
                f"attempted {request.method} on users"
            )
        return is_admin
    
    def has_object_permission(self, request, view, obj):
        """Verificar permisos a nivel de objeto"""
        # Para esquemas de Swagger, permitir
        if getattr(view, 'swagger_fake_view', False):
            return True
        
        # Admin puede hacer todo
        if hasattr(request.user, 'is_admin') and request.user.is_admin:
            return True
        
        # Para métodos seguros, permitir a todos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Para edición, verificar si es el mismo usuario
        if hasattr(obj, 'id'):
            is_self = obj.id == request.user.id
            if not is_self:
                logger.warning(
                    f"User {request.user.username} "
                    f"attempted to modify user {obj.username}"
                )
            return is_self
        
        return False


class IsRequestOwnerOrStaff(permissions.BasePermission):
    """
    Permiso para solicitudes de usuario.
    - Staff: Puede ver y modificar todas las solicitudes
    - Usuario: Solo puede ver y modificar sus propias solicitudes
    """
    
    def has_permission(self, request, view):
        """Verificar permisos a nivel de vista"""
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            logger.warning("Unauthenticated access attempt to user requests")
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """Verificar permisos a nivel de objeto"""
        # Staff puede acceder a todo
        if request.user.is_staff:
            logger.debug(f"Staff access granted to {request.user.username}")
            return True
        
        # Usuario puede acceder a sus propias solicitudes
        if hasattr(obj, 'user'):
            is_owner = obj.user == request.user
            if not is_owner:
                logger.warning(
                    f"Access denied: {request.user.username} "
                    f"tried to access request owned by {obj.user.username}"
                )
            return is_owner
        
        return False


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Permite acceso solo al mismo usuario o a administradores.
    Útil para endpoints de perfil de usuario.
    """
    
    def has_permission(self, request, view):
        """Verificar permisos a nivel de vista"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Verificar permisos a nivel de objeto"""
        # Admin tiene acceso completo
        if request.user.is_superuser or request.user.role == 'admin':
            return True
        
        # Usuario puede acceder a su propio perfil
        return obj.id == request.user.id