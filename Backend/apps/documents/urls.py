"""
URLs para la aplicación de documentos
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configurar el router para el ViewSet
router = DefaultRouter()
router.register(r'documents', views.DocumentViewSet)

urlpatterns = [
    # Rutas adicionales específicas - deben ir primero para mayor prioridad
    path('user/', views.user_documents, name='user-documents'),
    path('lote/<int:lote_id>/', views.lote_documents, name='lote-documents'),
    
    # Rutas generadas por el router para CRUD completo
    path('', include(router.urls)),
]
