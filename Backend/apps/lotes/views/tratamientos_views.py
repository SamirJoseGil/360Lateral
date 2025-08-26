"""
Vistas para la gestión de tratamientos urbanísticos y POT
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import logging

from ..services import lotes_service
from ..services.tratamientos_service import tratamientos_service

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_tratamientos(request):
    """Listar tratamientos del POT disponibles"""
    try:
        # Usar servicio de tratamientos
        tratamientos = tratamientos_service.listar_tratamientos()
        
        return Response({
            'success': True,
            'tratamientos': tratamientos,
            'count': len(tratamientos),
            'timestamp': lotes_service._get_timestamp()
        })
        
    except Exception as e:
        logger.error(f"Error en listar_tratamientos: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


def _validar_formato_matricula(matricula: str) -> bool:
    """Valida el formato de matrícula inmobiliaria"""
    import re
    patterns = [
        r'^\d{2,3}[A-Z]?-?\d{6,8}$',
        r'^\d{2,3}-\d{6,8}$',
        r'^\d{8,12}$'
    ]
    
    return any(re.match(pattern, matricula) for pattern in patterns)