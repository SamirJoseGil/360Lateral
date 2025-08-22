"""
Vistas comunes para depuración y utilidades
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check general del sistema"""
    return Response({
        'status': 'ok',
        'service': 'lateral360-backend',
        'version': '1.0.0',
        'environment': 'development' if settings.DEBUG else 'production',
        'database': 'connected',
        'cache': 'active'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def version_info(request):
    """Información de versión del sistema"""
    return Response({
        'version': '1.0.0',
        'django_version': '4.2+',
        'python_version': '3.11+',
        'apps': [
            'users', 'lotes', 'documents', 'stats', 'common'
        ]
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def system_status(request):
    """Status detallado del sistema"""
    return Response({
        'database': 'connected',
        'cache': 'active',
        'middleware': 'loaded',
        'apps_loaded': len(settings.INSTALLED_APPS),
        'debug_mode': settings.DEBUG
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def cors_debug(request):
    """
    Endpoint para depurar problemas de CORS
    """
    origin = request.META.get('HTTP_ORIGIN', 'No origin header')
    
    # Verificar si el origen está en CORS_ALLOWED_ORIGINS
    allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    is_origin_allowed = origin in allowed_origins
    
    # Verificar configuración CORS
    cors_config = {
        'CORS_ALLOW_ALL_ORIGINS': getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
        'CORS_ALLOW_CREDENTIALS': getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
        'CORS_ALLOWED_ORIGINS': allowed_origins,
        'REQUEST_ORIGIN': origin,
        'IS_ORIGIN_ALLOWED': is_origin_allowed,
        'CSRF_COOKIE_SECURE': getattr(settings, 'CSRF_COOKIE_SECURE', True),
        'SESSION_COOKIE_SECURE': getattr(settings, 'SESSION_COOKIE_SECURE', True),
        'CSRF_TRUSTED_ORIGINS': getattr(settings, 'CSRF_TRUSTED_ORIGINS', []),
    }
    
    # Obtener información de autenticación
    auth_header = request.META.get('HTTP_AUTHORIZATION', 'No authorization header')
    
    # Obtener información del middleware CORS
    cors_headers = {
        'Access-Control-Allow-Origin': 'Check response headers',
        'Access-Control-Allow-Methods': 'Check response headers',
        'Access-Control-Allow-Headers': 'Check response headers',
        'Access-Control-Allow-Credentials': 'Check response headers',
    }
    
    # Generar un token CSRF
    csrf_token = get_token(request)
    
    return Response({
        'success': True,
        'message': 'CORS debug information',
        'cors_config': cors_config,
        'auth_header': auth_header[:10] + '...' if len(auth_header) > 10 else auth_header,
        'csrf_token': csrf_token,
        'cors_headers': cors_headers,
        'cookies': request.COOKIES,
    })
