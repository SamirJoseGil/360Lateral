"""
Servicio base con utilidades comunes para MapGIS
"""
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class MapGISBaseService:
    """Clase base con utilidades comunes para servicios de MapGIS"""
    
    def _get_timestamp(self) -> str:
        """Obtener timestamp actual en formato ISO"""
        return datetime.now().isoformat()
    
    def _success_response(self, data: Dict[Any, Any]) -> Dict[str, Any]:
        """
        Generar respuesta exitosa estándar
        Args:
            data: Datos a retornar
        Returns:
            Dict con estructura de respuesta exitosa
        """
        return {
            'success': True,
            'data': data,
            'error': None
        }
    
    def _error_response(self, error: str, mensaje: str) -> Dict[str, Any]:
        """
        Generar respuesta de error estándar
        Args:
            error: Código o tipo de error
            mensaje: Mensaje descriptivo del error
        Returns:
            Dict con estructura de respuesta de error
        """
        return {
            'success': False,
            'error': error,
            'mensaje': mensaje,
            'data': None
        }
    
    def _clean_text(self, text: str) -> str:
        """
        Limpiar texto de espacios y caracteres especiales
        Args:
            text: Texto a limpiar
        Returns:
            str: Texto limpio
        """
        if not text:
            return ""
        return text.strip()
    
    def _validate_cbml(self, cbml: str) -> bool:
        """
        Validar formato básico de CBML
        Args:
            cbml: Código CBML a validar
        Returns:
            bool: True si es válido
        """
        if not cbml:
            return False
        
        # ✅ Sin validación de longitud (acepta cualquier CBML)
        return True
    
    def _log_operation(self, operation: str, cbml: str = None, success: bool = True, **kwargs):
        """
        Registrar operación en logs
        Args:
            operation: Nombre de la operación
            cbml: CBML relacionado (opcional)
            success: Si fue exitosa
            **kwargs: Datos adicionales
        """
        log_data = {
            'operation': operation,
            'cbml': cbml,
            'success': success,
            'timestamp': self._get_timestamp(),
            **kwargs
        }
        
        if success:
            logger.info(f"[MapGIS] {operation} - {log_data}")
        else:
            logger.error(f"[MapGIS] {operation} FAILED - {log_data}")
