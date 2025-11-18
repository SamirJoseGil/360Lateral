"""
Serializers para solicitudes
"""
from rest_framework import serializers
from .models import Solicitud
import logging

logger = logging.getLogger(__name__)


class SolicitudSerializer(serializers.ModelSerializer):
    """Serializer básico para listar solicitudes"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    lote_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Solicitud
        fields = [
            'id', 'tipo', 'tipo_display', 'titulo', 'estado', 'estado_display',
            'prioridad', 'prioridad_display', 'usuario', 'usuario_email', 'usuario_nombre',
            'lote', 'lote_info', 'created_at', 'updated_at', 'resuelta_at',
            'esta_resuelta', 'esta_pendiente'
        ]
        read_only_fields = ['id', 'usuario', 'created_at', 'updated_at', 'resuelta_at']
    
    def get_lote_info(self, obj):
        """Info del lote si existe"""
        if obj.lote:
            return {
                'id': str(obj.lote.id),
                'nombre': obj.lote.nombre,
                'direccion': obj.lote.direccion
            }
        return None


class SolicitudDetailSerializer(SolicitudSerializer):
    """Serializer detallado con toda la info"""
    revisor_nombre = serializers.CharField(source='revisor.get_full_name', read_only=True, allow_null=True)
    
    class Meta(SolicitudSerializer.Meta):
        fields = SolicitudSerializer.Meta.fields + [
            'descripcion', 'revisor', 'revisor_nombre', 'notas_revision', 'metadatos'
        ]


class SolicitudCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear solicitudes"""
    
    class Meta:
        model = Solicitud
        fields = ['tipo', 'titulo', 'descripcion', 'lote', 'prioridad']
    
    def validate_tipo(self, value):
        """Validar tipo"""
        valid_types = [choice[0] for choice in Solicitud.TIPO_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Tipo inválido. Válidos: {', '.join(valid_types)}"
            )
        return value
    
    def validate_titulo(self, value):
        """Validar título"""
        if len(value) < 5:
            raise serializers.ValidationError("El título debe tener al menos 5 caracteres")
        return value
    
    def validate_descripcion(self, value):
        """Validar descripción"""
        if len(value) < 20:
            raise serializers.ValidationError("La descripción debe tener al menos 20 caracteres")
        return value
    
    def create(self, validated_data):
        """Crear asignando usuario del request"""
        request = self.context.get('request')
        validated_data['usuario'] = request.user
        
        solicitud = Solicitud.objects.create(**validated_data)
        logger.info(f"Solicitud creada: {solicitud.id} por {request.user.email}")
        
        return solicitud
