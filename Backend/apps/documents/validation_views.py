"""
Views for document validation operations.
"""
from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from .models import Document
from .serializers import (
    DocumentValidationSerializer,
    DocumentValidateActionSerializer,
    DocumentListSerializer
)
from .validation_service import DocumentValidationService


class DocumentValidationSummaryView(views.APIView):
    """
    Vista para obtener un resumen de los documentos por estado de validación.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # Cache de 5 minutos
    def get(self, request):
        """
        Retorna el resumen de documentos por estado de validación.
        """
        summary = DocumentValidationService.get_validation_summary()
        return Response(summary)


class DocumentValidationListView(generics.ListAPIView):
    """
    Vista para listar documentos filtrados por estado de validación.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentListSerializer
    
    def get_queryset(self):
        """
        Filtra los documentos según el estado de validación solicitado.
        """
        status_param = self.request.query_params.get('status', None)
        if status_param:
            return Document.objects.filter(estado_validacion=status_param).order_by('-upload_date')
        return Document.objects.all().order_by('-upload_date')
    
    def list(self, request, *args, **kwargs):
        """
        Lista los documentos con paginación y cuenta total.
        """
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        status_param = request.query_params.get('status', None)
        
        documents, total = DocumentValidationService.get_documents_by_status(
            status=status_param, 
            page=page, 
            page_size=page_size
        )
        
        serializer = self.get_serializer(documents, many=True)
        
        return Response({
            'results': serializer.data,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        })


class RecentDocumentsView(generics.ListAPIView):
    """
    Vista para listar los documentos recientes que requieren validación.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentListSerializer
    
    def get_queryset(self):
        """
        Obtiene los documentos recientes pendientes de validación.
        """
        limit = int(self.request.query_params.get('limit', 10))
        return DocumentValidationService.get_recent_documents(limit=limit)


class DocumentValidationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para ver, actualizar y eliminar un documento específico.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentValidationSerializer
    queryset = Document.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        """
        Elimina un documento.
        """
        document_id = kwargs.get('pk')
        success, message = DocumentValidationService.delete_document(document_id)
        
        if success:
            return Response({'detail': message}, status=status.HTTP_204_NO_CONTENT)
        return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)


class DocumentValidateActionView(views.APIView):
    """
    Vista para realizar acciones de validación en documentos.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, document_id):
        """
        Procesa una acción de validación (validar o rechazar).
        """
        serializer = DocumentValidateActionSerializer(data=request.data)
        
        if serializer.is_valid():
            action = serializer.validated_data['action']
            comments = serializer.validated_data.get('comments', '')
            
            status_map = {
                'validar': 'validado',
                'rechazar': 'rechazado'
            }
            
            document, success, message = DocumentValidationService.validate_document(
                document_id, 
                status_map[action], 
                comments
            )
            
            if success and document:
                return Response({
                    'detail': message,
                    'document': DocumentValidationSerializer(document).data
                })
            
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)