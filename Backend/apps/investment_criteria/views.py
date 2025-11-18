"""
Vistas para criterios de inversión
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
import logging

from .models import InvestmentCriteria, CriteriaMatch
from .serializers import (
    InvestmentCriteriaSerializer,
    InvestmentCriteriaCreateSerializer,
    CriteriaMatchSerializer
)

logger = logging.getLogger(__name__)


class InvestmentCriteriaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar criterios de inversión"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Seleccionar serializer según acción"""
        if self.action == 'create':
            return InvestmentCriteriaCreateSerializer
        return InvestmentCriteriaSerializer
    
    def get_queryset(self):
        """✅ CORREGIDO: Admin ve TODOS, developer ve solo los suyos"""
        user = self.request.user
        
        # ✅ CRÍTICO: Admin ve TODOS los criterios
        if user.is_staff or user.role == 'admin':
            logger.info(f"[Investment Criteria] Admin {user.email} accessing all criteria")
            return InvestmentCriteria.objects.all()
        
        # ✅ Solo desarrolladores pueden tener criterios
        if user.role != 'developer':
            logger.warning(f"[Investment Criteria] Non-developer user {user.email} accessing criteria")
            return InvestmentCriteria.objects.none()
        
        # Desarrollador ve solo los suyos
        logger.info(f"[Investment Criteria] Developer {user.email} accessing own criteria")
        return InvestmentCriteria.objects.filter(developer=user)
    
    @action(detail=False, methods=['get'])
    def my_criteria(self, request):
        """Obtener mis criterios activos"""
        criteria = InvestmentCriteria.objects.filter(
            developer=request.user,
            status='active'
        ).order_by('-created_at')
        
        serializer = self.get_serializer(criteria, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Activar/desactivar criterio"""
        criteria = self.get_object()
        
        if criteria.status == 'active':
            criteria.status = 'inactive'
        else:
            criteria.status = 'active'
        
        criteria.save()
        
        serializer = self.get_serializer(criteria)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def matching_lotes(self, request, pk=None):
        """Obtener lotes que coinciden con este criterio"""
        criteria = self.get_object()
        
        from apps.lotes.models import Lote
        from apps.lotes.serializers import LoteSerializer
        from django.db.models import Q
        
        # Construir query
        queryset = Lote.objects.filter(
            status='active',
            is_verified=True,
            area__gte=criteria.area_min,
            area__lte=criteria.area_max
        )
        
        # Filtrar por zonas
        if criteria.zones:
            zone_filters = Q()
            for zone in criteria.zones:
                zone_filters |= Q(barrio__icontains=zone)
            queryset = queryset.filter(zone_filters)
        
        # Filtrar por estratos
        if criteria.estratos:
            queryset = queryset.filter(estrato__in=criteria.estratos)
        
        # Paginación
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 12))
        start = (page - 1) * page_size
        end = start + page_size
        
        total = queryset.count()
        lotes = queryset[start:end]
        
        serializer = LoteSerializer(lotes, many=True, context={'request': request})
        
        return Response({
            'count': total,
            'results': serializer.data,
            'page': page,
            'total_pages': (total + page_size - 1) // page_size
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """✅ CORREGIDO: Resumen correcto según usuario"""
        user = request.user
        
        # Admin obtiene resumen global
        if user.is_staff or user.role == 'admin':
            queryset = InvestmentCriteria.objects.all()
        else:
            queryset = InvestmentCriteria.objects.filter(developer=user)
        
        total = queryset.count()
        active = queryset.filter(status='active').count()
        inactive = total - active
        
        logger.info(f"[Investment Criteria] Summary for {user.email}: total={total}, active={active}")
        
        return Response({
            'total': total,
            'active': active,
            'inactive': inactive
        })
