"""
URLs para la aplicación de documentos
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .validation_views import (
    DocumentValidationSummaryView,
    DocumentValidationListView,
    RecentDocumentsView,
    DocumentValidationDetailView,
    DocumentValidateActionView
)

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

# Document validation URLs
validation_urlpatterns = [
    path('validation/summary/', DocumentValidationSummaryView.as_view(), name='document-validation-summary'),
    path('validation/list/', DocumentValidationListView.as_view(), name='document-validation-list'),
    path('validation/recent/', RecentDocumentsView.as_view(), name='recent-documents'),
    path('validation/<int:pk>/', DocumentValidationDetailView.as_view(), name='document-validation-detail'),
    path('validation/<int:document_id>/action/', DocumentValidateActionView.as_view(), name='document-validation-action'),
]

urlpatterns += validation_urlpatterns
