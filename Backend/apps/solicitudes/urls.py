"""
URLs para solicitudes
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SolicitudViewSet

app_name = 'solicitudes'

router = DefaultRouter()
router.register(r'', SolicitudViewSet, basename='solicitud')

urlpatterns = [
    path('', include(router.urls)),
]
