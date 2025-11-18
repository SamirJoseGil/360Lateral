"""
Serializadores para usuarios
Define la estructura de datos de entrada/salida para la API
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_yasg.utils import swagger_serializer_method
import logging

from .models import User, UserProfile, UserRequest

logger = logging.getLogger(__name__)


class UserSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para incluir información básica de usuario.
    Usado en relaciones anidadas para evitar recursión.
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role']
        read_only_fields = fields
    
    def get_full_name(self, obj):
        """Retorna nombre completo del usuario"""
        return obj.get_full_name()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializador completo para el modelo User.
    Incluye todos los campos y campos calculados.
    """
    full_name = serializers.SerializerMethodField()
    role_fields = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone', 'company', 'role', 'is_verified', 'is_active',
            'created_at', 'updated_at', 'role_fields'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified', 'is_active']
    
    @swagger_serializer_method(serializer_or_field=serializers.CharField)
    def get_full_name(self, instance):
        """Retorna el nombre completo del usuario"""
        return instance.get_full_name()
    
    def get_role_fields(self, instance):
        """
        Retorna campos específicos según el rol del usuario.
        Solo incluye campos relevantes para evitar exponer información innecesaria.
        """
        if instance.role == 'owner':
            return {
                'document_type': instance.document_type,
                'document_number': instance.document_number,
                'address': instance.address,
                'id_verification_file': instance.id_verification_file.url if instance.id_verification_file else None,
                'lots_count': instance.lots_count
            }
        elif instance.role == 'developer':
            return {
                'company_name': instance.company_name,
                'company_nit': instance.company_nit,
                'position': instance.position,
                'experience_years': instance.experience_years,
                'portfolio_url': instance.portfolio_url,
                'focus_area': instance.focus_area,
                'focus_area_display': instance.get_focus_area_display() if instance.focus_area else None
            }
        elif instance.role == 'admin':
            return {
                'department': instance.department,
                'department_display': instance.get_department_display() if instance.department else None,
                'permissions_scope': instance.permissions_scope,
                'permissions_scope_display': instance.get_permissions_scope_display() if instance.permissions_scope else None
            }
        return {}


class UpdateProfileSerializer(serializers.ModelSerializer):
    """
    Serializador para actualizar perfil del usuario según su rol.
    Valida que solo se actualicen campos permitidos para cada rol.
    """
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'company',
            # Campos para owner
            'document_type', 'document_number', 'address', 'id_verification_file',
            # Campos para developer
            'company_name', 'company_nit', 'position', 'experience_years', 
            'portfolio_url', 'focus_area',
            # Campos para admin
            'department', 'permissions_scope'
        ]
    
    def validate(self, attrs):
        """
        Validar campos según el rol del usuario.
        Solo permite actualizar campos relevantes para su rol.
        """
        user = self.context.get('request').user if 'request' in self.context else self.instance
        
        if not user:
            raise serializers.ValidationError("No se puede determinar el usuario")
        
        # Campos permitidos para todos
        allowed_fields = ['first_name', 'last_name', 'phone', 'company']
        
        # Agregar campos específicos según rol
        role_fields = {
            'owner': ['document_type', 'document_number', 'address', 'id_verification_file'],
            'developer': ['company_name', 'company_nit', 'position', 'experience_years', 'portfolio_url', 'focus_area'],
            'admin': ['department', 'permissions_scope']
        }
        
        allowed_fields.extend(role_fields.get(user.role, []))
        
        # Filtrar campos no permitidos
        disallowed = set(attrs.keys()) - set(allowed_fields)
        if disallowed:
            logger.warning(
                f"User {user.email} attempted to update disallowed fields: {disallowed}"
            )
            raise serializers.ValidationError({
                field: f"No puedes actualizar este campo con tu rol ({user.role})"
                for field in disallowed
            })
        
        # Validaciones específicas por rol
        if user.role == 'owner':
            if 'document_type' in attrs and not attrs.get('document_number'):
                raise serializers.ValidationError({
                    'document_number': 'Requerido cuando se especifica tipo de documento'
                })
        
        elif user.role == 'developer':
            if 'experience_years' in attrs:
                years = attrs['experience_years']
                if years is not None and (years < 0 or years > 50):
                    raise serializers.ValidationError({
                        'experience_years': 'Debe estar entre 0 y 50 años'
                    })
        
        # ✅ SOLO validar documentos si el usuario está actualizando perfil y es owner
        if user.role == 'owner' and (attrs.get('document_type') or attrs.get('document_number')):
            if not attrs.get('document_type') or not attrs.get('document_number'):
                raise serializers.ValidationError({
                    'document_type': 'Requerido para propietarios',
                    'document_number': 'Requerido para propietarios'
                })
        
        return attrs
    
    def update(self, instance, validated_data):
        """Actualizar solo los campos validados"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        try:
            instance.full_clean()
            instance.save()
            logger.info(f"Profile updated for user: {instance.email}")
        except DjangoValidationError as e:
            logger.error(f"Validation error updating profile: {e}")
            raise serializers.ValidationError(e.message_dict)
        
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializador para el perfil de usuario.
    Maneja configuraciones y preferencias personales.
    """
    user = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'user', 'avatar', 'bio', 'location', 'website', 'linkedin',
            'email_notifications', 'sms_notifications',
            'language', 'timezone', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate_bio(self, value):
        """Validar longitud de biografía"""
        if value and len(value) > 500:
            raise serializers.ValidationError("La biografía no puede exceder 500 caracteres")
        return value


class UserRequestSerializer(serializers.ModelSerializer):
    """
    Serializer para UserRequest con información básica.
    ✅ MEJORADO: Incluye información de lote
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    user_info = UserSimpleSerializer(source='user', read_only=True)
    
    # ✅ NUEVO: Información del lote
    lote_info = serializers.SerializerMethodField()
    
    class Meta:
        model = UserRequest
        fields = [
            'id', 'user', 'user_info', 'lote', 'lote_info',
            'request_type', 'request_type_display', 
            'title', 'status', 'status_display',
            'priority', 'priority_display',
            'created_at', 'updated_at', 'resolved_at',
            'is_resolved', 'is_pending'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'resolved_at']
    
    def get_lote_info(self, obj):
        """Información básica del lote si existe"""
        if obj.lote:
            return {
                'id': str(obj.lote.id),
                'nombre': obj.lote.nombre,
                'direccion': obj.lote.direccion,
                'status': obj.lote.status
            }
        return None


class UserRequestDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado para UserRequest.
    ✅ MEJORADO: Incluye toda la información
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    user_info = UserSimpleSerializer(source='user', read_only=True)
    reviewer_info = UserSimpleSerializer(source='reviewer', read_only=True)
    lote_info = serializers.SerializerMethodField()
    response_time_display = serializers.SerializerMethodField()
    
    class Meta:
        model = UserRequest
        fields = [
            'id', 'user', 'user_info', 'lote', 'lote_info',
            'request_type', 'request_type_display', 
            'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'reference_id',
            'metadata', 'reviewer', 'reviewer_info', 'review_notes', 
            'created_at', 'updated_at', 'resolved_at',
            'is_resolved', 'is_pending', 'response_time_display'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'resolved_at']
    
    def get_lote_info(self, obj):
        """Información completa del lote si existe"""
        if obj.lote:
            return {
                'id': str(obj.lote.id),
                'nombre': obj.lote.nombre,
                'direccion': obj.lote.direccion,
                'cbml': obj.lote.cbml,
                'area': float(obj.lote.area) if obj.lote.area else None,
                'status': obj.lote.status,
                'status_display': obj.lote.get_status_display()
            }
        return None
    
    def get_response_time_display(self, obj):
        """Tiempo de respuesta en formato legible"""
        response_time = obj.response_time
        if response_time:
            days = response_time.days
            hours = response_time.seconds // 3600
            if days > 0:
                return f"{days} día{'s' if days != 1 else ''}, {hours} hora{'s' if hours != 1 else ''}"
            return f"{hours} hora{'s' if hours != 1 else ''}"
        return None


class UserRequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear nuevas solicitudes de usuario.
    ✅ MEJORADO: Incluye lote y prioridad
    """
    class Meta:
        model = UserRequest
        fields = [
            'request_type', 'title', 'description', 
            'lote', 'priority', 'reference_id', 'metadata'
        ]
    
    def validate_request_type(self, value):
        """✅ MEJORADO: Validar con mensaje claro"""
        valid_types = [choice[0] for choice in UserRequest.REQUEST_TYPE_CHOICES]
        
        # ✅ NUEVO: Mapear valores antiguos a nuevos
        old_to_new_mapping = {
            'support': 'soporte_tecnico',
            'analysis': 'analisis_urbanistico',
            'general': 'consulta_general',
            'validation': 'validacion_documentos',
            'correction': 'correccion_datos',
        }
        
        # Si viene un valor antiguo, mapearlo
        if value in old_to_new_mapping:
            mapped_value = old_to_new_mapping[value]
            logger.warning(
                f"⚠️ Request type '{value}' está deprecated. "
                f"Usando '{mapped_value}' en su lugar."
            )
            return mapped_value
        
        # Validar que sea un tipo válido
        if value not in valid_types:
            raise serializers.ValidationError(
                f"❌ Tipo de solicitud inválido: '{value}'. "
                f"Los tipos válidos son: {', '.join(valid_types)}"
            )
        
        return value
    
    def validate_title(self, value):
        """Validar título de solicitud"""
        if len(value) < 5:
            raise serializers.ValidationError("El título debe tener al menos 5 caracteres")
        return value
    
    def validate_description(self, value):
        """Validar descripción de solicitud"""
        if len(value) < 20:
            raise serializers.ValidationError("La descripción debe tener al menos 20 caracteres")
        return value
    
    def validate_lote(self, value):
        """Validar que el lote exista y pertenezca al usuario"""
        if value:
            request = self.context.get('request')
            if request and request.user:
                # Verificar que el lote pertenezca al usuario (excepto admins)
                if not request.user.is_admin and value.owner != request.user:
                    raise serializers.ValidationError(
                        "No tienes permiso para crear solicitudes sobre este lote"
                    )
        return value
    
    def create(self, validated_data):
        """Crear solicitud asignando el usuario del contexto"""
        user = self.context['request'].user
        validated_data['user'] = user
        
        # ✅ NUEVO: Auto-asignar prioridad según tipo
        if validated_data.get('request_type') == 'analisis_urbanistico':
            validated_data.setdefault('priority', 'high')
        
        request = UserRequest.objects.create(**validated_data)
        logger.info(f"New user request created: {request.id} by {user.email}")
        
        return request


class UserRequestUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar solicitudes existentes.
    Solo permite actualizar campos específicos.
    """
    class Meta:
        model = UserRequest
        fields = ['description', 'metadata']
    
    def update(self, instance, validated_data):
        """Actualizar solicitud con logging"""
        old_description = instance.description
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        if old_description != instance.description:
            logger.info(f"UserRequest {instance.id} updated by {self.context['request'].user.email}")
        
        return instance


class RequestStatusSummarySerializer(serializers.Serializer):
    """
    Serializer para resumen de estados de solicitudes.
    Usado para dashboard y estadísticas.
    """
    total = serializers.IntegerField(read_only=True)
    pending = serializers.IntegerField(read_only=True)
    in_review = serializers.IntegerField(read_only=True, required=False)
    approved = serializers.IntegerField(read_only=True)
    rejected = serializers.IntegerField(read_only=True)
    completed = serializers.IntegerField(read_only=True, required=False)
    by_type = serializers.DictField(
        child=serializers.IntegerField(),
        read_only=True
    )


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer para solicitar recuperación de contraseña.
    Solo requiere el email del usuario.
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Validar que el email existe en el sistema"""
        email = value.lower().strip()
        
        if not User.objects.filter(email=email).exists():
            # ✅ Por seguridad, no revelar si el email existe o no
            # Retornar el mismo mensaje para evitar enumeration attacks
            logger.warning(f"Password reset requested for non-existent email: {email}")
        
        return email


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer para confirmar el reseteo de contraseña con token.
    """
    token = serializers.CharField(required=True, max_length=255)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    
    def validate_token(self, value):
        """Validar que el token existe y es válido"""
        from .models import PasswordResetToken
        
        try:
            token_obj = PasswordResetToken.objects.get(token=value)
            
            if not token_obj.is_valid():
                if token_obj.is_used:
                    raise serializers.ValidationError("Este token ya ha sido utilizado")
                else:
                    raise serializers.ValidationError("Este token ha expirado")
            
            # Guardar el objeto token en el contexto para usarlo después
            self.context['token_obj'] = token_obj
            return value
            
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Token inválido")
    
    def validate_new_password(self, value):
        """Validar la nueva contraseña con los validadores de Django"""
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        
        return value
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas no coinciden'
            })
        
        return attrs


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    ✅ NUEVO: Serializer para registro con validación de duplicados
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'company', 'role'
        ]
    
    def validate_email(self, value):
        """✅ Validar email único (case-insensitive)"""
        email = value.lower().strip()
        
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                f"Ya existe un usuario registrado con el email: {email}"
            )
        
        return email
    
    def validate_phone(self, value):
        """✅ Validar teléfono único si se proporciona"""
        if value:
            phone = value.strip()
            
            # Validar formato básico
            import re
            if not re.match(r'^[+]?[\d\s\-\(\)]{10,}$', phone):
                raise serializers.ValidationError(
                    "Formato de teléfono inválido. Debe tener al menos 10 dígitos."
                )
            
            # Validar duplicados
            if User.objects.filter(phone=phone).exists():
                raise serializers.ValidationError(
                    f"Ya existe un usuario registrado con el teléfono: {phone}"
                )
        
        return value
    
    def validate_username(self, value):
        """Validar username único"""
        username = value.strip()
        
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError(
                f"El nombre de usuario '{username}' ya está en uso"
            )
        
        return username
    
    def validate_password(self, value):
        """Validar fortaleza de contraseña"""
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        
        return value
    
    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Verificar que las contraseñas coincidan
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })
        
        # Eliminar password_confirm antes de crear el usuario
        attrs.pop('password_confirm')
        
        return attrs
    
    def create(self, validated_data):
        """Crear usuario con contraseña hasheada"""
        password = validated_data.pop('password')
        
        # Crear usuario
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        logger.info(f"New user registered: {user.email} (role: {user.role})")
        
        return user