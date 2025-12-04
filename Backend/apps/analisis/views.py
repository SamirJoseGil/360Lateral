"""
Vistas para análisis urbanístico
"""
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone  # ✅ CRÍTICO: Agregar esta importación
import logging

from .models import AnalisisUrbanistico, ParametroUrbanistico, RespuestaIA
from .serializers import (
    AnalisisUrbanisticoSerializer,
    AnalisisCreateSerializer,
    AnalisisUpdateSerializer,
    IniciarProcesoSerializer,
    CompletarAnalisisSerializer,
    RechazarAnalisisSerializer
)
from .services import GeminiAnalysisService
from apps.notifications.services import NotificationService

logger = logging.getLogger(__name__)


class AnalisisUrbanisticoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para análisis urbanístico
    - Owner: Puede crear y ver sus propios análisis
    - Admin: Puede ver todos, asignar, procesar y completar
    """
    queryset = AnalisisUrbanistico.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'tipo_analisis', 'lote', 'solicitante']
    search_fields = ['lote__nombre', 'lote__direccion', 'solicitante__email']
    ordering_fields = ['created_at', 'updated_at', 'estado']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Seleccionar serializer según acción"""
        if self.action == 'create':
            return AnalisisCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AnalisisUpdateSerializer
        return AnalisisUrbanisticoSerializer
    
    def get_queryset(self):
        """Filtrar según permisos"""
        user = self.request.user
        queryset = AnalisisUrbanistico.objects.select_related(
            'lote', 'solicitante', 'analista'
        ).order_by('-created_at')
        
        # Admin ve todos
        if user.is_staff:
            return queryset
        
        # Owner solo ve los suyos
        return queryset.filter(solicitante=user)
    
    def perform_create(self, serializer):
        """Crear análisis con el usuario actual"""
        analisis = serializer.save(solicitante=self.request.user)
        logger.info(f"Análisis creado: {analisis.id} por {self.request.user.email}")
        
        # Notificar a admins
        try:
            NotificationService.notify_nueva_solicitud_analisis(analisis)
        except Exception as e:
            logger.error(f"Error enviando notificación: {e}")
    
    @action(detail=False, methods=['get'])
    def mis_analisis(self, request):
        """Obtener análisis del usuario actual"""
        analisis = self.get_queryset().filter(solicitante=request.user)
        
        page = self.paginate_queryset(analisis)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(analisis, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas de análisis (solo admin)"""
        if not request.user.is_staff:
            return Response({
                'error': 'No tienes permiso para ver estadísticas'
            }, status=status.HTTP_403_FORBIDDEN)
        
        stats = AnalisisUrbanistico.objects.aggregate(
            total=Count('id'),
            pendientes=Count('id', filter=Q(estado='pendiente')),
            en_proceso=Count('id', filter=Q(estado='en_proceso')),
            completados=Count('id', filter=Q(estado='completado')),
            rechazados=Count('id', filter=Q(estado='rechazado'))
        )
        
        # Contar por tipo
        por_tipo = {}
        for choice in AnalisisUrbanistico.TIPO_ANALISIS_CHOICES:
            tipo_key = choice[0]
            count = AnalisisUrbanistico.objects.filter(tipo_analisis=tipo_key).count()
            por_tipo[tipo_key] = {
                'label': choice[1],
                'count': count
            }
        
        stats['por_tipo'] = por_tipo
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def iniciar_proceso(self, request, pk=None):
        """
        ✅ Iniciar proceso de análisis (admin toma el análisis)
        """
        analisis = self.get_object()
        
        if not analisis.esta_pendiente:
            return Response({
                'success': False,
                'error': 'Solo se pueden iniciar análisis pendientes'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # ✅ Cambiar estado a en_proceso y asignar analista
            analisis.estado = 'en_proceso'
            analisis.analista = request.user
            analisis.save()
            
            logger.info(f"[Analisis] {request.user.email} inició análisis {analisis.id}")
            
            return Response({
                'success': True,
                'message': 'Análisis iniciado correctamente',
                'analisis': AnalisisDetailSerializer(analisis).data
            })
            
        except Exception as e:
            logger.error(f"Error iniciando análisis: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al iniciar análisis: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def completar(self, request, pk=None):
        """Completar análisis (admin)"""
        analisis = self.get_object()
        
        if analisis.estado != 'en_proceso':
            return Response({
                'success': False,
                'error': 'El análisis debe estar en proceso'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CompletarAnalisisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        resultados = serializer.validated_data['resultados']
        observaciones = serializer.validated_data.get('observaciones')
        
        analisis.completar(resultados, observaciones)
        
        # Notificar al solicitante
        try:
            NotificationService.notify_analisis_completado(analisis)
        except Exception as e:
            logger.error(f"Error enviando notificación: {e}")
        
        return Response({
            'success': True,
            'message': 'Análisis completado correctamente',
            'data': AnalisisUrbanisticoSerializer(analisis).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def rechazar(self, request, pk=None):
        """
        ✅ Rechazar análisis
        """
        analisis = self.get_object()
        
        if analisis.esta_completado:
            return Response({
                'success': False,
                'error': 'No se puede rechazar un análisis completado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            motivo = request.data.get('motivo', '')
            if not motivo:
                return Response({
                    'success': False,
                    'error': 'Debe proporcionar un motivo de rechazo'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            analisis.estado = 'rechazado'
            analisis.resultados = {
                'motivo_rechazo': motivo,
                'rechazado_por': request.user.email,
                'fecha_rechazo': timezone.now().isoformat()
            }
            analisis.save()
            
            logger.info(f"[Analisis] Rechazado por {request.user.email}: {analisis.id}")
            
            return Response({
                'success': True,
                'message': 'Análisis rechazado'
            })
            
        except Exception as e:
            logger.error(f"Error rechazando análisis: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al rechazar análisis: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def generar_ia(self, request, pk=None):
        """
        Generar análisis con IA (NO guarda en BD, solo retorna JSON)
        """
        analisis = self.get_object()
        
        if not (analisis.esta_en_proceso or analisis.esta_pendiente):
            return Response({
                'success': False,
                'error': f'El análisis debe estar en proceso o pendiente'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f"[Analisis] 🤖 Generando IA para análisis {analisis.id}")
            
            # Si está pendiente, cambiar a en_proceso
            if analisis.esta_pendiente:
                analisis.estado = 'en_proceso'
                analisis.analista = request.user
                analisis.save()
            
            # ✅ CRÍTICO: Generar con IA (SIN guardar)
            service = GeminiAnalysisService()
            respuesta_ia = service.generar_analisis(analisis)
            
            logger.info(f"[Analisis] ✅ IA generada exitosamente para {analisis.id}")
            
            # ✅ CRÍTICO: Solo retornar JSON (NO guardar en analisis.resultados)
            return Response({
                'success': True,
                'message': 'Análisis generado con IA',
                'data': {
                    'respuesta': respuesta_ia.respuesta,
                    'modelo': respuesta_ia.modelo_ia,
                    'tokens_usados': respuesta_ia.tokens_usados,
                    'tiempo_respuesta': respuesta_ia.tiempo_respuesta,
                    'prompt': respuesta_ia.prompt[:500] + '...'  # Preview del prompt
                }
            })
            
        except Exception as e:
            logger.error(f"Error generando análisis IA: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Error al generar análisis: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def aprobar_ia(self, request, pk=None):
        """
        ✅ CRÍTICO: Aprobar respuesta editada y guardar en BD
        """
        analisis = self.get_object()
        
        if not analisis.esta_en_proceso:
            return Response({
                'success': False,
                'error': 'El análisis debe estar en proceso'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # ✅ CRÍTICO: Log detallado de lo que llega
            logger.info(f"[Analisis] 📥 aprobar_ia - Request data keys: {list(request.data.keys())}")
            logger.info(f"[Analisis] 📥 respuesta_ia presente: {'respuesta_ia' in request.data}")
            logger.info(f"[Analisis] 📥 respuesta_ia longitud: {len(request.data.get('respuesta_ia', ''))}")
            
            # ✅ CORREGIDO: Obtener respuesta editada
            respuesta_ia_editada = request.data.get('respuesta_ia', '').strip()
            notas_revision = request.data.get('notas_revision', '').strip()
            
            # ✅ Log de valores
            logger.info(f"[Analisis] 📥 respuesta_ia_editada length: {len(respuesta_ia_editada)}")
            logger.info(f"[Analisis] 📥 notas_revision length: {len(notas_revision)}")
            
            # ✅ NUEVO: Metadata puede venir como string o dict
            metadata = request.data.get('metadata', {})
            if isinstance(metadata, str):
                import json
                try:
                    metadata = json.loads(metadata)
                    logger.info(f"[Analisis] ✅ Metadata parseado: {metadata}")
                except Exception as e:
                    logger.warning(f"[Analisis] ⚠️ Error parsing metadata: {e}")
                    metadata = {}
            
            # ✅ CRÍTICO: Validación más específica
            if not respuesta_ia_editada:
                logger.error(f"[Analisis] ❌ respuesta_ia está vacía")
                logger.error(f"[Analisis] ❌ Valor recibido: '{respuesta_ia_editada}'")
                logger.error(f"[Analisis] ❌ Tipo: {type(respuesta_ia_editada)}")
                return Response({
                    'success': False,
                    'error': 'Debe proporcionar una respuesta de IA (campo vacío o no enviado)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"[Analisis] 💾 Guardando respuesta IA para {analisis.id}")
            logger.info(f"[Analisis] 💾 Longitud final: {len(respuesta_ia_editada)} caracteres")
            
            # ✅ CRÍTICO: Guardar en resultados
            analisis.resultados = {
                'generado_con_ia': True,
                'respuesta_ia': respuesta_ia_editada,
                'modelo_ia': metadata.get('modelo', 'gemini-pro'),
                'tokens': metadata.get('tokens_usados', 0),
                'tiempo_respuesta': metadata.get('tiempo_respuesta', 0),
                'aprobado_por': request.user.email,
                'fecha_aprobacion': timezone.now().isoformat(),
                'notas_revision': notas_revision if notas_revision else None,
                'editado': True
            }
            
            # ✅ CRÍTICO: Cambiar estado a completado
            analisis.estado = 'completado'
            analisis.fecha_completado = timezone.now()
            analisis.save()
            
            logger.info(f"[Analisis] ✅ Análisis {analisis.id} aprobado exitosamente")
            
            return Response({
                'success': True,
                'intent': 'aprobar_ia',
                'message': 'Análisis aprobado y guardado exitosamente'
            })
            
        except Exception as e:
            logger.error(f"[Analisis] ❌ Error aprobando: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': f'Error al aprobar análisis: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def parametros(self, request):
        """
        ✅ NUEVO: Obtener parámetros urbanísticos agrupados por categoría
        """
        from .models import ParametroUrbanistico
        
        try:
            parametros = ParametroUrbanistico.objects.filter(activo=True).order_by('categoria', 'orden')
            
            # Agrupar por categoría
            parametros_agrupados = {}
            for param in parametros:
                categoria_display = param.get_categoria_display()
                if categoria_display not in parametros_agrupados:
                    parametros_agrupados[categoria_display] = []
                
                parametros_agrupados[categoria_display].append({
                    'id': str(param.id),
                    'nombre': param.nombre,
                    'descripcion': param.descripcion,
                    'articulo_pot': param.articulo_pot,
                    'datos': param.datos,
                    'orden': param.orden
                })
            
            return Response({
                'success': True,
                'data': parametros_agrupados
            })
            
        except Exception as e:
            logger.error(f"Error obteniendo parámetros: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error al obtener parámetros'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def parametros_urbanisticos_view(request):
    """
    ✅ NUEVO: Vista para obtener parámetros urbanísticos agrupados por categoría
    GET /api/analisis/parametros/
    """
    from .models import ParametroUrbanistico
    
    try:
        parametros = ParametroUrbanistico.objects.filter(activo=True).order_by('categoria', 'orden')
        
        # Agrupar por categoría
        parametros_agrupados = {}
        for param in parametros:
            categoria_display = param.get_categoria_display()
            if categoria_display not in parametros_agrupados:
                parametros_agrupados[categoria_display] = []
            
            parametros_agrupados[categoria_display].append({
                'id': str(param.id),
                'nombre': param.nombre,
                'descripcion': param.descripcion,
                'articulo_pot': param.articulo_pot,
                'datos': param.datos,
                'orden': param.orden
            })
        
        logger.info(f"✅ Parámetros urbanísticos recuperados: {len(parametros)} parámetros en {len(parametros_agrupados)} categorías")
        
        return Response({
            'success': True,
            'data': parametros_agrupados,
            'total': len(parametros)
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo parámetros: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error al obtener parámetros urbanísticos'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
