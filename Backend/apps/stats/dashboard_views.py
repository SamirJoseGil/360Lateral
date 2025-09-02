from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .services.dashboard_service import DashboardService


class DashboardStatsView(APIView):
    """
    Vista para obtener estadísticas generales del dashboard.
    """
    permission_classes = [IsAuthenticated]
    
    # Caché de 5 minutos para mejorar rendimiento
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        # Solo los administradores pueden ver todas las estadísticas
        days = int(request.query_params.get('days', 30))
        stats = DashboardService.get_dashboard_stats(days=days)
        return Response(stats, status=status.HTTP_200_OK)


class UsersStatsView(APIView):
    """
    Vista para obtener estadísticas específicas de usuarios.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @method_decorator(cache_page(60 * 10))  # Caché de 10 minutos
    def get(self, request):
        stats = {
            'total': DashboardService.get_users_count(),
        }
        return Response(stats, status=status.HTTP_200_OK)


class LotesStatsView(APIView):
    """
    Vista para obtener estadísticas específicas de lotes.
    """
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # Caché de 5 minutos
    def get(self, request):
        stats = DashboardService.get_lotes_by_status()
        return Response(stats, status=status.HTTP_200_OK)


class DocumentosStatsView(APIView):
    """
    Vista para obtener estadísticas específicas de documentos.
    """
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # Caché de 5 minutos
    def get(self, request):
        stats = DashboardService.get_document_validations()
        return Response(stats, status=status.HTTP_200_OK)


class RecentActivityView(APIView):
    """
    Vista para obtener la actividad reciente en el sistema.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 7))
        activity = DashboardService.get_recent_activity(days=days)
        return Response(activity, status=status.HTTP_200_OK)