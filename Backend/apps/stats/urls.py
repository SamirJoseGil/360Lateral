"""
URLs para la aplicación de estadísticas.
"""
from django.urls import path, include
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
from apps.stats.views.event_stats_views import DailyEventsView, EventCountsView, EventDashboardView, EventTypeDistributionView
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
    
    # Events dashboard endpoints
    path('dashboard/events/table/', EventsTableView.as_view(), name='stats-events-table'),
    path('dashboard/events/distribution/', EventsDistributionView.as_view(), name='stats-events-distribution'),
    
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
]
