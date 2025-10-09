"""
Vistas para lotes públicos/disponibles para developers
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
    Obtener lotes disponibles para developers (verificados y activos)
    """
    try:
        user = request.user
        
        # Verificar que sea developer
        if getattr(user, 'role', None) != 'developer':
            return Response({
                'error': 'Este endpoint es solo para developers'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener lotes verificados y activos
        lotes = Lote.objects.filter(
            is_verified=True,
            estado='active'
        ).select_related('usuario')
        
        # Aplicar filtros si existen
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            lotes = lotes.filter(
                Q(nombre__icontains=search) |
                Q(direccion__icontains=search) |
                Q(cbml__icontains=search) |
                Q(barrio__icontains=search)
            )
        
        # Filtros adicionales
        if 'estrato' in request.query_params:
            lotes = lotes.filter(estrato=request.query_params['estrato'])
        
        if 'area_min' in request.query_params:
            lotes = lotes.filter(area__gte=float(request.query_params['area_min']))
        
        if 'area_max' in request.query_params:
            lotes = lotes.filter(area__lte=float(request.query_params['area_max']))
        
        # Ordenamiento
        ordering = request.query_params.get('ordering', '-fecha_creacion')
        lotes = lotes.order_by(ordering)
        
        # Paginación
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        total_count = lotes.count()
        lotes_page = lotes[offset:offset + limit]
        
        serializer = LoteSerializer(lotes_page, many=True, context={'request': request})
        
        logger.info(f"Developer {user.email} obtuvo {total_count} lotes disponibles")
        
        return Response({
            'count': total_count,
            'results': serializer.data,
            'next': offset + limit < total_count,
            'previous': offset > 0
        })
        
    except Exception as e:
        logger.error(f"Error obteniendo lotes disponibles: {str(e)}")
        return Response({
            'error': 'Error al obtener lotes disponibles',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
