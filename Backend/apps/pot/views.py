"""
Vistas para la API REST de tratamientos POT.
"""
import logging
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.views import APIView

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
        
        # Importar el servicio de tratamientos de lotes
        from apps.lotes.services.tratamiento_service import TratamientoService
        
        # Obtener el tratamiento aplicable al CBML
        servicio = TratamientoService()
        resultado = servicio.obtener_tratamiento_por_cbml(cbml)
        
        if not resultado:
            return Response({
                "error": f"No se encontró información para el CBML: {cbml}"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener el nombre del tratamiento
        nombre_tratamiento = resultado.get('nombre')
        if not nombre_tratamiento:
            return Response({
                "error": "La información del tratamiento está incompleta"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Buscar el tratamiento en la base de datos
        codigo = None
        if "Consolidación Nivel 1" in nombre_tratamiento:
            codigo = "CN1"
        elif "Consolidación Nivel 2" in nombre_tratamiento:
            codigo = "CN2"
        elif "Consolidación Nivel 3" in nombre_tratamiento:
            codigo = "CN3"
        elif "Consolidación Nivel 4" in nombre_tratamiento:
            codigo = "CN4"
        elif "Redesarrollo" in nombre_tratamiento:
            codigo = "RD"
        elif "Desarrollo" in nombre_tratamiento:
            codigo = "D"
        elif "Conservación" in nombre_tratamiento:
            codigo = "C"
        else:
            # Buscar por nombre si no coincide exactamente
            tratamientos = TratamientoPOT.objects.filter(nombre__icontains=nombre_tratamiento[:10])
            if tratamientos.exists():
                tratamiento = tratamientos.first()
                return Response({
                    "cbml": cbml,
                    "tratamiento": TratamientoPOTDetailSerializer(tratamiento).data
                })
            else:
                return Response({
                    "error": f"No se encontró un tratamiento POT para: {nombre_tratamiento}"
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Buscar por código
        try:
            tratamiento = TratamientoPOT.objects.get(codigo=codigo)
            return Response({
                "cbml": cbml,
                "tratamiento": TratamientoPOTDetailSerializer(tratamiento).data
            })
        except TratamientoPOT.DoesNotExist:
            return Response({
                "error": f"No se encontró el tratamiento POT con código: {codigo}"
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        logger.exception(f"Error consultando normativa por CBML: {e}")
        return Response({
            "error": f"Error consultando normativa: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)