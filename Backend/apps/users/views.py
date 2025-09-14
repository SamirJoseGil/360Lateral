"""
Vistas para la API de usuarios
"""
from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.http import Http404
from django.db import IntegrityError
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

    def create(self, request, *args, **kwargs):
        """Crear usuario con validación de email único"""
        try:
            # Validar que el email no exista
            email = request.data.get('email')
            if not email:
                return Response({
                    'success': False,
                    'error': 'El email es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar si ya existe un usuario con ese email
            if User.objects.filter(email=email).exists():
                return Response({
                    'success': False,
                    'error': f'Ya existe un usuario registrado con el email: {email}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Continuar con la creación normal
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            # Log de creación exitosa
            audit_log(
                action='USER_CREATED',
                user=request.user,
                details={'created_user_email': email},
                ip_address=get_client_ip(request)
            )
            
            return Response({
                'success': True,
                'message': 'Usuario creado exitosamente',
                'user': serializer.data
            }, status=status.HTTP_201_CREATED, headers=headers)
            
        except IntegrityError as e:
            logger.error(f"Error de integridad al crear usuario: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error de integridad: El email ya está registrado'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error inesperado al crear usuario: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    lookup_field = 'pk'  # Explícitamente usar pk para UUID
    
    def get_permissions(self):
        # Para eliminar usuario, solo admin
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_object(self):
        """Override get_object para mejor manejo de errores y debugging"""
        try:
            # Log del intento de acceso para debugging
            logger.info(f"Attempting to access user {self.kwargs.get('pk')} by user {getattr(self.request.user, 'username', 'anonymous')}")
            
            # Primero verificar si el usuario está autenticado
            if not self.request.user or not self.request.user.is_authenticated:
                logger.warning(f"Unauthenticated access attempt to user detail: {self.kwargs.get('pk')}")
                self.permission_denied(self.request, message="Autenticación requerida para acceder a detalles de usuario")
            
            # Obtener el objeto
            obj = super().get_object()
            
            # Verificar permisos de objeto específicos
            self.check_object_permissions(self.request, obj)
            
            logger.info(f"User detail access granted for {obj.username} to {self.request.user.username}")
            return obj
            
        except User.DoesNotExist:
            logger.warning(f"User with ID {self.kwargs.get('pk')} not found")
            raise Http404("Usuario no encontrado")
        except ValueError as e:
            # Error con formato de UUID
            logger.warning(f"Invalid UUID format for user ID {self.kwargs.get('pk')}: {str(e)}")
            raise Http404("Formato de ID de usuario inválido")
        except Exception as e:
            logger.error(f"Error retrieving user {self.kwargs.get('pk')}: {str(e)}")
            raise
    
    def check_object_permissions(self, request, obj):
        """Verificar permisos específicos del objeto"""
        # Admin puede ver a cualquier usuario
        if request.user.is_superuser or getattr(request.user, 'role', None) == 'admin':
            return
        
        # Usuario puede ver su propio perfil
        if obj.id == request.user.id:
            return
        
        # Para otros casos, denegar acceso
        logger.warning(f"Permission denied: User {request.user.username} tried to access user {obj.username}")
        self.permission_denied(request, message="No tienes permiso para ver este usuario")

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
    """Actualizar perfil del usuario autenticado con validación de email único"""
    try:
        # Validar email único si se está actualizando
        new_email = request.data.get('email')
        if new_email and new_email != request.user.email:
            # Verificar si ya existe otro usuario con ese email
            if User.objects.filter(email=new_email).exclude(id=request.user.id).exists():
                return Response({
                    'success': False,
                    'error': f'Ya existe otro usuario registrado con el email: {new_email}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
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
        
    except IntegrityError as e:
        logger.error(f"Error de integridad al actualizar perfil: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error de integridad: El email ya está registrado'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error inesperado al actualizar perfil: {str(e)}")
        return Response({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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


# Debug endpoint para verificar si un usuario existe
@api_view(['GET'])
@permission_classes([AllowAny])
def check_user_exists(request, user_id):
    """
    Endpoint de debug para verificar si un usuario existe
    """
    try:
        import uuid
        # Verificar que el ID es un UUID válido
        uuid_obj = uuid.UUID(str(user_id))
        
        # Verificar si el usuario existe
        user_exists = User.objects.filter(id=user_id).exists()
        
        if user_exists:
            user = User.objects.get(id=user_id)
            return Response({
                'exists': True,
                'user_id': str(user_id),
                'username': user.username,
                'email': user.email,
                'is_active': user.is_active,
                'created_at': user.created_at
            })
        else:
            return Response({
                'exists': False,
                'user_id': str(user_id),
                'message': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except ValueError as e:
        return Response({
            'error': 'UUID inválido',
            'user_id': str(user_id),
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Error interno',
            'details': str(e)
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