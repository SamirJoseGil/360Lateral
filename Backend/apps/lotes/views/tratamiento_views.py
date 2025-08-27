"""
Vistas para tratamientos urbanísticos
"""
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from ..services.tratamiento_service import TratamientoService

import logging
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_tratamientos(request):
    """
    Devuelve una lista de tratamientos urbanísticos definidos en el POT
    """
    try:
        servicio = TratamientoService()
        tratamientos = servicio.obtener_tratamientos()
        
        return Response({
            "count": len(tratamientos),
            "results": tratamientos
        })
    except Exception as e:
        logger.exception(f"Error obteniendo tratamientos: {e}")
        return Response(
            {"error": f"Error obteniendo tratamientos: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_tratamiento_por_cbml(request):
    """
    Consulta el tratamiento aplicable a un predio por su CBML
    """
    try:
        cbml = request.query_params.get('cbml')
        if not cbml:
            return Response(
                {"error": "CBML requerido como parámetro de consulta"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        servicio = TratamientoService()
        tratamiento = servicio.obtener_tratamiento_por_cbml(cbml)
        
        if tratamiento:
            return Response(tratamiento)
        else:
            return Response(
                {"error": f"No se encontró tratamiento para el CBML: {cbml}"},
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        logger.exception(f"Error consultando tratamiento por CBML: {e}")
        return Response(
            {"error": f"Error consultando tratamiento: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def actualizar_tratamientos(request):
    """
    Actualiza la base de datos de tratamientos desde MapGIS.
    Solo accesible para administradores.
    """
    try:
        # Obtener parámetro para forzar actualización
        forzar = request.data.get('forzar', False)
        
        servicio = TratamientoService()
        resultado = servicio.actualizar_tratamientos(forzar)
        
        if resultado.get('error'):
            return Response(
                resultado,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(resultado)
    except Exception as e:
        logger.exception(f"Error actualizando tratamientos: {e}")
        return Response(
            {
                "actualizado": False,
                "mensaje": f"Error actualizando tratamientos: {str(e)}",
                "error": True
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )