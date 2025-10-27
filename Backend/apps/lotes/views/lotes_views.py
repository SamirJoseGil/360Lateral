"""
Vistas principales para gestión de lotes
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
    """
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    lookup_field = 'pk'
    
    def perform_destroy(self, instance):
        """Solo permitir eliminación por el propietario"""
        if instance.owner != self.request.user and not self.request.user.is_admin:
            return Response(
                {'error': 'No tienes permiso para eliminar este lote'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()


class LoteMapGISSearchView(APIView):
    """
    Busca información de lote en MapGIS (autenticado)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Buscar por CBML, matrícula o dirección
        
        Body:
        {
            "search_type": "cbml|matricula|direccion",
            "value": "valor de búsqueda"
        }
        """
        from ..services.mapgis_service import MapGISService
        
        search_type = request.data.get('search_type')
        value = request.data.get('value')
        
        if not search_type or not value:
            return Response({
                'success': False,
                'error': 'search_type y value son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        service = MapGISService()
        
        try:
            if search_type == 'cbml':
                result = service.buscar_por_cbml(value)
            elif search_type == 'matricula':
                result = service.buscar_por_matricula(value)
            elif search_type == 'direccion':
                result = service.buscar_por_direccion(value)
            else:
                return Response({
                    'success': False,
                    'error': 'search_type inválido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(result)
            
        except Exception as e:
            logger.error(f"Error in MapGIS search: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error en la búsqueda de MapGIS'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoteAnalysisView(APIView):
    """
    Genera análisis urbanístico de un lote
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
            
            # Calcular análisis
            potencial = lote.calcular_potencial_constructivo()
            
            analysis = {
                'lote_id': str(lote.id),
                'cbml': lote.cbml,
                'potencial_constructivo': potencial,
                'normativa': {
                    'tratamiento': lote.tratamiento_urbanistico,
                    'uso_suelo': lote.uso_suelo,
                    'altura_maxima': float(lote.altura_maxima) if lote.altura_maxima else None,
                    'indice_ocupacion': float(lote.indice_ocupacion) if lote.indice_ocupacion else None,
                    'indice_construccion': float(lote.indice_construccion) if lote.indice_construccion else None,
                },
                'valoracion': {
                    'avaluo_catastral': float(lote.avaluo_catastral) if lote.avaluo_catastral else None,
                    'valor_comercial': float(lote.valor_comercial) if lote.valor_comercial else None,
                    'valor_m2': float(lote.valor_m2) if lote.valor_m2 else None,
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
    """
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LoteFilter
    search_fields = ['cbml', 'matricula', 'direccion', 'barrio', 'nombre']
    ordering_fields = ['created_at', 'area', 'estrato']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Solo lotes verificados y activos para developers"""
        return Lote.objects.filter(
            status='active',
            is_verified=True
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