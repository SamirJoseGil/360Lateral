"""
Vistas para la aplicación de documentos.
"""
import logging
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import views, generics
from django.core.exceptions import PermissionDenied
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.http import HttpResponseRedirect, JsonResponse

from .models import Document
from .serializers import (
    DocumentListSerializer, DocumentSerializer, DocumentUploadSerializer, 
    DocumentValidateActionSerializer, DocumentValidationSerializer
)
from .services import DocumentValidationService

logger = logging.getLogger(__name__)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a propietarios o administradores
    manipular sus propios documentos.
    """
    def has_object_permission(self, request, view, obj):
        # Los administradores siempre tienen acceso
        if request.user.is_staff:
            return True
        
        # Los propietarios tienen acceso a sus propios documentos
        return obj.user == request.user


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD en documentos.
    """
    queryset = Document.objects.filter(is_active=True)
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    basename = 'document'
    
    def get_serializer_class(self):
        """Determina qué serializador utilizar"""
        if self.action == 'create' or self.action == 'update':
            return DocumentUploadSerializer
        return DocumentSerializer
    
    def get_queryset(self):
        """Filtra los resultados según permisos y parámetros"""
        queryset = Document.objects.filter(is_active=True)
        
        # Los administradores pueden ver todos los documentos
        if not self.request.user.is_staff:
            # Los usuarios regulares solo pueden ver sus propios documentos
            queryset = queryset.filter(user=self.request.user)
        
        # Filtrar por tipo de documento
        document_type = self.request.query_params.get('document_type')
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        
        # Filtrar por lote
        lote_id = self.request.query_params.get('lote')
        if lote_id:
            queryset = queryset.filter(lote_id=lote_id)
        
        # Ordenar resultados
        ordering = self.request.query_params.get('ordering', '-created_at')
        return queryset.order_by(ordering)
    
    def perform_create(self, serializer):
        """Agregar el usuario actual al crear un documento"""
        serializer.save(user=self.request.user)
        logger.info(f"Documento creado: {serializer.data.get('title')} por usuario {self.request.user.username}")
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """
        Endpoint específico para subir un documento.
        """
        serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            document = serializer.save(user=request.user)
            response_serializer = DocumentSerializer(document, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Endpoint para obtener la URL de descarga directa de un documento.
        """
        document = self.get_object()
        if document.file:
            return Response({
                'download_url': request.build_absolute_uri(document.file.url),
                'file_name': document.file.name.split('/')[-1],
                'file_size': document.file_size,
                'mime_type': document.mime_type
            })
        return Response({"error": "No hay archivo asociado a este documento"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Endpoint para archivar un documento (marcar como inactivo)
        """
        document = self.get_object()
        document.is_active = False
        document.save()
        return Response({"message": "Documento archivado correctamente"})
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """
        Endpoint para obtener la lista de tipos de documento disponibles
        """
        return Response([
            {'value': key, 'label': label}
            for key, label in Document.DOCUMENT_TYPES
        ])


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
            return Document.objects.filter(metadata__validation_status=status_param).order_by('-created_at')
        return Document.objects.all().order_by('-created_at')
    
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


# ===== UTILITY VIEWS =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_documents(request):
    """
    Lista todos los documentos del usuario actual
    """
    documents = Document.objects.filter(user=request.user, is_active=True)
    serializer = DocumentSerializer(documents, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lote_documents(request, lote_id):
    """
    Lista todos los documentos asociados a un lote específico
    """
    try:
        from apps.lotes.models import Lote
        lote = get_object_or_404(Lote, pk=lote_id)
        
        # Solo el propietario del lote o un admin puede ver sus documentos
        if not request.user.is_staff and hasattr(lote, 'usuario') and lote.usuario != request.user:
            raise PermissionDenied("No tienes permiso para ver estos documentos")
        
        documents = Document.objects.filter(lote=lote, is_active=True)
        serializer = DocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data)
        
    except ImportError:
        logger.error("No se pudo importar el modelo Lote")
        return Response({"error": "Error en la configuración del sistema"}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error al consultar documentos: {e}")
        return Response({"message": "Error al consultar documentos"}, 
                       status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET', 'POST'])
def document_root_view(request):
    """
    Vista para manejar solicitudes a la raíz de documents.
    """
    logger.info(f"Document root view called with method: {request.method}")
    
    if request.method == 'POST':
        # Redirigir a la ruta correcta para subir documentos
        redirect_url = '/api/documents/documents/'
        return HttpResponseRedirect(redirect_url)
    elif request.method == 'GET':
        # Devolver información sobre el uso correcto del endpoint
        return JsonResponse({
            "message": "API de documentos activa",
            "endpoints": {
                "upload": "/api/documents/documents/",
                "list": "/api/documents/documents/",
                "lote_documents": "/api/documents/lote/{lote_id}/",
                "validation": "/api/documents/validation/"
            }
        })
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)