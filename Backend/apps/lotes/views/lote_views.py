"""
Vistas para operaciones CRUD básicas de lotes
"""
import logging
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Configurar el logger
logger = logging.getLogger(__name__)

# Importar el modelo Lote y otros modelos necesarios
from ..models import Lote
from django.utils import timezone

def serialize_lote(lote):
    """
    Convierte un objeto Lote en un diccionario con sus datos.
    Útil para mantener consistencia en la serialización en diferentes vistas.
    
    Args:
        lote: Instancia del modelo Lote
        
    Returns:
        dict: Diccionario con los datos del lote
    """
    return {
        'id': lote.id,
        'nombre': lote.nombre,
        'cbml': lote.cbml,
        'direccion': lote.direccion,
        'area': float(lote.area) if lote.area else None,
        'descripcion': lote.descripcion,
        'matricula': lote.matricula,
        'barrio': lote.barrio,
        'estrato': lote.estrato,
        'codigo_catastral': lote.codigo_catastral,
        'latitud': float(lote.latitud) if lote.latitud else None,
        'longitud': float(lote.longitud) if lote.longitud else None,
        'tratamiento_pot': lote.tratamiento_pot,
        'uso_suelo': lote.uso_suelo,
        'clasificacion_suelo': lote.clasificacion_suelo,
        'estado': lote.estado,  # 'status' en el frontend
        'fecha_creacion': lote.fecha_creacion.isoformat() if lote.fecha_creacion else None,
        'fecha_actualizacion': lote.fecha_actualizacion.isoformat() if lote.fecha_actualizacion else None,
        'usuario': lote.usuario.id if lote.usuario else None,  # 'owner' en el frontend
        'usuario_nombre': lote.usuario.get_full_name() if lote.usuario else None,
        'metadatos': lote.metadatos
    }

# Vista para listar lotes
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lote_list(request):
    """Lista todos los lotes del usuario actual"""
    try:
        lotes = Lote.objects.filter(usuario=request.user)
        data = [serialize_lote(lote) for lote in lotes]
        
        return Response({
            'count': len(data),
            'results': data
        })
    except Exception as e:
        return Response(
            {"error": f"Error listando lotes: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vista para ver detalle de un lote
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lote_detail(request, pk):
    """Muestra el detalle de un lote específico"""
    try:
        lote = Lote.objects.get(id=pk, usuario=request.user)
        return Response(serialize_lote(lote))
    except Lote.DoesNotExist:
        return Response(
            {"error": "Lote no encontrado"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error obteniendo detalle del lote: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vista para crear un lote
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lote_create(request):
    """Crea un nuevo lote"""
    try:
        # Validar datos mínimos
        if not request.data.get('nombre'):
            return Response(
                {"error": "El nombre del lote es obligatorio"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Si están usando el campo owner, asegurarse de mapearlo a usuario
        if 'owner' in request.data and not 'usuario' in request.data:
            request.data._mutable = True
            request.data['usuario'] = request.data['owner']
            del request.data['owner']
            request.data._mutable = False
        
        # Preparar datos para crear el lote
        lote_data = {
            'usuario': request.user,
            'nombre': request.data.get('nombre', 'Nuevo lote'),
            'estado': request.data.get('status', 'active')
        }
        
        # Agregar campos opcionales si existen en la petición
        if 'cbml' in request.data and request.data.get('cbml'):
            lote_data['cbml'] = request.data.get('cbml')
        
        if 'direccion' in request.data and request.data.get('direccion'):
            lote_data['direccion'] = request.data.get('direccion')
            
        if 'area' in request.data and request.data.get('area'):
            try:
                lote_data['area'] = float(request.data.get('area'))
            except (ValueError, TypeError):
                return Response(
                    {"error": "El área debe ser un valor numérico"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if 'descripcion' in request.data and request.data.get('descripcion'):
            lote_data['descripcion'] = request.data.get('descripcion')
            
        if 'matricula' in request.data and request.data.get('matricula'):
            lote_data['matricula'] = request.data.get('matricula')
            
        if 'barrio' in request.data and request.data.get('barrio'):
            lote_data['barrio'] = request.data.get('barrio')
            
        if 'estrato' in request.data and request.data.get('estrato'):
            try:
                estrato = int(request.data.get('estrato'))
                if 1 <= estrato <= 6:  # Validar rango del estrato
                    lote_data['estrato'] = estrato
                else:
                    return Response(
                        {"error": "El estrato debe ser un número entre 1 y 6"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "El estrato debe ser un valor numérico"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        # Nuevos campos
        if 'codigo_catastral' in request.data and request.data.get('codigo_catastral'):
            lote_data['codigo_catastral'] = request.data.get('codigo_catastral')
            
        if 'latitud' in request.data and request.data.get('latitud'):
            try:
                lote_data['latitud'] = float(request.data.get('latitud'))
            except (ValueError, TypeError):
                return Response(
                    {"error": "La latitud debe ser un valor numérico"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if 'longitud' in request.data and request.data.get('longitud'):
            try:
                lote_data['longitud'] = float(request.data.get('longitud'))
            except (ValueError, TypeError):
                return Response(
                    {"error": "La longitud debe ser un valor numérico"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if 'tratamiento_pot' in request.data and request.data.get('tratamiento_pot'):
            lote_data['tratamiento_pot'] = request.data.get('tratamiento_pot')
            
        if 'uso_suelo' in request.data and request.data.get('uso_suelo'):
            lote_data['uso_suelo'] = request.data.get('uso_suelo')
            
        if 'clasificacion_suelo' in request.data and request.data.get('clasificacion_suelo'):
            lote_data['clasificacion_suelo'] = request.data.get('clasificacion_suelo')
        
        # Si hay metadatos adicionales, los agregamos
        if 'metadatos' in request.data and isinstance(request.data.get('metadatos'), dict):
            lote_data['metadatos'] = request.data.get('metadatos')
        
        # Crear el lote
        lote = Lote.objects.create(**lote_data)
        
        # Log del lote creado
        logger.info(f"Lote creado: ID={lote.id}, Nombre={lote.nombre}, Usuario={request.user.username}")
        
        return Response({
            'id': lote.id,
            'mensaje': 'Lote creado exitosamente',
            'lote': serialize_lote(lote)  # Devolver el lote completo serializado
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.exception(f"Error creando lote: {e}")
        return Response(
            {"error": f"Error creando lote: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

# Vista para actualizar un lote
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def lote_update(request, pk):
    """Actualiza un lote existente"""
    try:
        lote = get_object_or_404(Lote, pk=pk)
        
        # Verificar que el usuario tenga permisos para editar este lote
        if lote.usuario != request.user and not request.user.is_staff:
            return Response(
                {"error": "No tienes permiso para editar este lote"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Actualizar campos básicos
        if 'nombre' in request.data:
            lote.nombre = request.data.get('nombre')
            
        if 'cbml' in request.data:
            lote.cbml = request.data.get('cbml')
            
        if 'direccion' in request.data:
            lote.direccion = request.data.get('direccion')
            
        if 'area' in request.data and request.data.get('area') is not None:
            try:
                lote.area = float(request.data.get('area'))
            except (ValueError, TypeError):
                return Response(
                    {"error": "El área debe ser un valor numérico"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if 'descripcion' in request.data:
            lote.descripcion = request.data.get('descripcion')
            
        if 'matricula' in request.data:
            lote.matricula = request.data.get('matricula')
            
        if 'barrio' in request.data:
            lote.barrio = request.data.get('barrio')
            
        if 'estrato' in request.data and request.data.get('estrato') is not None:
            try:
                estrato = int(request.data.get('estrato'))
                if 1 <= estrato <= 6:
                    lote.estrato = estrato
                else:
                    return Response(
                        {"error": "El estrato debe ser un número entre 1 y 6"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "El estrato debe ser un valor numérico"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Nuevos campos
        if 'codigo_catastral' in request.data:
            lote.codigo_catastral = request.data.get('codigo_catastral')
            
        if 'latitud' in request.data and request.data.get('latitud') is not None:
            try:
                lote.latitud = float(request.data.get('latitud'))
            except (ValueError, TypeError):
                return Response(
                    {"error": "La latitud debe ser un valor numérico"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if 'longitud' in request.data and request.data.get('longitud') is not None:
            try:
                lote.longitud = float(request.data.get('longitud'))
            except (ValueError, TypeError):
                return Response(
                    {"error": "La longitud debe ser un valor numérico"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if 'tratamiento_pot' in request.data:
            lote.tratamiento_pot = request.data.get('tratamiento_pot')
            
        if 'uso_suelo' in request.data:
            lote.uso_suelo = request.data.get('uso_suelo')
            
        if 'clasificacion_suelo' in request.data:
            lote.clasificacion_suelo = request.data.get('clasificacion_suelo')
                
        # Actualización del estado
        if 'status' in request.data:
            estado = request.data.get('status')
            if estado in ["active", "inactive", "archived", "in_process", "completed"]:
                lote.estado = estado
            else:
                return Response(
                    {"error": "El estado proporcionado no es válido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif 'estado' in request.data:
            estado = request.data.get('estado')
            if estado in ["active", "inactive", "archived", "in_process", "completed"]:
                lote.estado = estado
            else:
                return Response(
                    {"error": "El estado proporcionado no es válido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        if 'metadatos' in request.data and isinstance(request.data.get('metadatos'), dict):
            # Actualizar en lugar de sobreescribir
            metadatos_actuales = lote.metadatos or {}
            metadatos_actuales.update(request.data.get('metadatos'))
            lote.metadatos = metadatos_actuales
        
        # Guardar los cambios
        lote.save()
        
        return Response({
            'id': lote.id,
            'mensaje': 'Lote actualizado exitosamente',
            'lote': serialize_lote(lote)
        })
        
    except Exception as e:
        logger.exception(f"Error actualizando lote: {e}")
        return Response(
            {"error": f"Error actualizando lote: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

# Vista para eliminar un lote
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def lote_delete(request, pk):
    """Elimina un lote"""
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

# Vista para crear un lote desde MapGIS
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lote_create_from_mapgis(request):
    """
    Crea un nuevo lote importando datos directamente desde MapGIS usando el CBML
    """
    try:
        # Verificar datos mínimos
        cbml = request.data.get('cbml')
        if not cbml:
            return Response(
                {"error": "El CBML es obligatorio para crear un lote desde MapGIS"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Importar el servicio de MapGIS
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        
        # Consultar datos del lote en MapGIS
        logger.info(f"Consultando datos en MapGIS para CBML: {cbml}")
        resultado_mapgis = mapgis_service.buscar_por_cbml(cbml)
        
        # Verificar si se encontraron datos
        if not resultado_mapgis.get('encontrado'):
            return Response({
                "error": f"No se encontraron datos en MapGIS para el CBML: {cbml}",
                "detalle": resultado_mapgis.get('error', 'Sin detalles adicionales')
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Extraer datos relevantes de MapGIS
        datos_mapgis = resultado_mapgis.get('datos', {})
        
        # Preparar datos para el lote
        nombre_lote = request.data.get('nombre') or f"Lote CBML {cbml}"
        
        # Crear el lote con los datos obtenidos
        lote_data = {
            'usuario': request.user,
            'nombre': nombre_lote,
            'cbml': cbml,
            'estado': request.data.get('status', 'active')
        }
        
        # Agregar datos de área si existen
        if datos_mapgis.get('area_lote_m2'):
            lote_data['area'] = datos_mapgis.get('area_lote_m2')
            
        # Si hay dirección, la agregamos (puede estar en un formato diferente según MapGIS)
        # Esto es un ejemplo, ajustar según la estructura real de datos de MapGIS
        if datos_mapgis.get('direccion'):
            lote_data['direccion'] = datos_mapgis.get('direccion')
        
        # Agregar datos opcionales si están en la petición
        if 'descripcion' in request.data:
            lote_data['descripcion'] = request.data.get('descripcion')
            
        if 'matricula' in request.data:
            lote_data['matricula'] = request.data.get('matricula')
        # Si hay matrícula en datos de MapGIS, la usamos
        elif datos_mapgis.get('matricula'):
            lote_data['matricula'] = datos_mapgis.get('matricula')
            
        # Agregar barrio y estrato si están disponibles
        if datos_mapgis.get('barrio'):
            lote_data['barrio'] = datos_mapgis.get('barrio')
            
        # Agregar código catastral si está disponible en MapGIS
        if datos_mapgis.get('codigo_catastral'):
            lote_data['codigo_catastral'] = datos_mapgis.get('codigo_catastral')
            
        # Agregar tratamiento POT si está disponible en MapGIS
        if datos_mapgis.get('tratamiento'):
            lote_data['tratamiento_pot'] = datos_mapgis.get('tratamiento')
            
        # Agregar uso del suelo si está disponible en MapGIS
        if datos_mapgis.get('uso_suelo'):
            lote_data['uso_suelo'] = datos_mapgis.get('uso_suelo')
            
        # Agregar clasificación del suelo si está disponible en MapGIS
        if datos_mapgis.get('clasificacion_suelo'):
            lote_data['clasificacion_suelo'] = datos_mapgis.get('clasificacion_suelo')
            
        # Agregar coordenadas si están disponibles en MapGIS
        if datos_mapgis.get('latitud'):
            lote_data['latitud'] = datos_mapgis.get('latitud')
            
        if datos_mapgis.get('longitud'):
            lote_data['longitud'] = datos_mapgis.get('longitud')
            
        # Agregar campos adicionales de la petición
        if 'codigo_catastral' in request.data:
            lote_data['codigo_catastral'] = request.data.get('codigo_catastral')
            
        if 'tratamiento_pot' in request.data:
            lote_data['tratamiento_pot'] = request.data.get('tratamiento_pot')
            
        if 'uso_suelo' in request.data:
            lote_data['uso_suelo'] = request.data.get('uso_suelo')
            
        if 'clasificacion_suelo' in request.data:
            lote_data['clasificacion_suelo'] = request.data.get('clasificacion_suelo')
            
        if 'latitud' in request.data:
            lote_data['latitud'] = request.data.get('latitud')
            
        if 'longitud' in request.data:
            lote_data['longitud'] = request.data.get('longitud')
            
        # Guardar toda la información obtenida de MapGIS en metadatos
        lote_data['metadatos'] = {
            'datos_mapgis': datos_mapgis,
            'fecha_consulta_mapgis': timezone.now().isoformat()
        }
        
        # Crear el lote
        lote = Lote.objects.create(**lote_data)
        
        # Log del lote creado
        logger.info(f"Lote creado desde MapGIS: ID={lote.id}, CBML={cbml}, Usuario={request.user.username}")
        
        return Response({
            'id': lote.id,
            'mensaje': 'Lote creado exitosamente con datos de MapGIS',
            'lote': serialize_lote(lote)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.exception(f"Error creando lote desde MapGIS: {e}")
        return Response({
            "error": f"Error creando lote desde MapGIS: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Vista para buscar lotes
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lote_search(request):
    """
    Busca lotes aplicando diversos filtros
    """
    try:
        # Iniciar con los lotes del usuario actual
        queryset = Lote.objects.filter(usuario=request.user)
        
        # Aplicar filtro por nombre (búsqueda parcial)
        nombre = request.query_params.get('nombre')
        if nombre:
            queryset = queryset.filter(nombre__icontains=nombre)
        
        # Aplicar filtro por CBML (búsqueda exacta)
        cbml = request.query_params.get('cbml')
        if cbml:
            queryset = queryset.filter(cbml__iexact=cbml)
            
        # Aplicar filtro por dirección (búsqueda parcial)
        direccion = request.query_params.get('direccion')
        if direccion:
            queryset = queryset.filter(direccion__icontains=direccion)
            
        # Aplicar filtro por barrio (búsqueda parcial)
        barrio = request.query_params.get('barrio')
        if barrio:
            queryset = queryset.filter(barrio__icontains=barrio)
            
        # Aplicar filtro por estrato (búsqueda exacta)
        estrato = request.query_params.get('estrato')
        if estrato and estrato.isdigit():
            queryset = queryset.filter(estrato=int(estrato))
            
        # Aplicar filtro por código catastral (búsqueda exacta)
        codigo_catastral = request.query_params.get('codigo_catastral')
        if codigo_catastral:
            queryset = queryset.filter(codigo_catastral__iexact=codigo_catastral)
            
        # Aplicar filtro por tratamiento POT (búsqueda parcial)
        tratamiento_pot = request.query_params.get('tratamiento_pot')
        if tratamiento_pot:
            queryset = queryset.filter(tratamiento_pot__icontains=tratamiento_pot)
            
        # Aplicar filtro por uso del suelo (búsqueda parcial)
        uso_suelo = request.query_params.get('uso_suelo')
        if uso_suelo:
            queryset = queryset.filter(uso_suelo__icontains=uso_suelo)
            
        # Aplicar filtro por clasificación del suelo (búsqueda parcial)
        clasificacion_suelo = request.query_params.get('clasificacion_suelo')
        if clasificacion_suelo:
            queryset = queryset.filter(clasificacion_suelo__icontains=clasificacion_suelo)
            
        # Aplicar filtro por ubicación (coordenadas con rango)
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radio = request.query_params.get('radio', '0.01')  # Radio en grados, por defecto ~1km
        if lat and lng:
            try:
                lat = float(lat)
                lng = float(lng)
                radio = float(radio)
                queryset = queryset.filter(
                    latitud__range=(lat - radio, lat + radio),
                    longitud__range=(lng - radio, lng + radio)
                )
            except (ValueError, TypeError):
                pass
            
        # Aplicar filtro por área mínima
        area_min = request.query_params.get('area_min')
        if area_min:
            try:
                queryset = queryset.filter(area__gte=float(area_min))
            except ValueError:
                pass
                
        # Aplicar filtro por área máxima
        area_max = request.query_params.get('area_max')
        if area_max:
            try:
                queryset = queryset.filter(area__lte=float(area_max))
            except ValueError:
                pass
                
        # Aplicar filtro por estado
        estado = request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
            
        # Aplicar filtro por fecha de creación (desde)
        fecha_desde = request.query_params.get('fecha_desde')
        if fecha_desde:
            try:
                date_desde = timezone.datetime.strptime(fecha_desde, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_creacion__date__gte=date_desde)
            except ValueError:
                pass
                
        # Aplicar filtro por fecha de creación (hasta)
        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_hasta:
            try:
                date_hasta = timezone.datetime.strptime(fecha_hasta, '%Y-%m-%d').date()
                queryset = queryset.filter(fecha_creacion__date__lte=date_hasta)
            except ValueError:
                pass
                
        # Ordenar resultados
        orden = request.query_params.get('orden', '-fecha_creacion')
        if orden not in ['nombre', '-nombre', 'fecha_creacion', '-fecha_creacion', 'area', '-area']:
            orden = '-fecha_creacion'  # Orden por defecto
        queryset = queryset.order_by(orden)
        
        # Paginación básica
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 100)  # Máximo 100 items por página
        start = (page - 1) * page_size
        end = start + page_size
        
        # Obtener resultados paginados
        lotes_page = queryset[start:end]
        total = queryset.count()
        
        # Serializar resultados
        resultados = [serialize_lote(lote) for lote in lotes_page]
        
        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'pages': (total + page_size - 1) // page_size,  # Ceil division
            'results': resultados
        })
    
    except Exception as e:
        logger.exception(f"Error en búsqueda de lotes: {e}")
        return Response({
            "error": f"Error en la búsqueda: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)