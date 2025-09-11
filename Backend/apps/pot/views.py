"""
Vistas para la API REST de tratamientos POT - Optimizado
"""
import logging
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status, viewsets

from .models import (
    TratamientoPOT, 
    FrenteMinimoPOT, 
    AreaMinimaLotePOT, 
    AreaMinimaViviendaPOT
)
from .serializers import (
    TratamientoPOTListSerializer,
    TratamientoPOTDetailSerializer,
    TratamientoPOTCreateUpdateSerializer,
    FrenteMinimoPOTCreateUpdateSerializer,
    AreaMinimaLotePOTCreateUpdateSerializer,
    AreaMinimaViviendaPOTCreateUpdateSerializer
)

logger = logging.getLogger(__name__)

# Mapeo de nombres de tratamientos a códigos
MAPEO_TRATAMIENTOS = {
    'consolidacion_nivel_1': 'CN1',
    'consolidacion_nivel_2': 'CN2', 
    'consolidacion_nivel_3': 'CN3',
    'consolidacion_nivel_4': 'CN4',
    'redesarrollo': 'RD',
    'desarrollo': 'D',
    'conservacion': 'C'
}

def _obtener_codigo_tratamiento(nombre_tratamiento):
    """Helper para obtener código de tratamiento desde nombre"""
    nombre_lower = nombre_tratamiento.lower()
    
    if "consolidación nivel 1" in nombre_lower or "consolidacion nivel 1" in nombre_lower:
        return "CN1"
    elif "consolidación nivel 2" in nombre_lower or "consolidacion nivel 2" in nombre_lower:
        return "CN2"
    elif "consolidación nivel 3" in nombre_lower or "consolidacion nivel 3" in nombre_lower:
        return "CN3"
    elif "consolidación nivel 4" in nombre_lower or "consolidacion nivel 4" in nombre_lower:
        return "CN4"
    elif "redesarrollo" in nombre_lower:
        return "RD"
    elif "desarrollo" in nombre_lower:
        return "D"
    elif "conservación" in nombre_lower or "conservacion" in nombre_lower:
        return "C"
    else:
        return nombre_tratamiento[:3].upper()  # Fallback


class TratamientoPOTViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operaciones CRUD en TratamientoPOT.
    """
    queryset = TratamientoPOT.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TratamientoPOTListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TratamientoPOTCreateUpdateSerializer
        return TratamientoPOTDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_tratamientos_pot(request):
    """
    Lista todos los tratamientos POT activos
    """
    try:
        tratamientos = TratamientoPOT.objects.filter(activo=True)
        serializer = TratamientoPOTListSerializer(tratamientos, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })
    except Exception as e:
        logger.exception(f"Error listando tratamientos POT: {e}")
        return Response({
            "error": f"Error listando tratamientos: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detalle_tratamiento_pot(request, codigo):
    """
    Obtiene los detalles de un tratamiento POT específico por su código
    """
    try:
        tratamiento = get_object_or_404(TratamientoPOT, codigo=codigo.upper())
        serializer = TratamientoPOTDetailSerializer(tratamiento)
        return Response(serializer.data)
    except Exception as e:
        logger.exception(f"Error obteniendo detalle de tratamiento POT: {e}")
        return Response({
            "error": f"Error obteniendo detalle del tratamiento: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
@transaction.atomic
def importar_tratamientos_json(request):
    """
    Importa los tratamientos POT desde un JSON
    """
    try:
        data = request.data
        
        if not isinstance(data, dict):
            return Response({
                "error": "El formato del JSON no es válido. Se espera un objeto con tratamientos."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        tratamientos_creados = 0
        tratamientos_actualizados = 0
        
        for nombre, detalles in data.items():
            # Determinar código según el nombre
            codigo = None
            if "Consolidación Nivel 1" in nombre:
                codigo = "CN1"
            elif "Consolidación Nivel 2" in nombre:
                codigo = "CN2"
            elif "Consolidación Nivel 3" in nombre:
                codigo = "CN3"
            elif "Consolidación Nivel 4" in nombre:
                codigo = "CN4"
            elif "Redesarrollo" in nombre:
                codigo = "RD"
            elif "Desarrollo" in nombre:
                codigo = "D"
            elif "Conservación" in nombre:
                codigo = "C"
            else:
                codigo = nombre[:3].upper()  # Primeras 3 letras en mayúscula
            
            # Crear o actualizar el tratamiento
            tratamiento, created = TratamientoPOT.objects.update_or_create(
                codigo=codigo,
                defaults={
                    'nombre': nombre,
                    'descripcion': detalles.get('descripcion', ''),
                    'indice_ocupacion': detalles.get('indice_ocupacion'),
                    'indice_construccion': detalles.get('indice_construccion'),
                    'altura_maxima': detalles.get('altura_maxima'),
                    'retiro_frontal': detalles.get('retiro_frontal'),
                    'retiro_lateral': detalles.get('retiro_lateral'),
                    'retiro_posterior': detalles.get('retiro_posterior'),
                }
            )
            
            if created:
                tratamientos_creados += 1
            else:
                tratamientos_actualizados += 1
            
            # Procesar frentes mínimos
            if 'frente_minimo' in detalles and isinstance(detalles['frente_minimo'], dict):
                for tipo_vivienda, frente in detalles['frente_minimo'].items():
                    FrenteMinimoPOT.objects.update_or_create(
                        tratamiento=tratamiento,
                        tipo_vivienda=tipo_vivienda,
                        defaults={'frente_minimo': frente}
                    )
            
            # Procesar áreas mínimas de lote
            if 'area_minima_lote' in detalles and isinstance(detalles['area_minima_lote'], dict):
                for tipo_vivienda, area in detalles['area_minima_lote'].items():
                    AreaMinimaLotePOT.objects.update_or_create(
                        tratamiento=tratamiento,
                        tipo_vivienda=tipo_vivienda,
                        defaults={'area_minima': area}
                    )
            
            # Procesar áreas mínimas de vivienda
            if 'area_minima_vivienda' in detalles and isinstance(detalles['area_minima_vivienda'], dict):
                for tipo_vivienda, area in detalles['area_minima_vivienda'].items():
                    AreaMinimaViviendaPOT.objects.update_or_create(
                        tratamiento=tratamiento,
                        tipo_vivienda=tipo_vivienda,
                        defaults={'area_minima': area}
                    )
        
        return Response({
            'mensaje': 'Importación completada exitosamente',
            'creados': tratamientos_creados,
            'actualizados': tratamientos_actualizados
        })
        
    except Exception as e:
        logger.exception(f"Error importando tratamientos POT: {e}")
        transaction.set_rollback(True)
        return Response({
            "error": f"Error importando tratamientos: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def crear_tratamiento_pot(request):
    """
    Crea un nuevo tratamiento POT con todos sus detalles
    """
    try:
        with transaction.atomic():
            # Crear tratamiento
            serializer = TratamientoPOTCreateUpdateSerializer(data=request.data)
            if serializer.is_valid():
                tratamiento = serializer.save()
                
                # Procesar frentes mínimos
                frentes_minimos = request.data.get('frentes_minimos', [])
                for frente in frentes_minimos:
                    frente['tratamiento'] = tratamiento.id
                    frente_serializer = FrenteMinimoPOTCreateUpdateSerializer(data=frente)
                    if frente_serializer.is_valid():
                        frente_serializer.save()
                    else:
                        return Response(frente_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                # Procesar áreas mínimas de lote
                areas_lote = request.data.get('areas_minimas_lote', [])
                for area in areas_lote:
                    area['tratamiento'] = tratamiento.id
                    area_serializer = AreaMinimaLotePOTCreateUpdateSerializer(data=area)
                    if area_serializer.is_valid():
                        area_serializer.save()
                    else:
                        return Response(area_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                # Procesar áreas mínimas de vivienda
                areas_vivienda = request.data.get('areas_minimas_vivienda', [])
                for area in areas_vivienda:
                    area['tratamiento'] = tratamiento.id
                    area_serializer = AreaMinimaViviendaPOTCreateUpdateSerializer(data=area)
                    if area_serializer.is_valid():
                        area_serializer.save()
                    else:
                        return Response(area_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                # Devolver el tratamiento completo
                result_serializer = TratamientoPOTDetailSerializer(tratamiento)
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.exception(f"Error creando tratamiento POT: {e}")
        return Response({
            "error": f"Error creando tratamiento: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consultar_normativa_por_cbml(request):
    """
    Consulta la normativa POT aplicable a un predio por su CBML.
    Integra con el servicio MapGIS para determinar el tratamiento.
    """
    try:
        cbml = request.query_params.get('cbml')
        if not cbml:
            return Response({
                "error": "Se requiere el parámetro 'cbml'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Usar el servicio POT independiente
        from .services import pot_service
        
        # Consultar información del CBML
        resultado_cbml = pot_service.consultar_normativa_por_cbml(cbml)
        
        if not resultado_cbml.get('success'):
            return Response({
                "error": resultado_cbml.get('error', 'Error desconocido')
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener tratamiento por código
        codigo = resultado_cbml.get('codigo_tratamiento')
        if not codigo:
            return Response({
                "error": "No se pudo determinar el código del tratamiento"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        resultado_tratamiento = pot_service.obtener_tratamiento_por_codigo(codigo)
        
        if not resultado_tratamiento.get('success'):
            return Response({
                "error": resultado_tratamiento.get('error', 'Tratamiento no encontrado')
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            "cbml": cbml,
            "tratamiento_encontrado": resultado_cbml.get('nombre_tratamiento'),
            "codigo_tratamiento": codigo,
            "normativa": resultado_tratamiento.get('tratamiento'),
            "datos_mapgis": resultado_cbml.get('datos_mapgis', {})
        })
            
    except Exception as e:
        logger.exception(f"Error consultando normativa por CBML: {e}")
        return Response({
            "error": f"Error consultando normativa: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calcular_aprovechamiento_pot(request):
    """
    Calcula el aprovechamiento urbanístico para un lote específico
    """
    try:
        codigo_tratamiento = request.data.get('codigo_tratamiento')
        area_lote = request.data.get('area_lote')
        tipologia = request.data.get('tipologia', 'multifamiliar')
        
        if not codigo_tratamiento or not area_lote:
            return Response({
                "error": "Se requieren 'codigo_tratamiento' y 'area_lote'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from .services import pot_service
        resultado = pot_service.calcular_aprovechamiento(codigo_tratamiento, area_lote, tipologia)
        
        if resultado.get('success'):
            return Response(resultado)
        else:
            return Response({
                "error": resultado.get('error', 'Error en cálculo')
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.exception(f"Error calculando aprovechamiento: {e}")
        return Response({
            "error": f"Error calculando aprovechamiento: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_tipos_vivienda(request):
    """
    Obtiene los tipos de vivienda disponibles en el sistema POT
    """
    try:
        tipos_vivienda = {
            'tipos_frente_minimo': [
                {'codigo': 'unifamiliar', 'nombre': 'Unifamiliar'},
                {'codigo': 'bifamiliar_pisos_diferentes', 'nombre': 'Bifamiliar en pisos diferentes'},
                {'codigo': 'bifamiliar_mismo_piso', 'nombre': 'Bifamiliar en el mismo piso'},
                {'codigo': 'trifamiliar', 'nombre': 'Trifamiliar'},
                {'codigo': 'multifamiliar', 'nombre': 'Multifamiliar'},
            ],
            'tipos_area_lote': [
                {'codigo': 'unifamiliar', 'nombre': 'Unifamiliar'},
                {'codigo': 'bifamiliar_pisos_diferentes', 'nombre': 'Bifamiliar en pisos diferentes'},
                {'codigo': 'bifamiliar_mismo_piso', 'nombre': 'Bifamiliar en el mismo piso'},
                {'codigo': 'trifamiliar', 'nombre': 'Trifamiliar'},
                {'codigo': 'multifamiliar', 'nombre': 'Multifamiliar'},
            ],
            'tipos_area_vivienda': [
                {'codigo': '1_alcoba', 'nombre': '1 Alcoba'},
                {'codigo': '2_alcobas', 'nombre': '2 Alcobas'},
                {'codigo': '3_alcobas_vip', 'nombre': '3 Alcobas VIP'},
                {'codigo': '3_alcobas_vis', 'nombre': '3 Alcobas VIS'},
                {'codigo': '4_alcobas_vip', 'nombre': '4 Alcobas VIP'},
                {'codigo': '4_alcobas_vis', 'nombre': '4 Alcobas VIS'},
            ]
        }
        
        return Response(tipos_vivienda)
        
    except Exception as e:
        logger.exception(f"Error obteniendo tipos de vivienda: {e}")
        return Response({
            "error": f"Error obteniendo tipos de vivienda: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check_pot(request):
    """
    Health check para el módulo POT
    """
    try:
        from .services import pot_service
        import datetime
        
        # Verificar conexión a base de datos
        total_tratamientos = TratamientoPOT.objects.count()
        tratamientos_activos = TratamientoPOT.objects.filter(activo=True).count()
        
        # Verificar servicio POT
        resultado_service = pot_service.listar_tratamientos_activos()
        
        health_status = {
            'status': 'ok',
            'timestamp': datetime.datetime.now().isoformat(),
            'database': {
                'total_tratamientos': total_tratamientos,
                'tratamientos_activos': tratamientos_activos,
                'conexion': 'ok'
            },
            'pot_service': {
                'disponible': resultado_service.get('success', False),
                'tratamientos_disponibles': resultado_service.get('count', 0)
            }
        }
        
        return Response(health_status)
        
    except Exception as e:
        logger.exception(f"Error en health check POT: {e}")
        return Response({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)