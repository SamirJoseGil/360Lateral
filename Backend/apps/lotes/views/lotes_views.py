"""
Vistas principales para gestión de lotes - SIN MapGIS
"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
import logging

from ..models import Lote
from ..serializers import LoteSerializer, LoteCreateSerializer
from ..filters import LoteFilter
from ..permissions import IsOwnerOrAdmin

logger = logging.getLogger(__name__)


class LoteListCreateView(generics.ListCreateAPIView):
    """
    Lista y crea lotes.
    
    GET: Lista todos los lotes del usuario
    POST: Crea un nuevo lote
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LoteFilter
    search_fields = ['cbml', 'matricula', 'direccion', 'barrio']
    ordering_fields = ['created_at', 'area', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LoteCreateSerializer
        return LoteSerializer
    
    def get_queryset(self):
        """Filtrar lotes según el usuario"""
        user = self.request.user
        
        if user.is_admin:
            return Lote.objects.all()
        elif user.is_owner:
            return Lote.objects.filter(owner=user)
        elif user.is_developer:
            # Desarrolladores ven todos los lotes activos
            return Lote.objects.filter(status='active')
        
        return Lote.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Crear lote asignando el owner"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Asignar el usuario actual como owner
        lote = serializer.save(owner=request.user)
        
        logger.info(f"Lote created: {lote.cbml} by {request.user.email}")
        
        return Response(
            LoteSerializer(lote).data,
            status=status.HTTP_201_CREATED
        )


class LoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Obtiene, actualiza o elimina un lote específico.
    ✅ CORREGIDO: Soft delete en lugar de eliminación real
    """
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    lookup_field = 'pk'
    
    def perform_destroy(self, instance):
        """✅ SOFT DELETE: Archivar en lugar de eliminar"""
        instance.soft_delete()
        logger.info(f"Lote {instance.id} archivado por {self.request.user.email}")


class LoteAnalysisView(APIView):
    """
    Genera análisis urbanístico de un lote - SIN MapGIS
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Obtener análisis urbanístico del lote"""
        try:
            lote = Lote.objects.get(pk=pk)
            
            # Verificar permisos
            if not (request.user.is_admin or lote.owner == request.user):
                return Response({
                    'error': 'No tienes permiso para ver este análisis'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Análisis básico con datos del lote
            analysis = {
                'lote_id': str(lote.id),
                'cbml': lote.cbml,
                'area': float(lote.area) if lote.area else None,
                'ubicacion': {
                    'direccion': lote.direccion,
                    'barrio': lote.barrio,
                    'estrato': lote.estrato,
                    'latitud': float(lote.latitud) if lote.latitud else None,
                    'longitud': float(lote.longitud) if lote.longitud else None,
                },
                'normativa': {
                    'clasificacion_suelo': lote.clasificacion_suelo,
                    'uso_suelo': lote.uso_suelo,
                    'tratamiento_pot': lote.tratamiento_pot,
                },
                'estado': {
                    'status': lote.status,
                    'is_verified': lote.is_verified,
                    'created_at': lote.created_at.isoformat(),
                }
            }
            
            return Response({
                'success': True,
                'data': analysis
            })
            
        except Lote.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Lote no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in lote analysis: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error generando análisis'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AvailableLotesView(generics.ListAPIView):
    """
    Lista lotes disponibles para desarrolladores (verificados y activos)
    ✅ CORREGIDO: Solo mostrar lotes activos y verificados
    """
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LoteFilter
    search_fields = ['cbml', 'matricula', 'direccion', 'barrio', 'nombre']
    ordering_fields = ['created_at', 'area', 'estrato']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """✅ Solo lotes que pueden ser mostrados"""
        return Lote.objects.filter(
            status='active',
            is_verified=True,
            is_active=True  # Adicional: asegurar que no estén soft-deleted
        ).select_related('owner')
    
    def get(self, request, *args, **kwargs):
        """Obtener lotes disponibles con filtros"""
        # Verificar que sea developer
        if not hasattr(request.user, 'role') or request.user.role != 'developer':
            return Response({
                'error': 'Solo desarrolladores pueden acceder a esta vista'
            }, status=status.HTTP_403_FORBIDDEN)
        
        queryset = self.filter_queryset(self.get_queryset())
        
        # Aplicar filtros adicionales desde query params
        area_min = request.query_params.get('area_min')
        area_max = request.query_params.get('area_max')
        estrato = request.query_params.get('estrato')
        barrio = request.query_params.get('barrio')
        
        if area_min:
            try:
                queryset = queryset.filter(area__gte=float(area_min))
            except ValueError:
                pass
                
        if area_max:
            try:
                queryset = queryset.filter(area__lte=float(area_max))
            except ValueError:
                pass
                
        if estrato:
            try:
                queryset = queryset.filter(estrato=int(estrato))
            except ValueError:
                pass
                
        if barrio:
            queryset = queryset.filter(barrio__icontains=barrio)
        
        # ✅ MEJORADO: Match profile con lógica más permisiva
        match_profile = request.user.match_profile
        
        if match_profile:
            perfil = request.user
            
            # Construir filtros con OR (al menos 1 coincidencia)
            from django.db.models import Q
            
            match_conditions = Q()  # Inicializar Q object vacío
            
            # Si tiene ciudades de interés, agregar condición
            if perfil.ciudades_interes:
                # Buscar lotes que estén en alguna de las ciudades
                for ciudad in perfil.ciudades_interes:
                    match_conditions |= Q(barrio__icontains=ciudad) | Q(direccion__icontains=ciudad)
            
            # Si tiene usos preferidos, agregar condición
            if perfil.usos_preferidos:
                for uso in perfil.usos_preferidos:
                    match_conditions |= Q(uso_suelo__icontains=uso)
            
            # Si tiene modelos de pago (esto puede estar en metadatos)
            if perfil.modelos_pago:
                for modelo in perfil.modelos_pago:
                    match_conditions |= Q(metadatos__modelo_pago__icontains=modelo)
            
            # ✅ Aplicar filtro con OR (al menos 1 debe cumplirse)
            if match_conditions:
                queryset = queryset.filter(match_conditions)
                logger.info(f"🎯 Filtro de match aplicado para {request.user.email}")
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        
        logger.info(f"Developer {request.user.email} accessed {queryset.count()} available lotes")
        
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })