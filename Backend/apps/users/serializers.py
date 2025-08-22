"""
Serializadores para usuarios
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from drf_yasg.utils import swagger_serializer_method
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """Serializador para el modelo User"""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone', 'company', 'role', 'is_verified', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified']
        
    @swagger_serializer_method(serializer_or_field=serializers.CharField)
    def get_full_name(self, instance):
        """Retorna el nombre completo del usuario"""
        return instance.get_full_name()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializador para registro de usuarios"""
    password = serializers.CharField(
        write_only=True, 
        validators=[validate_password],
        help_text="Contraseña (mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números)"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        help_text="Confirmación de contraseña (debe coincidir con la contraseña)"
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'company', 'role'
        ]
        extra_kwargs = {
            'email': {'help_text': 'Dirección de email única'},
            'username': {'help_text': 'Nombre de usuario único'},
            'first_name': {'help_text': 'Nombre del usuario'},
            'last_name': {'help_text': 'Apellido del usuario'},
            'phone': {'help_text': 'Número de teléfono (opcional)'},
            'company': {'help_text': 'Empresa (opcional)'},
            'role': {'help_text': 'Rol del usuario: admin, owner, developer'},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializador para login"""
    email = serializers.EmailField(help_text="Email del usuario registrado")
    password = serializers.CharField(
        write_only=True,
        help_text="Contraseña del usuario"
    )
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('Credenciales inválidas')
            
            if not user.is_active:
                raise serializers.ValidationError('Usuario inactivo')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Email y contraseña requeridos')


class ChangePasswordSerializer(serializers.Serializer):
    """Serializador para cambio de contraseña"""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Contraseña actual incorrecta')
        return value
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class TokenSerializer(serializers.Serializer):
    """Serializador para tokens JWT"""
    
    @staticmethod
    def get_token_for_user(user):
        """Generar tokens para un usuario"""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.get_full_name(),
                'role': user.role
            }
        }


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializador para el perfil de usuario"""
    
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'location', 'website', 'linkedin',
            'email_notifications', 'sms_notifications',
            'language', 'timezone'
        ]