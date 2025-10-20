"""
Middleware personalizado para debugging de CORS
"""
import logging

logger = logging.getLogger(__name__)


class CORSDebugMiddleware:
    """Middleware para debugging de requests CORS"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log de request entrante
        origin = request.META.get('HTTP_ORIGIN', 'No origin')
        method = request.method
        path = request.path
        
        if origin != 'No origin':
            logger.debug(f"🔵 CORS Request: {method} {path} from {origin}")
        
        response = self.get_response(request)
        
        # Log de headers CORS en la respuesta
        if origin != 'No origin':
            cors_headers = {
                k: v for k, v in response.items() 
                if k.lower().startswith('access-control')
            }
            if cors_headers:
                logger.debug(f"🟢 CORS Response headers: {cors_headers}")
            else:
                logger.warning(f"⚠️  No CORS headers in response for {path}")
        
        return response
