"""
URLs para la aplicación de estadísticas.
"""
import logging
logger = logging.getLogger(__name__)

# Configuración inicial para imprimir todas las URLs registradas al cargar el módulo
def debug_urls():
    try:
        from django.urls import get_resolver
        resolver = get_resolver(None)
        for pattern in resolver.url_patterns:
            logger.info(f"DEBUG - Registered URL pattern: {pattern}")
    except Exception as e:
        logger.error(f"DEBUG - Error listing URLs: {str(e)}")

# Llamar al inicio para depurar
debug_urls()
from django.urls import path, include
from django.http import HttpResponse
from rest_framework import routers
from apps.stats.views import StatViewSet
from apps.stats.views.dashboard_views import (
    DashboardStatsView, 
    DashboardSummaryView,
    UsersStatsView, 
    LotesStatsView, 
    DocumentosStatsView, 
    RecentActivityView,
    EventsTableView,
    EventsDistributionView
)
from apps.stats.views.event_stats_views import (
    DailyEventsView, 
    EventCountsView, 
    EventDashboardView, 
    EventTypeDistributionView,
    daily_events_direct_view
)
from apps.stats.views.charts_views import (
    DashboardChartsView,
    LotesSummaryView,
    DocumentsCountView,
    DocumentsByMonthView,
    EventDistributionView as ChartsEventDistributionView
)


# Create a router for DRF viewsets
router = routers.DefaultRouter()
router.register(r'events', StatViewSet)

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Dashboard statistics endpoints
    path('dashboard/', DashboardStatsView.as_view(), name='stats-dashboard'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='stats-dashboard-summary'),
    path('dashboard/users/', UsersStatsView.as_view(), name='stats-users'),
    path('dashboard/lotes/', LotesStatsView.as_view(), name='stats-lotes'),
    path('dashboard/documentos/', DocumentosStatsView.as_view(), name='stats-documentos'),
    path('dashboard/recent-activity/', RecentActivityView.as_view(), name='stats-recent-activity'),
    
    # Añadir print de debug para ver todas las rutas registradas
    path('__debug_urls__', lambda request: print("DEBUG - All registered stats URLs:", [str(url.pattern) for url in urlpatterns]) or HttpResponse("Debug info printed to console")),
    
    # Events dashboard endpoints
    path('dashboard/events/table/', EventsTableView.as_view(), name='stats-events-table'),
    path('dashboard/events/distribution/', EventsDistributionView.as_view(), name='stats-events-distribution'),
    path('dashboard/events/', EventDashboardView.as_view(), name='stats-dashboard-events'),
    
    # Charts endpoints
    path('charts/', DashboardChartsView.as_view(), name='stats-charts'),
    path('charts/lotes-summary/', LotesSummaryView.as_view(), name='stats-lotes-summary'),
    path('charts/documents-count/', DocumentsCountView.as_view(), name='stats-documents-count'),
    path('charts/documents-by-month/', DocumentsByMonthView.as_view(), name='stats-documents-by-month'),
    path('charts/event-distribution/', ChartsEventDistributionView.as_view(), name='stats-charts-event-distribution'),
    
    # Event stats endpoints
    path('events/dashboard/', EventDashboardView.as_view(), name='stats-events-dashboard'),
    path('events/counts/', EventCountsView.as_view(), name='stats-events-counts'),
    path('events/daily/', DailyEventsView.as_view(), name='stats-events-daily'),
    path('events/types/', EventTypeDistributionView.as_view(), name='stats-events-types'),
    
    # Añadir rutas adicionales para intentar solucionar el problema 404
    path('events/daily', DailyEventsView.as_view()),  # Sin barra al final por si acaso
    
    # Vista HTTP directa para eventos diarios (alternativa)
    path('events-direct/daily/', daily_events_direct_view, name='stats-events-daily-direct')
]
