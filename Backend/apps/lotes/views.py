"""
Vistas consolidadas para el módulo de lotes
"""
from rest_framework import generics, viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging
import uuid

from apps.documents.models import Document

from .models import Lote, Favorite, Tratamiento
from .serializers import (
    LoteSerializer, LoteCreateSerializer, FavoriteSerializer
)
from .filters import LoteFilter
from .permissions import IsOwnerOrAdmin
from .services import LotesService, TratamientosService
from django.db.models import Prefetch, Q
from apps.common.cache import CacheService, cache_result

User = get_user_model()
logger = logging.getLogger(__name__)


# =============================================================================
# SECCIÓN 1: CRUD DE LOTES
# =============================================================================

class LoteListCreateView(generics.ListCreateAPIView):
    """Lista y crea lotes según permisos del usuario"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LoteFilter
    search_fields = ['cbml', 'matricula', 'direccion', 'barrio', 'nombre']
    ordering_fields = ['created_at', 'area', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        return LoteCreateSerializer if self.request.method == 'POST' else LoteSerializer
    
    def get_queryset(self):
        """Filtrar lotes según rol del usuario"""
        user = self.request.user
        
        if user.is_admin:
            return Lote.objects.all()
        elif user.is_owner:
            return Lote.objects.filter(owner=user)
        elif user.is_developer:
            return Lote.objects.filter(status='active', is_verified=True)
        
        return Lote.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Crear lote con owner asignado automáticamente"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        lote = serializer.save(owner=request.user)
        logger.info(f"✅ Lote creado: {lote.id} por {request.user.email}")
        
        return Response(
            LoteSerializer(lote, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class LoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualización y eliminación de lote"""
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    lookup_field = 'pk'
    
    def perform_destroy(self, instance):
        """Archivar en lugar de eliminar"""
        instance.status = 'archived'
        instance.save()
        logger.info(f"Lote archivado: {instance.id}")


class AvailableLotesView(APIView):
    """
    Vista para obtener lotes disponibles (verificados y activos)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtener lotes disponibles con filtros"""
        try:
            # ✅ CRÍTICO: Filtrar solo lotes activos y verificados
            queryset = Lote.objects.select_related('owner').filter(
                status='active',
                is_verified=True
            )
            
            # ✅ LOGGING
            total_count = queryset.count()
            logger.info(f"[AvailableLotes] Total lotes disponibles: {total_count}")
            
            # Aplicar filtros adicionales
            ciudad = request.query_params.get('ciudad')
            if ciudad:
                queryset = queryset.filter(ciudad__iexact=ciudad)
                logger.info(f"[AvailableLotes] Filtrado por ciudad '{ciudad}': {queryset.count()} lotes")
            
            uso_suelo = request.query_params.get('uso_suelo')
            if uso_suelo:
                queryset = queryset.filter(uso_suelo__icontains=uso_suelo)
            
            area_min = request.query_params.get('area_min')
            if area_min:
                queryset = queryset.filter(area__gte=float(area_min))
            
            area_max = request.query_params.get('area_max')
            if area_max:
                queryset = queryset.filter(area__lte=float(area_max))
            
            # ✅ NUEVO: Match con perfil de inversión
            match_profile = request.query_params.get('match_profile') == 'true'
            if match_profile and hasattr(request.user, 'ciudades_interes'):
                ciudades_interes = request.user.ciudades_interes or []
                if ciudades_interes:
                    queryset = queryset.filter(ciudad__in=ciudades_interes)
            
            # ✅ LOGGING FINAL
            final_count = queryset.count()
            logger.info(f"[AvailableLotes] Lotes después de filtros: {final_count}")
            
            # Serializar
            serializer = LoteSerializer(queryset, many=True)
            
            return Response({
                'success': True,
                'count': final_count,
                'lotes': serializer.data  # ✅ Asegurar que sea 'lotes'
            })
            
        except Exception as e:
            logger.error(f"[AvailableLotes] Error: {str(e)}")
            return Response({
                'success': False,
                'error': str(e),
                'lotes': []
            }, status=500)


# =============================================================================
# SECCIÓN 2: FAVORITOS
# =============================================================================

class FavoriteViewSet(viewsets.ModelViewSet):
    """Gestión de favoritos de lotes"""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(
            user=self.request.user
        ).select_related('lote', 'user')
    
    def create(self, request, *args, **kwargs):
        """Crear favorito con validación de UUID"""
        try:
            lote_id = request.data.get('lote')
            
            if not lote_id:
                return Response({
                    'success': False,
                    'error': 'El ID del lote es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar UUID
            try:
                lote_uuid = uuid.UUID(str(lote_id))
            except ValueError:
                return Response({
                    'success': False,
                    'error': f'UUID inválido: {lote_id}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que el lote existe
            try:
                lote = Lote.objects.get(pk=lote_uuid)
            except Lote.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Lote no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Verificar duplicados
            if Favorite.objects.filter(user=request.user, lote=lote).exists():
                return Response({
                    'success': False,
                    'error': 'Este lote ya está en favoritos'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear favorito
            serializer = self.get_serializer(
                data={'lote': lote.id, 'notas': request.data.get('notas', '')}
            )
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            logger.info(f"✅ Favorito creado: {lote.id} por {request.user.email}")
            
            return Response({
                'success': True,
                'message': 'Lote agregado a favoritos',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creando favorito: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Verificar si un lote es favorito"""
        lote_id = request.query_params.get('lote_id')
        
        if not lote_id:
            return Response({
                'success': False,
                'error': 'lote_id requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            lote_uuid = uuid.UUID(lote_id)
            exists = Favorite.objects.filter(
                user=request.user,
                lote_id=lote_uuid
            ).exists()
            
            return Response({
                'success': True,
                'is_favorite': exists
            })
        except ValueError:
            return Response({
                'success': False,
                'error': 'UUID inválido'
            }, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# SECCIÓN 3: VERIFICACIÓN (ADMIN)
# =============================================================================

class LoteVerificationView(APIView):
    """Verificar o rechazar lotes (solo admin)"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, pk):
        """
        Verificar, rechazar, archivar o reactivar lote
        Body: { 
            "action": "verify|reject|archive|reactivate", 
            "reason": "..." (requerido para reject)
        }
        """
        try:
            lote = get_object_or_404(Lote, pk=pk)
            action = request.data.get('action')
            
            if action == 'verify':
                lote.verify(verified_by=request.user)
                message = f'Lote {lote.nombre} verificado y activado'
                
                # ✅ Notificación
                try:
                    from apps.notifications.services import NotificationService
                    NotificationService.notify_lote_aprobado(lote)
                except ImportError:
                    logger.warning("NotificationService no disponible")
                
            elif action == 'reject':
                reason = request.data.get('reason')
                if not reason:
                    return Response({
                        'success': False,
                        'error': 'Debe proporcionar una razón para el rechazo'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                lote.reject(reason=reason, rejected_by=request.user)
                message = f'Lote {lote.nombre} rechazado'
                
                # ✅ Notificación
                try:
                    from apps.notifications.services import NotificationService
                    NotificationService.notify_lote_rechazado(lote, reason)
                except ImportError:
                    logger.warning("NotificationService no disponible")
                
            elif action == 'archive':
                # ✅ NUEVO: Soporte para archivar
                lote.soft_delete()
                message = f'Lote {lote.nombre} archivado'
                
            elif action == 'reactivate':
                # ✅ NUEVO: Soporte para reactivar
                lote.reactivate()
                message = f'Lote {lote.nombre} reactivado'
                
            else:
                return Response({
                    'success': False,
                    'error': 'Acción inválida. Use verify, reject, archive o reactivate'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"✅ {message} por {request.user.email}")
            
            return Response({
                'success': True,
                'message': message,
                'data': LoteSerializer(lote, context={'request': request}).data
            })
            
        except Exception as e:
            logger.error(f"Error en verificación: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LotePendingVerificationListView(generics.ListAPIView):
    """Lista lotes pendientes de verificación"""
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return Lote.objects.filter(
            status='pending',
            is_verified=False
        ).order_by('-created_at')


# =============================================================================
# SECCIÓN 4: ANÁLISIS Y TRATAMIENTOS
# =============================================================================

class LoteAnalysisView(APIView):
    """Análisis urbanístico de un lote"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Obtener análisis del lote"""
        try:
            lote = get_object_or_404(Lote, pk=pk)
            
            # Verificar permisos
            if not (request.user.is_admin or lote.owner == request.user):
                return Response({
                    'error': 'Sin permisos'
                }, status=status.HTTP_403_FORBIDDEN)
            
            analysis = {
                'lote_id': str(lote.id),
                'cbml': lote.cbml,
                'area': float(lote.area) if lote.area else None,
                'ubicacion': {
                    'direccion': lote.direccion,
                    'barrio': lote.barrio,
                    'estrato': lote.estrato,
                },
                'normativa': {
                    'clasificacion_suelo': lote.clasificacion_suelo,
                    'uso_suelo': lote.uso_suelo,
                    'tratamiento_pot': lote.tratamiento_pot,
                },
                'estado': {
                    'status': lote.status,
                    'is_verified': lote.is_verified,
                }
            }
            
            return Response({
                'success': True,
                'data': analysis
            })
            
        except Exception as e:
            logger.error(f"Error en análisis: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_tratamientos(request):
    """Lista tratamientos urbanísticos disponibles"""
    try:
        tratamientos = Tratamiento.objects.filter(activo=True).order_by('codigo')
        
        data = [{
            'id': t.id,
            'codigo': t.codigo,
            'nombre': t.nombre,
            'descripcion': t.descripcion,
            'indice_ocupacion': float(t.indice_ocupacion) if t.indice_ocupacion else None,
            'indice_construccion': float(t.indice_construccion) if t.indice_construccion else None,
        } for t in tratamientos]
        
        return Response({
            'success': True,
            'count': len(data),
            'tratamientos': data
        })
    except Exception as e:
        logger.error(f"Error listando tratamientos: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# SECCIÓN 5: ESTADÍSTICAS Y REPORTES
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_lote_stats(request, user_id=None):
    """Estadísticas de lotes por usuario"""
    if not user_id:
        user_id = request.user.id
    
    # Verificar permisos
    if str(request.user.id) != str(user_id) and not request.user.is_admin:
        return Response({
            'error': 'Sin permisos'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        target_user = User.objects.get(id=user_id)
        lotes = Lote.objects.filter(owner=target_user)
        
        total_area = sum(l.area for l in lotes if l.area)
        
        stats = {
            'user_id': user_id,
            'user_name': target_user.get_full_name(),
            'total_lotes': lotes.count(),
            'total_area': float(total_area) if total_area else 0,
            'por_estado': {
                'activos': lotes.filter(status='active').count(),
                'pendientes': lotes.filter(status='pending').count(),
                'archivados': lotes.filter(status='archived').count(),
            }
        }
        
        return Response(stats)
    except User.DoesNotExist:
        return Response({
            'error': 'Usuario no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lotes_disponibles(request):
    """
    Lista lotes disponibles con cache y optimización de queries.
    ✅ OPTIMIZADO: select_related + prefetch_related
    """
    # Generar clave de cache
    cache_key = CacheService.generate_key(
        'lotes_list',
        request.GET.get('ciudad', ''),
        request.GET.get('uso_suelo', ''),
        request.GET.get('area_min', ''),
        request.GET.get('area_max', ''),
        request.GET.get('match_profile', ''),
        request.GET.get('page', '1'),
    )
    
    # Intentar obtener del cache
    cached_data = CacheService.get(cache_key, cache_name='search')
    if cached_data:
        logger.info("📦 Returning cached lotes list")
        return Response(cached_data)
    
    # ✅ OPTIMIZADO: Query con select_related y prefetch_related
    queryset = Lote.objects.filter(
        status='active',
        is_verified=True
    ).select_related(
        'owner'  # ✅ JOIN con User en una sola query
    ).prefetch_related(
        Prefetch(
            'documentos',
            queryset=Document.objects.filter(
                metadata__status='validado'
            ).only('id', 'tipo', 'archivo', 'lote_id')
        )
    ).only(
        # ✅ Solo campos necesarios
        'id', 'cbml', 'nombre', 'direccion', 'barrio', 
        'area', 'uso_suelo', 'tratamiento_pot', 'estrato',
        'owner_id', 'created_at', 'updated_at'
    )
    
    # Aplicar filtros
    # ✅ NUEVO: Filtro por ciudad
    ciudad = request.GET.get('ciudad')
    if ciudad:
        # Asumimos que la ciudad está en el campo 'direccion' o 'barrio'
        queryset = queryset.filter(
            Q(direccion__icontains=ciudad) | Q(barrio__icontains=ciudad)
        )
    
    # Filtro por área
    area_min = request.GET.get('area_min')
    area_max = request.GET.get('area_max')
    if area_min:
        queryset = queryset.filter(area__gte=float(area_min))
    if area_max:
        queryset = queryset.filter(area__lte=float(area_max))
    
    # Filtro por estrato
    estrato = request.GET.get('estrato')
    if estrato:
        queryset = queryset.filter(estrato=int(estrato))
    
    # ✅ NUEVO: Filtro por uso de suelo
    uso_suelo = request.GET.get('uso_suelo')
    if uso_suelo:
        queryset = queryset.filter(uso_suelo__icontains=uso_suelo)
    
    # ✅ NUEVO: Filtro por tratamiento POT
    tratamiento = request.GET.get('tratamiento')
    if tratamiento:
        queryset = queryset.filter(tratamiento_pot__icontains=tratamiento)
    
    # Filtro por barrio
    barrio = request.GET.get('barrio')
    if barrio:
        queryset = queryset.filter(barrio__icontains=barrio)
    
    # ✅ NUEVO: Coincidencia con perfil del developer
    match_profile = request.GET.get('match_profile') == 'true'
    if match_profile and request.user.role == 'developer':
        user = request.user
        
        # Filtrar por ciudades de interés
        if user.ciudades_interes and len(user.ciudades_interes) > 0:
            ciudad_filters = Q()
            for ciudad in user.ciudades_interes:
                ciudad_filters |= Q(direccion__icontains=ciudad) | Q(barrio__icontains=ciudad)
            queryset = queryset.filter(ciudad_filters)
        
        # Filtrar por usos preferidos
        if user.usos_preferidos and len(user.usos_preferidos) > 0:
            uso_filters = Q()
            for uso in user.usos_preferidos:
                uso_filters |= Q(uso_suelo__icontains=uso)
            queryset = queryset.filter(uso_filters)
    
    # Ordenamiento
    orden = request.GET.get('orden', '-created_at')
    queryset = queryset.order_by(orden)
    
    # Paginación
    paginator = PageNumberPagination()
    paginator.page_size = int(request.GET.get('page_size', 20))
    
    paginated_lotes = paginator.paginate_queryset(queryset, request)
    serializer = LoteSerializer(paginated_lotes, many=True)
    
    # Calcular match score si aplica
    if request.GET.get('match_profile') == 'true' and request.user.role == 'developer':
        for lote_data in serializer.data:
            lote_data['match_score'] = calcular_match_score(lote_data, request.user)
    
    response_data = {
        'success': True,
        'lotes': serializer.data,
        'count': paginator.page.paginator.count,
        'next': paginator.get_next_link(),
        'previous': paginator.get_previous_link(),
    }
    
    # Guardar en cache por 2 minutos
    CacheService.set(cache_key, response_data, timeout=120, cache_name='search')
    logger.info("💾 Lotes list cached")
    
    return Response(response_data)

def calcular_match_score(lote_data, user):
    """
    Calcula un score de coincidencia entre el lote y el perfil del developer.
    Retorna un porcentaje (0-100).
    """
    score = 0
    total_criterios = 0
    
    # Criterio 1: Ciudad (30%)
    if user.ciudades_interes and len(user.ciudades_interes) > 0:
        total_criterios += 30
        direccion = lote_data.get('direccion', '').lower()
        barrio = lote_data.get('barrio', '').lower()
        
        for ciudad in user.ciudades_interes:
            if ciudad.lower() in direccion or ciudad.lower() in barrio:
                score += 30
                break
    
    # Criterio 2: Uso de suelo (30%)
    if user.usos_preferidos and len(user.usos_preferidos) > 0:
        total_criterios += 30
        uso_lote = lote_data.get('uso_suelo', '').lower()
        
        for uso in user.usos_preferidos:
            if uso.lower() in uso_lote:
                score += 30
                break
    
    # Criterio 3: Volumen de ventas (20%)
    # TODO: Implementar cuando tengamos precios estimados
    total_criterios += 20
    
    # Criterio 4: Ticket de inversión (20%)
    # TODO: Implementar cuando tengamos precios
    total_criterios += 20
    
    # Normalizar score
    if total_criterios > 0:
        return int((score / total_criterios) * 100)
    
    return 0

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

class LoteViewSet(viewsets.ModelViewSet):
    """Gestión de lotes"""
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_admin:
            return Lote.objects.all()
        elif user.is_owner:
            return Lote.objects.filter(owner=user)
        elif user.is_developer:
            return Lote.objects.filter(status='active', is_verified=True)
        
        return Lote.objects.none()
    
    def update(self, request, pk=None):
        """
        Actualizar un lote (admin only)
        PUT/PATCH /api/lotes/{id}/
        """
        try:
            lote = self.get_object()
            logger.info(f"[Lotes] Admin {request.user.email} updating lote {pk}")
            
            # ✅ CORRECCIÓN: Obtener datos del request
            data = request.data.copy()
            
            # ✅ Validar campos numéricos opcionales
            if 'area' in data and data['area']:
                try:
                    data['area'] = float(data['area'])
                except (ValueError, TypeError):
                    return Response({
                        'error': 'El área debe ser un número válido'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if 'estrato' in data and data['estrato']:
                try:
                    data['estrato'] = int(data['estrato'])
                except (ValueError, TypeError):
                    return Response({
                        'error': 'El estrato debe ser un número válido'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            if 'valor' in data and data['valor']:
                try:
                    data['valor'] = float(data['valor'])
                except (ValueError, TypeError):
                    return Response({
                        'error': 'El valor debe ser un número válido'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Convertir string vacío a None para campos opcionales
            optional_fields = [
                'cbml', 'matricula', 'codigo_catastral', 'barrio', 
                'descripcion', 'tratamiento_pot', 'uso_suelo', 
                'clasificacion_suelo', 'forma_pago'
            ]
            
            for field in optional_fields:
                if field in data and data[field] == '':
                    data[field] = None
            
            # ✅ Serializar y validar
            serializer = self.get_serializer(lote, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # ✅ Guardar cambios
            with transaction.atomic():
                updated_lote = serializer.save()
                logger.info(f"[Lotes] Lote {pk} updated successfully")
            
            return Response({
                'success': True,
                'message': 'Lote actualizado exitosamente',
                'lote': self.get_serializer(updated_lote).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"[Lotes] Error updating lote {pk}: {str(e)}")
            return Response({
                'error': 'Error al actualizar lote',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ✅ NUEVO: Vista para gestionar desarrolladores de un lote
@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_lote_developers(request, lote_id):
    """
    Gestionar desarrolladores de un lote (solo propietario)
    
    POST: Agregar desarrollador
    DELETE: Remover desarrollador
    
    Body: { "desarrollador_id": "uuid" }
    """
    from apps.lotes.serializers import LoteDesarrolladoresSerializer
    from apps.users.models import User
    
    try:
        lote = get_object_or_404(Lote, id=lote_id)
        
        # ✅ CRÍTICO: Solo el propietario puede gestionar desarrolladores
        if lote.owner != request.user and not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Solo el propietario del lote puede gestionar desarrolladores'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Validar datos
        serializer = LoteDesarrolladoresSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        desarrollador_id = serializer.validated_data['desarrollador_id']
        desarrollador = User.objects.get(id=desarrollador_id)
        
        if request.method == 'POST':
            # ✅ Agregar desarrollador
            if lote.desarrolladores.filter(id=desarrollador.id).exists():
                return Response({
                    'success': False,
                    'message': 'Este desarrollador ya tiene acceso al lote'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            lote.desarrolladores.add(desarrollador)
            logger.info(f"✅ Desarrollador {desarrollador.email} agregado al lote {lote.id}")
            
            return Response({
                'success': True,
                'message': f'Desarrollador {desarrollador.email} agregado exitosamente',
                'desarrolladores': [
                    {
                        'id': str(d.id),
                        'email': d.email,
                        'nombre': d.get_full_name()
                    }
                    for d in lote.desarrolladores.all()
                ]
            })
        
        elif request.method == 'DELETE':
            # ✅ Remover desarrollador
            if not lote.desarrolladores.filter(id=desarrollador.id).exists():
                return Response({
                    'success': False,
                    'message': 'Este desarrollador no tiene acceso al lote'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            lote.desarrolladores.remove(desarrollador)
            logger.info(f"✅ Desarrollador {desarrollador.email} removido del lote {lote.id}")
            
            return Response({
                'success': True,
                'message': f'Desarrollador {desarrollador.email} removido exitosamente',
                'desarrolladores': [
                    {
                        'id': str(d.id),
                        'email': d.email,
                        'nombre': d.get_full_name()
                    }
                    for d in lote.desarrolladores.all()
                ]
            })
            
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Desarrollador no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"❌ Error gestionando desarrolladores: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_lote_developers(request, lote_id):
    """
    Listar desarrolladores de un lote
    GET /api/lotes/{lote_id}/developers/
    """
    try:
        lote = get_object_or_404(Lote, id=lote_id)
        
        # ✅ Solo propietario o admin pueden ver
        if lote.owner != request.user and not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Sin permisos para ver desarrolladores de este lote'
            }, status=status.HTTP_403_FORBIDDEN)
        
        desarrolladores = lote.desarrolladores.all()
        
        return Response({
            'success': True,
            'desarrolladores': [
                {
                    'id': str(d.id),
                    'email': d.email,
                    'nombre': d.get_full_name(),
                    'developer_type': d.developer_type,
                    'legal_name': d.legal_name
                }
                for d in desarrolladores
            ],
            'count': desarrolladores.count()
        })
        
    except Exception as e:
        logger.error(f"❌ Error listando desarrolladores: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ✅ NUEVO: Vista para listar todos los desarrolladores disponibles (para propietarios)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_available_developers(request):
    """
    Listar todos los desarrolladores activos (para que propietarios puedan asignarlos)
    GET /api/lotes/available-developers/
    """
    from apps.users.models import User
    
    try:
        # Solo propietarios y admins pueden ver esta lista
        if request.user.role not in ['owner', 'admin']:
            return Response({
                'success': False,
                'error': 'Solo propietarios pueden ver desarrolladores disponibles'
            }, status=status.HTTP_403_FORBIDDEN)
        
        desarrolladores = User.objects.filter(
            role='developer',
            is_active=True
        ).order_by('legal_name', 'email')
        
        return Response({
            'success': True,
            'desarrolladores': [
                {
                    'id': str(d.id),
                    'email': d.email,
                    'nombre': d.get_full_name(),
                    'legal_name': d.legal_name,
                    'developer_type': d.developer_type,
                    'person_type': d.person_type
                }
                for d in desarrolladores
            ],
            'count': desarrolladores.count()
        })
        
    except Exception as e:
        logger.error(f"❌ Error listando desarrolladores disponibles: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
