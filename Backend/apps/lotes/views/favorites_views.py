from rest_framework import viewsets, status, permissions, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from ..models import Favorite, Lote
from ..serializers import FavoriteSerializer


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user favorites.
    """
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only favorites for the current user.
        """
        return Favorite.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Add a lot to the user's favorites.
        """
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {"detail": "Este lote ya está en tus favoritos."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """
        Toggle favorite status for a lot. If it's already a favorite, remove it,
        otherwise add it to favorites.
        """
        lote_id = request.data.get('lote_id')
        if not lote_id:
            return Response(
                {"detail": "Se requiere el ID del lote."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        lote = get_object_or_404(Lote, pk=lote_id)
        favorite = Favorite.objects.filter(user=request.user, lote=lote).first()
        
        if favorite:
            # If already a favorite, remove it
            favorite.delete()
            return Response(
                {"detail": "Lote eliminado de favoritos."},
                status=status.HTTP_200_OK
            )
        else:
            # Otherwise, add it to favorites
            favorite = Favorite.objects.create(user=request.user, lote=lote)
            serializer = self.get_serializer(favorite)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """
        Check if a specific lot is in the user's favorites.
        """
        lote_id = request.query_params.get('lote_id')
        if not lote_id:
            return Response(
                {"detail": "Se requiere el ID del lote."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        is_favorite = Favorite.objects.filter(
            user=request.user, 
            lote_id=lote_id
        ).exists()
        
        return Response({"is_favorite": is_favorite})