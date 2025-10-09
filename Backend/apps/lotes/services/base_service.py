"""
Clase base para servicios con utilidades comunes
"""
import logging
import re
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class BaseService:
    """
    Clase base con utilidades comunes para todos los servicios
    """
    
    def _get_timestamp(self) -> str:
        """Obtiene timestamp actual"""
        return datetime.now().isoformat()
    
    def _error_response(self, message: str, detail: str = "") -> Dict:
        """Genera respuesta de error estándar"""
        return {
            'encontrado': False,
            'error': True,
            'mensaje': message,
            'detalle': detail,
            'timestamp': self._get_timestamp()
        }
    
    def _success_response(self, data: Dict, message: str = "Operación exitosa") -> Dict:
        """Genera respuesta de éxito estándar"""
        return {
            'success': True,
            'encontrado': True,
            'mensaje': message,
            'data': data,
            'timestamp': self._get_timestamp()
        }
    
    def _clean_numeric_value(self, value: str) -> float:
        """Limpia y convierte valores numéricos"""
        try:
            cleaned = re.sub(r'[,\s]', '', str(value))
            return float(cleaned)
        except (ValueError, TypeError):
            return 0.0
    
    def _clean_text_value(self, value: str) -> str:
        """Limpia valores de texto"""
        if not value:
            return ""
        
        # Remover tags HTML
        clean_value = re.sub(r'<[^>]+>', '', str(value))
        # Normalizar espacios
        clean_value = re.sub(r'\s+', ' ', clean_value)
        # Remover caracteres especiales al inicio y final
        clean_value = re.sub(r'^["\',<>]+|["\',<>]+$', '', clean_value)
        
        return clean_value.strip()
