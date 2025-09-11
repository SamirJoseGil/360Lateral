# This file makes the views directory a Python package

"""
Vistas para la aplicación de lotes - Módulo optimizado
"""

# Importar vistas CRUD básicas
from .lotes_views import lote_list, lote_detail, lote_create, lote_update, lote_delete

# Importar vistas MapGIS
from .mapgis_views import (
    scrap_cbml,
    scrap_matricula,
    scrap_direccion,
    consultar_restricciones_completas,
    health_mapgis,
)

# Importar vistas públicas de MapGIS
from .public_mapgis_views import PublicCBMLView, PublicMatriculaView, PublicDireccionView

# Importar vistas de tratamientos
from .tratamientos_views import listar_tratamientos

# Importar vistas de favoritos
from .favorites_views import FavoriteViewSet

# Importar vistas de usuarios
from .user_lotes import UserLotesView, my_lotes, user_lote_stats

# Definir qué símbolos exporta este módulo
__all__ = [
    # CRUD de lotes
    'lote_list', 'lote_detail', 'lote_create', 'lote_update', 'lote_delete',
    
    # MapGIS
    'scrap_cbml', 'scrap_matricula', 'scrap_direccion',
    'consultar_restricciones_completas', 'health_mapgis',
    
    # Tratamientos
    'listar_tratamientos',

    # Vistas públicas
    'PublicCBMLView', 'PublicMatriculaView', 'PublicDireccionView',
    
    # Favoritos
    'FavoriteViewSet',
    
    # Usuarios
    'UserLotesView', 'my_lotes', 'user_lote_stats',
]