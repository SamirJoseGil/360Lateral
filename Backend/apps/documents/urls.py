"""
URLs para la aplicación de documentos - CORREGIDO para UUID
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
    # ✅ CORREGIDO: Usar uuid: en lugar de int: para lote_id
    path('lote/<uuid:lote_id>/', views.lote_documents, name='lote-documents'),
    
    # Validación de documentos
    path('validation/summary/', views.DocumentValidationSummaryView.as_view(), name='validation-summary'),
    path('validation/list/', views.DocumentValidationListView.as_view(), name='validation-list'),
    # ✅ NUEVO: Endpoint para documentos agrupados por lote
    path('validation/grouped/', views.DocumentValidationGroupedView.as_view(), name='validation-grouped'),
    path('validation/<uuid:pk>/', views.DocumentValidationDetailView.as_view(), name='validation-detail'),
    path('validation/<uuid:document_id>/action/', views.DocumentValidateActionView.as_view(), name='validation-action'),
]
