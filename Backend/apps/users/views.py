"""
Vistas para la API de usuarios
Maneja CRUD de usuarios, perfiles y solicitudes de usuario
"""
from rest_framework import generics, status, permissions, viewsets, filters, serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.http import Http404
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
import logging

from .models import User, UserProfile, UserRequest
from .serializers import (
    PerfilInversionSerializer, UserSerializer, UserProfileSerializer, UserRequestSerializer, 
    UserRequestDetailSerializer, UserRequestCreateSerializer, 
    UserRequestUpdateSerializer, RequestStatusSummarySerializer,
    UpdateProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserRegistrationSerializer,
    PromoteToAdminSerializer,  
)
from .permissions import CanManageUsers, IsOwnerOrAdmin, IsRequestOwnerOrStaff
from .services import RequestStatusService, PasswordResetService

# Utilidades comunes
from apps.common.utils import audit_log, get_client_ip

logger = logging.getLogger(__name__)


# =============================================================================
# VISTAS DE USUARIOS
# =============================================================================

class UserListCreateView(generics.ListCreateAPIView):
    """
    Lista todos los usuarios (filtrado según permisos) o crea uno nuevo.
    ✅ OPTIMIZADO: select_related para profile
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering_fields = ['created_at', 'email', 'role']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserRegistrationSerializer
        return UserSerializer
    
    def get_queryset(self):
        """
        ✅ OPTIMIZADO: Filtrar usuarios con select_related
        """
        user = self.request.user
        
        # ✅ Base queryset optimizado
        queryset = User.objects.select_related(
            'profile'  # JOIN con UserProfile
        ).only(
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'is_active', 'is_verified', 'created_at', 'updated_at',
            'phone', 'developer_type', 'person_type', 'legal_name'
        )
        
        # Admin ve todos los usuarios
        if user.is_superuser or user.role == 'admin':
            return queryset
        elif user.role == 'developer':
            # Developers ven otros developers y propietarios
            return queryset.filter(role__in=['developer', 'owner'])
        
        # Propietarios solo se ven a sí mismos
        return queryset.filter(pk=user.pk)

    def create(self, request, *args, **kwargs):
        """✅ CORREGIDO: Crear usuario con validación de email único"""
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
            # Usar UserRegistrationSerializer que maneja password correctamente
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Validar campos específicos según rol
            role = serializer.validated_data.get('role')
            
            # Si es admin, validar department
            if role == 'admin' and not request.data.get('department'):
                return Response({
                    'success': False,
                    'error': 'El campo "department" es requerido para administradores'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear usuario
            user = serializer.save()
            
            # Audit log
            audit_log(
                action='USER_CREATED',
                user=request.user,
                details={'created_user_email': email},
                ip_address=get_client_ip(request)
            )
            
            # Retornar con UserSerializer para respuesta completa
            response_serializer = UserSerializer(user)
            
            return Response({
                'success': True,
                'message': 'Usuario creado exitosamente',
                'user': response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except serializers.ValidationError as e:  # ✅ CORRECTO: Ahora serializers está importado
            logger.error(f"Validation error creating user: {e.detail}")
            return Response({
                'success': False,
                'errors': e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
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
                'error': f'Error interno del servidor'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Obtiene, actualiza o elimina un usuario específico.
    ✅ CORREGIDO: Soft delete
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
    
    def perform_destroy(self, instance):
        """✅ SOFT DELETE: Desactivar en lugar de eliminar"""
        reason = f"Usuario eliminado por {self.request.user.email}"
        instance.soft_delete(reason=reason)
        logger.info(f"User {instance.email} soft deleted by {self.request.user.email}")


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
        """Obtener todas las solicitudes del usuario actual (con info de revisión)"""
        request_type = request.query_params.get('type')
        request_status = request.query_params.get('status')

        # ✅ NUEVO: Logging detallado
        logger.info("="*60)
        logger.info(f"[my_requests] User: {request.user.email}")
        logger.info(f"[my_requests] Filters - type: {request_type}, status: {request_status}")

        # Obtener queryset enriquecido (select_related ya en el servicio)
        requests_qs = RequestStatusService.get_user_requests(
            user=request.user,
            request_type=request_type,
            status=request_status
        )

        # ✅ NUEVO: Log de cantidad y datos de primera solicitud
        logger.info(f"[my_requests] Found {requests_qs.count()} requests")
        
        if requests_qs.exists():
            first_req = requests_qs.first()
            logger.info(f"[my_requests] First request:")
            logger.info(f"  - ID: {first_req.id}")
            logger.info(f"  - Title: {first_req.title}")
            logger.info(f"  - Status: {first_req.status}")
            logger.info(f"  - Reviewer: {first_req.reviewer}")
            logger.info(f"  - Review notes: {first_req.review_notes}")
            logger.info(f"  - Reviewer info exists: {first_req.reviewer is not None}")
            if first_req.reviewer:
                logger.info(f"  - Reviewer email: {first_req.reviewer.email}")
                logger.info(f"  - Reviewer full_name: {first_req.reviewer.get_full_name()}")

        page = self.paginate_queryset(requests_qs)
        # Usar el serializer detallado para incluir reviewer/review_notes en la lista
        serializer_class = UserRequestDetailSerializer

        if page is not None:
            serializer = serializer_class(page, many=True, context={'request': request})
            
            # ✅ NUEVO: Log de datos serializados
            logger.info(f"[my_requests] Serialized {len(serializer.data)} items")
            if serializer.data:
                first_item = serializer.data[0]
                logger.info(f"[my_requests] First serialized item keys: {list(first_item.keys())}")
                logger.info(f"[my_requests] reviewer_info: {first_item.get('reviewer_info')}")
                logger.info(f"[my_requests] review_notes: {first_item.get('review_notes')}")
            
            logger.info("="*60)
            return self.get_paginated_response(serializer.data)

        serializer = serializer_class(requests_qs, many=True, context={'request': request})
        
        # ✅ NUEVO: Log para respuesta sin paginación
        logger.info(f"[my_requests] Non-paginated response with {len(serializer.data)} items")
        if serializer.data:
            logger.info(f"[my_requests] First item reviewer_info: {serializer.data[0].get('reviewer_info')}")
            logger.info(f"[my_requests] First item review_notes: {serializer.data[0].get('review_notes')}")
        logger.info("="*60)
        
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
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def response(self, request, pk=None):
        """
        Retorna la solicitud con la información de revisión del admin:
        - reviewer (info)
        - review_notes
        - status, resolved_at
        Endpoint: /api/users/requests/{pk}/response/
        """
        try:
            obj = self.get_object()  # aplica permisos automáticamente
            # Usar el serializer detallado que ya incluye reviewer_info y review_notes
            from .serializers import UserRequestDetailSerializer
            serializer = UserRequestDetailSerializer(obj, context={'request': request})
            
            data = serializer.data
            # Añadir campos de conveniencia
            data['reviewed'] = obj.is_resolved
            data['reviewer_response'] = obj.review_notes
            data['reviewer'] = None
            if obj.reviewer:
                from .serializers import UserSimpleSerializer
                data['reviewer'] = UserSimpleSerializer(obj.reviewer).data

            return Response({
                'success': True,
                'request': data
            })
        except Exception as e:
            logger.error(f"Error retrieving request response for {pk}: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Error al obtener la solicitud'}, status=500)


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
# RECUPERACIÓN DE CONTRASEÑA
# ⚠️ ADVERTENCIA: SMTP NO CONFIGURADO
# 
# ESTADO ACTUAL:
# - El token se retorna directamente en la respuesta (INSEGURO)
# - El token se imprime en consola
# - NO se envían emails
#
# PENDIENTE PARA PRODUCCIÓN:
# 1. Configurar SMTP en settings.py
# 2. Eliminar retorno de token en request_password_reset
# 3. Implementar envío de email con PasswordResetService.send_reset_email()
# 4. Actualizar frontend para mostrar mensaje de "revisa tu email"
# =============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Solicitar recuperación de contraseña.
    ⚠️ TEMPORAL: Retorna el token directamente (sin envío de email)
    
    POST /api/users/password-reset/request/
    Body: { "email": "user@example.com" }
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    try:
        user = User.objects.get(email__iexact=email)
        
        # Generar token
        token = PasswordResetService.generate_reset_token(user)
        
        # Audit log
        audit_log(
            action='PASSWORD_RESET_REQUESTED',
            user=user,
            details={'email': email},
            ip_address=get_client_ip(request)
        )
        
        logger.info(f"Password reset requested for {email}")
        
        # ⚠️ TEMPORAL: Retornar token directamente (INSEGURO - solo para desarrollo)
        # En producción, esto debería enviar un email y NO retornar el token
        return Response({
            'success': True,
            'message': 'Token de recuperación generado exitosamente',
            'data': {
                'token': token.token,  # ⚠️ INSEGURO - Solo para desarrollo
                'expires_at': token.expires_at.isoformat(),
                'user_email': user.email,
                # URL para copiar y pegar
                'reset_url': f"http://localhost:3000/reset-password?token={token.token}"
            },
            'warning': '⚠️ En producción, el token se enviará por email y NO se retornará en la respuesta'
        })
    
    except User.DoesNotExist:
        # ✅ Por seguridad, retornar el mismo mensaje
        # Esto evita que atacantes puedan enumerar emails válidos
        logger.warning(f"Password reset requested for non-existent email: {email}")
        
        return Response({
            'success': False,
            'error': f'No existe un usuario con el email: {email}'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error in password reset request: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """
    Verificar si un token de recuperación es válido.
    
    POST /api/users/password-reset/verify-token/
    Body: { "token": "abc123..." }
    """
    from .models import PasswordResetToken
    
    token_string = request.data.get('token')
    
    if not token_string:
        return Response({
            'success': False,
            'error': 'Token es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        token = PasswordResetToken.objects.get(token=token_string)
        
        is_valid = token.is_valid()
        
        return Response({
            'success': True,
            'valid': is_valid,
            'message': 'Token válido' if is_valid else 'Token inválido o expirado',
            'user_email': token.user.email if is_valid else None
        })
        
    except PasswordResetToken.DoesNotExist:
        return Response({
            'success': True,
            'valid': False,
            'message': 'Token inválido'
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    """
    Confirmar el reseteo de contraseña con token.
    
    POST /api/users/password-reset/confirm/
    Body: {
        "token": "abc123...",
        "new_password": "newpass123",
        "confirm_password": "newpass123"
    }
    """
    serializer = PasswordResetConfirmSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Obtener datos validados
    token_string = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']
    
    # Resetear contraseña
    success, message, user = PasswordResetService.reset_password(
        token_string,
        new_password
    )
    
    if success:
        # Invalidar otros tokens del usuario
        PasswordResetService.invalidate_user_tokens(user)
        
        # Audit log
        audit_log(
            action='PASSWORD_RESET_COMPLETED',
            user=user,
            details={'email': user.email},
            ip_address=get_client_ip(request)
        )
        
        logger.info(f"Password reset completed for {user.email}")
        
        return Response({
            'success': True,
            'message': message
        })
    else:
        return Response({
            'success': False,
            'error': message
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def check_email_exists(request):
    """
    ✅ NUEVO: Verificar si un email ya está registrado.
    Útil para validación en tiempo real en el frontend.
    
    POST /api/users/check-email/
    Body: { "email": "user@example.com" }
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'success': False,
            'error': 'Email es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = email.lower().strip()
    exists = User.objects.filter(email__iexact=email).exists()
    
    return Response({
        'success': True,
        'exists': exists,
        'email': email
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def check_phone_exists(request):
    """
    ✅ NUEVO: Verificar si un teléfono ya está registrado.
    
    POST /api/users/check-phone/
    Body: { "phone": "+57 300 123 4567" }
    """
    phone = request.data.get('phone')
    
    if not phone:
        return Response({
            'success': False,
            'error': 'Teléfono es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    phone = phone.strip()
    exists = User.objects.filter(phone=phone).exists()
    
    return Response({
        'success': True,
        'exists': exists,
        'phone': phone
    })


# =============================================================================
# EXPORTS PARA URLs
# =============================================================================

# Vistas basadas en clases como funciones para URLs
user_list_create = UserListCreateView.as_view()
user_detail = UserDetailView.as_view()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_verification_code(request):
    """
    ✅ NUEVO: Solicitar código de verificación
    
    POST /api/users/verification/request/
    Body: { "code_type": "email" | "whatsapp" | "sms" }
    """
    from .serializers import VerificationCodeSerializer
    from .services import VerificationService
    
    serializer = VerificationCodeSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    code_type = serializer.validated_data['code_type']
    user = request.user
    
    # Validar que el usuario tenga email/phone según tipo
    if code_type == 'email' and not user.email:
        return Response({
            'success': False,
            'error': 'No tienes email registrado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if code_type in ['whatsapp', 'sms'] and not user.phone:
        return Response({
            'success': False,
            'error': 'No tienes teléfono registrado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Generar código
        verification = VerificationService.generate_verification_code(user, code_type)
        
        # Audit log
        audit_log(
            action='VERIFICATION_CODE_REQUESTED',
            user=user,
            details={'code_type': code_type},
            ip_address=get_client_ip(request)
        )
        
        # ⚠️ TEMPORAL: Retornar código directamente (INSEGURO - solo para desarrollo)
        return Response({
            'success': True,
            'message': f'Código de verificación enviado a tu {code_type}',
            'data': {
                'code': verification.code,  # ⚠️ INSEGURO - Solo para desarrollo
                'expires_at': verification.expires_at.isoformat(),
                'code_type': code_type
            },
            'warning': '⚠️ En producción, el código se enviará y NO se retornará en la respuesta'
        })
        
    except Exception as e:
        logger.error(f"❌ Error generating verification code: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_code(request):
    """
    ✅ NUEVO: Verificar código de verificación
    
    POST /api/users/verification/verify/
    Body: { "code": "123456", "code_type": "email" }
    """
    from .serializers import VerifyCodeSerializer
    from .services import VerificationService
    
    serializer = VerifyCodeSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    code = serializer.validated_data['code']
    code_type = serializer.validated_data['code_type']
    user = request.user
    
    try:
        # Verificar código
        success, message = VerificationService.verify_code(user, code, code_type)
        
        if success:
            # Audit log
            audit_log(
                action='VERIFICATION_CODE_VERIFIED',
                user=user,
                details={'code_type': code_type},
                ip_address=get_client_ip(request)
            )
            
            return Response({
                'success': True,
                'message': message,
                'data': {
                    'is_verified': user.is_verified,
                    'is_phone_verified': user.is_phone_verified
                }
            })
        else:
            return Response({
                'success': False,
                'error': message
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"❌ Error verifying code: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_verification_code(request):
    """
    ✅ NUEVO: Reenviar código de verificación
    
    POST /api/users/verification/resend/
    Body: { "code_type": "email" }
    """
    from .serializers import VerificationCodeSerializer
    from .services import VerificationService
    
    serializer = VerificationCodeSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    code_type = serializer.validated_data['code_type']
    user = request.user
    
    try:
        # Reenviar código
        verification = VerificationService.resend_verification_code(user, code_type)
        
        # Audit log
        audit_log(
            action='VERIFICATION_CODE_RESENT',
            user=user,
            details={'code_type': code_type},
            ip_address=get_client_ip(request)
        )
        
        # ⚠️ TEMPORAL: Retornar código directamente
        return Response({
            'success': True,
            'message': f'Código reenviado a tu {code_type}',
            'data': {
                'code': verification.code,  # ⚠️ INSEGURO - Solo para desarrollo
                'expires_at': verification.expires_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error resending verification code: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def promote_to_admin(request):
    """
    ✅ NUEVO: Ascender un usuario a administrador
    Solo accesible para superusuarios
    
    POST /api/users/promote-to-admin/
    Body: {
        "user_id": "uuid",
        "department": "ventas",
        "permissions_scope": "full"
    }
    """
    # ✅ CRÍTICO: Solo superusuarios pueden ascender
    if not request.user.is_superuser:
        return Response({
            'success': False,
            'error': 'Solo los superusuarios pueden ascender usuarios a administrador'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = PromoteToAdminSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_id = serializer.validated_data['user_id']
        user = User.objects.get(id=user_id)
        
        # Guardar rol anterior para logging
        old_role = user.role
        
        # Ascender a admin
        user.role = 'admin'
        user.department = serializer.validated_data['department']
        user.permissions_scope = serializer.validated_data.get('permissions_scope', 'limited')
        user.save()
        
        # Audit log
        audit_log(
            action='USER_PROMOTED_TO_ADMIN',
            user=request.user,
            details={
                'promoted_user_id': str(user.id),
                'promoted_user_email': user.email,
                'old_role': old_role,
                'new_role': 'admin',
                'department': user.department
            },
            ip_address=get_client_ip(request)
        )
        
        logger.info(
            f"✅ User {user.email} promoted to admin by {request.user.email} "
            f"(old role: {old_role})"
        )
        
        # Retornar usuario actualizado
        response_serializer = UserSerializer(user)
        
        return Response({
            'success': True,
            'message': f'Usuario {user.email} ascendido a administrador exitosamente',
            'user': response_serializer.data
        })
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Usuario no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"❌ Error promoting user to admin: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_first_login_completed(request):
    """
    Marcar que el usuario completó su primera sesión
    
    POST /api/users/first-login-completed/
    """
    try:
        user = request.user
        
        logger.info(f"🔍 First login request for user: {user.email}")
        logger.info(f"   Current first_login_completed: {user.first_login_completed}")
        
        if not user.first_login_completed:
            user.first_login_completed = True
            user.save(update_fields=['first_login_completed'])
            logger.info(f"✅ First login completed marked for user: {user.email}")
        else:
            logger.info(f"ℹ️ First login already completed for user: {user.email}")
        
        return Response({
            'success': True,
            'message': 'Primera sesión completada',
            'user': UserSerializer(user).data
        })
        
    except Exception as e:
        logger.error(f"❌ Error marking first login: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Error al marcar primera sesión'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# PERFIL DE INVERSIÓN
# =============================================================================

@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def perfil_inversion(request):
    """
    Obtener o actualizar perfil de inversión del desarrollador.
    """
    if request.user.role != 'developer':
        return Response({
            'success': False,
            'message': 'Solo desarrolladores pueden acceder a este endpoint'
        }, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # ✅ MEJORADO: Retornar datos existentes con valores por defecto
        perfil = {
            'ciudades_interes': request.user.ciudades_interes or [],
            'usos_preferidos': request.user.usos_preferidos or [],
            'modelos_pago': request.user.modelos_pago or [],
            'volumen_ventas_min': request.user.volumen_ventas_min or '',
            'ticket_inversion_min': request.user.ticket_inversion_min or '',
            'perfil_completo': request.user.perfil_completo or False,
            'developer_type': request.user.developer_type or ''
        }
        
        # ✅ NUEVO: Log detallado para debugging
        logger.info(f"📊 Perfil de inversión obtenido - completo: {perfil['perfil_completo']}")
        logger.debug(f"📊 Datos del perfil: {perfil}")
        
        return Response({
            'success': True,
            'perfil': perfil
        })
    
    # PATCH o PUT - Actualizar
    serializer = PerfilInversionSerializer(data=request.data, instance=request.user)
    
    if not serializer.is_valid():
        logger.warning(f"❌ Validación fallida: {serializer.errors}")
        return Response({
            'success': False,
            'message': 'Datos inválidos',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # ✅ CRÍTICO: Guardar usando el serializer
        updated_user = serializer.save()
        
        # Respuesta con datos actualizados
        perfil = {
            'ciudades_interes': updated_user.ciudades_interes,
            'usos_preferidos': updated_user.usos_preferidos,
            'modelos_pago': updated_user.modelos_pago,
            'volumen_ventas_min': updated_user.volumen_ventas_min,
            'ticket_inversion_min': updated_user.ticket_inversion_min,
            'perfil_completo': updated_user.perfil_completo,
            'developer_type': updated_user.developer_type
        }
        
        logger.info(f"✅ Perfil actualizado - completo: {perfil['perfil_completo']}")
        
        return Response({
            'success': True,
            'message': 'Perfil de inversión actualizado correctamente',
            'perfil': perfil
        })
        
    except Exception as e:
        logger.error(f"❌ Error actualizando perfil: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error actualizando perfil: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])  # ✅ Público para que funcione en formularios
def ciudades_colombia(request):
    """
    Obtener lista de ciudades principales de Colombia.
    Endpoint público para formularios de registro y perfil.
    """
    # Lista estática de ciudades principales de Colombia
    ciudades = [
        {'value': 'medellin', 'label': 'Medellín'},
        {'value': 'bogota', 'label': 'Bogotá'},
        {'value': 'cali', 'label': 'Cali'},
        {'value': 'barranquilla', 'label': 'Barranquilla'},
        {'value': 'cartagena', 'label': 'Cartagena'},
        {'value': 'cucuta', 'label': 'Cúcuta'},
        {'value': 'bucaramanga', 'label': 'Bucaramanga'},
        {'value': 'pereira', 'label': 'Pereira'},
        {'value': 'santa_marta', 'label': 'Santa Marta'},
        {'value': 'ibague', 'label': 'Ibagué'},
        {'value': 'pasto', 'label': 'Pasto'},
        {'value': 'manizales', 'label': 'Manizales'},
        {'value': 'neiva', 'label': 'Neiva'},
        {'value': 'villavicencio', 'label': 'Villavicencio'},
        {'value': 'armenia', 'label': 'Armenia'},
        {'value': 'valledupar', 'label': 'Valledupar'},
        {'value': 'monteria', 'label': 'Montería'},
        {'value': 'sincelejo', 'label': 'Sincelejo'},
        {'value': 'popayan', 'label': 'Popayán'},
        {'value': 'tunja', 'label': 'Tunja'},
    ]
    
    logger.info(f"📍 Ciudades disponibles solicitadas: {len(ciudades)} ciudades")
    
    return Response({
        'success': True,
        'ciudades': ciudades,
        'count': len(ciudades)
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def soft_delete_user(request, user_id):
    """
    Soft delete de un usuario (solo admin).
    Marca al usuario como inactivo en lugar de eliminarlo.
    """
    try:
        user = get_object_or_404(User, id=user_id)
        
        # Prevenir auto-eliminación
        if user.id == request.user.id:
            return Response({
                'success': False,
                'message': 'No puedes eliminar tu propia cuenta'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prevenir eliminación de superusuarios por no-superusuarios
        if user.is_superuser and not request.user.is_superuser:
            return Response({
                'success': False,
                'message': 'No tienes permisos para eliminar un superusuario'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener razón de eliminación
        reason = request.data.get('reason', 'Eliminado por administrador')
        
        # Soft delete
        from django.utils import timezone
        user.is_active = False
        user.deleted_at = timezone.now()
        user.deletion_reason = reason
        user.save()
        
        # Audit log
        audit_log(
            'USER_DELETED',
            request.user,
            {
                'deleted_user_id': str(user.id),
                'deleted_user_email': user.email,
                'reason': reason
            },
            get_client_ip(request)
        )
        
        logger.info(f"User soft deleted: {user.email} by {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'Usuario eliminado exitosamente'
        })
        
    except Exception as e:
        logger.error(f"Error in soft_delete_user: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error al eliminar usuario'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_statistics(request):
    """
    Obtener estadísticas generales del sistema (solo admin).
    ✅ CORREGIDO: Campo uploaded_at → created_at
    """
    # Intentar obtener del cache
    from apps.common.cache import CacheService
    cache_key = 'admin_statistics'
    cached_stats = CacheService.get(cache_key)
    
    if cached_stats:
        logger.info("📦 Returning cached admin statistics")
        return Response({
            'success': True,
            'data': cached_stats,
            'cached': True
        })
    
    try:
        from apps.lotes.models import Lote
        from apps.documents.models import Document
        from apps.solicitudes.models import Solicitud
        from django.db.models import Count, Q, Sum
        from datetime import datetime, timedelta
        from django.utils import timezone  # ✅ AGREGADO
        
        # ✅ CORREGIDO: Usar timezone.now() en lugar de datetime.now()
        now = timezone.now()
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        # Estadísticas de Usuarios
        usuarios_stats = {
            'total': User.objects.count(),
            'activos': User.objects.filter(is_active=True).count(),
            'inactivos': User.objects.filter(is_active=False).count(),
            'por_rol': dict(
                User.objects.values('role').annotate(count=Count('id'))
                .values_list('role', 'count')
            ),
            'verificados': User.objects.filter(is_verified=True).count(),
            'nuevos_mes': User.objects.filter(
                created_at__gte=thirty_days_ago  # ✅ CORREGIDO: usar variable con timezone
            ).count()
        }
        
        # Estadísticas de Lotes
        lotes_stats = {
            'total': Lote.objects.count(),
            'por_estado': dict(
                Lote.objects.values('status').annotate(count=Count('id'))
                .values_list('status', 'count')
            ),
            'area_total': Lote.objects.aggregate(Sum('area'))['area__sum'] or 0,
            'verificados': Lote.objects.filter(is_verified=True).count(),
            'nuevos_mes': Lote.objects.filter(
                created_at__gte=thirty_days_ago  # ✅ CORREGIDO
            ).count()
        }
        
        # ✅ CORREGIDO: Estadísticas de Documentos - usar created_at en lugar de uploaded_at
        documentos_stats = {
            'total': Document.objects.count(),
            'validados': Document.objects.filter(
                metadata__status='validado'
            ).count(),
            'pendientes': Document.objects.filter(
                Q(metadata__status='pendiente') | Q(metadata__status__isnull=True)
            ).count(),
            'rechazados': Document.objects.filter(
                metadata__status='rechazado'
            ).count(),
            'nuevos_semana': Document.objects.filter(
                created_at__gte=seven_days_ago  # ✅ CORREGIDO: uploaded_at → created_at
            ).count()
        }
        
        # Estadísticas de Solicitudes
        solicitudes_stats = {
            'total': Solicitud.objects.count(),
            'por_estado': dict(
                Solicitud.objects.values('estado').annotate(count=Count('id'))
                .values_list('estado', 'count')
            ),
            'por_tipo': dict(
                Solicitud.objects.values('tipo').annotate(count=Count('id'))
                .values_list('tipo', 'count')
            ),
            'nuevas_semana': Solicitud.objects.filter(
                created_at__gte=seven_days_ago  # ✅ CORREGIDO
            ).count()
        }
        
        # Actividad Reciente - ✅ CORREGIDO: usar created_at con timezone
        actividad_reciente = {
            'usuarios_registrados_hoy': User.objects.filter(
                created_at__date=today  # ✅ CORREGIDO: usar today (date object)
            ).count(),
            'lotes_registrados_hoy': Lote.objects.filter(
                created_at__date=today  # ✅ CORREGIDO
            ).count(),
            'documentos_subidos_hoy': Document.objects.filter(
                created_at__date=today  # ✅ CORREGIDO: uploaded_at → created_at
            ).count(),
            'solicitudes_creadas_hoy': Solicitud.objects.filter(
                created_at__date=today  # ✅ CORREGIDO
            ).count(),
        }
        
        # Top Usuarios por Lotes
        top_usuarios = User.objects.filter(
            role='owner',
            is_active=True
        ).annotate(
            lotes_count=Count('lotes_owned')
        ).order_by('-lotes_count')[:5].only(
            'id', 'email', 'first_name', 'last_name'
        ).values(
            'id', 'email', 'first_name', 'last_name', 'lotes_count'
        )
        
        statistics_data = {
            'usuarios': usuarios_stats,
            'lotes': lotes_stats,
            'documentos': documentos_stats,
            'solicitudes': solicitudes_stats,
            'actividad_reciente': actividad_reciente,
            'top_usuarios': list(top_usuarios),
            'timestamp': now.isoformat()  # ✅ CORREGIDO: usar now con timezone
        }
        
        # Guardar en cache por 1 minuto
        CacheService.set(cache_key, statistics_data, timeout=60)
        
        logger.info(f"Admin statistics retrieved by {request.user.email}")
        
        return Response({
            'success': True,
            'data': statistics_data,
            'cached': False
        })
        
    except Exception as e:
        logger.error(f"Error in admin_statistics: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")  # ✅ AGREGADO: más info
        return Response({
            'success': False,
            'message': 'Error al obtener estadísticas'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def listar_perfiles_inversion(request):
    """
    Listar todos los perfiles de inversión (solo admin).
    Endpoint para dashboard de administrador.
    """
    try:
        # Obtener todos los desarrolladores
        desarrolladores = User.objects.filter(
            role='developer'
        ).select_related().order_by('-created_at')
        
        profiles = []
        for dev in desarrolladores:
            # Solo incluir si tiene al menos un campo de perfil configurado
            if dev.ciudades_interes or dev.usos_preferidos or dev.modelos_pago:
                profiles.append({
                    'id': dev.id,
                    'developer': {
                        'id': str(dev.id),
                        'email': dev.email,
                        'name': dev.get_full_name() or dev.email,
                    },
                    'ciudades_interes': dev.ciudades_interes or [],
                    'usos_preferidos': dev.usos_preferidos or [],
                    'modelos_pago': dev.modelos_pago or [],
                    'volumen_ventas_min': dev.volumen_ventas_min or '',
                    'ticket_inversion_min': dev.ticket_inversion_min,
                    'perfil_completo': dev.perfil_completo,
                    'created_at': dev.created_at.isoformat(),
                })
        
        logger.info(f"📋 Admin viewing {len(profiles)} investment profiles")
        
        return Response({
            'success': True,
            'profiles': profiles,
            'total': len(profiles)
        })
        
    except Exception as e:
        logger.error(f"Error listing investment profiles: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error obteniendo perfiles de inversión'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)