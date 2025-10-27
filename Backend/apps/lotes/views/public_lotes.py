"""
Vistas públicas de lotes (para desarrolladores)
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

from ..models import Lote
from ..serializers import LoteSerializer

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_lotes(request):
    """
    Lista lotes disponibles para desarrolladores
    Solo muestra lotes verificados y activos
    """
    try:
        # Verificar que sea desarrollador
        if request.user.role != 'developer':
            return Response({
                'error': 'Solo desarrolladores pueden acceder a esta vista'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener lotes disponibles
        lotes = Lote.objects.filter(
            status='active',
            is_verified=True
        ).order_by('-created_at')
        
        # Aplicar filtros si existen
        area_min = request.query_params.get('area_min')
        area_max = request.query_params.get('area_max')
        # ✅ CORREGIDO: usar barrio en lugar de comuna
        barrio = request.query_params.get('barrio')
        
        if area_min:
            lotes = lotes.filter(area__gte=float(area_min))
        if area_max:
            lotes = lotes.filter(area__lte=float(area_max))
        # ✅ CORREGIDO: filtrar por barrio en lugar de comuna
        if barrio:
            lotes = lotes.filter(barrio__icontains=barrio)
        
        serializer = LoteSerializer(lotes, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'count': lotes.count(),
            'lotes': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error getting available lotes: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error al obtener lotes disponibles'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
