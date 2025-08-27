"""
Permisos personalizados para la API
"""
from rest_framework import permissions

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