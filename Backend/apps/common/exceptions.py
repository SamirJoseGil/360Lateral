"""
Excepciones personalizadas para la aplicación
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class BaseAPIException(APIException):
    """Excepción base para errores de API"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Error interno del servidor'
    default_code = 'error'
    
    def __init__(self, detail=None, code=None):
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code
        
        super().__init__(detail, code)


class ValidationException(BaseAPIException):
    """Excepción para errores de validación"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Datos inválidos'
    default_code = 'validation_error'


class AuthenticationException(BaseAPIException):
    """Excepción para errores de autenticación"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Autenticación requerida'
    default_code = 'authentication_error'


class PermissionException(BaseAPIException):
    """Excepción para errores de permisos"""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Permiso denegado'
    default_code = 'permission_error'


class NotFoundException(BaseAPIException):
    """Excepción para recursos no encontrados"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Recurso no encontrado'
    default_code = 'not_found'


class ConflictException(BaseAPIException):
    """Excepción para conflictos (ej: duplicados)"""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Conflicto con recurso existente'
    default_code = 'conflict'


class ServiceUnavailableException(BaseAPIException):
    """Excepción para servicios no disponibles"""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Servicio temporalmente no disponible'
    default_code = 'service_unavailable'


class RateLimitException(BaseAPIException):
    """Excepción para rate limiting"""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Demasiadas solicitudes'
    default_code = 'rate_limit'
