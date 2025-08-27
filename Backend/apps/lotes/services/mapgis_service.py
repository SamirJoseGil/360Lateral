"""
Servicio para interactuar con MapGIS de Medellín (Versión actual).

Este archivo mantiene la compatibilidad con la API anterior,
pero internamente usa la nueva implementación modular.
"""

import logging
from typing import Dict, Any
from django.conf import settings

from .mapgis.service import MapGISService as NewMapGISService

# Configuración del logger
logger = logging.getLogger(__name__)

class MapGISService:
    """
    Servicio para interactuar con MapGIS de Medellín.
    Esta clase es un wrapper de la nueva implementación para mantener compatibilidad.
    """
    
    def __init__(self):
        """Inicializa el servicio."""
        self._service = NewMapGISService()
    
    def buscar_por_cbml(self, cbml: str) -> Dict[str, Any]:
        """
        Busca información de un lote por CBML.
        
        Args:
            cbml: Código CBML
            
        Returns:
            Dict con información del lote o error
        """
        return self._service.buscar_por_cbml(cbml)
    
    def buscar_por_matricula(self, matricula: str) -> Dict[str, Any]:
        """
        Busca información de un lote por matrícula.
        
        Args:
            matricula: Número de matrícula inmobiliaria
            
        Returns:
            Dict con información del lote o error
        """
        return self._service.buscar_por_matricula(matricula)
    
    def buscar_por_direccion(self, direccion: str) -> Dict[str, Any]:
        """
        Busca información de un lote por dirección.
        
        Args:
            direccion: Dirección del lote
            
        Returns:
            Dict con información del lote o error
        """
        return self._service.buscar_por_direccion(direccion)
    
    def health_check(self) -> Dict[str, Any]:
        """
        Verifica el estado del servicio.
        
        Returns:
            Dict con información del estado
        """
        return self._service.health_check()