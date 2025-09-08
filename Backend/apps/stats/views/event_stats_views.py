"""
Views for event statistics and metrics.
"""
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.stats.models import Stat
from apps.stats.services.event_stats_service import EventStatsService
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET


class EventDashboardView(APIView):
    """
    Vista para el dashboard de eventos que proporciona una visión general
    de las estadísticas de eventos.
    
    Permite filtrar por un número específico de días con el parámetro ?days=30
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Obtener el número de días desde el parámetro de consulta, default a 30 días
        days = int(request.query_params.get('days', 30))
        
        # Usar el servicio para obtener los datos
        result = EventStatsService.get_event_dashboard_data(days)
        
        return Response(result)


class EventCountsView(APIView):
    """
    Vista para obtener conteos de eventos por tipo.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Implementación de conteo de eventos
        counts = Stat.objects.values('event_type').annotate(count=Count('id')).order_by('-count')
        return Response(list(counts))


class DailyEventsView(APIView):
    """
    Vista para obtener estadísticas de eventos diarios.
    
    Permite filtrar por un número específico de días con el parámetro ?days=30
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        import logging
        logger = logging.getLogger(__name__)
        logger.info("DEBUG - DailyEventsView.get called")
        logger.info(f"DEBUG - Request path: {request.path}")
        logger.info(f"DEBUG - Request method: {request.method}")
        logger.info(f"DEBUG - Request query params: {request.query_params}")
        
        # Obtener el número de días desde el parámetro de consulta, default a 30 días
        days = int(request.query_params.get('days', 30))
        logger.info(f"DEBUG - Days parameter: {days}")
        
        # Usar el servicio para obtener los datos
        result = EventStatsService.get_daily_events(days)
        logger.info(f"DEBUG - Result from service: {result}")
        
        # Respuesta con cabecera para debug
        response = Response(result)
        response["X-Debug-Info"] = "DailyEventsView processed this request"
        logger.info("DEBUG - Sending response")
        
        return response


class EventTypeDistributionView(APIView):
    """
    Vista para obtener la distribución de eventos por tipo.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Implementación de distribución de tipos de eventos
        distribution = Stat.objects.values('event_type').annotate(count=Count('id'))
        total = Stat.objects.count()
        
        result = {
            'total': total,
            'distribution': list(distribution)
        }
        
        return Response(result)


@csrf_exempt
@require_GET
def daily_events_direct_view(request):
    """
    Vista directa HTTP para solucionar el problema de acceso al endpoint de eventos diarios.
    Esto evita cualquier problema de enrutamiento con DRF.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("DEBUG - daily_events_direct_view called")
    logger.info(f"DEBUG - Request path: {request.path}")
    logger.info(f"DEBUG - Request method: {request.method}")
    logger.info(f"DEBUG - Request GET params: {request.GET}")
    
    try:
        # Obtener el número de días
        days = int(request.GET.get('days', 30))
        logger.info(f"DEBUG - Days parameter: {days}")
        
        # Usar el servicio
        from apps.stats.services.event_stats_service import EventStatsService
        result = EventStatsService.get_daily_events(days)
        logger.info(f"DEBUG - Result from service: {result}")
        
        # Preparar respuesta JSON directa
        response = JsonResponse(result)
        response["X-Debug-Info"] = "Direct view for daily events"
        return response
    
    except Exception as e:
        logger.error(f"DEBUG - Error in daily_events_direct_view: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)