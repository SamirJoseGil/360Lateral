"""
Vistas públicas para consulta de información de MapGIS.
Estas vistas no requieren autenticación.
"""
from django.http import JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

import logging
logger = logging.getLogger(__name__)

class PublicCBMLView(APIView):
    """Vista pública para consulta de lotes por CBML"""
    authentication_classes = []  # Desactivar autenticación explícitamente
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Consulta un predio por CBML sin requerir autenticación"""
        try:
            # Obtener CBML de los datos de la solicitud
            cbml = request.data.get('cbml')
            
            if not cbml:
                return Response(
                    {"error": "CBML requerido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Log para depuración
            logger.info(f"Procesando consulta pública de CBML: {cbml}")
            
            # Importamos directamente el servicio MapGIS
            from ..services.mapgis_service import MapGISService
            mapgis_service = MapGISService()
            
            # Llamar al servicio con el método correcto
            resultado = mapgis_service.buscar_por_cbml(cbml)
            
            # Logging detallado del resultado para depuración
            logger.info(f"🔍 Resultado obtenido para CBML {cbml}: encontrado={resultado.get('encontrado', False)}")
            
            if resultado.get('error'):
                logger.warning(f"⚠️ Error en resultado para CBML {cbml}: {resultado.get('error')}")
                if resultado.get('codigo_error'):
                    logger.warning(f"⚠️ Código de error: {resultado.get('codigo_error')}")
            
            if resultado.get('datos'):
                datos = resultado.get('datos', {})
                logger.info(f"📊 Datos encontrados para CBML {cbml}:")
                logger.info(f"   - Área: {datos.get('area_lote')}")
                logger.info(f"   - Clasificación: {datos.get('clasificacion_suelo')}")
                
                # Información detallada
                uso = datos.get('uso_suelo', {})
                if uso and uso.get('categoria_uso'):
                    logger.info(f"   - Uso del suelo: {uso.get('categoria_uso')} - {uso.get('subcategoria_uso')}")
                
                aprovechamiento = datos.get('aprovechamiento_urbano', {})
                if aprovechamiento and aprovechamiento.get('tratamiento'):
                    logger.info(f"   - Tratamiento: {aprovechamiento.get('tratamiento')}")
                    logger.info(f"   - Densidad: {aprovechamiento.get('densidad_habitacional_max')} viv/ha")
                
                restricciones = datos.get('restricciones_ambientales', {})
                if restricciones:
                    logger.info(f"   - Restricciones: {len(restricciones)} tipos identificados")
            else:
                logger.warning(f"❌ No se encontraron datos para CBML {cbml}")
                logger.info(f"📑 Estructura completa de la respuesta: {resultado}")
            
            # Devolver el resultado - Formateamos como JSON para ver estructura completa en el log
            import json
            logger.debug(f"📄 JSON de respuesta: {json.dumps(resultado, indent=2, ensure_ascii=False)[:1000]}")
            return Response(resultado, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error en scrap CBML público: {e}")
            return Response(
                {"error": f"Error del servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PublicMatriculaView(APIView):
    """Vista pública para consulta de lotes por matrícula inmobiliaria"""
    authentication_classes = []  # Desactivar autenticación explícitamente
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Consulta un predio por matrícula sin requerir autenticación"""
        try:
            # Obtener matrícula de los datos de la solicitud
            matricula = request.data.get('matricula')
            
            if not matricula:
                return Response(
                    {"error": "Matrícula inmobiliaria requerida"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Log para depuración
            logger.info(f"Procesando consulta pública de matrícula: {matricula}")
            
            # Importamos directamente el servicio MapGIS
            from ..services.mapgis_service import MapGISService
            mapgis_service = MapGISService()
            
            # Llamar al servicio con el método correcto
            resultado = mapgis_service.buscar_por_matricula(matricula)
            
            # Devolver el resultado
            return Response(resultado, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error en scrap matrícula pública: {e}")
            return Response(
                {"error": f"Error del servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PublicDireccionView(APIView):
    """Vista pública para consulta de lotes por dirección"""
    authentication_classes = []  # Desactivar autenticación explícitamente
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Consulta un predio por dirección sin requerir autenticación"""
        try:
            # Obtener dirección de los datos de la solicitud
            direccion = request.data.get('direccion')
            
            if not direccion:
                return Response(
                    {"error": "Dirección requerida"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Log para depuración
            logger.info(f"Procesando consulta pública de dirección: {direccion}")
            
            # Importamos directamente el servicio MapGIS
            from ..services.mapgis_service import MapGISService
            mapgis_service = MapGISService()
            
            # Llamar al servicio con el método correcto
            resultado = mapgis_service.buscar_por_direccion(direccion)
            
            # Devolver el resultado
            return Response(resultado, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error en scrap dirección pública: {e}")
            return Response(
                {"error": f"Error del servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )