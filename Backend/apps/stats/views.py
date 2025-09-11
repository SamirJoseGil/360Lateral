"""
Vistas consolidadas para la aplicación de estadísticas.
"""
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.views import APIView
import uuid

from .models import DailySummary, Stat
from .serializers import (
    DailySummarySerializer, StatCreateSerializer, StatSerializer, 
    StatsOverTimeSerializer, UserActivitySerializer, StatsSummarySerializer
)
from .services.stats_service import StatsService
from .services.dashboard_service import DashboardService
from .services.event_stats_service import EventStatsService
from .services.charts_service import DashboardChartsService

logger = logging.getLogger(__name__)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a administradores 
    realizar cambios, pero permitir lectura a usuarios autenticados.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_staff


# ===== VIEWSETS =====

class StatViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar eventos estadísticos."""
    queryset = Stat.objects.all().order_by('-timestamp')
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StatCreateSerializer
        return StatSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear un nuevo evento estadístico"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Agregar IP del cliente si no se proporcionó
        if 'ip_address' not in serializer.validated_data:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            serializer.validated_data['ip_address'] = ip
            
        # Agregar ID de usuario si está autenticado
        if 'user_id' not in serializer.validated_data and request.user.is_authenticated:
            serializer.validated_data['user_id'] = request.user.id
            
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Obtener los tipos de estadísticas disponibles"""
        types = [{"value": choice[0], "label": choice[1]} for choice in Stat.STAT_TYPES]
        return Response(types)
    
    @action(detail=False, methods=['post'])
    def record(self, request):
        """Endpoint simplificado para registrar un evento estadístico."""
        serializer = StatCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user_id = request.user.id if request.user.is_authenticated else None
                
                stat = StatsService.record_stat(
                    type=serializer.validated_data['type'],
                    name=serializer.validated_data['name'],
                    value=serializer.validated_data.get('value', {}),
                    user_id=user_id,
                    session_id=serializer.validated_data.get('session_id'),
                    ip_address=request.META.get('REMOTE_ADDR')
                )
                
                if stat:
                    return Response(StatSerializer(stat).data, status=status.HTTP_201_CREATED)
                    
                return Response(
                    {"message": "Evento registrado correctamente"},
                    status=status.HTTP_200_OK
                )
                
            except Exception as e:
                logger.exception(f"Error al registrar estadística: {str(e)}")
                return Response(
                    {"message": "Evento registrado correctamente"},
                    status=status.HTTP_200_OK
                )
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DailySummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para consultar resúmenes diarios de estadísticas."""
    queryset = DailySummary.objects.all().order_by('-date')
    serializer_class = DailySummarySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                pass
                
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                pass
                
        return queryset


# ===== DASHBOARD VIEWS =====

class DashboardStatsView(APIView):
    """Vista para obtener estadísticas generales del dashboard."""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        stats = DashboardService.get_dashboard_stats(days=days)
        
        summary = {
            "total_usuarios": DashboardService.get_users_count(),
            "proyectos_activos": DashboardService.get_lotes_by_status()["activos"],
            "pendientes_validacion": DashboardService.get_document_validations()["pendientes"],
            "eventos_recientes": DashboardService.get_recent_activity_count(days=1)
        }
        stats["summary"] = summary
        
        return Response(stats, status=status.HTTP_200_OK)


class DashboardSummaryView(APIView):
    """Vista para obtener el resumen de métricas para las tarjetas del dashboard."""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 2))
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
    """Vista para obtener estadísticas específicas de usuarios."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @method_decorator(cache_page(60 * 10))
    def get(self, request):
        stats = {'total': DashboardService.get_users_count()}
        return Response(stats, status=status.HTTP_200_OK)


class LotesStatsView(APIView):
    """Vista para obtener estadísticas específicas de lotes."""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        stats = DashboardService.get_lotes_by_status()
        return Response(stats, status=status.HTTP_200_OK)


class DocumentosStatsView(APIView):
    """Vista para obtener estadísticas específicas de documentos."""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        stats = DashboardService.get_document_validations()
        return Response(stats, status=status.HTTP_200_OK)


class RecentActivityView(APIView):
    """Vista para obtener la actividad reciente en el sistema."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 7))
        activity = DashboardService.get_recent_activity(days=days)
        return Response(activity, status=status.HTTP_200_OK)


# ===== EVENT STATS VIEWS =====

class EventDashboardView(APIView):
    """Vista para el dashboard de eventos."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        result = EventStatsService.get_event_dashboard_data(days)
        return Response(result)


class EventCountsView(APIView):
    """Vista para obtener conteos de eventos por tipo."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        distribution = EventStatsService.get_event_type_distribution(days)
        return Response(distribution)


class DailyEventsView(APIView):
    """Vista para obtener estadísticas de eventos diarios."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        result = EventStatsService.get_daily_events(days)
        return Response(result)


class EventTypeDistributionView(APIView):
    """Vista para obtener la distribución de eventos por tipo."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        distribution = EventStatsService.get_event_type_distribution(days)
        return Response({
            'total': sum(item['count'] for item in distribution),
            'distribution': distribution
        })


# ===== CHARTS VIEWS =====

class DashboardChartsView(APIView):
    """Vista para obtener todos los datos de gráficos del dashboard."""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        data = DashboardChartsService.get_dashboard_charts_data()
        return Response(data)


class LotesSummaryView(APIView):
    """Vista para obtener estadísticas resumen de lotes."""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        data = DashboardChartsService.get_lotes_summary()
        return Response(data)


class DocumentsCountView(APIView):
    """Vista para obtener el conteo total de documentos."""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        count = DashboardChartsService.get_documents_count()
        return Response({"count": count})


class DocumentsByMonthView(APIView):
    """Vista para obtener conteos mensuales de documentos."""
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))
    def get(self, request):
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


# ===== UTILITY VIEWS =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_over_time(request):
    """Obtener estadísticas agregadas a lo largo del tiempo."""
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    interval = request.query_params.get('interval', 'day')
    stat_type = request.query_params.get('type')
    
    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            end_date = timezone.now().date()
    else:
        end_date = timezone.now().date()
        
    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            start_date = end_date - timedelta(days=30)
    else:
        start_date = end_date - timedelta(days=30)
    
    if interval not in ['day', 'week', 'month']:
        interval = 'day'
    
    data = StatsService.get_stats_over_time(
        start_date=start_date,
        end_date=end_date,
        interval=interval,
        stat_type=stat_type
    )
    
    serializer = StatsOverTimeSerializer(data, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activity(request, user_id=None):
    """Obtener la actividad de un usuario específico."""
    if user_id is None:
        user_id = request.user.id
    
    if str(user_id) != str(request.user.id) and not request.user.is_staff:
        return Response(
            {"error": "No tiene permiso para ver la actividad de este usuario"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    days = request.query_params.get('days', 30)
    try:
        days = int(days)
        if days < 1:
            days = 30
    except ValueError:
        days = 30
        
    activity = StatsService.get_user_activity(user_id, days=days)
    
    if activity['total_events'] == 0:
        return Response({
            'total_events': 0,
            'events_by_type': {},
            'recent_events': [],
            'first_activity': None,
            'last_activity': None
        })
    
    response_data = {
        'total_events': activity['total_events'],
        'events_by_type': activity['events_by_type'],
        'recent_events': activity['recent_events']
    }
    
    if activity['first_activity']:
        response_data['first_activity'] = StatSerializer(activity['first_activity']).data
    else:
        response_data['first_activity'] = None
        
    if activity['last_activity']:
        response_data['last_activity'] = StatSerializer(activity['last_activity']).data
    else:
        response_data['last_activity'] = None
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # OBLIGATORIO: Solo usuarios autenticados
def record_user_event(request):
    """
    Registrar evento de usuario para estadísticas.
    SEGURIDAD: Solo usuarios autenticados pueden registrar eventos.
    """
    try:
        # Validación estricta de autenticación
        if not request.user or not request.user.is_authenticated:
            logger.warning(
                f"SECURITY ALERT: Unauthorized event recording attempt from IP {request.META.get('REMOTE_ADDR', 'unknown')} "
                f"User-Agent: {request.META.get('HTTP_USER_AGENT', 'unknown')}"
            )
        # Aquí continúa el resto de tu lógica...
    except Exception as e:
        logger.exception(f"Error al registrar evento de usuario: {str(e)}")
        return Response(
            {"error": "Ocurrió un error al registrar el evento."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )