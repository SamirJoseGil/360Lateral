"""
Views for event statistics and metrics.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from ..services.event_stats_service import EventStatsService


class EventDashboardView(APIView):
    """
    View for getting complete event dashboard data.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 2))  # 2 minutes cache
    def get(self, request):
        """
        Get complete event dashboard data.
        """
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except ValueError:
            return Response(
                {"error": "Days parameter must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        data = EventStatsService.get_event_dashboard_data(days=days)
        return Response(data)


class EventCountsView(APIView):
    """
    View for getting event count metrics.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 2))  # 2 minutes cache
    def get(self, request):
        """
        Get event count metrics.
        """
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except ValueError:
            return Response(
                {"error": "Days parameter must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        data = {
            'total_events': EventStatsService.get_events_count(days=days),
            'unique_users': EventStatsService.get_unique_users_count(days=days),
            'sessions': EventStatsService.get_sessions_count(days=days),
            'errors': EventStatsService.get_errors_count(days=days)
        }
        return Response(data)


class DailyEventsView(APIView):
    """
    View for getting daily event counts.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # 5 minutes cache
    def get(self, request):
        """
        Get daily event counts.
        """
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except ValueError:
            return Response(
                {"error": "Days parameter must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        data = EventStatsService.get_daily_events(days=days)
        return Response(data)


class EventTypeDistributionView(APIView):
    """
    View for getting event type distribution.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # 5 minutes cache
    def get(self, request):
        """
        Get event type distribution.
        """
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except ValueError:
            return Response(
                {"error": "Days parameter must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        data = EventStatsService.get_event_type_distribution(days=days)
        return Response(data)