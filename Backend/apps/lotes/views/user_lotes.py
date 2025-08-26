"""
Vistas especializadas para gestionar lotes por usuario.
"""
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from apps.lotes.models import Lote
from apps.lotes.serializers import LoteSerializer, LoteDetailSerializer
from apps.lotes.filters import LoteFilterSet
from apps.users.models import User

class UserLotesView(generics.ListAPIView):
    """
    Endpoint para listar lotes por usuario específico.
    
    Permite:
    - A un usuario ver sus propios lotes
    - A un administrador ver lotes de cualquier usuario
    - Filtrar y ordenar por diferentes parámetros
    """
    serializer_class = LoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LoteFilterSet
    search_fields = ['nombre', 'direccion', 'codigo_catastral', 'matricula', 'cbml']
    ordering_fields = ['nombre', 'area', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtra lotes según el ID de usuario solicitado y los permisos del usuario actual."""
        user_id = self.kwargs.get('user_id')
        
        # Verificar permisos
        request_user = self.request.user
        target_user = User.objects.filter(id=user_id).first()
        
        if not target_user:
            return Lote.objects.none()
            
        # Admin puede ver lotes de cualquier usuario
        if request_user.is_superuser or request_user.role == 'admin':
            return Lote.objects.filter(owner=target_user)
            
        # Developer puede ver lotes asociados a sus proyectos
        elif request_user.role == 'developer':
            if request_user.id == int(user_id):
                # Un desarrollador viendo sus propios lotes
                return Lote.objects.filter(proyectos__developers=request_user)
            else:
                # Un desarrollador viendo lotes de otro usuario
                return Lote.objects.filter(
                    owner=target_user,
                    proyectos__developers=request_user
                )
                
        # Owner y usuarios normales solo pueden ver sus propios lotes
        elif request_user.id == int(user_id):
            return Lote.objects.filter(owner=request_user)
            
        # No tiene permisos para ver lotes de otro usuario
        return Lote.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Lista los lotes con información adicional."""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        
        # Añadir metadatos útiles
        user_id = self.kwargs.get('user_id')
        try:
            target_user = User.objects.get(id=user_id)
            user_name = f"{target_user.first_name} {target_user.last_name}"
        except User.DoesNotExist:
            user_name = "Usuario desconocido"
            
        response_data = {
            'count': queryset.count(),
            'user_id': user_id,
            'user_name': user_name,
            'results': serializer.data
        }
        
        return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_lotes(request):
    """
    Endpoint conveniente para obtener los lotes del usuario autenticado.
    Redirige automáticamente a /api/users/{user_id}/lotes/
    """
    user_id = request.user.id
    return Response({
        'redirect_url': f'/api/users/{user_id}/lotes/',
        'message': 'Redirigiendo a tus lotes'
    }, status=status.HTTP_307_TEMPORARY_REDIRECT, 
    headers={'Location': f'/api/users/{user_id}/lotes/'})


class UserLoteStatsView(generics.RetrieveAPIView):
    """
    Proporciona estadísticas sobre los lotes de un usuario específico.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id=None):
        """Obtiene estadísticas de lotes por usuario."""
        # Verificar permisos
        if not user_id:
            user_id = request.user.id
            
        if str(request.user.id) != str(user_id) and not (
            request.user.is_superuser or request.user.role == 'admin'
        ):
            return Response(
                {"detail": "No tienes permiso para ver estadísticas de este usuario."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Usuario no encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Obtener todos los lotes del usuario
        lotes = Lote.objects.filter(owner=target_user)
        
        # Calcular estadísticas
        total_lotes = lotes.count()
        total_area = sum(lote.area for lote in lotes if lote.area)
        lotes_activos = lotes.filter(status='active').count()
        lotes_pendientes = lotes.filter(status='pending').count()
        lotes_archivados = lotes.filter(status='archived').count()
        
        # Estadísticas por estrato
        lotes_por_estrato = {}
        for i in range(1, 7):
            lotes_por_estrato[f'estrato_{i}'] = lotes.filter(estrato=i).count()
            
        # Lotes con documentación completa
        lotes_con_documentacion = 0
        for lote in lotes:
            if lote.documentos.filter(tipo='escritura').exists() and \
               lote.documentos.filter(tipo='plano').exists():
                lotes_con_documentacion += 1
                
        stats = {
            'user_id': user_id,
            'user_name': f"{target_user.first_name} {target_user.last_name}",
            'email': target_user.email,
            'role': target_user.role,
            'total_lotes': total_lotes,
            'total_area': total_area,
            'lotes_activos': lotes_activos,
            'lotes_pendientes': lotes_pendientes,
            'lotes_archivados': lotes_archivados,
            'lotes_por_estrato': lotes_por_estrato,
            'lotes_con_documentacion_completa': lotes_con_documentacion,
            'lotes_con_documentacion_porcentaje': (
                (lotes_con_documentacion / total_lotes) * 100 if total_lotes > 0 else 0
            )
        }
        
        return Response(stats)
    
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])  # Permitir acceso a todos
def lote_list(request):
    """
    Listar todos los lotes o crear un nuevo lote
    """
    if request.method == 'GET':
        # Filtrar lotes según permisos
        user = request.user
        if user.is_superuser or user.role == 'admin':
            lotes = Lote.objects.all()
        elif user.role == 'developer':
            lotes = Lote.objects.filter(proyectos__developers=user).distinct()
        else:
            lotes = Lote.objects.filter(owner=user)
            
        serializer = LoteSerializer(lotes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = LoteSerializer(data=request.data)
        if serializer.is_valid():
            # Asignar el propietario si no se proporcionó
            if 'owner' not in serializer.validated_data:
                serializer.validated_data['owner'] = request.user
                
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Alias para compatibilidad con urls.py
lote_create = lote_list