"""
Vistas para verificación de lotes (solo admin)
"""
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from django.shortcuts import get_object_or_404
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
            logger.info(f"[Verification] Processing verification request for lote {pk}")
            logger.info(f"[Verification] Request data: {request.data}")
            logger.info(f"[Verification] User: {request.user.email} (role: {request.user.role})")
            
            # ✅ Obtener lote con manejo de error mejorado
            lote = get_object_or_404(Lote, pk=pk)
            
            action = request.data.get('action')
            
            if not action:
                logger.error("[Verification] No action provided in request")
                return Response({
                    'success': False,
                    'error': 'Se requiere el parámetro "action"'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if action == 'verify':
                logger.info(f"[Verification] Verifying lote {lote.cbml}")
                
                # ✅ Actualizar campos de verificación
                lote.is_verified = True
                lote.verified_by = request.user
                lote.verified_at = timezone.now()
                lote.status = 'active'
                lote.save()
                
                message = f'Lote {lote.nombre} verificado exitosamente'
                logger.info(f"[Verification] ✅ {message}")
                
            elif action == 'reject':
                reason = request.data.get('reason', 'Sin razón especificada')
                logger.info(f"[Verification] Rejecting lote {lote.cbml}, reason: {reason}")
                
                # ✅ Actualizar campos de rechazo
                lote.is_verified = False
                lote.verified_by = request.user
                lote.verified_at = timezone.now()
                lote.status = 'archived'
                lote.rejection_reason = reason
                lote.save()
                
                message = f'Lote {lote.nombre} rechazado'
                logger.info(f"[Verification] ✅ {message}")
                
            else:
                logger.error(f"[Verification] Invalid action: {action}")
                return Response({
                    'success': False,
                    'error': f'Acción inválida: "{action}". Use "verify" o "reject"'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Serializar respuesta
            serializer = LoteSerializer(lote, context={'request': request})
            
            return Response({
                'success': True,
                'message': message,
                'data': {
                    'lote': serializer.data
                }
            })
            
        except Lote.DoesNotExist:
            logger.error(f"[Verification] Lote {pk} not found")
            return Response({
                'success': False,
                'error': 'Lote no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            logger.error(f"[Verification] Invalid UUID: {pk}")
            return Response({
                'success': False,
                'error': 'ID de lote inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"[Verification] Unexpected error: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    
    def get_serializer_context(self):
        """✅ Agregar request al contexto"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
