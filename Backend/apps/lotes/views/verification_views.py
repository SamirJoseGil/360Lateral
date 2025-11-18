"""
Vistas de verificación de lotes
✅ CORREGIDO: Usar métodos del modelo
"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
import logging

from ..models import Lote
from ..serializers import LoteSerializer
from apps.notifications.services import NotificationService  # ✅ AGREGAR

logger = logging.getLogger(__name__)


class LoteVerificationView(APIView):
    """
    Verificar o rechazar lotes (solo admin)
    ✅ CORREGIDO: Usar métodos del modelo para cambios de estado
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, pk):
        """
        Verificar o rechazar lote
        Body: { 
            "action": "verify|reject|reactivate|archive", 
            "reason": "..." (requerido para reject)
        }
        """
        try:
            lote = get_object_or_404(Lote, pk=pk)
            action = request.data.get('action')
            
            if action == 'verify':
                lote.verify(verified_by=request.user)
                message = f'Lote {lote.nombre} verificado y activado'
                
                # ✅ NUEVO: Crear notificación
                NotificationService.notify_lote_aprobado(lote)
                
            elif action == 'reject':
                reason = request.data.get('reason')
                if not reason:
                    return Response({
                        'success': False,
                        'error': 'Debe proporcionar una razón para el rechazo'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                lote.reject(reason=reason, rejected_by=request.user)
                message = f'Lote {lote.nombre} rechazado'
                
                # ✅ NUEVO: Crear notificación de rechazo
                NotificationService.notify_lote_rechazado(lote, reason)
                
            elif action == 'archive':
                lote.soft_delete()
                message = f'Lote {lote.nombre} archivado'
                
            elif action == 'reactivate':
                lote.reactivate()
                message = f'Lote {lote.nombre} reactivado'
                
            else:
                return Response({
                    'success': False,
                    'error': 'Acción inválida. Use verify, reject, archive o reactivate'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"✅ {message} por {request.user.email}")
            
            return Response({
                'success': True,
                'message': message,
                'data': LoteSerializer(lote, context={'request': request}).data
            })
            
        except Exception as e:
            logger.error(f"Error en verificación: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LotePendingVerificationListView(generics.ListAPIView):
    """
    Lista lotes pendientes de verificación
    ✅ CORREGIDO: Solo lotes pendientes y activos
    """
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return Lote.objects.filter(
            status='pending',
            is_verified=False
        ).select_related('owner').order_by('-created_at')
