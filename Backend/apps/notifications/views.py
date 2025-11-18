"""
Vistas para notificaciones
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
import logging

from .models import Notification
from .serializers import NotificationSerializer
from .services import NotificationService

logger = logging.getLogger(__name__)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar notificaciones
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'is_read', 'priority']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Solo notificaciones del usuario actual"""
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Obtener conteo de no leídas"""
        count = NotificationService.get_unread_count(request.user)
        return Response({'count': count})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Marcar todas como leídas"""
        count = NotificationService.mark_all_as_read(request.user)
        return Response({
            'success': True,
            'marked': count,
            'message': f'{count} notificaciones marcadas como leídas'
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marcar una notificación como leída"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({
            'success': True,
            'message': 'Notificación marcada como leída'
        })
    
    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """Marcar una notificación como no leída"""
        notification = self.get_object()
        notification.mark_as_unread()
        return Response({
            'success': True,
            'message': 'Notificación marcada como no leída'
        })
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Obtener notificaciones recientes (últimas 10)"""
        notifications = self.get_queryset()[:10]
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
