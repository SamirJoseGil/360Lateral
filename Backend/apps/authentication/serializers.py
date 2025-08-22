"""
Serializadores para autenticación
"""
from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


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
    """Serializador para inicio de sesión"""
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


class TokenSerializer(serializers.Serializer):
    """Serializador para tokens JWT"""
    refresh = serializers.CharField(read_only=True)
    access = serializers.CharField(read_only=True)
    user = serializers.DictField(read_only=True)
    
    @staticmethod
    def get_token_for_user(user):
        """Generar tokens para un usuario"""
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


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializador para solicitar restablecimiento de contraseña"""
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            # No revelamos si el email existe o no (seguridad)
            return value
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializador para confirmar restablecimiento de contraseña"""
    token = serializers.CharField()
    password = serializers.CharField(validators=[validate_password])
    password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
