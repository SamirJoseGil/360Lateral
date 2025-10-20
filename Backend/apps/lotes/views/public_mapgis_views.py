"""
Vistas públicas para MapGIS (sin autenticación)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import logging

logger = logging.getLogger(__name__)


class PublicMapGISCBMLView(APIView):
    """
    Búsqueda pública por CBML en MapGIS
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Buscar lote por CBML
        
        Body:
        {
            "cbml": "01010010010010"
        }
        """
        from ..services.mapgis_service import MapGISService
        
        cbml = request.data.get('cbml')
        
        if not cbml:
            return Response({
                'success': False,
                'error': 'CBML es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            service = MapGISService()
            result = service.buscar_por_cbml(cbml)
            return Response(result)
        except Exception as e:
            logger.error(f"Error in public CBML search: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error consultando MapGIS'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicMapGISMatriculaView(APIView):
    """
    Búsqueda pública por matrícula en MapGIS
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Buscar lote por matrícula
        
        Body:
        {
            "matricula": "001-123456"
        }
        """
        from ..services.mapgis_service import MapGISService
        
        matricula = request.data.get('matricula')
        
        if not matricula:
            return Response({
                'success': False,
                'error': 'Matrícula es requerida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            service = MapGISService()
            result = service.buscar_por_matricula(matricula)
            return Response(result)
        except Exception as e:
            logger.error(f"Error in public matricula search: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error consultando MapGIS'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicMapGISDireccionView(APIView):
    """
    Búsqueda pública por dirección en MapGIS
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Buscar lotes por dirección
        
        Body:
        {
            "direccion": "Carrera 43A"
        }
        """
        from ..services.mapgis_service import MapGISService
        
        direccion = request.data.get('direccion')
        
        if not direccion:
            return Response({
                'success': False,
                'error': 'Dirección es requerida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            service = MapGISService()
            result = service.buscar_por_direccion(direccion)
            return Response(result)
        except Exception as e:
            logger.error(f"Error in public direccion search: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error consultando MapGIS'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)