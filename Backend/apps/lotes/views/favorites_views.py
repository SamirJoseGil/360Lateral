"""
Vistas para gestión de favoritos
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
import logging
import uuid

from ..models import Favorite, Lote
from ..serializers import FavoriteSerializer

logger = logging.getLogger(__name__)


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar favoritos de lotes
    """
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Solo mostrar favoritos del usuario actual"""
        return Favorite.objects.filter(user=self.request.user).select_related('lote', 'user')
    
    def create(self, request, *args, **kwargs):
        """
        Crear favorito con el usuario actual
        ✅ CORREGIDO: Manejar UUID correctamente
        """
        try:
            # ✅ CRÍTICO: Obtener lote_id y validar UUID
            lote_id = request.data.get('lote')
            
            if not lote_id:
                return Response({
                    'success': False,
                    'error': 'El ID del lote es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Convertir a UUID si es string
            try:
                if isinstance(lote_id, str):
                    lote_uuid = uuid.UUID(lote_id)
                else:
                    lote_uuid = lote_id
            except ValueError:
                return Response({
                    'success': False,
                    'error': f'ID de lote inválido: {lote_id}. Debe ser un UUID válido.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Verificar que el lote existe
            try:
                lote = Lote.objects.get(pk=lote_uuid)
            except Lote.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'Lote con ID {lote_id} no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # ✅ Verificar si ya existe el favorito
            if Favorite.objects.filter(user=request.user, lote=lote).exists():
                return Response({
                    'success': False,
                    'error': 'Este lote ya está en tus favoritos'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Crear favorito usando el objeto Lote
            serializer = self.get_serializer(data={'lote': lote.id, 'notas': request.data.get('notas', '')})
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            logger.info(f"✅ Favorito creado: lote {lote.id} por {request.user.email}")
            
            return Response({
                'success': True,
                'message': 'Lote agregado a favoritos',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"❌ Error creando favorito: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Error al crear favorito: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Obtener conteo de favoritos del usuario"""
        count = self.get_queryset().count()
        return Response({'count': count})
    
    @action(detail=False, methods=['get'], url_path='check')
    def check_favorite(self, request):
        """
        ✅ NUEVO: Verificar si un lote es favorito
        Query param: lote_id (UUID)
        """
        try:
            lote_id = request.query_params.get('lote_id')
            
            if not lote_id:
                return Response({
                    'success': False,
                    'error': 'lote_id es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Validar UUID
            try:
                lote_uuid = uuid.UUID(lote_id)
            except ValueError:
                return Response({
                    'success': False,
                    'error': f'UUID inválido: {lote_id}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Verificar si existe el favorito
            exists = Favorite.objects.filter(
                user=request.user,
                lote_id=lote_uuid
            ).exists()
            
            return Response({
                'success': True,
                'is_favorite': exists
            })
            
        except Exception as e:
            logger.error(f"Error checking favorite: {str(e)}")
            return Response({
                'success': False,
                'is_favorite': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='remove_by_lote')
    def remove_by_lote(self, request):
        """
        ✅ CORREGIDO: Remover favorito por ID de lote (UUID)
        Body: { "lote_id": "uuid" }
        """
        try:
            lote_id = request.data.get('lote_id')
            
            if not lote_id:
                return Response({
                    'success': False,
                    'error': 'lote_id es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Validar UUID
            try:
                lote_uuid = uuid.UUID(lote_id)
            except ValueError:
                return Response({
                    'success': False,
                    'error': f'UUID inválido: {lote_id}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Buscar y eliminar favorito
            try:
                favorite = Favorite.objects.get(
                    user=request.user,
                    lote_id=lote_uuid
                )
                favorite.delete()
                
                logger.info(f"✅ Favorito eliminado: lote {lote_id} por {request.user.email}")
                
                return Response({
                    'success': True,
                    'message': 'Lote removido de favoritos'
                })
                
            except Favorite.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Este lote no está en tus favoritos'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            logger.error(f"❌ Error removiendo favorito: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Error al remover favorito: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)