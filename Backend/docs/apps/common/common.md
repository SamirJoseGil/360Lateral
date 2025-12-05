# Módulo Común (Common)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Utilidades](#utilidades)
- [Cache Service](#cache-service)
- [Middleware](#middleware)
- [Excepciones Personalizadas](#excepciones-personalizadas)
- [Permisos](#permisos)
- [Validadores](#validadores)
- [Health Checks](#health-checks)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo **Common** contiene utilidades compartidas, servicios de cache, middleware, validadores y funciones helper que son utilizadas por todos los módulos de la aplicación.

### Características Principales

- 🔧 **Utilidades Compartidas**: Funciones helper para logging, auditoría, formateo
- 💾 **Sistema de Cache**: Servicio centralizado con Redis
- 🛡️ **Middleware Custom**: Logging de API, CORS debugging, headers de seguridad
- ⚠️ **Excepciones Personalizadas**: Errores estandarizados para toda la API
- 🔐 **Permisos Reutilizables**: Clases de permisos comunes
- ✅ **Validadores**: Validación de CBML, matrícula, NIT, teléfonos, etc.
- 🏥 **Health Checks**: Endpoints para monitoreo de sistema

---

## Utilidades

### `utils.py`

Funciones helper comunes para toda la aplicación.

**Ubicación**: `apps/common/utils.py`

#### Funciones Principales

##### `get_client_ip(request)`

Obtiene la IP del cliente considerando proxies.

```python
from apps.common.utils import get_client_ip

def my_view(request):
    ip = get_client_ip(request)
    logger.info(f"Request from IP: {ip}")
```

**Retorna**: String con la IP del cliente

---

##### `audit_log(action, user, details, ip_address)`

Registra acciones de auditoría en los logs.

```python
from apps.common.utils import audit_log

audit_log(
    action='USER_LOGIN',
    user=request.user,
    details={'method': 'email'},
    ip_address=get_client_ip(request)
)
```

**Parámetros**:
- `action` (str): Tipo de acción (ej: 'USER_LOGIN', 'USER_CREATED')
- `user` (User): Usuario que realizó la acción
- `details` (dict): Detalles adicionales (opcional)
- `ip_address` (str): IP del cliente (opcional)

**Log generado**:

Searched codebase for "PErfecto, sigamos con el de #file:common.md Ya te adjunte los archivos: #codebase ", no results

# Módulo Común (Common)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Utilidades](#utilidades)
- [Cache Service](#cache-service)
- [Middleware](#middleware)
- [Excepciones Personalizadas](#excepciones-personalizadas)
- [Permisos](#permisos)
- [Validadores](#validadores)
- [Health Checks](#health-checks)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo **Common** contiene utilidades compartidas, servicios de cache, middleware, validadores y funciones helper que son utilizadas por todos los módulos de la aplicación.

### Características Principales

- 🔧 **Utilidades Compartidas**: Funciones helper para logging, auditoría, formateo
- 💾 **Sistema de Cache**: Servicio centralizado con Redis
- 🛡️ **Middleware Custom**: Logging de API, CORS debugging, headers de seguridad
- ⚠️ **Excepciones Personalizadas**: Errores estandarizados para toda la API
- 🔐 **Permisos Reutilizables**: Clases de permisos comunes
- ✅ **Validadores**: Validación de CBML, matrícula, NIT, teléfonos, etc.
- 🏥 **Health Checks**: Endpoints para monitoreo de sistema

---

## Utilidades

### `utils.py`

Funciones helper comunes para toda la aplicación.

**Ubicación**: `apps/common/utils.py`

#### Funciones Principales

##### `get_client_ip(request)`

Obtiene la IP del cliente considerando proxies.

```python
from apps.common.utils import get_client_ip

def my_view(request):
    ip = get_client_ip(request)
    logger.info(f"Request from IP: {ip}")
```

**Retorna**: String con la IP del cliente

---

##### `audit_log(action, user, details, ip_address)`

Registra acciones de auditoría en los logs.

```python
from apps.common.utils import audit_log

audit_log(
    action='USER_LOGIN',
    user=request.user,
    details={'method': 'email'},
    ip_address=get_client_ip(request)
)
```

**Parámetros**:
- `action` (str): Tipo de acción (ej: 'USER_LOGIN', 'USER_CREATED')
- `user` (User): Usuario que realizó la acción
- `details` (dict): Detalles adicionales (opcional)
- `ip_address` (str): IP del cliente (opcional)

**Log generado**:
```
AUDIT: USER_LOGIN | User: user@example.com (uuid) | IP: 192.168.1.1 | Details: {'method': 'email'}
```

---

##### `format_success_response(data, message, status_code)`

Formatea respuestas exitosas en formato estándar.

```python
from apps.common.utils import format_success_response

return format_success_response(
    data={'user': user_data},
    message='Usuario creado exitosamente',
    status_code=201
)
```

**Response**:
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "user": {...}
  }
}
```

---

##### `format_error_response(errors, message, status_code)`

Formatea respuestas de error en formato estándar.

```python
from apps.common.utils import format_error_response

return format_error_response(
    errors={'email': 'Email ya registrado'},
    message='Error en validación',
    status_code=400
)
```

**Response**:
```json
{
  "success": false,
  "message": "Error en validación",
  "errors": {
    "email": "Email ya registrado"
  }
}
```

---

##### `custom_exception_handler(exc, context)`

Handler personalizado para excepciones de DRF.

**Configuración en `settings.py`**:
```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'apps.common.utils.custom_exception_handler',
}
```

**Funcionalidad**:
- Formatea todas las excepciones en formato consistente
- Extrae mensajes de error de `ValidationError`
- Loggea excepciones automáticamente
- Retorna respuestas en formato estándar

---

##### `validate_required_fields(data, required_fields)`

Valida que campos requeridos estén presentes.

```python
from apps.common.utils import validate_required_fields

data = request.data
required = ['email', 'password', 'first_name']

errors = validate_required_fields(data, required)
if errors:
    return Response({
        'success': False,
        'errors': errors
    }, status=400)
```

---

##### `sanitize_filename(filename)`

Sanitiza nombres de archivo para seguridad.

```python
from apps.common.utils import sanitize_filename

original = "Mi Archivo (2024).pdf"
safe = sanitize_filename(original)
# Result: "Mi_Archivo_2024.pdf"
```

---

##### `calculate_file_hash(file_obj)`

Calcula hash SHA256 de un archivo.

```python
from apps.common.utils import calculate_file_hash

file_hash = calculate_file_hash(uploaded_file)
# Result: "a1b2c3d4e5f6..."
```

---

## Cache Service

### `CacheService`

Servicio centralizado para operaciones de cache con Redis.

**Ubicación**: cache.py

#### Configuración

**Redis en `settings.py`**:
```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    },
    'search': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/2',
    }
}
```

#### Métodos

##### `CacheService.get(key, cache_name='default')`

Obtiene valor del cache.

```python
from apps.common.cache import CacheService

user_data = CacheService.get('user_data:uuid-123')
if user_data:
    return user_data
```

**Retorna**: Valor cacheado o `None` si no existe

---

##### `CacheService.set(key, value, timeout=None, cache_name='default')`

Guarda valor en cache.

```python
from apps.common.cache import CacheService

# Guardar por 5 minutos
CacheService.set(
    key='user_data:uuid-123',
    value={'email': 'user@example.com'},
    timeout=300
)
```

**Parámetros**:
- `key` (str): Clave única
- `value` (Any): Valor a guardar (debe ser serializable)
- `timeout` (int): Tiempo de expiración en segundos
- `cache_name` (str): Nombre del cache a usar

---

##### `CacheService.delete(key, cache_name='default')`

Elimina valor del cache.

```python
from apps.common.cache import CacheService

CacheService.delete('user_data:uuid-123')
```

---

##### `CacheService.clear(cache_name='default')`

Limpia todo el cache.

```python
from apps.common.cache import CacheService

# Limpiar cache de búsquedas
CacheService.clear(cache_name='search')
```

---

##### `CacheService.get_or_set(key, default_func, timeout=None)`

Obtiene del cache o ejecuta función si no existe.

```python
from apps.common.cache import CacheService

def fetch_user_data():
    return User.objects.get(id=user_id)

user = CacheService.get_or_set(
    key=f'user_data:{user_id}',
    default_func=fetch_user_data,
    timeout=300
)
```

---

##### `CacheService.generate_key(*args, **kwargs)`

Genera clave única basada en argumentos.

```python
from apps.common.cache import CacheService

cache_key = CacheService.generate_key(
    'lotes_list',
    ciudad='medellin',
    estrato=4,
    page=1
)
# Result: MD5 hash de "lotes_list:ciudad=medellin:estrato=4:page=1"
```

---

#### Decorador `@cache_result`

Decorador para cachear resultado de funciones.

```python
from apps.common.cache import cache_result

@cache_result(timeout=300, key_prefix='lotes')
def get_lotes_disponibles(ciudad):
    return Lote.objects.filter(ciudad=ciudad, status='active')

# Primera llamada: ejecuta query y cachea
lotes = get_lotes_disponibles('medellin')

# Segunda llamada: retorna del cache
lotes = get_lotes_disponibles('medellin')  # Cache HIT
```

---

#### Funciones Helper

##### `invalidate_user_cache(user_id)`

Invalida cache relacionado con un usuario.

```python
from apps.common.cache import invalidate_user_cache

# Después de actualizar usuario
user.save()
invalidate_user_cache(str(user.id))
```

---

##### `invalidate_lote_cache(lote_id)`

Invalida cache relacionado con un lote.

```python
from apps.common.cache import invalidate_lote_cache

# Después de actualizar lote
lote.save()
invalidate_lote_cache(str(lote.id))
```

---

##### `invalidate_statistics_cache()`

Invalida cache de estadísticas.

```python
from apps.common.cache import invalidate_statistics_cache

# Después de cambios importantes
invalidate_statistics_cache()
```

---

## Middleware

### `APILoggingMiddleware`

Middleware para logging detallado de requests API.

**Ubicación**: api_logging.py

#### Configuración

**En `settings.py`**:
```python
MIDDLEWARE = [
    # ...otros middleware...
    'apps.common.middleware.APILoggingMiddleware',
]

# Configuración del middleware
API_LOG_REQUEST_BODY = True
API_LOG_RESPONSE_BODY = True
API_LOG_MAX_BODY_LENGTH = 5000
```

#### Funcionalidad

- ✅ Loggea todas las requests a `/api/*`
- ✅ Registra: método, path, status code, tiempo de respuesta
- ✅ Incluye: user, IP, body (request y response)
- ✅ Niveles de log según status code:
  - **2xx**: `INFO`
  - **4xx**: `WARNING`
  - **5xx**: `ERROR`
- ✅ Paths sensibles (login, register) no loggean body

#### Log Generado

```
INFO: API REQUEST: POST /api/lotes/ - 201 - user@example.com - 125.43ms
```

**Log detallado**:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/lotes/",
  "method": "POST",
  "status_code": 201,
  "success": true,
  "response_time": 125.43,
  "user_id": "uuid",
  "username": "user@example.com",
  "ip": "192.168.1.1",
  "request_body": {...},
  "response_body": {...}
}
```

---

### `CORSDebugMiddleware`

Middleware para debugging de requests CORS.

**Ubicación**: cors_middleware.py

#### Configuración

```python
MIDDLEWARE = [
    'apps.common.middleware.CORSDebugMiddleware',
    # ...otros middleware...
]
```

#### Funcionalidad

- 🔵 Loggea requests CORS con origen
- 🟢 Loggea headers CORS en respuesta
- ⚠️ Alerta si faltan headers CORS

**Log generado**:
```
DEBUG: 🔵 CORS Request: POST /api/auth/login/ from http://localhost:3000
DEBUG: 🟢 CORS Response headers: {'Access-Control-Allow-Origin': '*', ...}
WARNING: ⚠️ No CORS headers in response for /api/auth/login/
```

---

### `SecurityHeadersMiddleware`

Agrega headers de seguridad a todas las respuestas.

**Ubicación**: middleware.py

#### Headers agregados:

```python
response['X-Content-Type-Options'] = 'nosniff'
response['X-Frame-Options'] = 'DENY'
response['X-XSS-Protection'] = '1; mode=block'
response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
```

---

## Excepciones Personalizadas

### Clases de Excepción

**Ubicación**: exceptions.py

#### `BaseAPIException`

Excepción base para toda la API.

```python
from apps.common.exceptions import BaseAPIException

class CustomError(BaseAPIException):
    status_code = 500
    default_detail = 'Error personalizado'
    default_code = 'custom_error'
```

---

#### `ValidationException`

Para errores de validación (400).

```python
from apps.common.exceptions import ValidationException

if not email:
    raise ValidationException('Email es requerido')
```

---

#### `AuthenticationException`

Para errores de autenticación (401).

```python
from apps.common.exceptions import AuthenticationException

if not token_valid:
    raise AuthenticationException('Token inválido o expirado')
```

---

#### `PermissionException`

Para errores de permisos (403).

```python
from apps.common.exceptions import PermissionException

if not user.is_admin:
    raise PermissionException('Solo administradores pueden acceder')
```

---

#### `NotFoundException`

Para recursos no encontrados (404).

```python
from apps.common.exceptions import NotFoundException

try:
    lote = Lote.objects.get(id=lote_id)
except Lote.DoesNotExist:
    raise NotFoundException(f'Lote {lote_id} no encontrado')
```

---

#### `ConflictException`

Para conflictos como duplicados (409).

```python
from apps.common.exceptions import ConflictException

if User.objects.filter(email=email).exists():
    raise ConflictException('Email ya está registrado')
```

---

#### `RateLimitException`

Para rate limiting (429).

```python
from apps.common.exceptions import RateLimitException

if attempts > 5:
    raise RateLimitException('Demasiados intentos. Intenta en 15 minutos')
```

---

## Permisos

### Clases de Permisos Reutilizables

**Ubicación**: permissions.py

#### `IsAdminOrReadOnly`

Permite lectura a todos, modificación solo a admin.

```python
from apps.common.permissions import IsAdminOrReadOnly

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
```

---

#### `IsOwnerOrAdmin`

Permite acceso al propietario o admin.

```python
from apps.common.permissions import IsOwnerOrAdmin

class LoteDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
```

**Verifica**:
- Si `obj.user == request.user`
- O si `obj.owner == request.user`
- O si `request.user.is_admin`

---

#### `IsAdminUser`

Solo administradores.

```python
from apps.common.permissions import IsAdminUser

@permission_classes([IsAdminUser])
def admin_only_view(request):
    pass
```

---

#### `IsVerified`

Requiere email verificado.

```python
from apps.common.permissions import IsVerified

class SecureView(APIView):
    permission_classes = [IsAuthenticated, IsVerified]
```

---

## Validadores

### Validadores Personalizados

**Ubicación**: validators.py

#### `validate_file_extension(value)`

Valida extensión de archivo.

```python
from apps.common.validators import validate_file_extension

class Document(models.Model):
    archivo = models.FileField(
        upload_to='docs/',
        validators=[validate_file_extension]
    )
```

**Extensiones permitidas**: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.xlsx`, `.xls`, `.csv`, `.txt`, `.zip`

---

#### `validate_file_size(value)`

Valida tamaño de archivo (máx 10MB).

```python
from apps.common.validators import validate_file_size

archivo = models.FileField(
    validators=[validate_file_size]
)
```

---

#### `validate_cbml(value)`

Valida formato de CBML (11 dígitos).

```python
from apps.common.validators import validate_cbml

# En serializer
cbml = serializers.CharField(
    validators=[validate_cbml]
)
```

---

#### `validate_matricula(value)`

Valida matrícula inmobiliaria (formato XXX-XXXXXX).

```python
from apps.common.validators import validate_matricula

matricula = models.CharField(
    max_length=20,
    validators=[validate_matricula]
)
```

---

#### `validate_phone_number(value)`

Valida teléfono colombiano.

```python
from apps.common.validators import validate_phone_number

phone = models.CharField(
    max_length=20,
    validators=[validate_phone_number]
)
```

**Formatos válidos**:
- `+57 300 123 4567`
- `300 123 4567`
- `3001234567`
- `+57 1234567` (fijo)

---

#### `validate_nit(value)`

Valida NIT colombiano (9-10 dígitos).

```python
from apps.common.validators import validate_nit

nit = models.CharField(
    validators=[validate_nit]
)
```

---

## Health Checks

### Endpoints de Monitoreo

**Ubicación**: views.py

#### `GET /api/common/health/`

Health check general del sistema.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "services": {
    "database": "ok",
    "cache": "ok"
  }
}
```

---

#### `GET /api/common/health/database/`

Health check de base de datos.

**Response**:
```json
{
  "status": "ok",
  "database": "postgresql",
  "connected": true,
  "version": "PostgreSQL 14.5",
  "response_time_ms": 12.43
}
```

---

#### `GET /api/common/health/redis/`

Health check de Redis/Cache.

**Response**:
```json
{
  "status": "ok",
  "cache": "connected",
  "response_time_ms": 3.21
}
```

---

## Ejemplos de Uso

### 1. Usar Cache en una Vista

```python
from apps.common.cache import CacheService, cache_result
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def lotes_disponibles(request):
    ciudad = request.GET.get('ciudad', 'medellin')
    
    # Generar clave de cache
    cache_key = CacheService.generate_key('lotes', ciudad=ciudad)
    
    # Intentar obtener del cache
    cached_data = CacheService.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # Si no está en cache, consultar BD
    lotes = Lote.objects.filter(ciudad=ciudad, status='active')
    serializer = LoteSerializer(lotes, many=True)
    
    # Guardar en cache por 2 minutos
    CacheService.set(cache_key, serializer.data, timeout=120)
    
    return Response(serializer.data)
```

---

### 2. Usar Decorador de Cache

```python
from apps.common.cache import cache_result

@cache_result(timeout=300, key_prefix='stats')
def obtener_estadisticas():
    return {
        'total_lotes': Lote.objects.count(),
        'total_usuarios': User.objects.count(),
    }

# Primera llamada: ejecuta queries
stats = obtener_estadisticas()

# Segunda llamada: retorna del cache
stats = obtener_estadisticas()  # Cache HIT
```

---

### 3. Usar Excepciones Personalizadas

```python
from apps.common.exceptions import (
    ValidationException,
    NotFoundException,
    PermissionException
)

@api_view(['POST'])
def crear_lote(request):
    # Validación
    email = request.data.get('email')
    if not email:
        raise ValidationException('Email es requerido')
    
    # Verificar existencia
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise NotFoundException(f'Usuario {email} no encontrado')
    
    # Verificar permisos
    if not user.is_admin:
        raise PermissionException('Solo administradores pueden crear lotes')
    
    # Crear lote...
```

---

### 4. Logging de Auditoría

```python
from apps.common.utils import audit_log, get_client_ip

@api_view(['POST'])
def cambiar_rol_usuario(request, user_id):
    user = User.objects.get(id=user_id)
    old_role = user.role
    new_role = request.data.get('role')
    
    user.role = new_role
    user.save()
    
    # Log de auditoría
    audit_log(
        action='USER_ROLE_CHANGED',
        user=request.user,
        details={
            'target_user': user.email,
            'old_role': old_role,
            'new_role': new_role
        },
        ip_address=get_client_ip(request)
    )
    
    return Response({'success': True})
```

---

### 5. Formatear Respuestas

```python
from apps.common.utils import format_success_response, format_error_response

@api_view(['POST'])
def registrar_usuario(request):
    serializer = UserSerializer(data=request.data)
    
    if not serializer.is_valid():
        return format_error_response(
            errors=serializer.errors,
            message='Datos de registro inválidos',
            status_code=400
        )
    
    user = serializer.save()
    
    return format_success_response(
        data={'user': UserSerializer(user).data},
        message='Usuario registrado exitosamente',
        status_code=201
    )
```

---

### 6. Validar Campos Requeridos

```python
from apps.common.utils import validate_required_fields

@api_view(['POST'])
def crear_lote(request):
    required = ['nombre', 'direccion', 'area']
    
    errors = validate_required_fields(request.data, required)
    if errors:
        return Response({
            'success': False,
            'errors': errors
        }, status=400)
    
    # Continuar con la creación...
```

---

## Estructura de Carpetas

```
apps/common/
├── __init__.py
├── apps.py
├── cache.py              # CacheService
├── exceptions.py         # Excepciones personalizadas
├── middleware.py         # Middleware base
├── middleware/
│   ├── __init__.py
│   ├── api_logging.py   # APILoggingMiddleware
│   └── cors_middleware.py  # CORSDebugMiddleware
├── models.py            # Sin modelos
├── permissions.py       # Permisos reutilizables
├── urls.py              # URLs de health checks
├── utils.py             # Utilidades generales
├── validators.py        # Validadores personalizados
└── views.py             # Health checks
```

---

## Configuración en Settings

### Cache

```python
# Redis cache
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    },
    'search': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/2',
    }
}
```

### Middleware

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'apps.common.middleware.CORSDebugMiddleware',  # ✅ CORS debugging
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.common.middleware.APILoggingMiddleware',  # ✅ API logging
    'apps.common.middleware.SecurityHeadersMiddleware',  # ✅ Security headers
]
```

### Exception Handler

```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'apps.common.utils.custom_exception_handler',
}
```

---

## Próximas Mejoras

- [ ] **Rate Limiting Service**: Servicio centralizado para rate limiting
- [ ] **Email Service**: Servicio para envío de emails
- [ ] **SMS Service**: Integración con Twilio/WhatsApp
- [ ] **File Storage Service**: Abstracción de almacenamiento (local/S3)
- [ ] **Metrics Service**: Tracking de métricas de la aplicación
- [ ] **Queue Service**: Integración con Celery para tareas asíncronas

---

**Última actualización**: 2024-01-15


Made changes.