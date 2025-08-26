"""
URLs para la app de documentos
"""
from django.urls import path
from .views import (
    documento_list,
    documento_detail,
    mis_documentos,
    cambiar_estado_documento
)

app_name = 'documents'

urlpatterns = [
    # CRUD básico de documentos
    path('', documento_list, name='documento-list'),
    path('<int:pk>/', documento_detail, name='documento-detail'),
    
    # Documentos del usuario autenticado
    path('mis-documentos/', mis_documentos, name='mis-documentos'),
    
    # Cambio de estado (solo admin)
    path('<int:pk>/estado/', cambiar_estado_documento, name='cambiar-estado-documento'),
]
