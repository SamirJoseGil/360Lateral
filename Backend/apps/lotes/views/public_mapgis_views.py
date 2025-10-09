"""
Vistas públicas para consultas MapGIS - SIN AUTENTICACIÓN REQUERIDA
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny  # ✅ CRÍTICO: Permitir acceso sin autenticación
import logging

from ..services.mapgis_service import MapGISService

logger = logging.getLogger(__name__)

class PublicCBMLView(APIView):
    """
    Vista pública para consultar información por CBML
    NO requiere autenticación
    """
    permission_classes = [AllowAny]  # ✅ CRÍTICO
    
    def post(self, request):
        cbml = request.data.get('cbml')
        
        if not cbml:
            return Response({
                'success': False,
                'message': 'CBML es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            mapgis_service = MapGISService()
            resultado = mapgis_service.buscar_por_cbml(cbml)
            
            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error en consulta pública CBML: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error al consultar MapGIS',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicMatriculaView(APIView):
    """
    Vista pública para consultar información por Matrícula
    NO requiere autenticación
    """
    permission_classes = [AllowAny]  # ✅ CRÍTICO
    
    def post(self, request):
        matricula = request.data.get('matricula')
        
        if not matricula:
            return Response({
                'success': False,
                'message': 'Matrícula es requerida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            mapgis_service = MapGISService()
            resultado = mapgis_service.buscar_por_matricula(matricula)
            
            return Response(resultado, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error en consulta pública matrícula: {str(e)}")
            return Response({
                'success': False,
                'message': 'Error al consultar MapGIS',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)