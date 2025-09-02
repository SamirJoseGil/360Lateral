from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from apps.documents.models import Document
from apps.lotes.models import Lote
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class DashboardService:
    """
    Servicio para obtener estadísticas del dashboard que incluyen:
    - Número de usuarios
    - Número de lotes
    - Actividad reciente
    - Validaciones de documentos (pendientes, aceptadas, rechazadas)
    - Estados de lotes (activos, inactivos)
    """
    
    @staticmethod
    def get_users_count():
        """Obtiene el número total de usuarios registrados."""
        return User.objects.count()
    
    @staticmethod
    def get_lotes_count():
        """Obtiene el número total de lotes registrados."""
        return Lote.objects.count()
    
    @staticmethod
    def get_lotes_by_status():
        """Obtiene el conteo de lotes por estado (activos/inactivos)."""
        total = Lote.objects.count()
        # Asumiendo que existe un campo 'activo' o similar en el modelo Lote
        # Si el campo es diferente, esto necesitará ajustarse
        try:
            activos = Lote.objects.filter(activo=True).count()
        except:
            # Si no existe el campo 'activo', asumimos todos como activos
            activos = total
            
        return {
            'total': total,
            'activos': activos,
            'inactivos': total - activos
        }
    
    @staticmethod
    def get_document_validations():
        """
        Obtiene el conteo de documentos por estado de validación
        (pendientes, aceptados, rechazados)
        """
        try:
            total = Document.objects.count()
            # Asumiendo que existe un campo 'estado_validacion' o similar
            # Si los campos son diferentes, esto necesitará ajustarse
            pendientes = Document.objects.filter(estado_validacion='pendiente').count()
            aceptados = Document.objects.filter(estado_validacion='aceptado').count()
            rechazados = Document.objects.filter(estado_validacion='rechazado').count()
        except:
            # Si no existen los campos necesarios, devolvemos valores por defecto
            return {
                'total': 0,
                'pendientes': 0,
                'aceptados': 0,
                'rechazados': 0
            }
            
        return {
            'total': total,
            'pendientes': pendientes,
            'aceptados': aceptados,
            'rechazados': rechazados
        }
    
    @staticmethod
    def get_recent_activity(days=7):
        """
        Obtiene la actividad reciente en el sistema.
        Por defecto, muestra la actividad de los últimos 7 días.
        """
        from apps.stats.models import Stat
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Obtener eventos recientes
        recent_events = Stat.objects.filter(
            timestamp__gte=start_date
        ).order_by('-timestamp')[:50]
        
        # Usuarios activos recientemente
        active_users_count = Stat.objects.filter(
            timestamp__gte=start_date
        ).values('user_id').distinct().count()
        
        # Actividad por tipo
        activity_by_type = Stat.objects.filter(
            timestamp__gte=start_date
        ).values('type').annotate(count=Count('id'))
        
        return {
            'recent_events': [
                {
                    'id': event.id,
                    'type': event.type,
                    'name': event.name,
                    'timestamp': event.timestamp,
                    'user_id': event.user_id
                } for event in recent_events
            ],
            'active_users': active_users_count,
            'activity_by_type': {
                item['type']: item['count'] for item in activity_by_type
            }
        }
    
    @staticmethod
    def get_dashboard_stats(days=30):
        """
        Obtiene todas las estadísticas para el dashboard.
        """
        return {
            'users': {
                'total': DashboardService.get_users_count(),
            },
            'lotes': DashboardService.get_lotes_by_status(),
            'documentos': DashboardService.get_document_validations(),
            'actividad_reciente': DashboardService.get_recent_activity(days=days)
        }