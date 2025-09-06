"""
Views for dashboard charts and visualizations.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from .services.charts_service import DashboardChartsService


class DashboardChartsView(APIView):
    """
    View for getting all chart data for the dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # 5 minutes cache
    def get(self, request):
        """
        Get all chart data for the dashboard.
        """
        data = DashboardChartsService.get_dashboard_charts_data()
        return Response(data)


class LotesSummaryView(APIView):
    """
    View for getting summary statistics about lotes.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # 5 minutes cache
    def get(self, request):
        """
        Get summary counts for lotes.
        """
        data = DashboardChartsService.get_lotes_summary()
        return Response(data)


class DocumentsCountView(APIView):
    """
    View for getting the total count of documents.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # 5 minutes cache
    def get(self, request):
        """
        Get the total count of documents.
        """
        count = DashboardChartsService.get_documents_count()
        return Response({"count": count})


class DocumentsByMonthView(APIView):
    """
    View for getting monthly document counts.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # 5 minutes cache
    def get(self, request):
        """
        Get document counts by month for a specific year.
        """
        year = request.query_params.get('year')
        if year:
            try:
                year = int(year)
            except ValueError:
                return Response(
                    {"error": "Year must be a valid integer"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            year = None
            
        data = DashboardChartsService.get_documents_by_month(year=year)
        return Response(data)


class EventDistributionView(APIView):
    """
    View for getting distribution of events by type.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # 5 minutes cache
    def get(self, request):
        """
        Get distribution of events by type for a specified period.
        """
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except ValueError:
            return Response(
                {"error": "Days must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        data = DashboardChartsService.get_event_type_distribution(days=days)
        return Response(data)