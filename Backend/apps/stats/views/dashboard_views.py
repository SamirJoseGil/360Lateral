from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from ..services.dashboard_service import DashboardService


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
        
        # Add summary data for the dashboard cards
        summary = {
            "total_usuarios": DashboardService.get_users_count(),
            "proyectos_activos": DashboardService.get_lotes_by_status()["activos"],
            "pendientes_validacion": DashboardService.get_document_validations()["pendientes"],
            "eventos_recientes": DashboardService.get_recent_activity_count(days=1)
        }
        stats["summary"] = summary
        
        return Response(stats, status=status.HTTP_200_OK)


class DashboardSummaryView(APIView):
    """
    Vista para obtener el resumen de métricas para las tarjetas del dashboard.
    """
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 2))  # Caché de 2 minutos
    def get(self, request):
        summary = {
            "total_usuarios": {
                "count": DashboardService.get_users_count(),
                "label": "Total Usuarios",
                "link": "/users"
            },
            "proyectos_activos": {
                "count": DashboardService.get_lotes_by_status()["activos"],
                "label": "Proyectos Activos",
                "link": "/projects"
            },
            "pendientes_validacion": {
                "count": DashboardService.get_document_validations()["pendientes"],
                "label": "Pendientes de Validación",
                "link": "/validations"
            },
            "eventos_recientes": {
                "count": DashboardService.get_recent_activity_count(days=1),
                "label": "Eventos Recientes",
                "link": "/activity"
            }
        }
        return Response(summary, status=status.HTTP_200_OK)

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


class EventsTableView(APIView):
    """
    Vista para obtener una tabla de eventos recientes para el dashboard.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        events = DashboardService.get_recent_events_table(limit=limit)
        return Response(events, status=status.HTTP_200_OK)


class EventsDistributionView(APIView):
    """
    Vista para obtener la distribución de eventos por tipo para el dashboard.
    """
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 10))  # Cache for 10 minutes
    def get(self, request):
        distribution = DashboardService.get_events_distribution()
        return Response(distribution, status=status.HTTP_200_OK)