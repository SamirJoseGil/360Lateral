# Common Module - Lateral 360°

## Descripción

Módulo de utilidades comunes compartidas por toda la aplicación. Incluye middleware, utilidades, health checks y funciones auxiliares reutilizables.

## Estructura

```
common/
├── __init__.py
├── apps.py                    # Configuración de la app
├── middleware/                # Middleware personalizado
│   ├── __init__.py
│   └── api_logging.py        # Logging de requests API
├── utils.py                   # Funciones de utilidad
├── exceptions.py              # Excepciones personalizadas
├── validators.py              # Validadores personalizados
├── urls.py                    # Health check endpoints
├── views.py                   # Vistas de health checks
└── README.md                  # Esta documentación
```

## Componentes

### 1. Middleware

#### APILoggingMiddleware

Middleware para registrar todas las peticiones API con detalles completos.

**Características:**
- Registra método HTTP, path, status code
- Tiempo de respuesta
- IP del cliente
- User agent
- Tamaño de request/response

**Uso:**
```python
# settings.py
MIDDLEWARE = [
    # ... otros middleware
    'apps.common.middleware.api_logging.APILoggingMiddleware',
]
```

**Logs generados:**
```
[INFO] API Request: POST /api/auth/login/ | Status: 200 | Time: 0.234s | IP: 192.168.1.1
[INFO] API Request: GET /api/lotes/ | Status: 200 | Time: 0.145s | IP: 192.168.1.1
```

### 2. Utilidades (utils.py)

#### audit_log

Registra acciones importantes del sistema para auditoría.

```python
def audit_log(action: str, user, details: dict = None, ip_address: str = None):
    """
    Registra acción de auditoría.
    
    Args:
        action: Tipo de acción (USER_LOGIN, USER_CREATED, etc)
        user: Usuario que realizó la acción
        details: Detalles adicionales
        ip_address: IP del cliente
    """
    pass
```

**Ejemplo de uso:**
```python
from apps.common.utils import audit_log

audit_log(
    action='USER_LOGIN',
    user=request.user,
    details={'email': request.user.email},
    ip_address=get_client_ip(request)
)
```

#### get_client_ip

Obtiene la IP del cliente de forma segura.

```python
def get_client_ip(request) -> str:
    """
    Obtiene IP del cliente considerando proxies.
    
    Returns:
        str: IP del cliente
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')
    return ip
```

#### custom_exception_handler

Handler personalizado para excepciones de DRF.

```python
def custom_exception_handler(exc, context):
    """
    Handler personalizado que retorna respuestas consistentes.
    
    Returns:
        Response con formato:
        {
            "success": false,
            "message": "Error description",
            "errors": {...}
        }
    """
    pass
```

### 3. Validadores (validators.py)

#### validate_file_extension

Valida extensiones de archivo permitidas.

```python
def validate_file_extension(value):
    """
    Valida que el archivo tenga una extensión permitida.
    
    Raises:
        ValidationError: Si la extensión no está permitida
    """
    import os
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    
    if ext.lower() not in valid_extensions:
        raise ValidationError(f'Extensión {ext} no permitida')
```

#### validate_file_size

Valida el tamaño máximo de archivo.

```python
def validate_file_size(value):
    """
    Valida que el archivo no exceda el tamaño máximo.
    
    Raises:
        ValidationError: Si el archivo es muy grande
    """
    filesize = value.size
    max_size = 10 * 1024 * 1024  # 10MB
    
    if filesize > max_size:
        raise ValidationError(f'Tamaño máximo: {max_size/1024/1024}MB')
```

#### validate_cbml

Valida formato de CBML (Código Base Municipal de Lote).

```python
def validate_cbml(value: str) -> bool:
    """
    Valida formato de CBML de Medellín.
    
    Args:
        value: CBML a validar (14 dígitos)
        
    Returns:
        bool: True si es válido
        
    Raises:
        ValidationError: Si el formato es inválido
    """
    if not value or len(value) != 14:
        raise ValidationError('CBML debe tener 14 dígitos')
    
    if not value.isdigit():
        raise ValidationError('CBML debe ser numérico')
    
    return True
```

### 4. Health Checks (views.py)

#### system_health_check

Health check general del sistema.

**Endpoint:** `GET /health/`

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
        "database": "ok",
        "redis": "ok",
        "storage": "ok"
    },
    "version": "1.0.0"
}
```

#### database_health_check

Verifica conexión a la base de datos.

**Endpoint:** `GET /health/database/`

**Response:**
```json
{
    "status": "ok",
    "database": "postgresql",
    "connected": true,
    "response_time_ms": 5
}
```

#### redis_health_check

Verifica conexión a Redis.

**Endpoint:** `GET /health/redis/`

**Response:**
```json
{
    "status": "ok",
    "redis": "connected",
    "response_time_ms": 2
}
```

## Excepciones Personalizadas (exceptions.py)

### APIException

Excepción base para errores de API.

```python
class APIException(Exception):
    """Excepción base para errores de API"""
    status_code = 500
    default_message = 'Error interno del servidor'
    
    def __init__(self, message=None, status_code=None):
        self.message = message or self.default_message
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.message)
```

### ValidationException

Excepción para errores de validación.

```python
class ValidationException(APIException):
    """Excepción para errores de validación"""
    status_code = 400
    default_message = 'Datos inválidos'
```

### AuthenticationException

Excepción para errores de autenticación.

```python
class AuthenticationException(APIException):
    """Excepción para errores de autenticación"""
    status_code = 401
    default_message = 'Autenticación requerida'
```

### PermissionException

Excepción para errores de permisos.

```python
class PermissionException(APIException):
    """Excepción para errores de permisos"""
    status_code = 403
    default_message = 'Permiso denegado'
```

## Constantes Comunes

### Status Codes

```python
# HTTP Status Codes
HTTP_200_OK = 200
HTTP_201_CREATED = 201
HTTP_204_NO_CONTENT = 204
HTTP_400_BAD_REQUEST = 400
HTTP_401_UNAUTHORIZED = 401
HTTP_403_FORBIDDEN = 403
HTTP_404_NOT_FOUND = 404
HTTP_500_INTERNAL_SERVER_ERROR = 500
```

### Response Messages

```python
# Mensajes de respuesta comunes
MESSAGES = {
    'CREATED': 'Creado exitosamente',
    'UPDATED': 'Actualizado exitosamente',
    'DELETED': 'Eliminado exitosamente',
    'NOT_FOUND': 'No encontrado',
    'INVALID_DATA': 'Datos inválidos',
    'PERMISSION_DENIED': 'Permiso denegado',
    'AUTHENTICATION_REQUIRED': 'Autenticación requerida',
}
```

## Decoradores Útiles

### @log_execution_time

Registra el tiempo de ejecución de una función.

```python
from apps.common.decorators import log_execution_time

@log_execution_time
def expensive_operation():
    # Operación costosa
    pass

# Log: Function 'expensive_operation' took 2.34 seconds
```

### @require_role

Requiere que el usuario tenga un rol específico.

```python
from apps.common.decorators import require_role

@require_role('admin')
def admin_only_view(request):
    # Solo accesible por admins
    pass
```

## Testing

### Ejecutar Tests

```bash
# Tests del módulo common
python manage.py test apps.common

# Tests específicos
python manage.py test apps.common.tests.test_middleware
python manage.py test apps.common.tests.test_utils
```

### Ejemplo de Test

```python
from django.test import TestCase
from apps.common.utils import get_client_ip
from django.test import RequestFactory

class UtilsTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
    
    def test_get_client_ip_direct(self):
        """Test obtener IP directa"""
        request = self.factory.get('/')
        request.META['REMOTE_ADDR'] = '192.168.1.1'
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '192.168.1.1')
    
    def test_get_client_ip_forwarded(self):
        """Test obtener IP con proxy"""
        request = self.factory.get('/')
        request.META['HTTP_X_FORWARDED_FOR'] = '10.0.0.1, 192.168.1.1'
        
        ip = get_client_ip(request)
        self.assertEqual(ip, '10.0.0.1')
```

## Best Practices

### Logging

1. Usar niveles apropiados:
   - `DEBUG`: Información detallada de debugging
   - `INFO`: Información general
   - `WARNING`: Advertencias
   - `ERROR`: Errores
   - `CRITICAL`: Errores críticos

2. Incluir contexto útil:
```python
logger.info(f"User {user.email} logged in from {ip}")
logger.error(f"Failed to process payment {payment_id}: {str(e)}")
```

### Exception Handling

1. Usar excepciones específicas:
```python
# Bueno
raise ValidationException("Email inválido")

# Evitar
raise Exception("Error")
```

2. Capturar excepciones específicas:
```python
# Bueno
try:
    user = User.objects.get(id=user_id)
except User.DoesNotExist:
    raise NotFoundException("Usuario no encontrado")

# Evitar
try:
    user = User.objects.get(id=user_id)
except Exception as e:
    raise Exception(str(e))
```

### Validación

1. Validar en múltiples capas:
   - Serializer (DRF)
   - Modelo (Django)
   - Lógica de negocio

2. Mensajes claros:
```python
# Bueno
raise ValidationError({
    'email': 'El email debe ser único',
    'password': 'La contraseña debe tener al menos 8 caracteres'
})

# Evitar
raise ValidationError('Error')
```

## Troubleshooting

### Error: "Middleware not found"

**Causa:** Middleware no está en INSTALLED_APPS o mal configurado.

**Solución:**
```python
# settings.py
INSTALLED_APPS = [
    # ...
    'apps.common',
]

MIDDLEWARE = [
    # ...
    'apps.common.middleware.api_logging.APILoggingMiddleware',
]
```

### Error: "Import error for custom_exception_handler"

**Causa:** Handler no configurado en settings.

**Solución:**
```python
# settings.py
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'apps.common.utils.custom_exception_handler',
}
```

## Referencias

- [Django Middleware](https://docs.djangoproject.com/en/4.2/topics/http/middleware/)
- [DRF Exception Handling](https://www.django-rest-framework.org/api-guide/exceptions/)
- [Python Logging](https://docs.python.org/3/library/logging.html)
