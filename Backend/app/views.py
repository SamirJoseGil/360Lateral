from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
import logging

# Importar serializers con manejo de errores
try:
    from .serializers import (
        UserRegistrationSerializer, 
        UserSerializer, 
        LoginSerializer,
        PasswordChangeSerializer
    )
except ImportError:
    # Fallback básico si los serializers no están implementados
    from rest_framework import serializers
    from django.contrib.auth import authenticate
    
    User = get_user_model()
    
    class UserRegistrationSerializer(serializers.ModelSerializer):
        password_confirm = serializers.CharField(write_only=True)
        
        class Meta:
            model = User
            fields = ('email', 'username', 'password', 'password_confirm', 'first_name', 'last_name', 'phone', 'company')
            extra_kwargs = {'password': {'write_only': True}}
        
        def validate(self, data):
            if data['password'] != data['password_confirm']:
                raise serializers.ValidationError("Las contraseñas no coinciden")
            return data
        
        def create(self, validated_data):
            validated_data.pop('password_confirm')
            user = User.objects.create_user(**validated_data)
            return user
    
    class UserSerializer(serializers.ModelSerializer):
        class Meta:
            model = User
            fields = ('id', 'email', 'username', 'first_name', 'last_name', 'phone', 'company', 'role', 'date_joined', 'is_active')
            read_only_fields = ('id', 'date_joined')
    
    class LoginSerializer(serializers.Serializer):
        email = serializers.EmailField()
        password = serializers.CharField()
        
        def validate(self, data):
            email = data.get('email')
            password = data.get('password')
            
            if email and password:
                user = authenticate(username=email, password=password)
                if user:
                    if user.is_active:
                        data['user'] = user
                        return data
                    else:
                        raise serializers.ValidationError("Usuario inactivo")
                else:
                    raise serializers.ValidationError("Credenciales inválidas")
            else:
                raise serializers.ValidationError("Email y contraseña son requeridos")
    
    class PasswordChangeSerializer(serializers.Serializer):
        current_password = serializers.CharField()
        new_password = serializers.CharField()
        new_password_confirm = serializers.CharField()
        
        def validate(self, data):
            if data['new_password'] != data['new_password_confirm']:
                raise serializers.ValidationError("Las nuevas contraseñas no coinciden")
            return data
        
        def save(self):
            user = self.context['request'].user
            current_password = self.validated_data['current_password']
            new_password = self.validated_data['new_password']
            
            if not user.check_password(current_password):
                raise serializers.ValidationError("Contraseña actual incorrecta")
            
            user.set_password(new_password)
            user.save()

# Importar permisos con manejo de errores
try:
    from .permissions import CanManageUsers
except ImportError:
    from rest_framework.permissions import BasePermission
    
    class CanManageUsers(BasePermission):
        def has_permission(self, request, view):
            if not request.user.is_authenticated:
                return False
            
            # Admin puede gestionar todos los usuarios
            if hasattr(request.user, 'role') and request.user.role == 'admin':
                return True
            
            # Usuario normal solo en ciertas acciones
            if view.action in ['list', 'retrieve', 'update', 'partial_update']:
                return True
            
            return False
        
        def has_object_permission(self, request, view, obj):
            if hasattr(request.user, 'role') and request.user.role == 'admin':
                return True
            
            # Solo puede acceder a su propio perfil
            return obj == request.user

User = get_user_model()
logger = logging.getLogger('security')


class AuthViewSet(viewsets.ViewSet):
    """ViewSet seguro para autenticación"""
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Registro seguro de usuarios"""
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            # Verificar rate limiting adicional para registros
            ip = self.get_client_ip(request)
            cache_key = f"register_attempts:{ip}"
            attempts = cache.get(cache_key, 0)
            
            if attempts >= 3:  # Máximo 3 registros por IP por hora
                return Response({
                    'error': 'Too many registration attempts',
                    'message': 'Demasiados intentos de registro. Intente más tarde.'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            try:
                user = serializer.save()
                
                # Incrementar contador de intentos
                cache.set(cache_key, attempts + 1, 3600)  # 1 hora
                
                # Log del registro exitoso
                logger.info(f"New user registered: {user.email} from IP {ip}")
                
                # Generar tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'message': 'Usuario creado exitosamente',
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Registration error for {request.data.get('email', 'unknown')}: {str(e)}")
                return Response({
                    'error': 'Registration failed',
                    'message': 'Error interno del servidor'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login seguro con protección contra brute force"""
        ip = self.get_client_ip(request)
        email = request.data.get('email', '').lower().strip()
        
        # Verificar intentos fallidos por IP
        ip_cache_key = f"login_attempts_ip:{ip}"
        ip_attempts = cache.get(ip_cache_key, 0)
        
        # Verificar intentos fallidos por email
        email_cache_key = f"login_attempts_email:{email}"
        email_attempts = cache.get(email_cache_key, 0)
        
        if ip_attempts >= 10 or email_attempts >= 5:
            logger.warning(f"Login blocked for IP {ip}, email {email}: too many attempts")
            return Response({
                'error': 'Account temporarily locked',
                'message': 'Demasiados intentos fallidos. Intente más tarde.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Limpiar contadores en login exitoso
            cache.delete(ip_cache_key)
            cache.delete(email_cache_key)
            
            # Log del login exitoso
            logger.info(f"Successful login: {user.email} from IP {ip}")
            
            # Generar tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login exitoso',
                'user': UserSerializer(user, context={'request': request}).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        else:
            # Incrementar contadores en login fallido
            cache.set(ip_cache_key, ip_attempts + 1, 900)  # 15 minutos
            cache.set(email_cache_key, email_attempts + 1, 900)  # 15 minutos
            
            logger.warning(f"Failed login attempt: {email} from IP {ip}")
            
            return Response({
                'error': 'Invalid credentials',
                'message': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout seguro con invalidación de token"""
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                
            logger.info(f"User logout: {request.user.email}")
            
            return Response({
                'message': 'Logout exitoso'
            }, status=status.HTTP_200_OK)
            
        except TokenError:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Obtener perfil del usuario autenticado"""
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Cambiar contraseña de forma segura"""
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            
            logger.info(f"Password changed for user: {request.user.email}")
            
            return Response({
                'message': 'Contraseña cambiada exitosamente'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        """Obtener IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet seguro para gestión de usuarios"""
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]
    
    def get_queryset(self):
        """Filtrar usuarios según permisos"""
        user = self.request.user
        
        # Admin puede ver todos los usuarios
        if hasattr(user, 'role') and user.role == 'admin':
            return User.objects.all()
        
        # Usuarios normales solo ven su propio perfil
        return User.objects.filter(id=user.id)
    
    def perform_update(self, serializer):
        """Validaciones adicionales en actualización"""
        user = self.request.user
        instance = serializer.instance
        
        # Solo admin o el mismo usuario pueden modificar
        if not (hasattr(user, 'role') and user.role == 'admin') and instance != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permisos para modificar este usuario")
        
        # Log de modificación
        logger.info(f"User {user.email} updating user {instance.email}")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Solo admin puede eliminar usuarios"""
        user = self.request.user
        
        if not (hasattr(user, 'role') and user.role == 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Solo administradores pueden eliminar usuarios")
        
        if instance == user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No puedes eliminar tu propia cuenta")
        
        logger.warning(f"User {user.email} deleted user {instance.email}")
        instance.delete()


# Mixin de seguridad
@method_decorator(never_cache, name='dispatch')
class SecureViewMixin:
    """Mixin para añadir funcionalidades de seguridad a las views"""
    
    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)
        
        # Añadir headers de seguridad específicos
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        
        return response
    
    def get_client_ip(self, request):
        """Obtener IP del cliente de forma segura"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# ViewSets simplificados que funcionan
class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de usuarios"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # Requiere autenticación
    
    def get_queryset(self):
        """Filtrar usuarios según permisos"""
        user = self.request.user
        
        # Admin puede ver todos los usuarios
        if hasattr(user, 'role') and user.role == 'admin':
            return User.objects.all()
        
        # Usuarios normales solo ven su propio perfil
        return User.objects.filter(id=user.id)


class AuthViewSet(viewsets.ViewSet):
    """ViewSet para autenticación - permisos específicos por acción"""
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Registro seguro de usuarios - SIN autenticación requerida"""
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                
                # Log del registro exitoso
                logger.info(f"New user registered: {user.email}")
                
                # Generar tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'message': 'Usuario creado exitosamente',
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Registration error: {str(e)}")
                return Response({
                    'error': 'Registration failed',
                    'message': 'Error interno del servidor'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login seguro - SIN autenticación requerida"""
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Log del login exitoso
            logger.info(f"Successful login: {user.email}")
            
            # Generar tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login exitoso',
                'user': UserSerializer(user, context={'request': request}).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        else:
            logger.warning(f"Failed login attempt from {request.META.get('REMOTE_ADDR')}")
            
            return Response({
                'error': 'Invalid credentials',
                'message': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout seguro"""
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                
            logger.info(f"User logout: {request.user.email}")
            
            return Response({
                'message': 'Logout exitoso'
            }, status=status.HTTP_200_OK)
            
        except TokenError:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Obtener perfil del usuario autenticado"""
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Cambiar contraseña"""
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            
            logger.info(f"Password changed for user: {request.user.email}")
            
            return Response({
                'message': 'Contraseña cambiada exitosamente'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# ERROR HANDLERS
# =============================================================================

def bad_request(request, exception):
    """Custom 400 error handler"""
    return JsonResponse({
        'error': True,
        'message': 'Solicitud inválida',
        'status_code': 400
    }, status=400)


def permission_denied(request, exception):
    """Custom 403 error handler"""
    return JsonResponse({
        'error': True,
        'message': 'Acceso denegado',
        'status_code': 403
    }, status=403)


def not_found(request, exception):
    """Custom 404 error handler"""
    return JsonResponse({
        'error': True,
        'message': 'Recurso no encontrado',
        'status_code': 404
    }, status=404)


def server_error(request):
    """Custom 500 error handler"""
    return JsonResponse({
        'error': True,
        'message': 'Error interno del servidor',
        'status_code': 500
    }, status=500)