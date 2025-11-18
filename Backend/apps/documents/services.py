"""
Servicios para la gestión de documentos.
"""
from django.utils import timezone
from .models import Document
import logging

logger = logging.getLogger(__name__)


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
    def validate_document(document_id, status, comments=None, validated_by=None):
        """
        ✅ MEJORADO: Valida o rechaza un documento usando los métodos del modelo.
        
        Args:
            document_id: ID del documento
            status: Nuevo estado ('validado' o 'rechazado')
            comments: Comentarios opcionales sobre la validación
            validated_by: Usuario que realiza la validación
            
        Returns:
            (documento, éxito, mensaje)
        """
        document = DocumentValidationService.get_document_by_id(document_id)
        
        if not document:
            return None, False, "Documento no encontrado"
            
        if status not in ['validado', 'rechazado']:
            return document, False, "Estado de validación no válido"
        
        try:
            # ✅ USAR MÉTODOS DEL MODELO
            if status == 'validado':
                document.validate_document(
                    validated_by=validated_by,
                    comments=comments
                )
                message = "Documento validado correctamente"
                
            elif status == 'rechazado':
                if not comments:
                    return document, False, "Se requieren comentarios para rechazar"
                
                document.reject_document(
                    reason=comments,
                    rejected_by=validated_by
                )
                message = "Documento rechazado correctamente"
            
            logger.info(f"✅ {message}: {document.id}")
            return document, True, message
            
        except Exception as e:
            logger.error(f"❌ Error en validación: {str(e)}")
            return document, False, f"Error al procesar: {str(e)}"
    
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
        ✅ MEJORADO: Obtiene un resumen actualizado de documentos por estado.
        Cuenta TODOS los documentos activos y los agrupa por estado.
        
        Returns:
            Diccionario con el conteo por estado
        """
        from django.db.models import Q, Count, Case, When, IntegerField
        
        # Obtener todos los documentos activos
        total = Document.objects.filter(is_active=True).count()
        
        # ✅ MEJORADO: Contar usando agregación en una sola query
        summary = Document.objects.filter(is_active=True).aggregate(
            pendientes=Count('id', filter=Q(metadata__validation_status='pendiente')),
            validados=Count('id', filter=Q(metadata__validation_status='validado')),
            rechazados=Count('id', filter=Q(metadata__validation_status='rechazado'))
        )
        
        # Los documentos sin estado de validación se consideran pendientes
        sin_estado = total - (summary['pendientes'] + summary['validados'] + summary['rechazados'])
        
        result = {
            'total': total,
            'pendientes': summary['pendientes'] + sin_estado,  # Incluir sin estado
            'validados': summary['validados'],
            'rechazados': summary['rechazados']
        }
        
        logger.info(f"📊 Resumen de validación: {result}")
        return result
    
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
    
    @staticmethod
    def get_documents_grouped_by_lote(status=None, page=1, page_size=10):
        """
        ✅ MEJORADO: Ordenar documentos por fecha de creación (más reciente primero)
        """
        from django.db.models import Count, Q
        from apps.lotes.models import Lote
        
        # Obtener lotes que tienen documentos
        base_query = Lote.objects.filter(
            documents__isnull=False,
            documents__is_active=True  # ✅ Solo documentos activos
        )
        
        # Aplicar filtro de estado si se proporciona
        if status:
            base_query = base_query.filter(
                documents__metadata__validation_status=status
            )
        
        # ✅ CRITICAL: Usar distinct() ANTES de anotar para evitar duplicados
        lotes_query = base_query.distinct()
        
        # ✅ NUEVO: Ordenar por última actualización de documentos
        lotes_query = lotes_query.order_by('-updated_at', '-created_at')
        
        # Paginación
        total_lotes = lotes_query.count()
        total_pages = (total_lotes + page_size - 1) // page_size if total_lotes > 0 else 0
        
        start = (page - 1) * page_size
        end = start + page_size
        lotes_paginated = lotes_query[start:end]
        
        # Construir resultado
        result = {
            'lotes': [],
            'total': total_lotes,
            'page': page,
            'total_pages': total_pages
        }
        
        for lote in lotes_paginated:
            # ✅ Obtener documentos del lote ORDENADOS por fecha (más reciente primero)
            docs_query = Document.objects.filter(
                lote=lote, 
                is_active=True
            )
            
            if status:
                docs_query = docs_query.filter(metadata__validation_status=status)
            
            # ✅ NUEVO: Ordenar por fecha de creación descendente (más reciente primero)
            docs = list(docs_query.order_by('-created_at', '-updated_at'))
            
            # ✅ Contar estados correctamente
            total_docs = len(docs)
            
            # Contar cada estado
            pendientes = 0
            validados = 0
            rechazados = 0
            
            for d in docs:
                val_status = d.metadata.get('validation_status') if d.metadata else None
                if val_status == 'validado':
                    validados += 1
                elif val_status == 'rechazado':
                    rechazados += 1
                else:
                    pendientes += 1  # Sin estado o pendiente
            
            result['lotes'].append({
                'lote_id': str(lote.id),
                'lote_nombre': lote.nombre,
                'lote_direccion': lote.direccion,
                'lote_status': lote.status,
                'documentos': docs,
                'total_documentos': total_docs,
                'pendientes': pendientes,
                'validados': validados,
                'rechazados': rechazados
            })
        
        logger.info(f"📊 Documentos agrupados: {total_lotes} lotes, página {page}")
        return result