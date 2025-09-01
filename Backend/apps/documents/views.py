"""
Vistas para la aplicación de documentos.
"""
import logging
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer
from django.core.exceptions import PermissionDenied
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

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
        Mismo comportamiento que create pero con un nombre más intuitivo.
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
    # Verificar acceso al lote
    try:
        from apps.lotes.models import Lote
        lote = get_object_or_404(Lote, pk=lote_id)
        
        # Solo el propietario del lote o un admin puede ver sus documentos
        if not request.user.is_staff and hasattr(lote, 'usuario') and lote.usuario != request.user:
            raise PermissionDenied("No tienes permiso para ver estos documentos")
        
        # Verificar si la tabla Document existe antes de intentar consultarla
        try:
            # Comprobar si la tabla existe haciendo una consulta simple
            Document.objects.first()
            documents = Document.objects.filter(lote=lote, is_active=True)
            serializer = DocumentSerializer(documents, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error al consultar documentos: {e}")
            return Response({"message": "El módulo de documentos no está completamente configurado"}, 
                           status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except ImportError:
        logger.error("No se pudo importar el modelo Lote")
        return Response({"error": "Error en la configuración del sistema"}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)