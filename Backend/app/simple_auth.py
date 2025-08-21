from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
import json

User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def simple_login(request):
    """Login simple sin DRF para debugging"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({
                'error': 'Email y password requeridos'
            }, status=400)
        
        # Intentar autenticación
        user = authenticate(username=email, password=password)
        
        if user and user.is_active:
            # Generar tokens
            refresh = RefreshToken.for_user(user)
            
            return JsonResponse({
                'message': 'Login exitoso',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        else:
            return JsonResponse({
                'error': 'Credenciales inválidas'
            }, status=401)
            
    except Exception as e:
        return JsonResponse({
            'error': f'Error del servidor: {str(e)}'
        }, status=500)

@csrf_exempt 
@require_http_methods(["POST"])
def simple_register(request):
    """Registro simple sin DRF para debugging"""
    try:
        data = json.loads(request.body)
        
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        if not all([email, username, password]):
            return JsonResponse({
                'error': 'Email, username y password requeridos'
            }, status=400)
        
        # Verificar si el usuario ya existe
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'error': 'Email already registered'
            }, status=400)
            
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'error': 'Username already exists'
            }, status=400)
        
        # Crear usuario
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Generar tokens
        refresh = RefreshToken.for_user(user)
        
        return JsonResponse({
            'message': 'Usuario creado exitosamente',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=201)
        
    except Exception as e:
        return JsonResponse({
            'error': f'Error del servidor: {str(e)}'
        }, status=500)