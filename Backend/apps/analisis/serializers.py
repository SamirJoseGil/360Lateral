"""
Serializadores para análisis urbanístico
"""
from rest_framework import serializers
from .models import AnalisisUrbanistico
from apps.users.serializers import UserSimpleSerializer
import logging

logger = logging.getLogger(__name__)


class AnalisisUrbanisticoSerializer(serializers.ModelSerializer):
    """Serializer completo para análisis"""
    tipo_analisis_display = serializers.CharField(source='get_tipo_analisis_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    solicitante_info = UserSimpleSerializer(source='solicitante', read_only=True)
    analista_info = UserSimpleSerializer(source='analista', read_only=True)
    
    lote_info = serializers.SerializerMethodField()
    tiempo_procesamiento_display = serializers.SerializerMethodField()
    
    # Propiedades booleanas
    esta_pendiente = serializers.BooleanField(read_only=True)
    esta_en_proceso = serializers.BooleanField(read_only=True)
    esta_completado = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = AnalisisUrbanistico
        fields = [
            'id', 'lote', 'lote_info', 
            'solicitante', 'solicitante_info',
            'analista', 'analista_info',
            'tipo_analisis', 'tipo_analisis_display',
            'incluir_vis', 'comentarios_solicitante',
            'estado', 'estado_display',
            'resultados', 'observaciones_analista', 'archivo_informe',
            'created_at', 'updated_at',
            'fecha_inicio_proceso', 'fecha_completado',
            'tiempo_procesamiento_display',
            'esta_pendiente', 'esta_en_proceso', 'esta_completado',
            'metadatos'
        ]
        read_only_fields = [
            'id', 'solicitante', 'created_at', 'updated_at',
            'fecha_inicio_proceso', 'fecha_completado'
        ]
    
    def get_lote_info(self, obj):
        """Información del lote"""
        if obj.lote:
            return {
                'id': str(obj.lote.id),
                'nombre': obj.lote.nombre,
                'direccion': obj.lote.direccion,
                'area': float(obj.lote.area) if obj.lote.area else None,
                'cbml': obj.lote.cbml,
            }
        return None
    
    def get_tiempo_procesamiento_display(self, obj):
        """Tiempo de procesamiento en formato legible"""
        tiempo = obj.tiempo_procesamiento
        if tiempo:
            dias = tiempo.days
            horas = tiempo.seconds // 3600
            return f"{dias} días, {horas} horas"
        return None


class AnalisisCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear análisis"""
    class Meta:
        model = AnalisisUrbanistico
        fields = [
            'lote', 'tipo_analisis', 'incluir_vis', 'comentarios_solicitante'
        ]
    
    def validate_lote(self, value):
        """Validar que el lote pertenezca al usuario"""
        request = self.context.get('request')
        if request and request.user:
            if value.owner != request.user:
                raise serializers.ValidationError(
                    "Solo puedes solicitar análisis para tus propios lotes"
                )
        return value
    
    def create(self, validated_data):
        """Crear análisis asignando el solicitante"""
        request = self.context.get('request')
        validated_data['solicitante'] = request.user
        
        analisis = AnalisisUrbanistico.objects.create(**validated_data)
        logger.info(
            f"✅ Análisis creado: {analisis.id} - "
            f"Tipo: {analisis.tipo_analisis} - "
            f"Lote: {analisis.lote.nombre}"
        )
        
        return analisis


class AnalisisUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar análisis (admin)"""
    class Meta:
        model = AnalisisUrbanistico
        fields = [
            'estado', 'analista', 'resultados',
            'observaciones_analista', 'archivo_informe'
        ]


class IniciarProcesoSerializer(serializers.Serializer):
    """Serializer para iniciar proceso"""
    analista_id = serializers.UUIDField(required=False)


class CompletarAnalisisSerializer(serializers.Serializer):
    """Serializer para completar análisis"""
    resultados = serializers.JSONField(required=True)
    observaciones = serializers.CharField(required=False, allow_blank=True)


class RechazarAnalisisSerializer(serializers.Serializer):
    """Serializer para rechazar análisis"""
    motivo = serializers.CharField(required=True, min_length=10)
