"""
API para acceder a lotes por usuario.
"""
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import logging

from apps.lotes.models import Lote
from apps.lotes.serializers import LoteSerializer
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

class UserLotesView(generics.ListAPIView):
    """
    Endpoint para listar lotes por usuario específico.
    
    Permite:
    - A un usuario ver sus propios lotes
    - A un administrador ver lotes de cualquier usuario
    - Filtrar y ordenar por diferentes parámetros
    """
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'direccion', 'codigo_catastral', 'matricula', 'cbml']
    ordering_fields = ['nombre', 'area', 'fecha_creacion', 'fecha_actualizacion']
    ordering = ['-fecha_creacion']
    
    def get_queryset(self):
        """Filtra lotes según el ID de usuario solicitado y los permisos del usuario actual."""
        user_id = self.kwargs.get('user_id')
        
        # Verificar permisos
        request_user = self.request.user
        target_user = User.objects.filter(id=user_id).first()
        
        if not target_user:
            logger.warning(f"Usuario con ID {user_id} no encontrado")
            return Lote.objects.none()
            
        # Admin puede ver lotes de cualquier usuario
        if request_user.is_superuser or getattr(request_user, 'role', None) == 'admin':
            return Lote.objects.filter(usuario=target_user)
        elif getattr(request_user, 'role', None) == 'developer':
            # Developer puede ver sus propios lotes
            return Lote.objects.filter(usuario=target_user) if target_user == request_user else Lote.objects.none()
        elif request_user.id == int(user_id):
            # Usuario puede ver sus propios lotes
            return Lote.objects.filter(usuario=request_user)
            
        # No tiene permisos para ver lotes de otro usuario
        logger.warning(f"Usuario {request_user.username} intentó consultar lotes de otro usuario: {target_user.username}")
        return Lote.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Lista los lotes con información adicional."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Verificar si hay filtros aplicados
        filters_applied = {}
        if request.query_params:
            if 'search' in request.query_params:
                filters_applied['search'] = request.query_params['search']
                    
        if filters_applied:
            logger.info(f"Filtros aplicados: {filters_applied}")
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        
        # Añadir metadatos útiles
        user_id = self.kwargs.get('user_id')
        try:
            target_user = User.objects.get(id=user_id)
            user_name = f"{target_user.first_name} {target_user.last_name}".strip() or target_user.username
        except User.DoesNotExist:
            user_name = f"Usuario {user_id}"
            
        response_data = {
            'count': queryset.count(),
            'user_id': user_id,
            'user_name': user_name,
            'results': serializer.data
        }
        
        logger.info(f"Retornando {queryset.count()} lotes para el usuario {user_name} (ID={user_id})")
        return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_lotes(request):
    """
    Endpoint conveniente para obtener los lotes del usuario autenticado.
    """
    user = request.user
    lotes = Lote.objects.filter(usuario=user)
    serializer = LoteSerializer(lotes, many=True)
    
    response_data = {
        'count': lotes.count(),
        'user_id': user.id,
        'user_name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'results': serializer.data
    }
    
    logger.info(f"Usuario {user.username} (ID={user.id}) consultando sus {lotes.count()} lotes")
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_lote_stats(request, user_id=None):
    """
    Proporciona estadísticas sobre los lotes de un usuario específico.
    """
    # Verificar permisos
    if not user_id:
        user_id = request.user.id
        
    if str(request.user.id) != str(user_id) and not (
        request.user.is_superuser or getattr(request.user, 'role', None) == 'admin'
    ):
        return Response(
            {'detail': 'No tienes permisos para ver estas estadísticas'}, 
            status=status.HTTP_403_FORBIDDEN
        )
        
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Usuario no encontrado'}, 
            status=status.HTTP_404_NOT_FOUND
        )
        
    # Obtener todos los lotes del usuario
    lotes = Lote.objects.filter(usuario=target_user)
    
    # Calcular estadísticas
    total_lotes = lotes.count()
    
    # Prevenir división por cero
    if total_lotes == 0:
        return Response({
            'user_id': user_id,
            'user_name': f"{target_user.first_name} {target_user.last_name}".strip() or target_user.username,
            'total_lotes': 0,
            'message': 'Este usuario no tiene lotes registrados'
        })
    
    # Calcular área total (con manejo seguro)
    total_area = sum(lote.area for lote in lotes if lote.area is not None)
    
    # Estadísticas por estado
    lotes_activos = lotes.filter(estado='active').count()
    lotes_pendientes = lotes.filter(estado='pending').count()
    lotes_archivados = lotes.filter(estado='archived').count()
    
    # Estadísticas por estrato
    lotes_por_estrato = {}
    for i in range(1, 7):
        count = lotes.filter(estrato=i).count()
        if count > 0:
            lotes_por_estrato[f'estrato_{i}'] = count
    
    stats = {
        'user_id': user_id,
        'user_name': f"{target_user.first_name} {target_user.last_name}".strip() or target_user.username,
        'email': target_user.email,
        'role': getattr(target_user, 'role', None),
        'total_lotes': total_lotes,
        'total_area': float(total_area) if total_area else 0,
        'lotes_activos': lotes_activos,
        'lotes_pendientes': lotes_pendientes,
        'lotes_archivados': lotes_archivados,
        'lotes_por_estrato': lotes_por_estrato
    }
    
    if request.user.id == int(user_id):
        logger.info(f"Usuario {request.user.username} consultando sus propias estadísticas")
    else:
        logger.info(f"Admin {request.user.username} consultando estadísticas del usuario {target_user.username}")
    
    return Response(stats)