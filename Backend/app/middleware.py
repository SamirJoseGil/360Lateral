import json
import logging
import time
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger('security')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware que añade headers de seguridad a todas las respuestas
    """
    
    def process_response(self, request, response):
        # Headers de seguridad básicos
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Content Security Policy básica
        if not response.get('Content-Security-Policy'):
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )
            response['Content-Security-Policy'] = csp
        
        # Headers HTTPS en producción
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
            response['Expect-CT'] = 'max-age=86400, enforce'
        
        return response


class RateLimitMiddleware(MiddlewareMixin):
    """
    Middleware para limitar la tasa de requests por IP/usuario
    """
    
    def __init__(self, get_response):
        super().__init__(get_response)
        self.rate_limits = {
            # Endpoints más sensibles
            '/api/auth/login/': {'requests': 5, 'period': 300},  # 5 intentos en 5 min
            '/api/auth/register/': {'requests': 3, 'period': 3600},  # 3 registros por hora
            '/api/users/': {'requests': 100, 'period': 3600},  # 100 requests por hora
            '/api/lotes/': {'requests': 200, 'period': 3600},  # 200 requests por hora
            # Rate limit general
            'default': {'requests': 1000, 'period': 3600}  # 1000 requests por hora
        }
    
    def process_request(self, request):
        # Obtener IP del cliente
        ip = self.get_client_ip(request)
        path = request.path
        
        # Determinar límite aplicable
        limit_config = self.rate_limits.get(path, self.rate_limits['default'])
        
        # Crear clave única para el cache
        cache_key = f"rate_limit:{ip}:{path}"
        
        # Obtener contador actual
        current_requests = cache.get(cache_key, 0)
        
        if current_requests >= limit_config['requests']:
            logger.warning(f"Rate limit exceeded for IP {ip} on path {path}")
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'message': f"Too many requests. Try again in {limit_config['period']} seconds"
            }, status=429)
        
        # Incrementar contador
        cache.set(cache_key, current_requests + 1, limit_config['period'])
        
        return None
    
    def get_client_ip(self, request):
        """Obtener IP real del cliente considerando proxies"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para logging de eventos de seguridad
    """
    
    def __init__(self, get_response):
        super().__init__(get_response)
        self.sensitive_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/users/',
            '/admin/'
        ]
        self.sensitive_methods = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    def process_request(self, request):
        # Guardar tiempo de inicio para medir duración
        request._security_start_time = time.time()
        
        # Log de requests sensibles
        if self.is_sensitive_request(request):
            self.log_security_event(request, 'REQUEST_RECEIVED')
        
        return None
    
    def process_response(self, request, response):
        # Calcular duración del request
        duration = time.time() - getattr(request, '_security_start_time', time.time())
        
        # Log de respuestas con errores o accesos sensibles
        if (response.status_code >= 400 or 
            self.is_sensitive_request(request) or
            hasattr(request, 'user') and request.user.is_authenticated):
            
            self.log_security_event(request, 'RESPONSE_SENT', {
                'status_code': response.status_code,
                'duration': round(duration, 3)
            })
        
        return response
    
    def process_exception(self, request, exception):
        # Log de excepciones
        self.log_security_event(request, 'EXCEPTION', {
            'exception': str(exception),
            'exception_type': type(exception).__name__
        })
        return None
    
    def is_sensitive_request(self, request):
        """Determinar si un request es sensible desde el punto de vista de seguridad"""
        return (
            any(path in request.path for path in self.sensitive_paths) or
            request.method in self.sensitive_methods
        )
    
    def log_security_event(self, request, event_type, extra_data=None):
        """Registrar evento de seguridad"""
        log_data = {
            'event_type': event_type,
            'ip': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200],
            'path': request.path,
            'method': request.method,
            'timestamp': time.time()
        }
        
        # Añadir información del usuario si está autenticado
        if hasattr(request, 'user') and request.user.is_authenticated:
            log_data.update({
                'user_id': request.user.id,
                'username': request.user.username or request.user.email,
                'user_role': getattr(request.user, 'role', 'unknown')
            })
        
        # Añadir datos extra si se proporcionan
        if extra_data:
            log_data.update(extra_data)
        
        # Log del evento
        logger.info(json.dumps(log_data))
    
    def get_client_ip(self, request):
        """Obtener IP real del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RequestValidationMiddleware(MiddlewareMixin):
    """
    Middleware para validaciones básicas de requests
    """
    
    def process_request(self, request):
        # Validar tamaño del request
        if hasattr(request, 'META') and 'CONTENT_LENGTH' in request.META:
            try:
                content_length = int(request.META['CONTENT_LENGTH'])
                max_size = getattr(settings, 'DATA_UPLOAD_MAX_MEMORY_SIZE', 2621440)  # 2.5MB default
                
                if content_length > max_size * 10:  # 10x el límite normal para requests especiales
                    return JsonResponse({
                        'error': 'Request too large',
                        'message': 'El tamaño del request excede el límite permitido'
                    }, status=413)
            except (ValueError, TypeError):
                pass
        
        # Validar headers sospechosos
        suspicious_headers = [
            'X-Forwarded-Host',
            'X-Original-URL',
            'X-Rewrite-URL'
        ]
        
        for header in suspicious_headers:
            if header in request.META:
                logger.warning(f"Suspicious header detected: {header} from IP {self.get_client_ip(request)}")
        
        return None
    
    def get_client_ip(self, request):
        """Obtener IP real del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip