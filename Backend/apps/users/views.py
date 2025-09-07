"""
Vistas para la API de usuarios
"""
from datetime import timezone
from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
import logging

from .models import User, UserProfile, UserRequest
from .serializers import UserSerializer, UserProfileSerializer, UserRequestSerializer, UserRequestDetailSerializer, UserRequestCreateSerializer, UserRequestUpdateSerializer, RequestStatusSummarySerializer
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
    

# Servicio para manejar la lógica de solicitudes de usuario
class RequestStatusService:
    """
    Service to manage and retrieve user request statuses.
    """
    
    @staticmethod
    def get_user_requests(user, request_type=None, status=None):
        """
        Get all requests for a specific user with optional filtering.
        
        Args:
            user: User object or ID
            request_type: Optional type of request to filter by
            status: Optional status to filter by
            
        Returns:
            QuerySet of UserRequest objects
        """
        if isinstance(user, int):
            user_id = user
        else:
            user_id = user.id
            
        # Start with base query for this user
        queryset = UserRequest.objects.filter(user_id=user_id)
        
        # Apply filters if provided
        if request_type:
            queryset = queryset.filter(request_type=request_type)
            
        if status:
            queryset = queryset.filter(status=status)
            
        # Return sorted by most recent first
        return queryset.order_by('-created_at')
    
    @staticmethod
    def get_request_details(request_id, user=None):
        """
        Get detailed information about a specific request.
        If user is provided, ensure it belongs to them.
        
        Args:
            request_id: ID of the request
            user: Optional User object to verify ownership
            
        Returns:
            UserRequest object or None if not found or not owned by user
        """
        try:
            if user:
                return UserRequest.objects.get(id=request_id, user=user)
            return UserRequest.objects.get(id=request_id)
        except UserRequest.DoesNotExist:
            return None
    
    @staticmethod
    def get_request_status_summary(user):
        """
        Get a summary of request statuses for a user.
        
        Args:
            user: User object or ID
            
        Returns:
            Dict with counts by status and type
        """
        if isinstance(user, int):
            user_id = user
        else:
            user_id = user.id
            
        # Get all requests for this user
        requests = UserRequest.objects.filter(user_id=user_id)
        
        # Count by status
        pending = requests.filter(status='pending').count()
        approved = requests.filter(status='approved').count()
        rejected = requests.filter(status='rejected').count()
        
        # Count by type
        counts_by_type = {}
        request_types = requests.values_list('request_type', flat=True).distinct()
        
        for req_type in request_types:
            counts_by_type[req_type] = requests.filter(request_type=req_type).count()
        
        return {
            'total': requests.count(),
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'by_type': counts_by_type
        }
    
    @staticmethod
    def get_recent_status_updates(user, days=30, limit=10):
        """
        Get recent status updates for a user's requests.
        
        Args:
            user: User object or ID
            days: Number of days to look back
            limit: Maximum number of updates to return
            
        Returns:
            List of recent status updates
        """
        if isinstance(user, int):
            user_id = user
        else:
            user_id = user.id
            
        start_date = timezone.now() - timezone.timedelta(days=days)
        
        # Get recently updated requests
        recent_updates = UserRequest.objects.filter(
            user_id=user_id,
            updated_at__gte=start_date
        ).order_by('-updated_at')[:limit]
        
        return recent_updates