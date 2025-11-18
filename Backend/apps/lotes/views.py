"""
Vistas consolidadas para el módulo de lotes
Organizado por secciones: CRUD, Favoritos, Verificación, Estadísticas
"""
from rest_framework import generics, viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging
import uuid

from .models import Lote, Favorite, Tratamiento
from .serializers import (
    LoteSerializer, LoteCreateSerializer, FavoriteSerializer
)
from .filters import LoteFilter
from .permissions import IsOwnerOrAdmin
from .services import LotesService, TratamientosService

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


class AvailableLotesView(generics.ListAPIView):
    """Lotes disponibles para desarrolladores"""
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LoteFilter
    search_fields = ['cbml', 'matricula', 'direccion', 'barrio', 'nombre']
    ordering_fields = ['created_at', 'area', 'estrato']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Lote.objects.filter(
            status='active',
            is_verified=True
        ).select_related('owner')


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
        Verificar o rechazar lote
        Body: { "action": "verify|reject", "reason": "..." }
        """
        try:
            lote = get_object_or_404(Lote, pk=pk)
            action = request.data.get('action')
            
            if action == 'verify':
                lote.is_verified = True
                lote.status = 'active'
                message = f'Lote {lote.nombre} verificado'
                
            elif action == 'reject':
                lote.is_verified = False
                lote.status = 'archived'
                lote.metadatos['rejection_reason'] = request.data.get('reason', '')
                message = f'Lote {lote.nombre} rechazado'
                
            else:
                return Response({
                    'success': False,
                    'error': 'Acción inválida. Use verify o reject'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            lote.save()
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
