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
    Usado en listas y vistas simplificadas.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    user_info = UserSimpleSerializer(source='user', read_only=True)
    
    class Meta:
        model = UserRequest
        fields = [
            'id', 'user', 'user_info', 'request_type', 'request_type_display', 
            'title', 'status', 'status_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserRequestDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado para UserRequest.
    Incluye toda la información incluyendo reviewer y notas.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    user_info = UserSimpleSerializer(source='user', read_only=True)
    reviewer_info = UserSimpleSerializer(source='reviewer', read_only=True)
    
    class Meta:
        model = UserRequest
        fields = [
            'id', 'user', 'user_info', 'request_type', 'request_type_display', 
            'title', 'description', 'status', 'status_display', 'reference_id',
            'metadata', 'reviewer', 'reviewer_info', 'review_notes', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class UserRequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear nuevas solicitudes de usuario.
    El usuario se asigna automáticamente del contexto.
    """
    class Meta:
        model = UserRequest
        fields = ['request_type', 'title', 'description', 'reference_id', 'metadata']
    
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
    
    def create(self, validated_data):
        """Crear solicitud asignando el usuario del contexto"""
        user = self.context['request'].user
        validated_data['user'] = user
        
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