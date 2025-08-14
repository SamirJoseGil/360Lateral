"""
Vistas para la gestión de usuarios
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import get_user_model, logout, login
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar usuarios
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtrar usuarios según el rol del usuario actual
        """
        # Protección para Swagger/generación de esquemas
        if getattr(self, 'swagger_fake_view', False):
            return User.objects.none()
            
        # Verificar si el usuario está autenticado
        if not self.request.user.is_authenticated:
            return User.objects.none()
            
        # Verificar si tiene el atributo is_admin
        if hasattr(self.request.user, 'is_admin') and self.request.user.is_admin:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Obtener información del usuario actual
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar perfiles de usuario
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtrar perfiles según el usuario actual
        """
        # Protección para Swagger/generación de esquemas
        if getattr(self, 'swagger_fake_view', False):
            return UserProfile.objects.none()
            
        # Verificar si el usuario está autenticado
        if not self.request.user.is_authenticated:
            return UserProfile.objects.none()
            
        # Verificar si tiene el atributo is_admin
        if hasattr(self.request.user, 'is_admin') and self.request.user.is_admin:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)

class RegisterView(generics.CreateAPIView):
    """Vista para registro de usuarios"""
    
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Serializar datos del usuario
        user_data = UserSerializer(user).data
        
        response_data = {
            'user': user_data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Usuario registrado exitosamente'
        }
        
        response = Response(response_data, status=status.HTTP_201_CREATED)
        
        # ✅ Establecer cookies httpOnly para mayor seguridad
        response.set_cookie(
            'access_token',
            str(refresh.access_token),
            max_age=60 * 15,  # 15 minutos
            httponly=True,
            samesite='Lax'
        )
        response.set_cookie(
            'refresh_token',
            str(refresh),
            max_age=60 * 60 * 24 * 7,  # 7 días
            httponly=True,
            samesite='Lax'
        )
        
        return response

class LoginView(generics.GenericAPIView):
    """Vista para login de usuarios"""
    
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Login en Django
        login(request, user)
        
        # Serializar datos del usuario
        user_data = UserSerializer(user).data
        
        response_data = {
            'user': user_data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Login exitoso'
        }
        
        response = Response(response_data, status=status.HTTP_200_OK)
        
        # ✅ Establecer cookies httpOnly
        response.set_cookie(
            'access_token',
            str(refresh.access_token),
            max_age=60 * 15,  # 15 minutos
            httponly=True,
            samesite='Lax'
        )
        response.set_cookie(
            'refresh_token',
            str(refresh),
            max_age=60 * 60 * 24 * 7,  # 7 días
            httponly=True,
            samesite='Lax'
        )
        
        return response

class LogoutView(generics.GenericAPIView):
    """Vista para logout de usuarios"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        try:
            # Obtener refresh token del request
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        
        # Logout en Django
        logout(request)
        
        response = Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)
        
        # ✅ Limpiar cookies
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        
        return response

class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Vista para obtener/actualizar usuario actual"""
    
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.UpdateAPIView):
    """Vista para cambiar contraseña"""
    
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Verificar contraseña actual
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    'error': 'Contraseña actual incorrecta'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Establecer nueva contraseña
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'message': 'Contraseña actualizada exitosamente'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✅ Vistas para gestión de usuarios (Admin)
class UserListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear usuarios (Solo Admin)"""
    
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo admins pueden ver todos los usuarios
        if self.request.user.role == 'admin':
            return User.objects.all().order_by('-created_at')
        else:
            # Otros usuarios solo pueden ver su propio perfil
            return User.objects.filter(id=self.request.user.id)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para detalle, actualización y eliminación de usuario"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo admins pueden gestionar otros usuarios
        if self.request.user.role == 'admin':
            return User.objects.all()
        else:
            # Otros usuarios solo pueden gestionar su propio perfil
            return User.objects.filter(id=self.request.user.id)

# ✅ Endpoint para obtener CSRF token
@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    """
    Vista para obtener el token CSRF
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Retorna el token CSRF para usar en formularios
        """
        csrf_token = get_token(request)
        return JsonResponse({
            'csrfToken': csrf_token,
            'detail': 'CSRF token obtenido exitosamente'
        })
