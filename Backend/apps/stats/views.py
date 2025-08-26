"""
Vistas para mostrar estadísticas de la aplicación
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
import logging
import time

from .services.stats_service import StatsService

logger = logging.getLogger(__name__)
api_logger = logging.getLogger('api.requests')
stats_service = StatsService()

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_general_stats(request):
    """
    Obtiene estadísticas generales de la aplicación.
    Solo accesible para administradores.
    """
    start_time = time.time()
    api_logger.info(f"Admin {request.user.username} solicitando estadísticas generales")
    
    stats = stats_service.get_general_stats()
    
    execution_time = time.time() - start_time
    
    if stats.get('success'):
        users_count = stats['stats']['users']['total']
        lotes_count = stats['stats']['lotes']['total']
        docs_count = stats['stats']['documents']['total']
        
        api_logger.info(
            f"Admin {request.user.username} obtuvo estadísticas generales: "
            f"{users_count} usuarios, {lotes_count} lotes, {docs_count} documentos "
            f"(tiempo: {execution_time:.2f}s)"
        )
        return Response(stats)
    else:
        error_msg = stats.get('error', 'Error desconocido')
        api_logger.error(
            f"Error al obtener estadísticas generales para admin {request.user.username}: {error_msg}"
        )
        return Response(stats, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_user_stats(request):
    """
    Obtiene estadísticas detalladas de usuarios.
    Solo accesible para administradores.
    """
    start_time = time.time()
    api_logger.info(f"Admin {request.user.username} solicitando estadísticas de usuarios")
    
    stats = stats_service.get_user_stats()
    execution_time = time.time() - start_time
    
    if stats.get('success'):
        # Extraer información relevante para el log
        by_role = stats['stats'].get('by_role', [])
        role_counts = {role['role']: role['count'] for role in by_role} if by_role else {}
        
        api_logger.info(
            f"Admin {request.user.username} obtuvo estadísticas de usuarios: "
            f"Distribución por roles: {role_counts} "
            f"(tiempo: {execution_time:.2f}s)"
        )
        return Response(stats)
    else:
        error_msg = stats.get('error', 'Error desconocido')
        api_logger.error(
            f"Error al obtener estadísticas de usuarios para admin {request.user.username}: {error_msg}"
        )
        return Response(stats, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_document_stats(request):
    """
    Obtiene estadísticas detalladas de documentos.
    Solo accesible para administradores.
    """
    start_time = time.time()
    api_logger.info(f"Admin {request.user.username} solicitando estadísticas de documentos")
    
    stats = stats_service.get_document_stats()
    execution_time = time.time() - start_time
    
    if stats.get('success'):
        # Extraer información relevante para el log
        by_status = stats['stats'].get('by_status', [])
        status_counts = {status['status']: status['count'] for status in by_status} if by_status else {}
        
        api_logger.info(
            f"Admin {request.user.username} obtuvo estadísticas de documentos: "
            f"Documentos por estado: {status_counts} "
            f"(tiempo: {execution_time:.2f}s)"
        )
        return Response(stats)
    else:
        error_msg = stats.get('error', 'Error desconocido')
        api_logger.error(
            f"Error al obtener estadísticas de documentos para admin {request.user.username}: {error_msg}"
        )
        return Response(stats, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_lotes_stats(request):
    """
    Obtiene estadísticas detalladas de lotes.
    Solo accesible para administradores.
    """
    start_time = time.time()
    api_logger.info(f"Admin {request.user.username} solicitando estadísticas de lotes")
    
    stats = stats_service.get_lotes_stats()
    execution_time = time.time() - start_time
    
    if stats.get('success'):
        # Extraer información relevante para el log
        by_status = stats['stats'].get('by_status', [])
        status_counts = {status['status']: status['count'] for status in by_status} if by_status else {}
        
        api_logger.info(
            f"Admin {request.user.username} obtuvo estadísticas de lotes: "
            f"Lotes por estado: {status_counts} "
            f"(tiempo: {execution_time:.2f}s)"
        )
        return Response(stats)
    else:
        error_msg = stats.get('error', 'Error desconocido')
        api_logger.error(
            f"Error al obtener estadísticas de lotes para admin {request.user.username}: {error_msg}"
        )
        return Response(stats, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
