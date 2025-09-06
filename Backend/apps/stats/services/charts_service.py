"""
Service for generating chart data for the dashboard.
"""
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
import calendar
from apps.documents.models import Document
from apps.lotes.models import Lote
from apps.stats.models import Stat

class DashboardChartsService:
    """
    Service for generating data for dashboard charts and visualizations.
    """
    
    @staticmethod
    def get_lotes_summary():
        """
        Get summary counts for lotes (total, active, inactive).
        
        Returns:
            dict: Summary statistics for lotes
        """
        total = Lote.objects.count()
        
        # Get active lotes (assuming is_active is the field)
        try:
            active = Lote.objects.filter(is_active=True).count()
            inactive = total - active
        except:
            # Fallback if field doesn't exist
            active = total
            inactive = 0
            
        return {
            'total': total,
            'activos': active,
            'inactivos': inactive
        }
    
    @staticmethod
    def get_documents_count():
        """
        Get total number of documents.
        
        Returns:
            int: Total number of documents
        """
        return Document.objects.count()
    
    @staticmethod
    def get_documents_by_month(year=None):
        """
        Get count of documents processed per month for the given year.
        
        Args:
            year (int, optional): Year to get data for. Defaults to current year.
            
        Returns:
            dict: Monthly document counts
        """
        if not year:
            year = timezone.now().year
            
        # Get documents created in the specified year
        docs = Document.objects.filter(
            created_at__year=year
        ).extra(
            select={'month': "EXTRACT(MONTH FROM created_at)"}
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        # Initialize result with all months
        result = {m: 0 for m in range(1, 13)}
        
        # Fill in actual data
        for entry in docs:
            month = int(entry['month'])
            result[month] = entry['count']
        
        # Format result for the chart
        formatted_result = []
        month_names = {
            1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr',
            5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Ago',
            9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic'
        }
        
        for month, count in result.items():
            formatted_result.append({
                'mes': month_names[month],
                'count': count,
                'valor': count  # Duplicate for flexibility in frontend
            })
            
        return formatted_result
    
    @staticmethod
    def get_event_type_distribution(days=30):
        """
        Get distribution of events by type for the last N days.
        
        Args:
            days (int, optional): Number of days to look back. Defaults to 30.
            
        Returns:
            list: Event type distribution with counts and percentages
        """
        # Get events from the specified period
        start_date = timezone.now() - timedelta(days=days)
        events = Stat.objects.filter(
            timestamp__gte=start_date
        ).values('type').annotate(count=Count('id')).order_by('-count')
        
        # Calculate total for percentages
        total = sum(item['count'] for item in events)
        if total == 0:
            return []
            
        # Format result with percentages
        result = []
        for item in events:
            event_type = item['type']
            count = item['count']
            percentage = round((count / total) * 100, 1)
            
            # Map event types to Spanish
            type_mapping = {
                'view': 'Vistas',
                'search': 'Búsquedas',
                'action': 'Acciones',
                'error': 'Errores',
                'api': 'API',
                'other': 'Otros'
            }
            
            display_name = type_mapping.get(event_type, event_type)
            
            result.append({
                'type': display_name,
                'count': count,
                'percentage': percentage
            })
            
        return result
    
    @staticmethod
    def get_dashboard_charts_data():
        """
        Get all chart data needed for the dashboard.
        
        Returns:
            dict: Complete dataset for dashboard charts
        """
        return {
            'lotes_summary': DashboardChartsService.get_lotes_summary(),
            'documents_count': DashboardChartsService.get_documents_count(),
            'documents_by_month': DashboardChartsService.get_documents_by_month(),
            'event_distribution': DashboardChartsService.get_event_type_distribution()
        }