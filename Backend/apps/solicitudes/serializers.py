"""
Serializers para solicitudes
"""
from rest_framework import serializers
from .models import Solicitud
from apps.users.serializers import UserSimpleSerializer
import logging

logger = logging.getLogger(__name__)


class SolicitudSerializer(serializers.ModelSerializer):
    """
    Serializer para Solicitud con información completa
    ✅ MEJORADO: Incluye notas_revision y revisor_info
    """
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    
    # ✅ CRÍTICO: Información del usuario
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    
    # ✅ CRÍTICO: Información del revisor y notas
    revisor_info = UserSimpleSerializer(source='revisor', read_only=True)
    notas_revision = serializers.CharField(read_only=True)  # ✅ EXPLÍCITO
    
    # ✅ NUEVO: Información del lote
    lote_info = serializers.SerializerMethodField()
    
    # ✅ NUEVO: Estado booleanos útiles
    esta_resuelta = serializers.BooleanField(read_only=True)
    esta_pendiente = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Solicitud
        fields = [
            'id', 'tipo', 'tipo_display', 'titulo', 'descripcion',
            'estado', 'estado_display', 'prioridad', 'prioridad_display',
            'usuario', 'usuario_email', 'usuario_nombre',
            'lote', 'lote_info',
            'revisor', 'revisor_info', 'notas_revision',  # ✅ INCLUIR EXPLÍCITAMENTE
            'created_at', 'updated_at', 'resuelta_at',
            'esta_resuelta', 'esta_pendiente', 'metadatos'
        ]
        read_only_fields = ['id', 'usuario', 'created_at', 'updated_at', 'resuelta_at']
    
    def get_usuario_nombre(self, obj):
        """Nombre completo del usuario"""
        if obj.usuario:
            return obj.usuario.get_full_name()
        return None
    
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
    
    def to_representation(self, instance):
        """✅ NUEVO: Override para logging y verificación"""
        ret = super().to_representation(instance)
        
        # Log solo para debug (primera vez)
        if not hasattr(self.__class__, '_logged_first'):
            logger.info(f"[SolicitudSerializer] Serializing solicitud {instance.id}")
            logger.info(f"  - Has revisor: {instance.revisor is not None}")
            logger.info(f"  - Notas revision from DB: {instance.notas_revision}")
            logger.info(f"  - Serialized notas_revision: {ret.get('notas_revision')}")
            logger.info(f"  - Serialized revisor_info: {ret.get('revisor_info')}")
            self.__class__._logged_first = True
        
        return ret


class SolicitudCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear solicitudes"""
    class Meta:
        model = Solicitud
        fields = [
            'tipo', 'titulo', 'descripcion', 'prioridad', 'lote', 'metadatos'
        ]
    
    def create(self, validated_data):
        """Crear solicitud asignando usuario del contexto"""
        user = self.context['request'].user
        validated_data['usuario'] = user
        
        solicitud = Solicitud.objects.create(**validated_data)
        logger.info(f"Solicitud {solicitud.id} creada: {solicitud.titulo}")
        
        return solicitud


class SolicitudUpdateSerializer(serializers.ModelSerializer):
    """
    ✅ CRÍTICO: Serializer para actualización por admin
    Permite actualizar estado, revisor y notas_revision
    """
    class Meta:
        model = Solicitud
        fields = ['estado', 'revisor', 'notas_revision', 'metadatos']
    
    def update(self, instance, validated_data):
        """✅ Actualizar con logging"""
        old_estado = instance.estado
        old_notas = instance.notas_revision
        
        # Actualizar campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Log cambios
        if old_estado != instance.estado:
            logger.info(f"Solicitud {instance.id} cambió estado: {old_estado} → {instance.estado}")
        
        if old_notas != instance.notas_revision:
            logger.info(f"Solicitud {instance.id} notas actualizadas por {self.context['request'].user.email}")
        
        return instance
