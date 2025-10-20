"""
Permisos personalizados para lotes
"""
from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso para que solo el propietario o admin puedan modificar
    """
    
    def has_object_permission(self, request, view, obj):
        # Lectura permitida para todos autenticados
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin puede todo
        if request.user.is_admin:
            return True
        
        # El propietario puede modificar
        return obj.owner == request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso de solo lectura para todos, modificación para propietario
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return obj.owner == request.user or request.user.is_admin
