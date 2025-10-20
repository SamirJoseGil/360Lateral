"""
Vistas para la API de usuarios
Maneja CRUD de usuarios, perfiles y solicitudes de usuario
"""
from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.http import Http404
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
import logging

from .models import User, UserProfile, UserRequest
from .serializers import (
    UserSerializer, UserProfileSerializer, UserRequestSerializer, 
    UserRequestDetailSerializer, UserRequestCreateSerializer, 
    UserRequestUpdateSerializer, RequestStatusSummarySerializer,
    UpdateProfileSerializer
)
from .permissions import CanManageUsers, IsOwnerOrAdmin, IsRequestOwnerOrStaff
from .services import RequestStatusService

# Utilidades comunes
try:
    from apps.common.utils import audit_log, get_client_ip
except ImportError:
    def audit_log(action, user, details=None, ip_address=None):
        """Stub para audit_log si no existe el módulo común"""
        pass
    
    def get_client_ip(request):
        """Stub para obtener IP del cliente"""
        return request.META.get('REMOTE_ADDR', 'unknown')

logger = logging.getLogger(__name__)


# =============================================================================
# VISTAS DE USUARIOS
# =============================================================================

class UserListCreateView(generics.ListCreateAPIView):
    """
    Lista todos los usuarios (filtrado según permisos) o crea uno nuevo.
    
    GET: Lista usuarios (admin ve todos, otros ven limitado)
    POST: Crear usuario (solo admin)
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering_fields = ['created_at', 'email', 'role']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrar usuarios según rol y permisos"""
        user = self.request.user
        
        # Admin ve todos los usuarios
        if user.is_superuser or user.role == 'admin':
            return User.objects.all()
        
        # Desarrollador ve usuarios relacionados con sus proyectos
        elif user.role == 'developer':
            return User.objects.filter(proyectos__developers=user).distinct()
        
        # Propietarios solo se ven a sí mismos
        return User.objects.filter(pk=user.pk)

    def create(self, request, *args, **kwargs):
        """Crear usuario con validación de email único"""
        email = request.data.get('email')
        
        # Validación de email
        if not email:
            return Response({
                'success': False,
                'error': 'El email es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar email único
        if User.objects.filter(email__iexact=email).exists():
            logger.warning(f"Attempt to create user with duplicate email: {email}")
            return Response({
                'success': False,
                'error': f'Ya existe un usuario registrado con el email: {email}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            # Audit log
            audit_log(
                action='USER_CREATED',
                user=request.user,
                details={'created_user_email': email},
                ip_address=get_client_ip(request)
            )
            
            headers = self.get_success_headers(serializer.data)
            return Response({
                'success': True,
                'message': 'Usuario creado exitosamente',
                'user': serializer.data
            }, status=status.HTTP_201_CREATED, headers=headers)
            
        except IntegrityError as e:
            logger.error(f"IntegrityError creating user: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error de integridad: El email ya está registrado'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error creating user: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Error interno del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Obtiene, actualiza o elimina un usuario específico.
    
    GET: Obtener detalles de usuario
    PUT/PATCH: Actualizar usuario
    DELETE: Eliminar usuario (solo admin)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'
    
    def get_permissions(self):
        """Permisos específicos según método HTTP"""
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_object(self):
        """Obtener objeto con manejo de errores mejorado"""
        try:
            user_id = self.kwargs.get('pk')
            logger.debug(f"Fetching user {user_id} for {self.request.user.username}")
            
            # Verificar autenticación
            if not self.request.user or not self.request.user.is_authenticated:
                logger.warning(f"Unauthenticated access attempt to user {user_id}")
                self.permission_denied(
                    self.request, 
                    message="Autenticación requerida"
                )
            
            # Obtener objeto
            obj = super().get_object()
            
            # Verificar permisos de objeto
            self.check_object_permissions(self.request, obj)
            
            logger.debug(f"User {obj.username} retrieved by {self.request.user.username}")
            return obj
            
        except User.DoesNotExist:
            logger.warning(f"User {self.kwargs.get('pk')} not found")
            raise Http404("Usuario no encontrado")
        except ValueError as e:
            logger.warning(f"Invalid UUID format: {self.kwargs.get('pk')}")
            raise Http404("Formato de ID inválido")
    
    def check_object_permissions(self, request, obj):
        """Verificar permisos específicos del objeto"""
        # Admin puede ver cualquier usuario
        if request.user.is_superuser or request.user.role == 'admin':
            return
        
        # Usuario puede ver su propio perfil
        if obj.id == request.user.id:
            return
        
        # Denegar acceso en otros casos
        logger.warning(
            f"Permission denied: {request.user.username} "
            f"tried to access {obj.username}"
        )
        self.permission_denied(
            request, 
            message="No tienes permiso para ver este usuario"
        )
    
    def update(self, request, *args, **kwargs):
        """Actualizar usuario con validación de email"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Validar email único si se está actualizando
        new_email = request.data.get('email')
        if new_email and new_email != instance.email:
            if User.objects.filter(email__iexact=new_email).exclude(id=instance.id).exists():
                return Response({
                    'success': False,
                    'error': f'Ya existe otro usuario con el email: {new_email}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Audit log
        audit_log(
            action='USER_UPDATED',
            user=request.user,
            details={'updated_user': instance.email},
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'success': True,
            'message': 'Usuario actualizado exitosamente',
            'user': serializer.data
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Obtener datos del usuario actualmente autenticado.
    
    Returns:
        Response: Datos del usuario actual
    """
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Actualizar perfil del usuario autenticado.
    Valida email único y campos específicos según rol.
    """
    try:
        # Validar email único si se actualiza
        new_email = request.data.get('email')
        if new_email and new_email != request.user.email:
            if User.objects.filter(email__iexact=new_email).exclude(id=request.user.id).exists():
                return Response({
                    'success': False,
                    'error': f'Ya existe otro usuario con el email: {new_email}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = UpdateProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Audit log
            audit_log(
                action='PROFILE_UPDATED',
                user=request.user,
                details={'updated_fields': list(serializer.validated_data.keys())},
                ip_address=get_client_ip(request)
            )
            
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
        
    except IntegrityError:
        logger.error("IntegrityError updating profile", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error de integridad: El email ya está registrado'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# VISTAS DE SOLICITUDES DE USUARIO
# =============================================================================

class UserRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar solicitudes de usuario.
    Permite crear, ver, actualizar y eliminar solicitudes.
    """
    queryset = UserRequest.objects.all()
    permission_classes = [IsAuthenticated, IsRequestOwnerOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'status', 'request_type']
    ordering_fields = ['created_at', 'updated_at', 'status', 'request_type']
    ordering = ['-updated_at']
    
    def get_serializer_class(self):
        """Seleccionar serializer según acción"""
        if self.action == 'create':
            return UserRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserRequestUpdateSerializer
        elif self.action in ['retrieve', 'status_history']:
            return UserRequestDetailSerializer
        return UserRequestSerializer
    
    def get_queryset(self):
        """Filtrar solicitudes según permisos"""
        user = self.request.user
        
        # Staff ve todas las solicitudes
        if user.is_staff:
            return UserRequest.objects.all()
        
        # Usuarios regulares solo ven las suyas
        return UserRequest.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        """Crear nueva solicitud"""
        serializer = self.get_serializer(
            data=request.data, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Audit log
        audit_log(
            action='USER_REQUEST_CREATED',
            user=request.user,
            details={'request_type': serializer.validated_data.get('request_type')},
            ip_address=get_client_ip(request)
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Obtener todas las solicitudes del usuario actual"""
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
        """Obtener resumen de solicitudes del usuario"""
        summary = RequestStatusService.get_request_status_summary(request.user)
        serializer = RequestStatusSummarySerializer(summary)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent_updates(self, request):
        """Obtener actualizaciones recientes de solicitudes"""
        days = int(request.query_params.get('days', 30))
        limit = int(request.query_params.get('limit', 10))
        
        updates = RequestStatusService.get_recent_status_updates(
            user=request.user,
            days=days,
            limit=limit
        )
        
        serializer = UserRequestSerializer(updates, many=True)
        return Response(serializer.data)


# =============================================================================
# VISTAS DE UTILIDAD Y HEALTH CHECK
# =============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def users_health_check(request):
    """
    Health check para el módulo de usuarios.
    Verifica que la base de datos esté accesible.
    """
    try:
        users_count = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        return Response({
            'status': 'ok',
            'module': 'users',
            'database': 'connected',
            'users_count': users_count,
            'active_users': active_users
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return Response({
            'status': 'error',
            'module': 'users',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_user_exists(request, user_id):
    """
    Endpoint de debug para verificar si un usuario existe.
    Útil para debugging y troubleshooting.
    """
    try:
        import uuid
        
        # Validar formato UUID
        try:
            uuid_obj = uuid.UUID(str(user_id))
        except ValueError:
            return Response({
                'error': 'UUID inválido',
                'user_id': str(user_id)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar existencia
        try:
            user = User.objects.get(id=user_id)
            return Response({
                'exists': True,
                'user_id': str(user_id),
                'username': user.username,
                'email': user.email,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat()
            })
        except User.DoesNotExist:
            return Response({
                'exists': False,
                'user_id': str(user_id),
                'message': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.error(f"Error checking user existence: {str(e)}")
        return Response({
            'error': 'Error interno',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# EXPORTS PARA URLs
# =============================================================================

# Vistas basadas en clases como funciones para URLs
user_list_create = UserListCreateView.as_view()
user_detail = UserDetailView.as_view()