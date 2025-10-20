"""
Middleware común para la aplicación
"""

import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para loggear todas las requests.
    """
    
    def process_request(self, request):
        """Registrar inicio de request"""
        request.start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Registrar respuesta y tiempo de ejecución"""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Determinar nivel de log según status code
            if response.status_code >= 500:
                log_level = logger.error
            elif response.status_code >= 400:
                log_level = logger.warning
            else:
                log_level = logger.info
            
            # Log detallado
            log_level(
                f"{request.method} {request.path} | "
                f"Status: {response.status_code} | "
                f"Time: {duration:.3f}s | "
                f"User: {getattr(request.user, 'email', 'anonymous')}"
            )
        
        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware para agregar headers de seguridad.
    """
    
    def process_response(self, request, response):
        """Agregar headers de seguridad"""
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response