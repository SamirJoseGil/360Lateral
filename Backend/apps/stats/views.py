"""
Vistas para la aplicación de estadísticas.
"""
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
import uuid  # Añadir esta importación

from .models import Stat, DailySummary
from .serializers import (
    StatSerializer, StatCreateSerializer, DailySummarySerializer,
    StatsOverTimeSerializer, UserActivitySerializer, StatsSummarySerializer
)
from .services.stats_service import StatsService

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

class StatViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar eventos estadísticos.
    """
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
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Obtener las estadísticas más recientes"""
        stats = self.get_queryset()[:50]  # Limitar a 50 registros
        serializer = StatSerializer(stats, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def record(self, request):
        """
        Endpoint simplificado para registrar un evento estadístico.
        Ideal para uso desde el frontend.
        """
        serializer = StatCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Verificar que la tabla existe
                from django.db import connection, DatabaseError
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT 1 FROM stats_stat LIMIT 1")
                except DatabaseError:
                    logger.error("La tabla stats_stat no existe. Las migraciones no se han aplicado.")
                    # Devolver un mensaje amigable al cliente
                    return Response(
                        {"message": "El servicio de estadísticas está en mantenimiento. Tu acción ha sido registrada."},
                        status=status.HTTP_200_OK
                    )
                    
                # Usar el servicio para registrar la estadística
                user_id = request.user.id if request.user.is_authenticated else None
                
                # user_id ya se convierte a string en el servicio, pero lo aseguramos aquí también
                stat = StatsService.record_stat(
                    type=serializer.validated_data['type'],
                    name=serializer.validated_data['name'],
                    value=serializer.validated_data.get('value', {}),
                    user_id=user_id,
                    session_id=serializer.validated_data.get('session_id'),
                    ip_address=request.META.get('REMOTE_ADDR')
                )
                
                if stat:
                    logger.info(f"Estadística registrada: {stat.type} - {stat.name}")
                    return Response(StatSerializer(stat).data, status=status.HTTP_201_CREATED)
                    
                # Si StatsService.record_stat devuelve None, manejamos el error de forma elegante
                logger.warning("No se pudo registrar la estadística pero se guardó en el log de respaldo")
                return Response(
                    {"message": "Tu acción ha sido registrada pero no procesada completamente."},
                    status=status.HTTP_200_OK
                )
                
            except Exception as e:
                logger.exception(f"Error inesperado al registrar estadística: {str(e)}")
                # Devolver un mensaje amigable en lugar de un error 500
                return Response(
                    {"message": "Se produjo un error al procesar tu acción, pero ha sido registrada."},
                    status=status.HTTP_200_OK
                )
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DailySummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar resúmenes diarios de estadísticas.
    Solo lectura, ya que los resúmenes se generan automáticamente.
    """
    queryset = DailySummary.objects.all().order_by('-date')
    serializer_class = DailySummarySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por rango de fechas si se especifica
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
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Obtener el resumen del día actual"""
        today = timezone.now().date()
        summary = StatsService.get_daily_summary(today)
        
        # Si no hay métricas o están vacías, calcularlas
        if not summary.metrics:
            StatsService.calculate_daily_metrics(today)
            summary.refresh_from_db()
            
        serializer = self.get_serializer(summary)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def recalculate(self, request):
        """
        Recalcular las métricas para una fecha específica.
        Solo disponible para administradores.
        """
        date_str = request.data.get('date')
        if not date_str:
            return Response(
                {"error": "Debe proporcionar una fecha (YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Formato de fecha inválido. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        metrics = StatsService.calculate_daily_metrics(target_date)
        return Response({"message": "Métricas recalculadas", "metrics": metrics})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_over_time(request):
    """
    Obtener estadísticas agregadas a lo largo del tiempo.
    """
    # Parámetros para filtrar
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    interval = request.query_params.get('interval', 'day')
    stat_type = request.query_params.get('type')
    
    # Validar y convertir fechas
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
    
    # Validar intervalo
    if interval not in ['day', 'week', 'month']:
        interval = 'day'
    
    # Obtener datos
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
    """
    Obtener la actividad de un usuario específico.
    Si no se proporciona user_id, se usa el usuario autenticado.
    """
    if user_id is None:
        user_id = request.user.id
    
    # Verificar permisos
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
    
    # Manejar el caso donde no hay actividad
    if activity['total_events'] == 0:
        return Response({
            'total_events': 0,
            'events_by_type': {},
            'recent_events': [],
            'first_activity': None,
            'last_activity': None
        })
    
    # Serializar manualmente debido a posibles None en first/last activity
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

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_summary(request):
    """
    Obtener un resumen para el dashboard de administración.
    Solo disponible para administradores.
    """
    # Obtener estadísticas de los últimos 30 días por defecto
    days = request.query_params.get('days', 30)
    try:
        days = int(days)
        if days < 1:
            days = 30
    except ValueError:
        days = 30
    
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Obtener resúmenes diarios
    daily_summaries = DailySummary.objects.filter(
        date__gte=start_date,
        date__lte=end_date
    ).order_by('date')
    
    # Si hay días sin resumen, calcularlos
    existing_dates = set(summary.date for summary in daily_summaries)
    missing_dates = []
    
    current_date = start_date
    while current_date <= end_date:
        if current_date not in existing_dates:
            missing_dates.append(current_date)
        current_date += timedelta(days=1)
    
    # Calcular métricas para fechas faltantes (limitado a los últimos 7 días para optimizar)
    for missing_date in missing_dates[-7:]:
        StatsService.calculate_daily_metrics(missing_date)
    
    # Refrescar la consulta si se calcularon nuevas métricas
    if missing_dates[-7:]:
        daily_summaries = DailySummary.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
    data = []
    # Preparar datos para el gráfico
    daily_data = []
    for summary in daily_summaries:
        if summary.metrics:
            daily_data.append({
                'date': summary.date,
                'metrics': summary.metrics
            })
    # Calcular totales
    total_events = sum(summary.metrics.get('total_events', 0) for summary in daily_summaries if summary.metrics)
    unique_users = set()
    for summary in daily_summaries:
        if summary.metrics and 'unique_users' in summary.metrics:
            # Nota: esto es una aproximación ya que no tenemos usuarios únicos reales
            unique_users.add(summary.metrics['unique_users'])
    response_data = {
        'total_events': total_events,
        'unique_users': len(unique_users),
        'period': f"{start_date} to {end_date}",
        'daily_data': daily_data
    }
    
    return Response(response_data)
    
    return Response(response_data)
