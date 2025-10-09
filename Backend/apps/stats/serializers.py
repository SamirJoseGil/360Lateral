"""
Serializadores para la aplicación de estadísticas.
"""
from rest_framework import serializers
from .models import Stat, DailySummary

class StatSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Stat.
    """
    class Meta:
        model = Stat
        fields = ['id', 'event_type', 'event_name', 'event_value', 'timestamp', 'user_id', 'session_id', 'ip_address']
        read_only_fields = ['id', 'timestamp']

class StatCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para crear un nuevo evento estadístico.
    """
    class Meta:
        model = Stat
        fields = ['event_type', 'event_name', 'event_value', 'user_id', 'session_id', 'ip_address']
        
    def validate_event_type(self, value):
        """Validar que el tipo sea uno de los permitidos"""
        valid_types = [choice[0] for choice in Stat.STAT_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Tipo inválido. Opciones válidas: {', '.join(valid_types)}")
        return value

class DailySummarySerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo DailySummary.
    """
    class Meta:
        model = DailySummary
        fields = ['id', 'date', 'metrics', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StatsOverTimeSerializer(serializers.Serializer):
    """
    Serializador para estadísticas a lo largo del tiempo.
    """
    period = serializers.DateTimeField()
    count = serializers.IntegerField()

class UserActivitySerializer(serializers.Serializer):
    """
    Serializador para la actividad de un usuario.
    """
    total_events = serializers.IntegerField()
    events_by_type = serializers.DictField()
    recent_events = serializers.ListField()
    first_activity = StatSerializer()
    last_activity = StatSerializer()
    
class StatsSummarySerializer(serializers.Serializer):
    """
    Serializador para resúmenes de estadísticas.
    """
    period = serializers.CharField()
    data = serializers.DictField()