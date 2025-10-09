"""
Vistas para verificación administrativa de lotes
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import logging

from ..models import Lote
from ..serializers import LoteDetailSerializer

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_lote(request, pk):
    """
    Verificar un lote (solo administradores)
    """
    # Verificar permisos de administrador
    if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
        return Response({
            'error': 'No tienes permisos para verificar lotes'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response({
            'error': 'Lote no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Verificar el lote
    lote.verify(request.user)
    
    logger.info(f"Lote {lote.id} verificado por {request.user.username}")
    
    serializer = LoteDetailSerializer(lote)
    return Response({
        'success': True,
        'message': f'Lote "{lote.nombre}" verificado exitosamente',
        'lote': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_lote(request, pk):
    """
    Rechazar un lote (solo administradores)
    """
    # Verificar permisos de administrador
    if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
        return Response({
            'error': 'No tienes permisos para rechazar lotes'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response({
            'error': 'Lote no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Obtener razón de rechazo
    reason = request.data.get('reason', 'Sin razón especificada')
    
    # Rechazar el lote
    lote.reject(request.user, reason)
    
    logger.info(f"Lote {lote.id} rechazado por {request.user.username}")
    
    serializer = LoteDetailSerializer(lote)
    return Response({
        'success': True,
        'message': f'Lote "{lote.nombre}" rechazado',
        'lote': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def archive_lote(request, pk):
    """
    Archivar un lote (solo administradores)
    """
    # Verificar permisos de administrador
    if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
        return Response({
            'error': 'No tienes permisos para archivar lotes'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response({
            'error': 'Lote no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Archivar el lote
    lote.archive(request.user)
    
    logger.info(f"Lote {lote.id} archivado por {request.user.username}")
    
    serializer = LoteDetailSerializer(lote)
    return Response({
        'success': True,
        'message': f'Lote "{lote.nombre}" archivado',
        'lote': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reactivate_lote(request, pk):
    """
    Reactivar un lote archivado o rechazado (solo administradores)
    """
    # Verificar permisos de administrador
    if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
        return Response({
            'error': 'No tienes permisos para reactivar lotes'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response({
            'error': 'Lote no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Reactivar el lote
    lote.estado = 'pending'
    lote.is_verified = False
    lote.rejection_reason = None
    lote.save()
    
    logger.info(f"Lote {lote.id} reactivado por {request.user.username}")
    
    serializer = LoteDetailSerializer(lote)
    return Response({
        'success': True,
        'message': f'Lote "{lote.nombre}" reactivado',
        'lote': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lotes_pending_verification(request):
    """
    Listar lotes pendientes de verificación (solo administradores)
    """
    # Verificar permisos de administrador
    if not (request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'):
        return Response({
            'error': 'No tienes permisos para ver lotes pendientes'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Obtener lotes pendientes
    lotes = Lote.objects.filter(
        estado='pending',
        is_verified=False
    ).order_by('-created_at')
    
    serializer = LoteDetailSerializer(lotes, many=True)
    
    return Response({
        'count': lotes.count(),
        'results': serializer.data
    })
