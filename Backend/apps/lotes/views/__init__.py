"""
Inicialización del módulo de vistas para la aplicación de lotes
"""

# Importar vistas CRUD básicas
from .lotes_views import lote_list, lote_detail

# Importar vistas MapGIS
from .mapgis_views import (
    scrap_cbml,
    scrap_matricula,
    scrap_direccion,
    consultar_restricciones_completas,
    health_mapgis,
)

# Importar vistas de pruebas MapGIS
from .test_mapgis_views import (
    test_mapgis_session,
    test_mapgis_real_connection,
    investigate_mapgis_endpoints,
    test_mapgis_complete_data,
)

# Importar vistas de tratamientos
from .tratamientos_views import listar_tratamientos

# Definir qué símbolos exporta este módulo
__all__ = [
    # CRUD de lotes
    'lote_list', 'lote_detail',
    
    # MapGIS
    'scrap_cbml', 'scrap_matricula', 'scrap_direccion',
    'consultar_restricciones_completas', 'health_mapgis',
    
    # Testing MapGIS
    'test_mapgis_session', 'test_mapgis_real_connection',
    'investigate_mapgis_endpoints', 'test_mapgis_complete_data',
    
    # Tratamientos
    'listar_tratamientos',
]