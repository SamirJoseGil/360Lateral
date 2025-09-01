"""
URLs para la aplicación de estadísticas.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'events', views.StatViewSet)
router.register(r'summaries', views.DailySummaryViewSet)

urlpatterns = [
    # Rutas del router
    path('', include(router.urls)),
    
    # Rutas adicionales
    path('over-time/', views.stats_over_time, name='stats-over-time'),
    path('user-activity/', views.user_activity, name='user-activity'),
    path('user-activity/<int:user_id>/', views.user_activity, name='user-activity-specific'),
    path('dashboard/', views.dashboard_summary, name='dashboard-summary'),
]
