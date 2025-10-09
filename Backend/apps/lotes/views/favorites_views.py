"""
Vistas para gestión de lotes favoritos
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import logging

from ..models import Lote, Favorite
from ..serializers import FavoriteSerializer, LoteSerializer

logger = logging.getLogger(__name__)


class FavoriteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de favoritos"""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Obtener favoritos del usuario actual"""
        return Favorite.objects.filter(usuario=self.request.user).select_related('lote')
    
    def create(self, request, *args, **kwargs):
        """Agregar lote a favoritos"""
        try:
            lote_id = request.data.get('lote')
            
            if not lote_id:
                return Response({
                    'success': False,
                    'message': 'ID del lote es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que el lote existe y está visible
            try:
                lote = Lote.objects.get(id=lote_id)
            except Lote.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Lote no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Verificar que el lote está activo y verificado
            if lote.estado != 'active' or not lote.is_verified:
                return Response({
                    'success': False,
                    'message': 'Este lote no está disponible'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar si ya existe el favorito
            favorite, created = Favorite.objects.get_or_create(
                usuario=request.user,
                lote=lote,
                defaults={
                    'notas': request.data.get('notas', '')
                }
            )
            
            if not created:
                return Response({
                    'success': False,
                    'message': 'Este lote ya está en tus favoritos'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Usuario {request.user.email} agregó lote {lote.id} a favoritos")
            
            serializer = self.get_serializer(favorite)
            return Response({
                'success': True,
                'message': 'Lote agregado a favoritos',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error agregando favorito: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error al agregar a favoritos'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        """Remover lote de favoritos"""
        try:
            instance = self.get_object()
            lote_nombre = instance.lote.nombre
            
            self.perform_destroy(instance)
            
            logger.info(f"Usuario {request.user.email} removió lote {instance.lote.id} de favoritos")
            
            return Response({
                'success': True,
                'message': f'Lote "{lote_nombre}" removido de favoritos'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error removiendo favorito: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error al remover de favoritos'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def remove_by_lote(self, request):
        """Remover favorito por ID de lote"""
        try:
            lote_id = request.data.get('lote_id')
            
            if not lote_id:
                return Response({
                    'success': False,
                    'message': 'ID del lote es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                favorite = Favorite.objects.get(
                    usuario=request.user,
                    lote_id=lote_id
                )
                favorite.delete()
                
                logger.info(f"Usuario {request.user.email} removió lote {lote_id} de favoritos")
                
                return Response({
                    'success': True,
                    'message': 'Lote removido de favoritos'
                }, status=status.HTTP_200_OK)
                
            except Favorite.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Este lote no está en tus favoritos'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            logger.error(f"Error removiendo favorito: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error al remover de favoritos'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Verificar si un lote es favorito"""
        lote_id = request.query_params.get('lote_id')
        
        if not lote_id:
            return Response({
                'success': False,
                'message': 'ID del lote es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        is_favorite = Favorite.objects.filter(
            usuario=request.user,
            lote_id=lote_id
        ).exists()
        
        return Response({
            'success': True,
            'is_favorite': is_favorite
        })