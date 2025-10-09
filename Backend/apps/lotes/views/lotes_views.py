"""
Vistas CRUD para la gestión de lotes - Consolidadas y optimizadas
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import models, IntegrityError
from django.utils import timezone
import logging

from ..models import Lote
from ..serializers import LoteSerializer, LoteDetailSerializer, LoteCreateFromMapGISSerializer

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def lote_list(request):
    """
    GET: Listar todos los lotes SEGÚN EL ROL DEL USUARIO
    POST: Crear un nuevo lote
    """
    if request.method == 'GET':
        try:
            user = request.user
            
            # LÓGICA DE FILTRADO POR ROL
            if user.is_superuser or getattr(user, 'role', None) == 'admin':
                # Admin ve TODOS los lotes
                lotes = Lote.objects.all()
                logger.info(f"Admin {user.email} consultando TODOS los lotes")
                
            elif getattr(user, 'role', None) == 'developer':
                # Developer ve SOLO lotes verificados y activos (disponibles para desarrollo)
                lotes = Lote.objects.filter(
                    is_verified=True,
                    estado='active'
                ).exclude(usuario=user)  # Excluir sus propios lotes si los tiene
                logger.info(f"Developer {user.email} consultando lotes verificados disponibles")
                
            elif getattr(user, 'role', None) == 'owner':
                # Owner ve SOLO sus propios lotes
                lotes = Lote.objects.filter(usuario=user)
                logger.info(f"Owner {user.email} consultando sus propios lotes")
                
            else:
                # Usuario sin rol específico - solo sus lotes
                lotes = Lote.objects.filter(usuario=user)
                logger.warning(f"Usuario {user.email} sin rol específico")
            
            # Aplicar ordenamiento
            ordering = request.query_params.get('ordering', '-fecha_creacion')
            lotes = lotes.order_by(ordering)
            
            serializer = LoteSerializer(lotes, many=True, context={'request': request})
            return Response({
                'count': len(serializer.data),
                'results': serializer.data,
                'user_role': getattr(user, 'role', 'unknown')
            })
        except Exception as e:
            logger.error(f"Error al acceder a lotes: {str(e)}")
            return Response({
                "error": "Error al recuperar lotes",
                "detail": str(e)
            }, status=500)
    
    elif request.method == 'POST':
        serializer = LoteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            if 'usuario' not in serializer.validated_data:
                serializer.validated_data['usuario'] = request.user
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def lote_detail(request, pk):
    """
    GET: Obtener detalles de un lote
    PUT: Actualizar un lote
    DELETE: Eliminar un lote
    """
    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error al acceder a lote {pk}: {str(e)}")
        
        if "no existe la relación" in str(e).lower():
            return Response({
                "error": "La tabla de lotes no existe en la base de datos.",
                "detail": "Ejecuta 'python manage.py migrate' para crear las tablas necesarias.",
                "code": "table_not_exists"
            }, status=500)
        
        return Response({
            "error": "Error al recuperar lote",
            "detail": str(e)
        }, status=500)
    
    # ✅ CORREGIDO: Lógica de permisos según rol
    user = request.user
    
    # Admin puede ver cualquier lote
    if user.is_superuser or getattr(user, 'role', None) == 'admin':
        pass  # Tiene acceso total
    
    # Developer puede ver lotes verificados y activos
    elif getattr(user, 'role', None) == 'developer':
        if not (lote.is_verified and lote.estado == 'active'):
            return Response({
                'detail': 'Este lote no está disponible para visualización'
            }, status=status.HTTP_403_FORBIDDEN)
    
    # Owner solo puede ver sus propios lotes
    elif lote.usuario != user:
        return Response({
            'detail': 'No tienes permiso para acceder a este lote'
        }, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = LoteDetailSerializer(lote, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Solo admin y owner pueden editar
        if not (user.is_superuser or getattr(user, 'role', None) == 'admin' or lote.usuario == user):
            return Response({
                'detail': 'No tienes permiso para editar este lote'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = LoteDetailSerializer(lote, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Solo admin puede eliminar
        if not (user.is_superuser or getattr(user, 'role', None) == 'admin'):
            return Response({
                'detail': 'Solo los administradores pueden eliminar lotes'
            }, status=status.HTTP_403_FORBIDDEN)
        lote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lote_create(request):
    """Crear un nuevo lote con validación de duplicados"""
    try:
        # Validar datos mínimos
        if not request.data.get('nombre'):
            return Response(
                {"error": "El nombre del lote es requerido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar unicidad de CBML si se proporciona
        cbml = request.data.get('cbml')
        if cbml:
            if Lote.objects.filter(cbml=cbml).exists():
                return Response({
                    "error": f"Ya existe un lote registrado con el CBML: {cbml}"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar unicidad de matrícula si se proporciona
        matricula = request.data.get('matricula')
        if matricula:
            if Lote.objects.filter(matricula=matricula).exists():
                return Response({
                    "error": f"Ya existe un lote registrado con la matrícula: {matricula}"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que al menos uno de los identificadores únicos esté presente
        if not cbml and not matricula:
            return Response({
                "error": "Debe proporcionar al menos el CBML o la matrícula del lote"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Preparar datos para crear el lote
        lote_data = {
            'usuario': request.user,
            'nombre': request.data.get('nombre', 'Nuevo lote'),
            'estado': request.data.get('status', 'active')
        }
        
        # Agregar campos opcionales si existen
        optional_fields = [
            'cbml', 'direccion', 'area', 'descripcion', 'matricula', 
            'barrio', 'estrato', 'codigo_catastral', 'latitud', 'longitud',
            'tratamiento_pot', 'uso_suelo', 'clasificacion_suelo'
        ]
        
        for field in optional_fields:
            if field in request.data and request.data.get(field):
                lote_data[field] = request.data.get(field)
        
        # Metadatos adicionales
        if 'metadatos' in request.data and isinstance(request.data.get('metadatos'), dict):
            lote_data['metadatos'] = request.data.get('metadatos')
        
        # Crear el lote
        lote = Lote.objects.create(**lote_data)
        
        logger.info(f"Lote creado: ID={lote.id}, Nombre={lote.nombre}, CBML={cbml}, Matrícula={matricula}, Usuario={request.user.username}")
        
        serializer = LoteSerializer(lote)
        return Response({
            'id': lote.id,
            'mensaje': 'Lote creado exitosamente',
            'lote': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except IntegrityError as e:
        logger.error(f"Error de integridad al crear lote: {str(e)}")
        return Response({
            "error": "Error de integridad: Ya existe un lote con esos identificadores"
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"Error creando lote: {e}")
        return Response(
            {"error": f"Error creando lote: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def lote_update(request, pk):
    """Actualizar un lote existente con validación de duplicados"""
    try:
        lote = Lote.objects.get(pk=pk)
        
        # Verificar permisos
        if lote.usuario != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'No tienes permiso para editar este lote'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar unicidad de CBML si se está actualizando
        new_cbml = request.data.get('cbml')
        if new_cbml and new_cbml != lote.cbml:
            if Lote.objects.filter(cbml=new_cbml).exclude(id=lote.id).exists():
                return Response({
                    "error": f"Ya existe otro lote registrado con el CBML: {new_cbml}"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar unicidad de matrícula si se está actualizando
        new_matricula = request.data.get('matricula')
        if new_matricula and new_matricula != lote.matricula:
            if Lote.objects.filter(matricula=new_matricula).exclude(id=lote.id).exists():
                return Response({
                    "error": f"Ya existe otro lote registrado con la matrícula: {new_matricula}"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = LoteDetailSerializer(lote, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            logger.info(f"Lote actualizado: ID={lote.id}, Usuario={request.user.username}")
            
            return Response({
                'id': lote.id,
                'mensaje': 'Lote actualizado exitosamente',
                'lote': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Lote.DoesNotExist:
        return Response(
            {"error": "Lote no encontrado"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except IntegrityError as e:
        logger.error(f"Error de integridad al actualizar lote: {str(e)}")
        return Response({
            "error": "Error de integridad: Ya existe un lote con esos identificadores"
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"Error actualizando lote: {e}")
        return Response(
            {"error": f"Error actualizando lote: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def lote_delete(request, pk):
    """Eliminar un lote"""
    try:
        lote = Lote.objects.get(id=pk, usuario=request.user)
        nombre_lote = lote.nombre
        lote.delete()
        
        return Response({
            'mensaje': f'Lote "{nombre_lote}" eliminado exitosamente'
        })
        
    except Lote.DoesNotExist:
        return Response(
            {"error": "Lote no encontrado"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error eliminando lote: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lote_create_from_mapgis(request):
    """
    Crear lote con datos de MapGIS - FLUJO OPTIMIZADO
    
    Campos obligatorios:
    - cbml O matricula (al menos uno)
    - nombre
    - direccion
    - descripcion
    
    Los datos de MapGIS (área, clasificación_suelo, etc.) se obtienen automáticamente
    """
    try:
        logger.info(f"Creación de lote con MapGIS - Usuario: {request.user.email}")
        
        # Validar con serializer
        serializer = LoteCreateFromMapGISSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            logger.warning(f"Validación fallida: {serializer.errors}")
            return Response({
                'success': False,
                'message': 'Datos de creación inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar duplicados antes de crear
        cbml = serializer.validated_data.get('cbml')
        matricula = serializer.validated_data.get('matricula')
        
        if cbml and Lote.objects.filter(cbml=cbml).exists():
            return Response({
                'success': False,
                'message': f'Ya existe un lote registrado con el CBML: {cbml}',
                'errors': {'cbml': ['Este CBML ya está registrado']}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if matricula and Lote.objects.filter(matricula=matricula).exists():
            return Response({
                'success': False,
                'message': f'Ya existe un lote registrado con la matrícula: {matricula}',
                'errors': {'matricula': ['Esta matrícula ya está registrada']}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el lote
        lote = serializer.save()
        
        logger.info(f"Lote creado exitosamente: ID={lote.id}, CBML={lote.cbml}, Usuario={request.user.email}")
        
        # Serializar respuesta
        response_serializer = LoteDetailSerializer(lote, context={'request': request})
        
        return Response({
            'success': True,
            'message': 'Lote creado exitosamente. Pendiente de verificación administrativa.',
            'data': {
                'lote': response_serializer.data
            }
        }, status=status.HTTP_201_CREATED)
        
    except ValidationError as e:
        logger.error(f"Error de validación al crear lote: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error de validación',
            'errors': {'general': str(e)}
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.exception(f"Error inesperado al crear lote desde MapGIS: {e}")
        return Response({
            'success': False,
            'message': 'Error interno del servidor',
            'errors': {'general': 'Por favor, intenta de nuevo más tarde.'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lote_search(request):
    """Buscar lotes aplicando filtros - CON LÓGICA DE VISIBILIDAD POR ROL"""
    try:
        user = request.user
        
        # Base queryset según permisos - CORREGIDO
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            # Admin ve todos los lotes
            queryset = Lote.objects.all()
            
        elif getattr(user, 'role', None) == 'developer':
            # Developer SOLO ve lotes verificados y activos
            queryset = Lote.objects.filter(
                estado='active',
                is_verified=True
            )
            logger.info(f"Developer {user.email} buscando en lotes verificados")
            
        else:
            # Owner ve solo sus propios lotes
            queryset = Lote.objects.filter(usuario=user)
        
        # Aplicar filtros de búsqueda
        if 'search' in request.query_params:
            search_term = request.query_params['search']
            queryset = queryset.filter(
                models.Q(nombre__icontains=search_term) |
                models.Q(direccion__icontains=search_term) |
                models.Q(cbml__icontains=search_term) |
                models.Q(barrio__icontains=search_term)
            )
        
        # Filtros específicos
        if 'estrato' in request.query_params:
            queryset = queryset.filter(estrato=request.query_params['estrato'])
        
        if 'area_min' in request.query_params:
            queryset = queryset.filter(area__gte=float(request.query_params['area_min']))
        
        if 'area_max' in request.query_params:
            queryset = queryset.filter(area__lte=float(request.query_params['area_max']))
        
        if 'tratamiento_pot' in request.query_params:
            queryset = queryset.filter(tratamiento_pot__icontains=request.query_params['tratamiento_pot'])
        
        if 'barrio' in request.query_params:
            queryset = queryset.filter(barrio__icontains=request.query_params['barrio'])
        
        # Ordenamiento
        ordering = request.query_params.get('ordering', '-fecha_creacion')
        
        # Mapear nombres de campos
        field_mapping = {
            'created_at': 'fecha_creacion',
            '-created_at': '-fecha_creacion',
            'updated_at': 'fecha_actualizacion',
            '-updated_at': '-fecha_actualizacion',
        }
        
        ordering = field_mapping.get(ordering, ordering)
        queryset = queryset.order_by(ordering)
        
        # Paginación
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        total_count = queryset.count()
        queryset = queryset[offset:offset + limit]
        
        serializer = LoteSerializer(queryset, many=True, context={'request': request})
        
        return Response({
            'count': total_count,
            'results': serializer.data,
            'next': offset + limit < total_count,
            'previous': offset > 0,
            'user_role': getattr(user, 'role', 'unknown'),
            'filters_applied': {
                'verified_only': getattr(user, 'role', None) == 'developer'
            }
        })
        
    except Exception as e:
        logger.exception(f"Error en búsqueda de lotes: {e}")
        return Response(
            {"error": f"Error en búsqueda: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )