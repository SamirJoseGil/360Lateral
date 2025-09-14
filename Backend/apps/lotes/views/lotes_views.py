"""
Vistas CRUD para la gestión de lotes - Consolidadas y optimizadas
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import models, IntegrityError
import logging

from ..models import Lote
from ..serializers import LoteSerializer, LoteDetailSerializer

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def lote_list(request):
    """
    GET: Listar todos los lotes
    POST: Crear un nuevo lote
    """
    if request.method == 'GET':
        try:
            # Filtrar lotes según permisos
            user = request.user
            if user.is_superuser or getattr(user, 'role', None) == 'admin':
                lotes = Lote.objects.all()
            else:
                lotes = Lote.objects.filter(usuario=user)
                
            serializer = LoteSerializer(lotes, many=True)
            return Response({
                'count': len(serializer.data),
                'results': serializer.data
            })
        except Exception as e:
            logger.error(f"Error al acceder a lotes: {str(e)}")
            
            if "no existe la relación" in str(e).lower():
                return Response({
                    "error": "La tabla de lotes no existe en la base de datos.",
                    "detail": "Ejecuta 'python manage.py migrate' para crear las tablas necesarias.",
                    "code": "table_not_exists"
                }, status=500)
            
            return Response({
                "error": "Error al recuperar lotes",
                "detail": str(e)
            }, status=500)
    
    elif request.method == 'POST':
        serializer = LoteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Asignar el propietario si no se proporcionó
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
    
    # Verificar permisos
    user = request.user
    if not (user.is_superuser or getattr(user, 'role', None) == 'admin' or lote.usuario == user):
        return Response({'detail': 'No tienes permiso para acceder a este lote'}, 
                      status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = LoteDetailSerializer(lote)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = LoteDetailSerializer(lote, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not (user.is_superuser or getattr(user, 'role', None) == 'admin'):
            return Response({'detail': 'Solo los administradores pueden eliminar lotes'},
                          status=status.HTTP_403_FORBIDDEN)
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
    """Crear un nuevo lote importando datos desde MapGIS usando CBML con validación de duplicados"""
    try:
        cbml = request.data.get('cbml')
        if not cbml:
            return Response(
                {"error": "CBML es requerido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que no exista un lote con ese CBML
        if Lote.objects.filter(cbml=cbml).exists():
            return Response({
                "error": f"Ya existe un lote registrado con el CBML: {cbml}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Importar servicio MapGIS
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        
        # Consultar datos en MapGIS
        logger.info(f"Consultando datos en MapGIS para CBML: {cbml}")
        resultado_mapgis = mapgis_service.buscar_por_cbml(cbml)
        
        # Verificar si se encontraron datos
        if not resultado_mapgis.get('encontrado'):
            return Response(
                {"error": f"No se encontraron datos para el CBML {cbml}"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Extraer datos de MapGIS
        datos_mapgis = resultado_mapgis.get('datos', {})
        
        # Preparar datos para el lote
        nombre_lote = request.data.get('nombre') or f"Lote CBML {cbml}"
        
        lote_data = {
            'usuario': request.user,
            'nombre': nombre_lote,
            'cbml': cbml,
            'estado': request.data.get('status', 'active')
        }
        
        # Agregar datos de MapGIS
        if datos_mapgis.get('area_lote_m2'):
            lote_data['area'] = datos_mapgis.get('area_lote_m2')
        
        if datos_mapgis.get('clasificacion_suelo'):
            lote_data['clasificacion_suelo'] = datos_mapgis.get('clasificacion_suelo')
        
        if datos_mapgis.get('aprovechamiento_urbano', {}).get('tratamiento'):
            lote_data['tratamiento_pot'] = datos_mapgis['aprovechamiento_urbano']['tratamiento']
        
        # Crear el lote
        lote = Lote.objects.create(**lote_data)
        
        logger.info(f"Lote creado desde MapGIS: ID={lote.id}, CBML={cbml}")
        
        serializer = LoteSerializer(lote)
        return Response({
            'id': lote.id,
            'mensaje': 'Lote creado desde MapGIS exitosamente',
            'lote': serializer.data,
            'datos_mapgis': datos_mapgis
        }, status=status.HTTP_201_CREATED)
        
    except IntegrityError as e:
        logger.error(f"Error de integridad al crear lote desde MapGIS: {str(e)}")
        return Response({
            "error": "Error de integridad: Ya existe un lote con ese CBML"
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"Error creando lote desde MapGIS: {e}")
        return Response(
            {"error": f"Error creando lote desde MapGIS: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lote_search(request):
    """Buscar lotes aplicando filtros"""
    try:
        user = request.user
        
        # Base queryset según permisos
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            queryset = Lote.objects.all()
        else:
            queryset = Lote.objects.filter(usuario=user)
        
        # Aplicar filtros
        if 'search' in request.query_params:
            search_term = request.query_params['search']
            queryset = queryset.filter(
                models.Q(nombre__icontains=search_term) |
                models.Q(direccion__icontains=search_term) |
                models.Q(cbml__icontains=search_term)
            )
        
        # Filtros específicos
        if 'estrato' in request.query_params:
            queryset = queryset.filter(estrato=request.query_params['estrato'])
        
        if 'estado' in request.query_params:
            queryset = queryset.filter(estado=request.query_params['estado'])
        
        # Ordenamiento
        ordering = request.query_params.get('ordering', '-fecha_creacion')
        queryset = queryset.order_by(ordering)
        
        serializer = LoteSerializer(queryset, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })
        
    except Exception as e:
        logger.exception(f"Error en búsqueda de lotes: {e}")
        return Response(
            {"error": f"Error en búsqueda: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )