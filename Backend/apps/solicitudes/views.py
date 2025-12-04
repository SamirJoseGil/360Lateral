"""
Vistas para solicitudes
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
import logging

from .models import Solicitud
from .serializers import (
    SolicitudSerializer,
    SolicitudCreateSerializer,
    SolicitudUpdateSerializer
)
from apps.notifications.services import NotificationService

logger = logging.getLogger(__name__)


class SolicitudViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar solicitudes
    ✅ MEJORADO: Incluye select_related para optimizar queries
    """
    serializer_class = SolicitudSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'estado', 'prioridad']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['created_at', 'updated_at', 'prioridad']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """✅ CRÍTICO: Incluir select_related para evitar N+1 queries"""
        user = self.request.user
        
        # ✅ MEJORADO: select_related para traer usuario, revisor y lote en una sola query
        queryset = Solicitud.objects.select_related(
            'usuario',
            'revisor',
            'lote'
        ).order_by('-created_at')
        
        # ✅ NUEVO: Logging detallado
        logger.info("="*60)
        logger.info(f"[SolicitudViewSet] User: {user.email}")
        logger.info(f"[SolicitudViewSet] Role: {user.role}")
        
        # Admin ve todas
        if user.is_staff:
            total = queryset.count()
            logger.info(f"[SolicitudViewSet] Admin viewing all: {total} solicitudes")
            
            # ✅ NUEVO: Mostrar primeras solicitudes para debug
            if total > 0:
                first = queryset.first()
                logger.info(f"[SolicitudViewSet] First solicitud:")
                logger.info(f"  - ID: {first.id}")
                logger.info(f"  - Titulo: {first.titulo}")
                logger.info(f"  - Usuario: {first.usuario.email}")
                logger.info(f"  - Estado: {first.estado}")
                logger.info(f"  - Notas: {first.notas_revision}")
            
            logger.info("="*60)
            return queryset
        
        # Usuario regular solo ve las suyas
        filtered = queryset.filter(usuario=user)
        logger.info(f"[SolicitudViewSet] User viewing own: {filtered.count()} solicitudes")
        logger.info("="*60)
        return filtered
    
    def get_serializer_class(self):
        """Seleccionar serializer según acción"""
        if self.action == 'create':
            return SolicitudCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SolicitudUpdateSerializer
        return SolicitudSerializer
    
    def perform_create(self, serializer):
        """Crear solicitud"""
        solicitud = serializer.save(usuario=self.request.user)
        logger.info(f"Solicitud creada: {solicitud.id} por {self.request.user.email}")
    
    @action(detail=False, methods=['get'])
    def mis_solicitudes(self, request):
        """
        Obtener solicitudes del usuario actual
        ✅ MEJORADO: Con logging detallado y select_related
        """
        logger.info("="*60)
        logger.info(f"[mis_solicitudes] User: {request.user.email}")
        
        # ✅ CRÍTICO: Usar select_related
        solicitudes = Solicitud.objects.filter(
            usuario=request.user
        ).select_related('usuario', 'revisor', 'lote').order_by('-created_at')
        
        count = solicitudes.count()
        logger.info(f"[mis_solicitudes] Found {count} solicitudes")
        
        if count > 0:
            first = solicitudes.first()
            logger.info(f"[mis_solicitudes] First solicitud:")
            logger.info(f"  - ID: {first.id}")
            logger.info(f"  - Titulo: {first.titulo}")
            logger.info(f"  - Estado: {first.estado}")
            logger.info(f"  - Revisor: {first.revisor}")
            logger.info(f"  - Notas revision: {first.notas_revision}")
        
        # ✅ Serializar con contexto
        serializer = SolicitudSerializer(
            solicitudes,
            many=True,
            context={'request': request}
        )
        
        # ✅ NUEVO: Log de datos serializados
        if serializer.data:
            first_data = serializer.data[0]
            logger.info(f"[mis_solicitudes] First serialized:")
            logger.info(f"  - notas_revision: {first_data.get('notas_revision')}")
            logger.info(f"  - revisor_info: {first_data.get('revisor_info')}")
        
        logger.info("="*60)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Obtener resumen de solicitudes del usuario"""
        user = request.user
        
        if user.is_staff:
            solicitudes = Solicitud.objects.all()
        else:
            solicitudes = Solicitud.objects.filter(usuario=user)
        
        total = solicitudes.count()
        pendientes = solicitudes.filter(estado='pendiente').count()
        completadas = solicitudes.filter(estado='completado').count()
        
        return Response({
            'total': total,
            'pendientes': pendientes,
            'completadas': completadas
        })
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """
        ✅ MEJORADO: Cambiar estado de solicitud (solo admin)
        Incluye actualización de notas_revision
        """
        if not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'No tienes permisos para cambiar el estado'
            }, status=status.HTTP_403_FORBIDDEN)
        
        solicitud = self.get_object()
        nuevo_estado = request.data.get('estado')
        notas = request.data.get('notas_revision', '')
        
        if not nuevo_estado:
            return Response({
                'success': False,
                'error': 'El estado es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_estado = solicitud.estado
        solicitud.estado = nuevo_estado
        solicitud.revisor = request.user
        
        # ✅ CRÍTICO: Actualizar notas_revision
        if notas:
            solicitud.notas_revision = notas
        
        solicitud.save()
        
        logger.info(
            f"Solicitud {solicitud.id} estado cambiado: "
            f"{old_estado} → {nuevo_estado} por {request.user.email}"
        )
        
        # ✅ Crear notificación
        if nuevo_estado in ['aprobado', 'rechazado', 'completado']:
            NotificationService.create_notification(
                user=solicitud.usuario,
                type='solicitud_respondida',
                title='Solicitud actualizada',
                message=f'Tu solicitud "{solicitud.titulo}" ha sido {nuevo_estado}',
                action_url='/owner/solicitudes'
            )
        
        # ✅ Serializar con contexto
        serializer = SolicitudSerializer(solicitud, context={'request': request})
        
        return Response({
            'success': True,
            'message': f'Estado actualizado a {nuevo_estado}',
            'data': serializer.data
        })
