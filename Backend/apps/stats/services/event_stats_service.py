"""
Service for event statistics and metrics.
"""
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from apps.stats.models import Stat
from apps.stats.models import Stat


class EventStatsService:
    """
    Service to provide statistics and metrics about events tracked in the system.
    """
    
    @staticmethod
    def get_events_count(days=30):
        """
        Get the total number of events recorded in the last N days.
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            int: Total event count
        """
        start_date = timezone.now() - timezone.timedelta(days=days)
        return Stat.objects.filter(timestamp__gte=start_date).count()
    
    @staticmethod
    def get_unique_users_count(days=30):
        """
        Get the count of unique users who generated events in the last N days.
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            int: Count of unique users
        """
        start_date = timezone.now() - timezone.timedelta(days=days)
        # Count distinct user_ids that aren't null
        return Stat.objects.filter(
            timestamp__gte=start_date,
            user_id__isnull=False
        ).values('user_id').distinct().count()
    
    @staticmethod
    def get_sessions_count(days=30):
        """
        Get the count of unique sessions in the last N days.
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            int: Count of unique sessions
        """
        start_date = timezone.now() - timezone.timedelta(days=days)
        # Count distinct session_ids that aren't null or empty
        return Stat.objects.filter(
            timestamp__gte=start_date,
            session_id__isnull=False
        ).exclude(session_id='').values('session_id').distinct().count()
    
    @staticmethod
    def get_errors_count(days=30):
        """
        Get the count of errors recorded in the last N days.
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            int: Count of errors
        """
        start_date = timezone.now() - timezone.timedelta(days=days)
        return Stat.objects.filter(
            timestamp__gte=start_date,
            type='error'
        ).count()
    
    @staticmethod
    def get_daily_events(days=30):
        """
        Get daily event counts for the last N days.
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            dict: Dictionary with daily counts and total
        """
        # Obtener la fecha de inicio (hoy - days)
        start_date = timezone.now() - timezone.timedelta(days=days)
        
        # Filtrar eventos por fecha
        daily_stats = Stat.objects.filter(
            timestamp__gte=start_date
        ).annotate(
            date=TruncDate('timestamp')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Preparar los datos para la respuesta
        result = {
            'daily_counts': [
                {
                    'date': item['date'].strftime('%Y-%m-%d'),
                    'count': item['count']
                }
                for item in daily_stats
            ],
            'total_count': sum(item['count'] for item in daily_stats),
            'days_period': days
        }
        
        return result
    
    @staticmethod
    def get_event_type_distribution(days=30):
        """
        Get distribution of events by type for the last N days.
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            list: List of dicts with type, count, and percentage
        """
        start_date = timezone.now() - timezone.timedelta(days=days)
        
        # Get counts by type
        type_stats = Stat.objects.filter(
            timestamp__gte=start_date
        ).values('type').annotate(count=Count('id')).order_by('-count')
        
        # Calculate total for percentages
        total = sum(item['count'] for item in type_stats)
        if total == 0:
            return []
            
        # Format results with percentages
        results = []
        for item in type_stats:
            results.append({
                'type': item['type'],
                'count': item['count'],
                'percentage': round((item['count'] / total) * 100, 1)
            })
            
        return results
    
    @staticmethod
    def get_event_dashboard_data(days=30):
        """
        Obtiene un resumen general de las estadísticas de eventos para el dashboard.
        
        Args:
            days (int): Número de días a considerar. Por defecto es 30.
            
        Returns:
            dict: Diccionario con varias métricas de eventos.
        """
        # Obtener la fecha de inicio (hoy - days)
        start_date = timezone.now() - timezone.timedelta(days=days)
        
        # Filtrar eventos por fecha
        events = Stat.objects.filter(timestamp__gte=start_date)
        
        # Obtener conteo total
        total_count = events.count()
        
        # Obtener distribución por tipo de evento
        # Usamos 'type' en lugar de 'event_type' que no existe en el modelo
        event_types = events.values('type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Obtener eventos por día
        daily_events = events.annotate(
            date=TruncDate('timestamp')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Preparar los datos para la respuesta
        result = {
            'total_events': total_count,
            'event_types': list(event_types),
            'daily_events': [
                {
                    'date': item['date'].strftime('%Y-%m-%d'),
                    'count': item['count']
                }
                for item in daily_events
            ],
            'period_days': days
        }
        
        return result