"""
Vistas para health checks y utilidades del sistema
"""
from django.http import JsonResponse
from django.db import connection
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import redis
import psutil
import time

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check completo del sistema
    """
    health_data = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "checks": {}
    }
    
    overall_status = True
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            health_data["checks"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful"
            }
    except Exception as e:
        health_data["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database error: {str(e)}"
        }
        overall_status = False
    
    # Check Redis (si está configurado)
    try:
        redis_url = getattr(settings, 'REDIS_URL', None)
        if redis_url:
            r = redis.from_url(redis_url)
            r.ping()
            health_data["checks"]["redis"] = {
                "status": "healthy",
                "message": "Redis connection successful"
            }
        else:
            health_data["checks"]["redis"] = {
                "status": "skipped",
                "message": "Redis not configured"
            }
    except Exception as e:
        health_data["checks"]["redis"] = {
            "status": "unhealthy",
            "message": f"Redis error: {str(e)}"
        }
        overall_status = False
    
    # System resources
    try:
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        health_data["checks"]["system"] = {
            "status": "healthy",
            "memory_percent": memory.percent,
            "disk_percent": disk.percent,
            "message": "System resources normal"
        }
        
        # Warning if resources are high
        if memory.percent > 90 or disk.percent > 90:
            health_data["checks"]["system"]["status"] = "warning"
            health_data["checks"]["system"]["message"] = "High resource usage"
            
    except Exception as e:
        health_data["checks"]["system"] = {
            "status": "error",
            "message": f"System check error: {str(e)}"
        }
    
    # Overall status
    health_data["status"] = "healthy" if overall_status else "unhealthy"
    
    response_status = status.HTTP_200_OK if overall_status else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response(health_data, status=response_status)

@api_view(['GET'])
@permission_classes([AllowAny])
def simple_health(request):
    """
    Health check simple para Docker/load balancers
    """
    try:
        # Test básico de database
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            "status": "healthy",
            "message": "OK"
        })
    except Exception as e:
        return JsonResponse({
            "status": "unhealthy",
            "message": str(e)
        }, status=503)
