"""
Vistas para gestión de favoritos
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
import logging

from ..models import Favorite
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
        return Favorite.objects.filter(user=self.request.user).select_related('lote')
    
    def create(self, request, *args, **kwargs):
        """Crear favorito con el usuario actual"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Verificar si ya existe
        lote_id = serializer.validated_data['lote'].id
        if Favorite.objects.filter(user=request.user, lote_id=lote_id).exists():
            return Response({
                'success': False,
                'error': 'Este lote ya está en tus favoritos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        
        logger.info(f"Favorite created: lote {lote_id} by {request.user.email}")
        
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Obtener conteo de favoritos del usuario"""
        count = self.get_queryset().count()
        return Response({'count': count})