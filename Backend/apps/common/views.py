"""
Vistas comunes para depuración, utilidades y health checks
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.conf import settings
from .utils import comprehensive_health_check, check_database_health, check_cache_health
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check completo del sistema integrado
    """
    health_data = comprehensive_health_check()
    response_status = status.HTTP_200_OK if health_data['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(health_data, status=response_status)

@api_view(['GET'])
@permission_classes([AllowAny])
def simple_health_check(request):
    """Health check simple para Docker y load balancers"""
    return Response({
        'status': 'healthy',
        'service': 'lateral360-backend',
        'message': 'OK'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def database_health_check(request):
    """Health check específico de base de datos"""
    db_health = check_database_health()
    response_status = status.HTTP_200_OK if db_health['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response({
        'database': db_health,
        'timestamp': comprehensive_health_check()['timestamp']
    }, status=response_status)

@api_view(['GET'])
@permission_classes([AllowAny])
def cache_health_check(request):
    """Health check específico de cache/Redis"""
    cache_health = check_cache_health()
    response_status = status.HTTP_200_OK if cache_health['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response({
        'cache': cache_health,
        'timestamp': comprehensive_health_check()['timestamp']
    }, status=response_status)

@api_view(['GET'])
@permission_classes([AllowAny])
def version_info(request):
    """Información de versión del sistema"""
    return Response({
        'version': '1.0.0',
        'django_version': '4.2+',
        'python_version': '3.11+',
        'apps': [
            'authentication', 'users', 'lotes', 'documents', 'stats', 'pot', 'common'
        ],
        'environment': 'development' if settings.DEBUG else 'production'
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
        'debug_mode': settings.DEBUG,
        'environment': 'development' if settings.DEBUG else 'production'
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
