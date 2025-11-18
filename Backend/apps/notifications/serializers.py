"""
Serializers para notificaciones
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'title', 'message',
            'priority', 'priority_display', 'is_read', 'read_at',
            'action_url', 'data', 'created_at', 'time_ago',
            'lote_id', 'document_id', 'solicitud_id'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
    
    def get_time_ago(self, obj):
        """Tiempo transcurrido desde la creación"""
        from django.utils import timezone
        delta = timezone.now() - obj.created_at
        
        if delta.seconds < 60:
            return 'Hace un momento'
        elif delta.seconds < 3600:
            minutes = delta.seconds // 60
            return f'Hace {minutes} minuto{"s" if minutes != 1 else ""}'
        elif delta.days == 0:
            hours = delta.seconds // 3600
            return f'Hace {hours} hora{"s" if hours != 1 else ""}'
        elif delta.days == 1:
            return 'Ayer'
        elif delta.days < 7:
            return f'Hace {delta.days} días'
        else:
            return obj.created_at.strftime('%d/%m/%Y')
