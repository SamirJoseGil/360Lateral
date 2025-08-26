"""
Vistas para la aplicación de documentos
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
import logging

from .models import Documento
from .serializers import DocumentoSerializer, DocumentoBasicSerializer, DocumentoCreateSerializer

logger = logging.getLogger(__name__)
api_logger = logging.getLogger('api.requests')

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def documento_list(request):
    """
    Lista todos los documentos o crea uno nuevo
    """
    if request.method == 'GET':
        # Filtrar documentos según rol del usuario
        if request.user.is_staff:
            # Staff ve todos los documentos
            documentos = Documento.objects.all()
            api_logger.info(f"Admin {request.user.username} listando todos los documentos")
        else:
            # Usuarios normales solo ven sus propios documentos
            documentos = Documento.objects.filter(propietario=request.user)
            api_logger.info(f"Usuario {request.user.username} listando sus documentos")
        
        # Opciones de filtrado
        tipo = request.query_params.get('tipo')
        status_param = request.query_params.get('status')
        lote = request.query_params.get('lote')
        
        filters_applied = {}
        
        if tipo:
            documentos = documentos.filter(tipo=tipo)
            filters_applied['tipo'] = tipo
        
        if status_param:
            documentos = documentos.filter(status=status_param)
            filters_applied['status'] = status_param
        
        if lote:
            documentos = documentos.filter(lote=lote)
            filters_applied['lote'] = lote
            
        if filters_applied:
            api_logger.info(f"Filtros aplicados: {filters_applied}")
        
        # Paginación y serialización
        serializer = DocumentoBasicSerializer(documentos, many=True)
        
        api_logger.info(f"Retornando {documentos.count()} documentos")
        return Response({
            'count': documentos.count(),
            'results': serializer.data
        })
    
    elif request.method == 'POST':
        # Crear nuevo documento
        serializer = DocumentoCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Establecer propietario automáticamente
            serializer.validated_data['propietario'] = request.user
            documento = serializer.save()
            
            api_logger.info(
                f"Documento creado: ID={documento.id}, Nombre={documento.nombre}, "
                f"Tipo={documento.get_tipo_display()}, Usuario={request.user.username}"
            )
            
            return Response(DocumentoSerializer(documento).data, status=status.HTTP_201_CREATED)
        
        api_logger.warning(
            f"Error al crear documento por {request.user.username}: {serializer.errors}"
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def documento_detail(request, pk):
    """
    Recupera, actualiza o elimina un documento
    """
    try:
        documento = Documento.objects.get(pk=pk)
        
        # Comprobar permisos
        if not request.user.is_staff and documento.propietario != request.user:
            api_logger.warning(
                f"Acceso denegado: Usuario {request.user.username} intentó acceder al documento "
                f"ID={pk} de {documento.propietario.username}"
            )
            return Response(
                {'error': 'No tiene permiso para acceder a este documento'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
    except Documento.DoesNotExist:
        api_logger.warning(f"Documento no encontrado: ID={pk}, solicitado por {request.user.username}")
        return Response(
            {'error': 'Documento no encontrado'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = DocumentoSerializer(documento)
        api_logger.info(f"Documento ID={pk} consultado por {request.user.username}")
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Solo los administradores o el propietario pueden actualizar
        if not request.user.is_staff and documento.propietario != request.user:
            api_logger.warning(
                f"Permiso denegado: Usuario {request.user.username} intentó modificar el documento "
                f"ID={pk} de {documento.propietario.username}"
            )
            return Response(
                {'error': 'No tiene permiso para modificar este documento'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = DocumentoSerializer(documento, data=request.data, partial=True)
        if serializer.is_valid():
            # Si un admin cambia el estado a 'aprobado', registrar quién lo aprobó
            if request.user.is_staff and serializer.validated_data.get('status') == 'approved':
                serializer.validated_data['aprobado_por'] = request.user
                api_logger.info(f"Documento ID={pk} aprobado por admin {request.user.username}")
            
            documento_actualizado = serializer.save()
            
            # Registrar los cambios específicos realizados
            changed_fields = [field for field in serializer.validated_data.keys()]
            api_logger.info(
                f"Documento ID={pk} actualizado por {request.user.username}. "
                f"Campos modificados: {', '.join(changed_fields)}"
            )
            
            return Response(DocumentoSerializer(documento_actualizado).data)
        
        api_logger.warning(
            f"Error al actualizar documento ID={pk} por {request.user.username}: {serializer.errors}"
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Solo administradores o propietario pueden eliminar
        if not request.user.is_staff and documento.propietario != request.user:
            api_logger.warning(
                f"Permiso denegado: Usuario {request.user.username} intentó eliminar el documento "
                f"ID={pk} de {documento.propietario.username}"
            )
            return Response(
                {'error': 'No tiene permiso para eliminar este documento'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        nombre_documento = documento.nombre
        tipo_documento = documento.get_tipo_display()
        propietario_documento = documento.propietario.username
        
        documento.delete()
        
        api_logger.info(
            f"Documento eliminado: ID={pk}, Nombre={nombre_documento}, "
            f"Tipo={tipo_documento}, Propietario={propietario_documento}, "
            f"Eliminado por={request.user.username}"
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_documentos(request):
    """
    Devuelve los documentos del usuario autenticado
    """
    documentos = Documento.objects.filter(propietario=request.user)
    
    # Filtrar por tipo si se especifica
    tipo = request.query_params.get('tipo')
    status_param = request.query_params.get('status')
    
    filters_applied = {}
    
    if tipo:
        documentos = documentos.filter(tipo=tipo)
        filters_applied['tipo'] = tipo
    
    if status_param:
        documentos = documentos.filter(status=status_param)
        filters_applied['status'] = status_param
        
    if filters_applied:
        api_logger.info(f"Usuario {request.user.username} filtrando sus documentos: {filters_applied}")
    else:
        api_logger.info(f"Usuario {request.user.username} consultando todos sus documentos")
    
    serializer = DocumentoBasicSerializer(documentos, many=True)
    return Response({
        'count': documentos.count(),
        'results': serializer.data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def cambiar_estado_documento(request, pk):
    """
    Cambia el estado de un documento (solo para administradores)
    """
    try:
        documento = Documento.objects.get(pk=pk)
    except Documento.DoesNotExist:
        api_logger.warning(f"Documento no encontrado: ID={pk}, solicitado por admin {request.user.username}")
        return Response(
            {'error': 'Documento no encontrado'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    nuevo_estado = request.data.get('status')
    if not nuevo_estado:
        api_logger.warning(f"Admin {request.user.username} intentó cambiar estado de documento ID={pk} sin especificar estado")
        return Response(
            {'error': 'Debe proporcionar un estado'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if nuevo_estado not in [choice[0] for choice in Documento.STATUS_CHOICES]:
        api_logger.warning(f"Admin {request.user.username} intentó cambiar estado de documento ID={pk} a valor inválido: {nuevo_estado}")
        return Response(
            {'error': f'Estado inválido. Opciones válidas: {[choice[0] for choice in Documento.STATUS_CHOICES]}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    estado_anterior = documento.status
    
    # Actualizar estado y registrar quién lo cambió
    documento.status = nuevo_estado
    if nuevo_estado == 'approved':
        documento.aprobado_por = request.user
        documento.fecha_aprobacion = None  # Se establecerá automáticamente en save()
    
    documento.save()
    
    api_logger.info(
        f"Estado de documento ID={pk} cambiado por admin {request.user.username}: "
        f"{estado_anterior} → {nuevo_estado}, Documento: {documento.nombre}"
    )
    
    return Response(DocumentoSerializer(documento).data)
