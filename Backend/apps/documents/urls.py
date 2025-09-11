"""
URLs para la aplicación de documentos
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para ViewSets
router = DefaultRouter()
router.register(r'documents', views.DocumentViewSet)

urlpatterns = [
    # Vista raíz para manejar solicitudes directas a /api/documents/
    path('', views.document_root_view, name='document-root'),
    
    # Rutas de documentos
    path('', include(router.urls)),
    
    # Documentos por usuario o lote
    path('user/', views.user_documents, name='user-documents'),
    path('lote/<int:lote_id>/', views.lote_documents, name='lote-documents'),
    
    # Validación de documentos
    path('validation/summary/', views.DocumentValidationSummaryView.as_view(), name='validation-summary'),
    path('validation/list/', views.DocumentValidationListView.as_view(), name='validation-list'),
    path('validation/<int:pk>/', views.DocumentValidationDetailView.as_view(), name='validation-detail'),
    path('validation/<int:document_id>/action/', views.DocumentValidateActionView.as_view(), name='validation-action'),
]
