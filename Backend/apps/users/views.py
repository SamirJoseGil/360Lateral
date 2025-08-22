"""
Views para la gestión de usuarios
"""
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
import logging

from .models import User, UserProfile
from .serializers import UserSerializer, UserProfileSerializer
from .permissions import CanManageUsers, IsOwnerOrAdmin

# Importar utilidades si existen
try:
    from apps.common.utils import audit_log, get_client_ip
except ImportError:
    # Si no existe el módulo, crear funciones básicas
    def audit_log(action, user, details=None, ip_address=None):
        pass
    
    def get_client_ip(request):
        return request.META.get('REMOTE_ADDR', 'unknown')

logger = logging.getLogger(__name__)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Vista para el usuario actual"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión completa de usuarios"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanManageUsers]
    
    def get_queryset(self):
        """Filtrar usuarios según rol"""
        # Detectar si estamos en el contexto de generación de esquema de Swagger/OpenAPI
        if getattr(self, 'swagger_fake_view', False):
            # Retornar queryset vacío o filtrado para no causar errores
            return User.objects.none()  # O User.objects.all() si prefieres mostrar todos
        
        # Comportamiento normal para peticiones reales
        user = self.request.user
        if user.is_admin:
            return User.objects.all()
        elif user.is_owner:
            # Los propietarios solo ven su propio perfil
            return User.objects.filter(id=user.id)
        else:
            # Desarrolladores ven usuarios básicos
            return User.objects.filter(role__in=['owner', 'developer'])
    
    def perform_destroy(self, instance):
        """Solo admins pueden eliminar usuarios"""
        if not self.request.user.is_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permisos para eliminar usuarios")
        
        # Log de eliminación
        audit_log(
            action='USER_DELETED',
            user=self.request.user,
            details={'deleted_user': instance.email},
            ip_address=get_client_ip(self.request)
        )
        
        super().perform_destroy(instance)
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Obtener perfil extendido de usuario"""
        # Detectar si estamos en el contexto de generación de esquema
        if getattr(self, 'swagger_fake_view', False):
            return Response({})
            
        user = self.get_object()
        profile, created = UserProfile.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_profile(self, request, pk=None):
        """Actualizar perfil extendido"""
        # Detectar si estamos en el contexto de generación de esquema
        if getattr(self, 'swagger_fake_view', False):
            return Response({})
            
        user = self.get_object()
        profile, created = UserProfile.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado',
            'data': serializer.data
        })


# Health check específico para usuarios
@api_view(['GET'])
@permission_classes([AllowAny])
def users_health_check(request):
    """Health check para el módulo de usuarios"""
    try:
        users_count = User.objects.count()
        return Response({
            'status': 'ok',
            'module': 'users',
            'users_count': users_count,
            'active_users': User.objects.filter(is_active=True).count()
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'module': 'users',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)