"""
Servicios para la gestión de documentos.
"""
from django.utils import timezone
from .models import Document


class DocumentValidationService:
    """
    Servicio para gestionar la validación de documentos en el sistema.
    """
    
    @staticmethod
    def get_documents_by_status(status=None, page=1, page_size=10):
        """
        Obtiene documentos filtrados por estado de validación.
        
        Args:
            status: Estado de validación ('pendiente', 'validado', 'rechazado', None para todos)
            page: Número de página
            page_size: Tamaño de página
            
        Returns:
            Tupla con (documentos, total)
        """
        queryset = Document.objects.all().order_by('-created_at')
        
        if status:
            queryset = queryset.filter(metadata__validation_status=status)
            
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        return queryset[start:end], total
    
    @staticmethod
    def get_document_by_id(document_id):
        """
        Obtiene un documento por su ID.
        
        Args:
            document_id: ID del documento
            
        Returns:
            Documento o None si no existe
        """
        try:
            return Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return None
    
    @staticmethod
    def validate_document(document_id, status, comments=None):
        """
        Valida o rechaza un documento.
        
        Args:
            document_id: ID del documento
            status: Nuevo estado ('validado' o 'rechazado')
            comments: Comentarios opcionales sobre la validación
            
        Returns:
            (documento, éxito, mensaje)
        """
        document = DocumentValidationService.get_document_by_id(document_id)
        
        if not document:
            return None, False, "Documento no encontrado"
            
        if status not in ['validado', 'rechazado']:
            return document, False, "Estado de validación no válido"
            
        # Inicializar metadata si no existe
        if not document.metadata:
            document.metadata = {}
            
        # Actualizar el documento usando el campo metadata
        document.metadata['validation_status'] = status
        if comments:
            document.metadata['validation_comments'] = comments
        document.metadata['validation_date'] = timezone.now().isoformat()
        document.updated_at = timezone.now()
        document.save()
        
        return document, True, f"Documento {status} correctamente"
    
    @staticmethod
    def delete_document(document_id):
        """
        Elimina un documento.
        
        Args:
            document_id: ID del documento
            
        Returns:
            (éxito, mensaje)
        """
        document = DocumentValidationService.get_document_by_id(document_id)
        
        if not document:
            return False, "Documento no encontrado"
            
        try:
            # Eliminar el archivo físico si es necesario
            if document.file:
                document.file.delete(save=False)
            
            # Eliminar el registro
            document.delete()
            return True, "Documento eliminado correctamente"
        except Exception as e:
            return False, f"Error al eliminar el documento: {str(e)}"
    
    @staticmethod
    def get_validation_summary():
        """
        Obtiene un resumen de los documentos por estado de validación.
        
        Returns:
            Diccionario con el conteo por estado
        """
        total = Document.objects.count()
        
        # Use the metadata field to determine status
        pending = Document.objects.filter(metadata__validation_status='pendiente').count()
        validated = Document.objects.filter(metadata__validation_status='validado').count()
        rejected = Document.objects.filter(metadata__validation_status='rechazado').count()
        
        # If we can't find any documents with validation status, count all as pending
        if pending + validated + rejected == 0:
            pending = total
        
        return {
            'total': total,
            'pendientes': pending,
            'validados': validated,
            'rechazados': rejected
        }
    
    @staticmethod
    def get_recent_documents(limit=10):
        """
        Obtiene los documentos más recientes que requieren validación.
        
        Args:
            limit: Número máximo de documentos a retornar
            
        Returns:
            Lista de documentos recientes
        """
        # Get documents with validation_status=pendiente in metadata
        pending_docs = Document.objects.filter(
            metadata__validation_status='pendiente'
        ).order_by('-created_at')
        
        # If we don't have enough pending docs, add recently created docs without validation status
        if pending_docs.count() < limit:
            # Get docs that don't have validation_status in metadata
            docs_without_status = Document.objects.exclude(
                metadata__has_key='validation_status'
            ).order_by('-created_at')[:limit - pending_docs.count()]
            
            # Combine the querysets
            from itertools import chain
            return list(chain(pending_docs, docs_without_status))[:limit]
            
        return pending_docs[:limit]