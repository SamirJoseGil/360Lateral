"""
Middleware para logging de requests API
"""
import json
import logging
import time
import traceback
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger('api.requests')

class APILoggingMiddleware(MiddlewareMixin):
    """
    Middleware que registra todas las peticiones API con información detallada.
    """
    
    def __init__(self, get_response=None):
        self.get_response = get_response
        self.log_request_body = getattr(settings, 'API_LOG_REQUEST_BODY', True)
        self.log_response_body = getattr(settings, 'API_LOG_RESPONSE_BODY', True) 
        self.max_body_length = getattr(settings, 'API_LOG_MAX_BODY_LENGTH', 5000)
        
        # APIs que queremos monitorear
        self.monitored_paths = [
            '/api/auth/',
            '/api/users/',
            '/api/lotes/',
            '/api/documentos/',
        ]
        
        # Paths que solo loggeamos en caso de error
        self.error_only_paths = [
            '/api/stats/events/record/',
            '/api/stats/metrics/',
            '/api/common/health/',
        ]
        
        # Endpoints sensibles cuyo contenido no debe ser registrado
        self.sensitive_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/change-password/'
        ]
        
    def should_log_path(self, path):
        """Determina si la ruta debe ser registrada."""
        return any(path.startswith(monitored) for monitored in self.monitored_paths)
    
    def should_log_error_only(self, path):
        """Determina si la ruta solo debe loggearse en caso de error."""
        return any(path.startswith(error_only) for error_only in self.error_only_paths)
        
    def is_sensitive_path(self, path):
        """Comprueba si la ruta contiene información sensible."""
        return any(path.startswith(sensitive) for sensitive in self.sensitive_paths)
        
    def get_client_ip(self, request):
        """Obtiene la IP real del cliente incluso detrás de proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Si está detrás de un proxy, tomar la primera IP
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            # De lo contrario, usar la IP directa
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip
    
    def process_request(self, request):
        """Registrar inicio de la petición"""
        request.start_time = time.time()
        
        # Solo registrar solicitudes a la API
        if not self.should_log_path(request.path):
            return None
            
        # Guardar el tiempo de inicio para calcular el tiempo de respuesta
        request.api_req_time = time.time()
        
        # Si estamos registrando el cuerpo de la solicitud y no es sensible
        if self.log_request_body and not self.is_sensitive_path(request.path):
            try:
                # Para solicitudes POST con formato form-data o multipart
                if request.POST:
                    request.api_req_body = dict(request.POST)
                # Para solicitudes con JSON en el cuerpo
                elif request.body:
                    try:
                        request.api_req_body = json.loads(request.body)
                    except json.JSONDecodeError:
                        request.api_req_body = {'raw_body': str(request.body)[:self.max_body_length]}
                else:
                    request.api_req_body = None
            except Exception:
                request.api_req_body = {'error': 'No se pudo analizar el cuerpo de la solicitud'}
        else:
            request.api_req_body = None if self.is_sensitive_path(request.path) else {'message': 'Cuerpo de solicitud no registrado por configuración'}
        
        return None
    
    def process_response(self, request, response):
        """Registrar respuesta y tiempo de ejecución"""
        # Solo registrar solicitudes a la API
        if not self.should_log_path(request.path) and not self.should_log_error_only(request.path):
            return response
        
        # Para paths de solo errores, solo loggear si hay problemas
        if self.should_log_error_only(request.path) and 200 <= response.status_code < 400:
            return response
            
        # Calcular el tiempo de respuesta
        api_req_time = getattr(request, 'api_req_time', time.time())
        api_res_time = time.time() - api_req_time
        
        # Determinar el usuario
        user = request.user if hasattr(request, 'user') else None
        user_id = user.id if user and user.is_authenticated else None
        username = user.username if user and user.is_authenticated else "anonymous"
        
        # Intentar obtener el cuerpo de la respuesta si está configurado
        response_body = None
        if self.log_response_body and not self.is_sensitive_path(request.path):
            try:
                if hasattr(response, 'data'):
                    response_body = response.data
                elif hasattr(response, 'content'):
                    try:
                        response_body = json.loads(response.content.decode('utf-8'))
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        response_body = {'raw_content': str(response.content)[:self.max_body_length]}
            except Exception:
                response_body = {'error': 'No se pudo analizar la respuesta'}
        
        # Determinar si la respuesta fue exitosa (códigos 2xx)
        success = 200 <= response.status_code < 300
        
        # Registrar la información
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'path': request.path,
            'method': request.method,
            'status_code': response.status_code,
            'success': success,
            'response_time': round(api_res_time * 1000, 2),  # en milisegundos
            'user_id': user_id,
            'username': username,
            'ip': self.get_client_ip(request),
            'request_body': getattr(request, 'api_req_body', None),
            'response_body': response_body
        }
        
        # Determinar el nivel de log según el código de estado
        if success:
            logger.info(f"API REQUEST: {request.method} {request.path} - {response.status_code} - {username} - {round(api_res_time * 1000, 2)}ms", 
                        extra=log_data)
        elif 400 <= response.status_code < 500:
            logger.warning(f"API CLIENT ERROR: {request.method} {request.path} - {response.status_code} - {username}", 
                          extra=log_data)
        else:
            logger.error(f"API SERVER ERROR: {request.method} {request.path} - {response.status_code} - {username}", 
                         extra=log_data)
        
        return response
    
    def process_exception(self, request, exception):
        """Registrar excepciones"""
        logger.error(
            f"[API Exception] {request.method} {request.path} | "
            f"Exception: {exception.__class__.__name__}: {str(exception)} | "
            f"IP: {self.get_client_ip(request)} | "
            f"User: {getattr(request.user, 'email', 'anonymous')}",
            exc_info=True
        )
        return None
