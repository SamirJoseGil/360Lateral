"""
Vistas para testing y diagnóstico del servicio MapGIS
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

from ..services import lotes_service

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def test_mapgis_session(request):
    """Test de sesión MapGIS"""
    try:
        from ..services import mapgis_service
        
        return Response({
            'session_initialized': mapgis_service.session_initialized,
            'mode': 'production',
            'mensaje': 'Conexión real con MapGIS Medellín',
            'cookies_count': len(mapgis_service.session.cookies),
            'headers': dict(mapgis_service.session.headers),
            'endpoints_disponibles': [
                '/api/lotes/scrap/cbml/',
                '/api/lotes/scrap/matricula/',
                '/api/lotes/scrap/direccion/'
            ]
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en test_mapgis_session: {str(e)}")
        return Response({
            'error': True,
            'mensaje': 'Error al probar sesión MapGIS',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def test_mapgis_real_connection(request):
    """Test de conexión real con MapGIS"""
    try:
        from ..services import mapgis_service
        
        cbml_test = '14180230004'
        logger.info(f"Probando conexión real con CBML: {cbml_test}")
        
        # Reinicializar sesión para test
        mapgis_service.session_initialized = False
        
        # Intentar la consulta real
        resultado = mapgis_service.buscar_por_cbml(cbml_test)
        
        return Response({
            'test_successful': not resultado.get('error', True),
            'found_data': resultado.get('encontrado', False),
            'data': resultado,
            'session_info': {
                'initialized': mapgis_service.session_initialized,
                'cookies_count': len(mapgis_service.session.cookies)
            },
            'timestamp': lotes_service._get_timestamp()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en test_mapgis_real_connection: {str(e)}")
        return Response({
            'error': True,
            'mensaje': 'Error al probar conexión real con MapGIS',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def investigate_mapgis_endpoints(request):
    """Investigar endpoints de MapGIS"""
    try:
        from ..services import mapgis_service
        
        logger.info("Iniciando investigación de endpoints MapGIS")
        
        # Reinicializar servicio
        mapgis_service.session_initialized = False
        
        # Inicializar sesión
        session_ok = mapgis_service._inicializar_sesion()
        
        return Response({
            'investigation_complete': True,
            'session_initialized': session_ok,
            'base_url': mapgis_service.base_url,
            'cookies_obtained': len(mapgis_service.session.cookies),
            'timestamp': lotes_service._get_timestamp(),
            'recommendations': [
                'Usar GET con parámetros en URL si está disponible',
                'Verificar si el endpoint necesita autenticación específica',
                'Comprobar si hay un token de sesión requerido',
                'Revisar si hay un endpoint de API REST alternativo'
            ]
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en investigate_mapgis_endpoints: {str(e)}")
        return Response({
            'error': True,
            'mensaje': 'Error al investigar endpoints MapGIS',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def test_mapgis_complete_data(request):
    """Test completo de extracción de datos MapGIS"""
    try:
        from ..services import mapgis_service
        
        cbml_test = request.data.get('cbml', '14180230004')
        logger.info(f"Probando extracción completa con CBML: {cbml_test}")
        
        # Reinicializar sesión para test
        mapgis_service.session_initialized = False
        
        # Realizar consulta completa
        resultado = mapgis_service.buscar_por_cbml(cbml_test)
        
        # Resumen de datos extraídos
        datos_extraidos = {}
        if resultado.get('encontrado') and 'datos' in resultado:
            datos = resultado['datos']
            
            # Datos básicos
            if 'cbml' in datos:
                datos_extraidos['cbml'] = datos['cbml']
            
            # Área del lote
            if 'area_lote' in datos:
                datos_extraidos['area_lote'] = datos['area_lote']
            if 'area_lote_m2' in datos:
                datos_extraidos['area_lote_m2'] = datos['area_lote_m2']
            
            # Clasificación del suelo
            if 'clasificacion_suelo' in datos:
                datos_extraidos['clasificacion_suelo'] = datos['clasificacion_suelo']
            
            # Uso del suelo
            if 'uso_suelo' in datos:
                datos_extraidos['uso_suelo'] = datos['uso_suelo']
            
            # Aprovechamiento urbano
            if 'aprovechamiento_urbano' in datos:
                datos_extraidos['aprovechamiento_urbano'] = datos['aprovechamiento_urbano']
            
            # Restricciones ambientales - MEJORADO
            if 'restricciones_ambientales' in datos:
                restricciones = datos['restricciones_ambientales']
                
                # Extraer datos específicos de amenaza y riesgo
                if 'amenaza_riesgo' in restricciones:
                    datos_extraidos['restriccion_amenaza_riesgo'] = restricciones['amenaza_riesgo']
                
                # Extraer datos específicos de retiros a ríos
                if 'retiros_rios' in restricciones:
                    datos_extraidos['restriccion_rios_quebradas'] = restricciones['retiros_rios']
                
                # Extraer datos de estructura ecológica
                if 'estructura_ecologica' in restricciones:
                    datos_extraidos['estructura_ecologica'] = restricciones['estructura_ecologica']
            
            # Casos POT
            if 'casos_pot' in datos:
                datos_extraidos['casos_pot'] = 'Disponible'
        
        # Agregar consulta adicional de restricciones si no están presentes
        if 'restriccion_amenaza_riesgo' not in datos_extraidos or 'restriccion_rios_quebradas' not in datos_extraidos:
            logger.info("Consultando restricciones adicionales...")
            restricciones_completas = mapgis_service.consultar_restricciones_completas(cbml_test)
            
            if restricciones_completas.get('encontrado') and 'restricciones' in restricciones_completas:
                rest_data = restricciones_completas['restricciones']
                
                if 'restriccion_amenaza_riesgo' not in datos_extraidos:
                    datos_extraidos['restriccion_amenaza_riesgo'] = rest_data.get('amenaza_riesgo', 'No disponible')
                
                if 'restriccion_rios_quebradas' not in datos_extraidos:
                    datos_extraidos['restriccion_rios_quebradas'] = rest_data.get('retiros_rios', 'No disponible')
                
                if 'estructura_ecologica' not in datos_extraidos:
                    datos_extraidos['estructura_ecologica'] = rest_data.get('estructura_ecologica', 'No disponible')
        
        return Response({
            'test_successful': resultado.get('encontrado', False),
            'cbml_consultado': cbml_test,
            'datos_extraidos': datos_extraidos,
            'total_campos': len(datos_extraidos),
            'resultado_completo': resultado,
            'timestamp': lotes_service._get_timestamp()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en test_mapgis_complete_data: {str(e)}")
        return Response({
            'error': True,
            'mensaje': 'Error al probar extracción completa',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)