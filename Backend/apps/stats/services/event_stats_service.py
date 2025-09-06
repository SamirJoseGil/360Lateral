"""
Service for event statistics and metrics.
"""
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import json
from ..models import Stat


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
        start_date = timezone.now() - timedelta(days=days)
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
        start_date = timezone.now() - timedelta(days=days)
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
        start_date = timezone.now() - timedelta(days=days)
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
        start_date = timezone.now() - timedelta(days=days)
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
            list: List of dicts with date and count
        """
        start_date = timezone.now() - timedelta(days=days)
        
        # Get counts by date
        daily_stats = Stat.objects.filter(
            timestamp__gte=start_date
        ).extra({
            'date': "DATE(timestamp)"
        }).values('date').annotate(count=Count('id')).order_by('date')
        
        # Format results
        results = []
        for stat in daily_stats:
            results.append({
                'date': stat['date'].strftime('%Y-%m-%d'),
                'count': stat['count']
            })
            
        return results
    
    @staticmethod
    def get_event_type_distribution(days=30):
        """
        Get distribution of events by type for the last N days.
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            list: List of dicts with type, count, and percentage
        """
        start_date = timezone.now() - timedelta(days=days)
        
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
        Get all event dashboard data in a single call.
        
        Args:
            days (int): Number of days to look back
            
        Returns:
            dict: Complete event dashboard data
        """
        return {
            'total_events': EventStatsService.get_events_count(days),
            'unique_users': EventStatsService.get_unique_users_count(days),
            'sessions': EventStatsService.get_sessions_count(days),
            'errors': EventStatsService.get_errors_count(days),
            'daily_events': EventStatsService.get_daily_events(days),
            'event_types': EventStatsService.get_event_type_distribution(days)
        }