"""
Serializers para criterios de inversión
"""
from rest_framework import serializers
from .models import InvestmentCriteria, CriteriaMatch
import logging

logger = logging.getLogger(__name__)


class InvestmentCriteriaSerializer(serializers.ModelSerializer):
    """Serializer básico para listar criterios"""
    developer_email = serializers.EmailField(source='developer.email', read_only=True)
    developer_name = serializers.CharField(source='developer.get_full_name', read_only=True)
    matching_lotes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = InvestmentCriteria
        fields = [
            'id', 'name', 'description', 'developer', 'developer_email', 'developer_name',
            'area_min', 'area_max', 'budget_min', 'budget_max',
            'zones', 'treatments', 'estratos', 'uso_suelo_preferido',
            'status', 'enable_notifications', 'matching_lotes_count',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'developer', 'created_at', 'updated_at']
    
    def get_matching_lotes_count(self, obj):
        """Obtener conteo de lotes que coinciden"""
        try:
            return obj.get_matching_lotes_count()
        except Exception as e:
            logger.error(f"Error getting matching lotes count: {e}")
            return 0


class InvestmentCriteriaCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear criterios"""
    
    class Meta:
        model = InvestmentCriteria
        fields = [
            'name', 'description', 'area_min', 'area_max',
            'budget_min', 'budget_max', 'zones', 'treatments',
            'estratos', 'uso_suelo_preferido', 'enable_notifications'
        ]
    
    def validate(self, attrs):
        """Validaciones cruzadas"""
        if attrs['area_max'] < attrs['area_min']:
            raise serializers.ValidationError({
                'area_max': 'El área máxima debe ser mayor o igual al área mínima'
            })
        
        if attrs['budget_max'] < attrs['budget_min']:
            raise serializers.ValidationError({
                'budget_max': 'El presupuesto máximo debe ser mayor o igual al presupuesto mínimo'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Crear asignando desarrollador del request"""
        request = self.context.get('request')
        validated_data['developer'] = request.user
        
        criteria = InvestmentCriteria.objects.create(**validated_data)
        logger.info(f"Investment criteria created: {criteria.id} by {request.user.email}")
        
        return criteria


class CriteriaMatchSerializer(serializers.ModelSerializer):
    """Serializer para matches de criterios con lotes"""
    lote_info = serializers.SerializerMethodField()
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    
    class Meta:
        model = CriteriaMatch
        fields = [
            'id', 'criteria', 'criteria_name', 'lote', 'lote_info',
            'match_score', 'notified', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_lote_info(self, obj):
        """Información del lote"""
        lote = obj.lote
        return {
            'id': str(lote.id),
            'nombre': lote.nombre,
            'direccion': lote.direccion,
            'area': float(lote.area) if lote.area else None,
            'barrio': lote.barrio,
            'estrato': lote.estrato,
        }
