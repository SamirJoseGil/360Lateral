"""
Vistas comunes para health checks y utilidades
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def system_health_check(request):
    """
    Health check general del sistema.
    Verifica estado de base de datos, cache y servicios.
    
    Returns:
        Response con estado del sistema y servicios
    """
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {}
    }
    
    status_code = status.HTTP_200_OK
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                health_status['services']['database'] = 'ok'
            else:
                raise Exception("No result from database")
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        health_status['services']['database'] = 'error'
        health_status['status'] = 'unhealthy'
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    # Check cache
    try:
        cache_key = 'health_check_test'
        cache.set(cache_key, 'test', 10)
        cache_value = cache.get(cache_key)
        if cache_value == 'test':
            health_status['services']['cache'] = 'ok'
        else:
            raise Exception("Cache value mismatch")
    except Exception as e:
        logger.error(f"Cache health check failed: {str(e)}")
        health_status['services']['cache'] = 'error'
        health_status['status'] = 'degraded'
    
    return Response(health_status, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def database_health_check(request):
    """
    Health check específico de base de datos.
    
    Returns:
        Response con detalles de la conexión a la base de datos
    """
    try:
        import time
        start = time.time()
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            db_version = cursor.fetchone()[0]
        
        response_time = (time.time() - start) * 1000  # en milisegundos
        
        return Response({
            'status': 'ok',
            'database': 'postgresql',
            'connected': True,
            'version': db_version,
            'response_time_ms': round(response_time, 2)
        })
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return Response({
            'status': 'error',
            'database': 'postgresql',
            'connected': False,
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([AllowAny])
def redis_health_check(request):
    """
    Health check específico de Redis/Cache.
    
    Returns:
        Response con estado del cache/Redis
    """
    try:
        import time
        start = time.time()
        
        test_key = 'redis_health_check'
        test_value = 'test_value'
        
        cache.set(test_key, test_value, 10)
        result = cache.get(test_key)
        
        response_time = (time.time() - start) * 1000
        
        if result == test_value:
            return Response({
                'status': 'ok',
                'cache': 'connected',
                'response_time_ms': round(response_time, 2)
            })
        else:
            raise Exception("Cache value mismatch")
            
    except Exception as e:
        logger.error(f"Cache health check failed: {str(e)}")
        return Response({
            'status': 'error',
            'cache': 'disconnected',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
