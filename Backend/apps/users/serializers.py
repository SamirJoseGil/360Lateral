"""
Serializadores para usuarios
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo User
    """
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'company', 'is_verified', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializador para el perfil de usuario
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'avatar', 'bio', 'website', 'location',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username',
            'email', 
            'first_name',
            'last_name',
            'password',
            'password_confirm'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuarios"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2', 'first_name', 'last_name', 'role', 'phone', 'company']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        
        # Generar username único basado en el email
        email = validated_data['email']
        username = email.split('@')[0]
        counter = 1
        original_username = username
        
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1
        
        validated_data['username'] = username
        
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                # ✅ Autenticar usando el email como identificador
                user = User.objects.get(email=email)
                user = authenticate(username=user.email, password=password)
                
                if not user:
                    raise serializers.ValidationError('Credenciales inválidas')
                
                if not user.is_active:
                    raise serializers.ValidationError('Cuenta desactivada')
                
                attrs['user'] = user
                return attrs
                
            except User.DoesNotExist:
                raise serializers.ValidationError('Usuario no encontrado')
        
        raise serializers.ValidationError('Email y contraseña requeridos')

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError("Las contraseñas nuevas no coinciden")
        return attrs
