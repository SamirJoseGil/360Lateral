"""
Health Check Views

This module contains view functions for health checking of the application and its components.
These endpoints are typically used by monitoring tools and load balancers to verify
that the application is running correctly.
"""

import time
from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError
from django.core.cache import cache
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import logging

# Importaciones opcionales
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint de health check completo del sistema
    
    Args:
        request: The HTTP request object
        
    Returns:
        JsonResponse: A JSON response with status information
    """
    start_time = time.time()
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {},
        "system": {},
        "response_time_ms": 0
    }
    
    overall_status = True
    
    # Verificar conexión a la base de datos
    try:
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["services"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
        overall_status = False
    
    # Verificar conexión a Redis/Cache
    try:
        cache.set('health_check_test', 'ok', timeout=10)
        result = cache.get('health_check_test')
        if result == 'ok':
            health_status["services"]["redis"] = {
                "status": "healthy",
                "message": "Cache connection successful"
            }
        else:
            raise Exception("Cache test failed")
    except Exception as e:
        health_status["services"]["redis"] = {
            "status": "unhealthy",
            "message": f"Cache connection failed: {str(e)}"
        }
        # Redis no es crítico para la aplicación
    
    # Verificar memoria del sistema (solo si psutil está disponible)
    if PSUTIL_AVAILABLE:
        try:
            memory = psutil.virtual_memory()
            health_status["system"]["memory"] = {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "status": "healthy" if memory.percent < 90 else "warning"
            }
            if memory.percent >= 95:
                overall_status = False
        except Exception as e:
            health_status["system"]["memory"] = {
                "status": "unhealthy",
                "message": f"Memory check failed: {str(e)}"
            }
    else:
        health_status["system"]["memory"] = {
            "status": "unavailable",
            "message": "psutil not installed"
        }
    
    # Estado general y tiempo de respuesta
    health_status["status"] = "healthy" if overall_status else "unhealthy"
    health_status["response_time_ms"] = round((time.time() - start_time) * 1000, 2)
    
    response_status = status.HTTP_200_OK if overall_status else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(health_status, status=response_status)

@api_view(['GET'])
@permission_classes([AllowAny])
def simple_health_check(request):
    """
    Health check simple para Docker y load balancers
    
    Returns a simple JSON response indicating the application is running.
    
    Args:
        request: The HTTP request object
        
    Returns:
        JsonResponse: A JSON response with status information
    """
    return JsonResponse({"status": "healthy", "message": "OK"}, status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def database_health_check(request):
    """
    Database connection health check.
    
    Attempts to connect to all configured databases and returns status.
    
    Args:
        request: The HTTP request object
        
    Returns:
        JsonResponse: A JSON response with database connection status
    """
    db_status = {}
    all_healthy = True
    
    for db_name in connections:
        try:
            cursor = connections[db_name].cursor()
            cursor.execute("SELECT 1")
            db_status[db_name] = "connected"
        except OperationalError as e:
            db_status[db_name] = {"status": "error", "message": str(e)}
            all_healthy = False
    
    status_code = 200 if all_healthy else 500
    return JsonResponse({"database_status": db_status}, status=status_code)

@api_view(['GET'])
@permission_classes([AllowAny])
def dependencies_health_check(request):
    """
    External dependencies health check.
    
    Checks the health of external services this application depends on.
    
    Args:
        request: The HTTP request object
        
    Returns:
        JsonResponse: A JSON response with the health status of dependencies
    """
    # Example implementation - in a real app, you would check actual dependencies
    dependencies = {
        "cache": "ok",
        "message_broker": "ok",
        "storage": "ok"
    }
    
    return JsonResponse({"dependencies": dependencies})
