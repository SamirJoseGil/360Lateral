"""
Vistas para la aplicación de documentos.
"""
import logging
from django.shortcuts import get_object_or_404
from django.db import transaction  # ✅ AGREGADO: Import de transaction
from rest_framework import status, viewsets, permissions, parsers
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
    ✅ CORREGIDO: Soft delete y validación de estados
    """
    queryset = Document.objects.filter(is_active=True)
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    # ✅ CRÍTICO: SOLO MultiPart y Form parsers - SIN JSONParser
    parser_classes = [
        parsers.MultiPartParser,  # Para archivos
        parsers.FormParser,        # Para formularios
    ]
    
    def get_serializer_class(self):
        """Determina qué serializador utilizar"""
        if self.action == 'create' or self.action == 'update':
            return DocumentUploadSerializer
        return DocumentSerializer
    
    def get_queryset(self):
        """✅ Filtrar documentos activos y según permisos"""
        queryset = Document.objects.filter(is_active=True)
        
        # Los administradores pueden ver todos los documentos
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        # Filtrar por tipo de documento
        document_type = self.request.query_params.get('document_type')
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        
        # Filtrar por lote
        lote_id = self.request.query_params.get('lote')
        if lote_id:
            queryset = queryset.filter(lote_id=lote_id)
        
        # ✅ NUEVO: Filtrar por estado de validación
        validation_status = self.request.query_params.get('validation_status')
        if validation_status:
            queryset = queryset.filter(metadata__validation_status=validation_status)
        
        ordering = self.request.query_params.get('ordering', '-created_at')
        return queryset.order_by(ordering)
    
    def perform_create(self, serializer):
        """Agregar el usuario actual al crear un documento"""
        serializer.save(user=self.request.user)
        logger.info(f"Documento creado: {serializer.data.get('title')} por usuario {self.request.user.username}")
    
    def perform_destroy(self, instance):
        """✅ SOFT DELETE: Archivar en lugar de eliminar"""
        instance.soft_delete()
        logger.info(f"Documento {instance.id} archivado por {self.request.user.email}")
    
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
        ✅ CORREGIDO: Retorna URL absoluta correcta
        """
        document = self.get_object()
        if document.file:
            # ✅ CRÍTICO: Construir URL absoluta correctamente
            file_url = request.build_absolute_uri(document.file.url)
            
            logger.info(f"📥 Download request for document {document.id}: {file_url}")
            
            return Response({
                'success': True,
                'download_url': file_url,
                'file_name': document.file.name.split('/')[-1],
                'file_size': document.file_size,
                'mime_type': document.mime_type
            })
        
        logger.warning(f"⚠️ Download request for document {pk} without file")
        return Response({
            "success": False,
            "error": "No hay archivo asociado a este documento"
        }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Endpoint para archivar un documento (marcar como inactivo)
        """
        document = self.get_object()
        document.soft_delete()
        
        return Response({
            "success": True,
            "message": "Documento archivado correctamente"
        })
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        ✅ NUEVO: Restaurar un documento archivado
        """
        document = get_object_or_404(Document, pk=pk)
        
        # Verificar permisos
        if not (request.user.is_staff or document.user == request.user):
            return Response({
                "success": False,
                "error": "No tienes permiso para restaurar este documento"
            }, status=status.HTTP_403_FORBIDDEN)
        
        document.reactivate()
        
        return Response({
            "success": True,
            "message": "Documento restaurado correctamente",
            "data": DocumentSerializer(document, context={'request': request}).data
        })
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """
        Endpoint para obtener la lista de tipos de documento disponibles
        """
        return Response([
            {'value': key, 'label': label}
            for key, label in Document.DOCUMENT_TYPES
        ])
    
    def create(self, request, *args, **kwargs):
        """Crear documento con logging mejorado"""
        try:
            logger.info(f"📤 Document upload request received from {request.user.email}")
            logger.info(f"   Content-Type: {request.content_type}")
            logger.info(f"   Data keys: {list(request.data.keys())}")
            
            # Verificar si hay archivo
            if 'file' in request.data:
                file = request.data['file']
                logger.info(f"   File: {file.name} ({file.size} bytes)")
            else:
                logger.warning("   ⚠️ No file in request data")
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            logger.info(f"✅ Document created successfully: {serializer.data.get('id')}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            logger.error(f"❌ Error creating document: {str(e)}")
            logger.exception("Full traceback:")
            raise
    
    @action(detail=False, methods=['get'])
    def me(request):
        """
        Endpoint para obtener los documentos del usuario autenticado.
        """
        documents = Document.objects.filter(user=request.user, is_active=True)
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def metadata(self, request, pk=None):
        """
        Endpoint para obtener la metadata de un documento.
        """
        document = self.get_object()
        return Response(document.metadata)
    
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """
        Endpoint para validar un documento.
        """
        document = self.get_object()
        serializer = DocumentValidationSerializer(data=request.data)
        
        if serializer.is_valid():
            # Procesar validación
            DocumentValidationService.validate_document(document, serializer.validated_data)
            return Response({"message": "Documento validado correctamente"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Endpoint para rechazar un documento.
        """
        document = self.get_object()
        serializer = DocumentValidationSerializer(data=request.data)
        
        if serializer.is_valid():
            # Procesar rechazo
            DocumentValidationService.reject_document(document, serializer.validated_data)
            return Response({"message": "Documento rechazado correctamente"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Endpoint para restaurar un documento archivado.
        """
        document = self.get_object()
        document.is_active = True
        document.save()
        return Response({"message": "Documento restaurado correctamente"})
    
    @action(detail=True, methods=['delete'])
    def delete(self, request, pk=None):
        """
        Endpoint para eliminar un documento.
        """
        document = self.get_object()
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentValidationSummaryView(views.APIView):
    """
    Vista para obtener un resumen de los documentos por estado de validación.
    ✅ MEJORADO: Sin caché para reflejar cambios inmediatamente
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Retorna el resumen de documentos por estado de validación.
        ✅ SIN CACHE para que se actualice inmediatamente
        """
        summary = DocumentValidationService.get_validation_summary()
        logger.info(f"📊 Validation summary requested: {summary}")
        return Response(summary)


class DocumentValidationListView(generics.ListAPIView):
    """
    Vista para listar documentos filtrados por estado de validación.
    ✅ MEJORADO: Ordenar por fecha descendente
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentListSerializer
    
    def get_queryset(self):
        """✅ Filtra y ORDENA los documentos"""
        status_param = self.request.query_params.get('status', None)
        
        queryset = Document.objects.filter(
            is_active=True  # ✅ Solo documentos activos
        ).select_related('user', 'lote').order_by(
            '-created_at',  # ✅ Más reciente primero
            '-updated_at'
        )
        
        if status_param:
            queryset = queryset.filter(metadata__validation_status=status_param)
        
        return queryset
    
    def get_serializer_context(self):
        """✅ CRÍTICO: Agregar request al contexto del serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        """Lista los documentos con paginación y cuenta total."""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        status_param = request.query_params.get('status', None)
        
        # Obtener queryset filtrado
        queryset = self.get_queryset()
        total = queryset.count()
        
        # Aplicar paginación manual
        start = (page - 1) * page_size
        end = start + page_size
        documents = queryset[start:end]
        
        # ✅ CRÍTICO: Pasar context con request
        serializer = self.get_serializer(documents, many=True)
        
        # ✅ LOGGING: Ver qué datos se están enviando
        logger.info(f"[Validation List] Sending {len(serializer.data)} documents")
        if serializer.data:
            first_doc = serializer.data[0]
            logger.info(f"[Validation List] First doc keys: {list(first_doc.keys())}")
            logger.info(f"[Validation List] First doc file_url: {first_doc.get('file_url')}")
        
        return Response({
            'results': serializer.data,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size if total > 0 else 0
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
    ✅ MEJORADO: Vista para realizar acciones de validación en documentos.
    Evita duplicados y actualiza estado correctamente.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    @transaction.atomic  # ✅ AGREGADO: Decorador para manejar transacciones
    def post(self, request, document_id):
        """
        Procesa una acción de validación (validar o rechazar).
        """
        serializer = DocumentValidateActionSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        comments = serializer.validated_data.get('comments', '')
        
        try:
            # ✅ CORREGIDO: Ahora select_for_update funciona porque está en una transacción
            document = Document.objects.select_for_update().get(id=document_id)
        except Document.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Documento no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # ✅ EVITAR DUPLICADOS: Verificar estado actual
        current_status = document.metadata.get('validation_status', 'pendiente')
        
        if action == 'validar' and current_status == 'validado':
            return Response({
                'success': False,
                'error': 'El documento ya está validado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if action == 'rechazar' and current_status == 'rechazado':
            return Response({
                'success': False,
                'error': 'El documento ya está rechazado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ USAR SERVICIO para validar
        document, success, message = DocumentValidationService.validate_document(
            document_id=document_id,
            status='validado' if action == 'validar' else 'rechazado',
            comments=comments,
            validated_by=request.user
        )
        
        if not success:
            return Response({
                'success': False,
                'error': message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ Serializar con estado actualizado
        serialized = DocumentValidationSerializer(document, context={'request': request})
        
        logger.info(f"✅ Document {document.id} {action} by {request.user.email}")
        
        return Response({
            'success': True,
            'message': message,
            'document': serialized.data
        })

class DocumentValidationGroupedView(generics.ListAPIView):
    """
    ✅ NUEVO: Vista para obtener documentos agrupados por lote.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get(self, request, *args, **kwargs):
        """Obtener documentos agrupados por lote"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        status_param = request.query_params.get('status', None)
        
        # Obtener datos agrupados
        result = DocumentValidationService.get_documents_grouped_by_lote(
            status=status_param,
            page=page,
            page_size=page_size
        )
        
        # Serializar documentos
        from .serializers import DocumentValidationSerializer
        
        lotes_serializados = []
        for lote_data in result['lotes']:
            documentos_serializados = DocumentValidationSerializer(
                lote_data['documentos'],
                many=True,
                context={'request': request}
            ).data
            
            lotes_serializados.append({
                'lote_id': lote_data['lote_id'],
                'lote_nombre': lote_data['lote_nombre'],
                'lote_direccion': lote_data['lote_direccion'],
                'lote_status': lote_data['lote_status'],
                'documentos': documentos_serializados,
                'total_documentos': lote_data['total_documentos'],
                'pendientes': lote_data['pendientes'],
                'validados': lote_data['validados'],
                'rechazados': lote_data['rechazados']
            })
        
        return Response({
            'lotes': lotes_serializados,
            'total': result['total'],
            'page': result['page'],
            'total_pages': result['total_pages']
        })


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
    ✅ CORREGIDO: Acepta UUID como lote_id
    """
    try:
        from apps.lotes.models import Lote
        
        # ✅ CORREGIDO: Manejar UUID correctamente
        try:
            lote = Lote.objects.get(pk=lote_id)
        except Lote.DoesNotExist:
            logger.warning(f"Lote {lote_id} no encontrado")
            return Response(
                {"error": f"Lote {lote_id} no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            logger.error(f"UUID inválido: {lote_id} - {str(e)}")
            return Response(
                {"error": "ID de lote inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar permisos
        if not request.user.is_staff and hasattr(lote, 'owner') and lote.owner != request.user:
            logger.warning(f"Usuario {request.user.id} intentó acceder a documentos de lote {lote_id} sin permiso")
            raise PermissionDenied("No tienes permiso para ver estos documentos")
        
        # Obtener documentos del lote
        documents = Document.objects.filter(lote=lote, is_active=True).order_by('-created_at')
        
        logger.info(f"Documentos encontrados para lote {lote_id}: {documents.count()}")
        
        serializer = DocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data)
        
    except ImportError as e:
        logger.error(f"No se pudo importar el modelo Lote: {str(e)}")
        return Response(
            {"error": "Error en la configuración del sistema"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except PermissionDenied as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_403_FORBIDDEN
        )
    except Exception as e:
        logger.error(f"Error al consultar documentos del lote {lote_id}: {str(e)}", exc_info=True)
        return Response(
            {"error": "Error al consultar documentos"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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