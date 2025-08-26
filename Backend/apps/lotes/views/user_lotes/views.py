"""
Vistas especializadas para gestionar lotes por usuario.
"""
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.lotes.models import Lote
from apps.lotes.serializers import LoteSerializer, LoteDetailSerializer
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
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
                return Lote.objects.filter(owner=request_user)  # Simplificado sin proyectos
            else:
                # Un desarrollador viendo lotes de otro usuario
                return Lote.objects.none()  # Simplificado sin proyectos
                
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
    Devuelve directamente los lotes en lugar de redirigir.
    """
    user = request.user
    lotes = Lote.objects.filter(owner=user)
    serializer = LoteSerializer(lotes, many=True)
    
    response_data = {
        'count': lotes.count(),
        'user_id': user.id,
        'user_name': f"{user.first_name} {user.last_name}",
        'results': serializer.data
    }
    
    return Response(response_data)


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
        
        # Calcular estadísticas básicas
        total_lotes = lotes.count()
        
        # Evitar error si no hay lotes
        if total_lotes == 0:
            return Response({
                'user_id': user_id,
                'user_name': f"{target_user.first_name} {target_user.last_name}",
                'email': target_user.email,
                'role': target_user.role,
                'total_lotes': 0,
                'message': 'El usuario no tiene lotes registrados.'
            })
            
        # Calcular estadísticas con manejo de errores
        try:
            total_area = sum(lote.area for lote in lotes if lote.area)
            lotes_activos = lotes.filter(status='active').count()
            lotes_pendientes = lotes.filter(status='pending').count()
            lotes_archivados = lotes.filter(status='archived').count()
            
            # Estadísticas por estrato
            lotes_por_estrato = {}
            for i in range(1, 7):
                lotes_por_estrato[f'estrato_{i}'] = lotes.filter(estrato=i).count()
        except:
            # Si hay algún error en el cálculo, dar estadísticas básicas
            return Response({
                'user_id': user_id,
                'user_name': f"{target_user.first_name} {target_user.last_name}",
                'email': target_user.email,
                'role': target_user.role,
                'total_lotes': total_lotes,
                'error': 'Error al calcular algunas estadísticas'
            })
        
        # Construir respuesta completa
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
            'lotes_por_estrato': lotes_por_estrato
        }
        
        # Intentar obtener información de documentos si existe la relación
        try:
            lotes_con_documentacion = 0
            for lote in lotes:
                if hasattr(lote, 'documentos'):
                    docs = lote.documentos.all()
                    if docs.filter(tipo='escritura').exists() and docs.filter(tipo='plano').exists():
                        lotes_con_documentacion += 1
                        
            stats['lotes_con_documentacion_completa'] = lotes_con_documentacion
            stats['lotes_con_documentacion_porcentaje'] = (
                (lotes_con_documentacion / total_lotes) * 100 if total_lotes > 0 else 0
            )
        except:
            # Si no existe la relación documentos o hay error, ignorar
            pass
        
        return Response(stats)