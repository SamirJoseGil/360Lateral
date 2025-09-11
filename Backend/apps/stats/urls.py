"""
URLs para la aplicación de estadísticas.
"""
from django.urls import path, include
from rest_framework import routers
from . import views

# Create a router for DRF viewsets
router = routers.DefaultRouter()
router.register(r'events', views.StatViewSet)

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Dashboard statistics endpoints
    path('dashboard/', views.DashboardStatsView.as_view(), name='stats-dashboard'),
    path('dashboard/summary/', views.DashboardSummaryView.as_view(), name='stats-dashboard-summary'),
    path('dashboard/users/', views.UsersStatsView.as_view(), name='stats-users'),
    path('dashboard/lotes/', views.LotesStatsView.as_view(), name='stats-lotes'),
    path('dashboard/documentos/', views.DocumentosStatsView.as_view(), name='stats-documentos'),
    path('dashboard/recent-activity/', views.RecentActivityView.as_view(), name='stats-recent-activity'),
    
    # Events endpoints
    path('events/dashboard/', views.EventDashboardView.as_view(), name='stats-events-dashboard'),
    path('events/daily/', views.DailyEventsView.as_view(), name='stats-events-daily'),
    path('events/counts/', views.EventCountsView.as_view(), name='stats-events-counts'),
    path('events/types/', views.EventTypeDistributionView.as_view(), name='stats-events-types'),
    
    # Charts endpoints
    path('charts/', views.DashboardChartsView.as_view(), name='stats-charts'),
    path('charts/lotes-summary/', views.LotesSummaryView.as_view(), name='stats-lotes-summary'),
    path('charts/documents-count/', views.DocumentsCountView.as_view(), name='stats-documents-count'),
    path('charts/documents-by-month/', views.DocumentsByMonthView.as_view(), name='stats-documents-by-month'),
    
    # Utility endpoints
    path('over-time/', views.stats_over_time, name='stats-over-time'),
    path('user-activity/', views.user_activity, name='stats-user-activity'),
    path('user-activity/<str:user_id>/', views.user_activity, name='stats-user-activity-detail'),
]
