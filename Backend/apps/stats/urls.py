"""
URLs para la aplicación de estadísticas.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    StatViewSet,
    DailySummaryViewSet,
    DashboardStatsView,
    DashboardSummaryView,
    UsersStatsView,
    LotesStatsView,
    DocumentosStatsView,
    RecentActivityView,
    EventDashboardView,
    EventCountsView,
    DailyEventsView,
    EventTypeDistributionView,
    DashboardChartsView,
    LotesSummaryView,
    DocumentsCountView,
    DocumentsByMonthView,
    stats_over_time,
    user_activity,
    RecordEventView,  # Importar la clase-based view
)

app_name = 'stats'

router = DefaultRouter()
router.register(r'stats', StatViewSet, basename='stat')
router.register(r'daily-summary', DailySummaryViewSet, basename='daily-summary')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Dashboard endpoints
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard-charts'),
    
    # Specific stats endpoints
    path('users/', UsersStatsView.as_view(), name='users-stats'),
    path('lotes/', LotesStatsView.as_view(), name='lotes-stats'),
    path('lotes/summary/', LotesSummaryView.as_view(), name='lotes-summary'),
    path('documentos/', DocumentosStatsView.as_view(), name='documentos-stats'),
    path('documentos/count/', DocumentsCountView.as_view(), name='documents-count'),
    path('documentos/by-month/', DocumentsByMonthView.as_view(), name='documents-by-month'),
    path('activity/', RecentActivityView.as_view(), name='recent-activity'),
    
    # Event stats endpoints
    path('events/dashboard/', EventDashboardView.as_view(), name='events-dashboard'),
    path('events/counts/', EventCountsView.as_view(), name='event-counts'),
    path('events/daily/', DailyEventsView.as_view(), name='daily-events'),
    path('events/distribution/', EventTypeDistributionView.as_view(), name='event-distribution'),
    
    # ✅ CRÍTICO: Endpoint para registrar eventos - SIN RESTRICCIÓN DE ROL
    path('events/record/', RecordEventView.as_view(), name='record-event'),
    
    # Function-based views
    path('over-time/', stats_over_time, name='stats-over-time'),
    path('user-activity/', user_activity, name='user-activity'),
    path('user-activity/<uuid:user_id>/', user_activity, name='user-activity-detail'),
]
