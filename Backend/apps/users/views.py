"""
Vistas para la gestión de usuarios
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import get_user_model, logout, authenticate, login
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer

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

class LoginView(APIView):
    """Vista para login de usuarios"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Autenticar usuario"""
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email y contraseña son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                login(request, user)
                return Response({
                    'message': 'Login exitoso',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    }
                })
            else:
                return Response(
                    {'error': 'Credenciales inválidas'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

class LogoutView(APIView):
    """Vista para logout de usuarios"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Cerrar sesión"""
        logout(request)
        return Response({'message': 'Logout exitoso'})

class RegisterView(APIView):
    """Vista para registro de usuarios"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Registrar nuevo usuario"""
        data = request.data
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        
        # Validar campos requeridos
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {'error': f'El campo {field} es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Verificar si el usuario ya existe
        if User.objects.filter(email=data['email']).exists():
            return Response(
                {'error': 'Ya existe un usuario con este email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(username=data['username']).exists():
            return Response(
                {'error': 'Ya existe un usuario con este nombre de usuario'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear usuario
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        
        return Response({
            'message': 'Usuario creado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)
    
    def put(self, request):
        """Actualizar perfil del usuario actual"""
        user = request.user
        data = request.data
        
        # Campos que se pueden actualizar
        updatable_fields = ['first_name', 'last_name', 'phone']
        
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
        user.save()
        
        return Response({
            'message': 'Perfil actualizado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'phone': user.phone,
                'full_name': user.full_name,
            }
        })
