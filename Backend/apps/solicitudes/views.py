"""
Vistas para solicitudes
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
import logging

from .models import Solicitud
from .serializers import (
    SolicitudSerializer,
    SolicitudDetailSerializer,
    SolicitudCreateSerializer
)

logger = logging.getLogger(__name__)


class SolicitudViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar solicitudes"""
    queryset = Solicitud.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'estado', 'prioridad', 'lote']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['created_at', 'prioridad', 'estado']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Seleccionar serializer según acción"""
        if self.action == 'create':
            return SolicitudCreateSerializer
        elif self.action == 'retrieve':
            return SolicitudDetailSerializer
        return SolicitudSerializer
    
    def get_queryset(self):
        """Filtrar según usuario"""
        user = self.request.user
        
        # Admin ve todas
        if user.is_staff or user.role == 'admin':
            return Solicitud.objects.all()
        
        # Usuario ve solo las suyas
        return Solicitud.objects.filter(usuario=user)
    
    @action(detail=False, methods=['get'])
    def mis_solicitudes(self, request):
        """Obtener mis solicitudes"""
        solicitudes = Solicitud.objects.filter(usuario=request.user).order_by('-created_at')
        
        serializer = self.get_serializer(solicitudes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Resumen de estados"""
        user_solicitudes = Solicitud.objects.filter(usuario=request.user)
        
        resumen = {
            'total': user_solicitudes.count(),
            'pendientes': user_solicitudes.filter(estado='pendiente').count(),
            'en_revision': user_solicitudes.filter(estado='en_revision').count(),
            'completadas': user_solicitudes.filter(estado='completado').count(),
            'rechazadas': user_solicitudes.filter(estado='rechazado').count(),
        }
        
        return Response(resumen)
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado de solicitud (solo staff)"""
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({
                'error': 'No tienes permiso'
            }, status=status.HTTP_403_FORBIDDEN)
        
        solicitud = self.get_object()
        nuevo_estado = request.data.get('estado')
        notas = request.data.get('notas', '')
        
        if nuevo_estado not in dict(Solicitud.ESTADO_CHOICES):
            return Response({
                'error': 'Estado inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        solicitud.estado = nuevo_estado
        solicitud.revisor = request.user
        if notas:
            solicitud.notas_revision = notas
        solicitud.save()
        
        logger.info(f"Solicitud {pk} cambió a {nuevo_estado} por {request.user.email}")
        
        serializer = SolicitudDetailSerializer(solicitud)
        return Response(serializer.data)
