"""
URLs para la aplicación de estadísticas.
"""
from django.urls import path, include
from rest_framework import routers
from apps.stats.views import StatViewSet
from apps.stats.dashboard_views import (
    DashboardStatsView, 
    UsersStatsView, 
    LotesStatsView, 
    DocumentosStatsView, 
    RecentActivityView
)

# Create a router for DRF viewsets
router = routers.DefaultRouter()
router.register(r'events', StatViewSet)

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Dashboard statistics endpoints
    path('dashboard/', DashboardStatsView.as_view(), name='stats-dashboard'),
    path('dashboard/users/', UsersStatsView.as_view(), name='stats-users'),
    path('dashboard/lotes/', LotesStatsView.as_view(), name='stats-lotes'),
    path('dashboard/documentos/', DocumentosStatsView.as_view(), name='stats-documentos'),
    path('dashboard/recent-activity/', RecentActivityView.as_view(), name='stats-recent-activity'),
]
