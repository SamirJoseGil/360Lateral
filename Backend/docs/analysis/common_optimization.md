# DOCUMENTACIÓN TÉCNICA - MÓDULO COMMON CONSOLIDADO

Este archivo documenta la estructura completa del módulo Common optimizado después de la consolidación con Health Check, eliminación de duplicaciones y mejoras de funcionalidad.

## 📁 ESTRUCTURA DE ARCHIVOS (Consolidada)

```
apps/common/
├── __init__.py                  # Configuración básica
├── apps.py                      # App config optimizada
├── 
├── middleware/                  # Middleware especializado
│   ├── __init__.py              # Exports de middleware
│   └── api_logging.py           # Logging completo de API requests
│
├── middleware.py                # Security headers middleware
├── permissions.py               # Permisos personalizados
├── urls.py                      # URLs consolidadas (7 endpoints)
├── utils.py                     # Utilidades consolidadas + health checks
├── validators.py                # Validadores de seguridad
└── views.py                     # Vistas con health checks integrados
```

## 📋 FUNCIONALIDADES DEL MÓDULO COMMON

### 🛡️ SEGURIDAD Y VALIDACIONES
- **Headers de seguridad**: Middleware automático para todas las respuestas
- **Validación de archivos**: Detección de malware y sanitización
- **Validaciones anti-injection**: XSS, SQL injection, script injection
- **Contraseñas seguras**: Verificación de fortaleza avanzada
- **Comparación segura**: Prevención de timing attacks

### 📊 LOGGING Y AUDITORÍA
- **API Logging**: Registro completo de requests/responses
- **Logging de auditoría**: Para acciones críticas del sistema
- **Manejo de excepciones**: Personalizado con ocultación de datos sensibles
- **Detección de IP**: Segura con soporte para proxies
- **Enmascaramiento**: De datos sensibles en logs

### 🏥 HEALTH CHECKS Y MONITOREO
- **Health check completo**: Sistema, DB, cache, memoria
- **Health checks específicos**: Por servicio individual
- **Monitoreo de recursos**: Memoria, CPU, conexiones
- **Status del sistema**: Información detallada de componentes
- **Version info**: Información de versión y entorno

### 🔧 UTILIDADES DEL SISTEMA
- **Generación de tokens**: Seguros para diversos usos
- **Manejo de archivos**: Nombres seguros y únicos
- **Validación JSON**: Anti JSON bombing
- **Debugging CORS**: Herramientas para resolver problemas CORS
- **Contexto de permisos**: Para logging y auditoría

## 🔌 ENDPOINTS DE LA API

### 🏥 HEALTH CHECKS
```
GET    /api/common/health/               # Health check completo del sistema
GET    /api/common/health/simple/        # Health check simple para Docker
GET    /api/common/health/database/      # Health check específico de base de datos
GET    /api/common/health/cache/         # Health check específico de cache/Redis
```

### 🔧 INFORMACIÓN DEL SISTEMA
```
GET    /api/common/version/              # Información de versión del sistema
GET    /api/common/status/               # Status detallado de componentes
GET    /api/common/cors-debug/           # Debug de configuración CORS
```

## 🛠️ MIDDLEWARE DISPONIBLE

### 🔒 SecurityHeadersMiddleware
```python
# Añade headers de seguridad a todas las respuestas
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Cache-Control: (para datos sensibles)
```

### 📊 APILoggingMiddleware
```python
# Configuración en settings.py
API_LOG_REQUEST_BODY = True          # Loggear body de requests
API_LOG_RESPONSE_BODY = True         # Loggear body de responses
API_LOG_MAX_BODY_LENGTH = 5000       # Límite de caracteres

# Paths monitoreados
- /api/auth/
- /api/users/
- /api/lotes/
- /api/documentos/
- /api/stats/

# Paths sensibles (sin logging de contenido)
- /api/auth/login/
- /api/auth/register/
- /api/auth/change-password/
```

## 🔧 UTILIDADES PRINCIPALES

### 🛡️ Seguridad
```python
# Manejo de excepciones personalizado
custom_exception_handler(exc, context)

# Sanitización de archivos
sanitize_filename(filename)
generate_secure_filename(original_filename)
validate_file_content(file)

# Protección de datos
hash_sensitive_data(data)
mask_sensitive_data(data, mask_char='*')
secure_compare(a, b)

# Validaciones
validate_json_structure(data, required_fields, max_depth)
check_password_strength(password)
```

### 🏥 Health Checks
```python
# Health checks individuales
check_database_health()
check_cache_health()
get_system_memory_info()

# Health check completo
comprehensive_health_check()
```

### 📊 Auditoría y Logging
```python
# Logging de auditoría
audit_log(action, user, resource, details, ip_address)

# Detección segura de IP
get_client_ip(request)

# Contexto de usuario
get_user_permissions_context(user)
```

### 🔧 Utilidades Generales
```python
# Generación de tokens
generate_secure_token(length=32)

# Contexto de permisos
get_user_permissions_context(user)
```

## 🔍 VALIDADORES DISPONIBLES

### 📄 SecureFileValidator
```python
# Validador completo para archivos
SecureFileValidator(
    allowed_extensions=['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    max_size=10*1024*1024,  # 10MB
    allowed_mimes={'pdf': 'application/pdf', ...}
)

# Validaciones incluidas:
- Extensión permitida
- Tipo MIME real vs extensión
- Tamaño máximo
- Nombre de archivo seguro
- Contenido malicioso básico
```

### 🔒 Validadores de Seguridad
```python
# Anti-injection
validate_no_script_injection(value)
validate_safe_html(value)

# Contraseñas
validate_strong_password(password)

# Números telefónicos
validate_phone_number(value)
```

## 🔐 PERMISOS PERSONALIZADOS

### 🌐 AllowPublicEndpoints
```python
# Permite endpoints específicos sin autenticación
public_endpoints = [
    'POST-/api/lotes/scrap/cbml/',
    'POST-/api/lotes/scrap/matricula/',
    'POST-/api/lotes/scrap/direccion/',
]
```

## 📊 RESPUESTAS DE HEALTH CHECKS

### 🏥 Health Check Completo
```json
GET /api/common/health/

{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "cache": {
      "status": "healthy", 
      "message": "Cache connection successful"
    }
  },
  "system": {
    "memory": {
      "total": 8589934592,
      "available": 4294967296,
      "percent": 50.0,
      "status": "healthy"
    }
  },
  "response_time_ms": 145.23
}
```

### 🔍 Health Check Simple
```json
GET /api/common/health/simple/

{
  "status": "healthy",
  "service": "lateral360-backend",
  "message": "OK"
}
```

### 📊 Version Info
```json
GET /api/common/version/

{
  "version": "1.0.0",
  "django_version": "4.2+",
  "python_version": "3.11+",
  "apps": [
    "authentication", "users", "lotes", 
    "documents", "stats", "pot", "common"
  ],
  "environment": "development"
}
```

### 🔧 CORS Debug
```json
GET /api/common/cors-debug/

{
  "success": true,
  "message": "CORS debug information",
  "cors_config": {
    "CORS_ALLOW_ALL_ORIGINS": false,
    "CORS_ALLOW_CREDENTIALS": true,
    "CORS_ALLOWED_ORIGINS": ["http://localhost:3000"],
    "REQUEST_ORIGIN": "http://localhost:3000",
    "IS_ORIGIN_ALLOWED": true
  },
  "auth_header": "Bearer eyJ...",
  "csrf_token": "abc123...",
  "cors_headers": {...},
  "cookies": {...}
}
```

## ⚙️ CONFIGURACIÓN

### 🔧 Settings Requeridos
```python
# Logging de API
API_LOG_REQUEST_BODY = True
API_LOG_RESPONSE_BODY = True  
API_LOG_MAX_BODY_LENGTH = 5000

# Configuración de logging
LOGGING = {
    'loggers': {
        'api.requests': {...},
        'security': {...}
    }
}

# Middleware
MIDDLEWARE = [
    'apps.common.middleware.SecurityHeadersMiddleware',
    'apps.common.middleware.api_logging.APILoggingMiddleware',
    # ... otros middleware
]
```

### 📁 Dependencias Opcionales
```python
# Para health checks avanzados
pip install psutil  # Monitoreo de memoria

# Para validación de archivos
pip install python-magic  # Detección de tipos MIME

# Para cache
pip install redis  # Si usas Redis como cache
```

## 🔒 CARACTERÍSTICAS DE SEGURIDAD

### 🛡️ Headers de Seguridad Automáticos
- **X-Content-Type-Options**: Previene MIME sniffing
- **X-Frame-Options**: Previene clickjacking  
- **X-XSS-Protection**: Protección XSS del navegador
- **Referrer-Policy**: Control de información de referrer

### 📊 Logging Seguro
- **Enmascaramiento automático** de datos sensibles
- **Hash de información crítica** para logging
- **Filtrado de endpoints** sensibles
- **Detección de IP** segura con proxy support

### 🔍 Validaciones Robustas
- **Anti-injection** para múltiples vectores de ataque
- **Validación de archivos** con detección de malware básico
- **Sanitización automática** de nombres de archivo
- **Validación JSON** contra bombing attacks

## 📈 MÉTRICAS Y MONITOREO

### 🏥 Health Check Automático
- **Verificación de DB**: Conectividad y queries básicas
- **Verificación de Cache**: Escritura y lectura de test
- **Monitoreo de Memoria**: Porcentaje de uso y disponibilidad
- **Tiempo de respuesta**: Medición automática

### 📊 Logging Centralizado
- **Requests/Responses**: Logging completo configurable
- **Excepciones**: Captura y logging automático
- **Auditoría**: Registro de acciones críticas
- **Seguridad**: Alertas de intentos de acceso no autorizado

## 🚀 ESTADO DE OPTIMIZACIÓN

### ✅ COMPLETADO
- ✅ Consolidación exitosa de 2 módulos en 1
- ✅ Eliminación total de código duplicado
- ✅ Health checks robustos para monitoreo
- ✅ Middleware de seguridad optimizado
- ✅ Validadores completos de seguridad
- ✅ API unificada para utilidades del sistema

### 📊 FUNCIONALIDAD FINAL
El módulo Common consolidado proporciona:
- Base sólida de seguridad para todo el sistema
- Health checks completos para monitoreo en producción
- Logging y auditoría centralizados
- Validaciones robustas contra ataques comunes
- Utilidades reutilizables para otros módulos
- API consistente para debugging y monitoreo

Arquitectura limpia, segura y production-ready.