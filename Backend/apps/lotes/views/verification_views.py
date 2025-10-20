"""
Vistas para verificación de lotes (solo admin)
"""
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
import logging

from ..models import Lote
from ..serializers import LoteSerializer

logger = logging.getLogger(__name__)


class LoteVerificationView(APIView):
    """
    Verificar o rechazar un lote (solo admin)
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, pk):
        """
        Verificar o rechazar lote
        
        Body:
        {
            "action": "verify|reject",
            "reason": "motivo (solo para reject)"
        }
        """
        try:
            lote = Lote.objects.get(pk=pk)
            action = request.data.get('action')
            
            if action == 'verify':
                lote.verify(request.user)
                message = 'Lote verificado exitosamente'
            elif action == 'reject':
                reason = request.data.get('reason', '')
                lote.reject(request.user, reason)
                message = 'Lote rechazado'
            else:
                return Response({
                    'success': False,
                    'error': 'Acción inválida. Use "verify" o "reject"'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Lote {lote.cbml} {action} by {request.user.email}")
            
            return Response({
                'success': True,
                'message': message,
                'lote': LoteSerializer(lote).data
            })
            
        except Lote.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Lote no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)


class LotePendingVerificationListView(ListAPIView):
    """
    Lista lotes pendientes de verificación (solo admin)
    """
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Obtener lotes pendientes"""
        return Lote.objects.filter(
            status='pending',
            is_verified=False
        ).order_by('-created_at')
