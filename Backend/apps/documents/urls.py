"""
URLs para la aplicación de documentos
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.stats.views.charts_views import DocumentsByMonthView
from .views import DocumentValidateActionView, DocumentViewSet
# Importamos la vista raíz que acabamos de crear
from .views import document_root_view
# Importamos las vistas de validación
from .views import DocumentValidationSummaryView, DocumentValidationListView, DocumentValidationDetailView

# Router para ViewSets
router = DefaultRouter()
router.register(r'documents', DocumentViewSet)

urlpatterns = [
    # Vista raíz para manejar solicitudes directas a /api/documents/
    path('', document_root_view, name='document-root'),
    
    # Rutas de documentos
    path('', include(router.urls)),
    
    # Documentos por usuario o lote
    # Comentamos temporalmente la vista de documentos de usuario mientras se implementa
    # path('user/', UserDocumentsView.as_view(), name='user-documents'),
    path('lote/<int:lote_id>/', DocumentsByMonthView.as_view(), name='lote-documents'),
    
    # Validación de documentos
    path('validation/summary/', DocumentValidationSummaryView.as_view(), name='validation-summary'),
    path('validation/list/', DocumentValidationListView.as_view(), name='validation-list'),
    # path('validation/recent/', RecentValidationView.as_view(), name='validation-recent'),
    path('validation/<int:pk>/', DocumentValidationDetailView.as_view(), name='validation-detail'),
    path('validation/<int:document_id>/action/', DocumentValidateActionView.as_view(), name='validation-action'),
]
