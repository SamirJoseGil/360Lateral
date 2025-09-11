"""
Vistas para la API de usuarios
"""
from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
import logging

from .models import User, UserProfile, UserRequest
from .serializers import (
    UserSerializer, UserProfileSerializer, UserRequestSerializer, 
    UserRequestDetailSerializer, UserRequestCreateSerializer, 
    UserRequestUpdateSerializer, RequestStatusSummarySerializer,
    UpdateProfileSerializer
)
from .permissions import CanManageUsers, IsOwnerOrAdmin
from .services import RequestStatusService

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


# Eliminar UserViewSet y vistas duplicadas ya que UserListCreateView y UserDetailView cubren la funcionalidad

class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Vista para el usuario actual"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


# Vista basada en clase para listar y crear usuarios
class UserListCreateView(generics.ListCreateAPIView):
    """
    get: Listar todos los usuarios (solo para admin)
    post: Crear un nuevo usuario (solo para admin)
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        # Filtrar usuarios según rol - solo admin ve todos
        user = self.request.user
        if user.is_superuser or user.role == 'admin':
            return User.objects.all()
        # Desarrollador ve usuarios relacionados con sus proyectos
        elif user.role == 'developer':
            return User.objects.filter(proyectos__developers=user).distinct()
        # Propietarios solo se ven a sí mismos
        else:
            return User.objects.filter(pk=user.pk)

# Vista basada en clase para detalles de usuario
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get: Obtener detalles de un usuario
    put: Actualizar usuario
    delete: Eliminar usuario
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Para eliminar usuario, solo admin
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()
    
    def check_object_permissions(self, request, obj):
        # Solo admin o el propio usuario pueden ver/editar perfil
        if not (request.user.is_superuser or request.user.role == 'admin' or obj.id == request.user.id):
            self.permission_denied(request, message="No tienes permiso para ver este usuario")
        return super().check_object_permissions(request, obj)

# Vista para el usuario actual
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Obtener datos del usuario actualmente autenticado"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# Vista para actualizar perfil del usuario actual
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Actualizar perfil del usuario autenticado"""
    serializer = UpdateProfileSerializer(
        request.user, 
        data=request.data, 
        partial=True,
        context={'request': request}
    )
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Log de actualización
        audit_log(
            action='PROFILE_UPDATED',
            user=request.user,
            details={'updated_fields': list(serializer.validated_data.keys())},
            ip_address=get_client_ip(request)
        )
        
        # Retornar datos actualizados
        response_serializer = UserSerializer(user)
        return Response({
            'success': True,
            'message': 'Perfil actualizado correctamente',
            'user': response_serializer.data
        })
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

# Función utilitaria para que las URLs funcionen con las vistas basadas en funciones o clases
user_list_create = UserListCreateView.as_view()
user_detail = UserDetailView.as_view()


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


class IsRequestOwnerOrStaff(permissions.BasePermission):
    """
    Permission to only allow owners of a request or staff to view or edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Staff can always access
        if request.user.is_staff:
            return True
        
        # Owner can access
        return obj.user == request.user


class UserRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user requests.
    """
    queryset = UserRequest.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsRequestOwnerOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'status', 'request_type']
    ordering_fields = ['created_at', 'updated_at', 'status', 'request_type']
    ordering = ['-updated_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserRequestUpdateSerializer
        elif self.action in ['retrieve', 'status_history']:
            return UserRequestDetailSerializer
        return UserRequestSerializer
    
    def get_queryset(self):
        """
        Filter requests to return only those belonging to the current user,
        unless the user is staff.
        """
        user = self.request.user
        
        # Staff can see all requests
        if user.is_staff:
            return UserRequest.objects.all()
        
        # Regular users can only see their own
        return UserRequest.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """
        Get all requests for the current user.
        """
        request_type = request.query_params.get('type')
        request_status = request.query_params.get('status')
        
        requests = RequestStatusService.get_user_requests(
            user=request.user,
            request_type=request_type,
            status=request_status
        )
        
        page = self.paginate_queryset(requests)
        if page is not None:
            serializer = UserRequestSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = UserRequestSerializer(requests, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get a summary of request statuses for the current user.
        """
        summary = RequestStatusService.get_request_status_summary(request.user)
        serializer = RequestStatusSummarySerializer(summary)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent_updates(self, request):
        """
        Get recent status updates for the current user's requests.
        """
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        
        updates = RequestStatusService.get_recent_status_updates(
            user=request.user,
            days=days,
            limit=limit
        )
        
        serializer = UserRequestSerializer(updates, many=True)
        return Response(serializer.data)