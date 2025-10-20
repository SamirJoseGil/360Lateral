# ENDPOINTS API - MÓDULO COMMON

Documentación completa de todos los endpoints disponibles en el módulo Common consolidado (incluye funcionalidad de Health Check).

## 🔗 Base URL
```
http://localhost:8000/api/common/
```

## 🏥 HEALTH CHECKS

### 🔍 Health Check Completo
```
GET /api/common/health/
```
**Descripción**: Health check completo del sistema con verificación de todos los servicios
**Autenticación**: No requerida (público)
**Uso**: Monitoreo de producción, load balancers

**Respuesta Exitosa (200)**:
```json
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

**Respuesta con Problemas (503)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "unhealthy",
      "message": "Database connection failed: connection timeout"
    },
    "cache": {
      "status": "healthy",
      "message": "Cache connection successful"
    }
  },
  "system": {
    "memory": {
      "total": 8589934592,
      "available": 429496729,
      "percent": 95.0,
      "status": "warning"
    }
  },
  "response_time_ms": 5000.12
}
```

### 🚀 Health Check Simple
```
GET /api/common/health/simple/
```
**Descripción**: Health check básico para Docker, Kubernetes, load balancers
**Autenticación**: No requerida (público)
**Uso**: Verificación rápida de que el servicio está activo

**Respuesta**:
```json
{
  "status": "healthy",
  "service": "lateral360-backend",
  "message": "OK"
}
```

### 🗃️ Health Check Base de Datos
```
GET /api/common/health/database/
```
**Descripción**: Verificación específica de conectividad a base de datos
**Autenticación**: No requerida (público)
**Uso**: Monitoreo específico de DB

**Respuesta Exitosa (200)**:
```json
{
  "database": {
    "status": "healthy",
    "message": "Database connection successful"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Respuesta con Problemas (503)**:
```json
{
  "database": {
    "status": "unhealthy",
    "message": "Database connection failed: FATAL: password authentication failed"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 🔄 Health Check Cache
```
GET /api/common/health/cache/
```
**Descripción**: Verificación específica de conectividad a cache (Redis/MemCache)
**Autenticación**: No requerida (público)
**Uso**: Monitoreo específico de cache

**Respuesta Exitosa (200)**:
```json
{
  "cache": {
    "status": "healthy",
    "message": "Cache connection successful"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Respuesta con Problemas (503)**:
```json
{
  "cache": {
    "status": "unhealthy",
    "message": "Cache connection failed: ConnectionError: Redis server not available"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📊 INFORMACIÓN DEL SISTEMA

### 📋 Información de Versión
```
GET /api/common/version/
```
**Descripción**: Información de versión del sistema y componentes
**Autenticación**: No requerida (público)
**Uso**: Documentación, debugging, inventario de versiones

**Respuesta**:
```json
{
  "version": "1.0.0",
  "django_version": "4.2+",
  "python_version": "3.11+",
  "apps": [
    "authentication",
    "users", 
    "lotes",
    "documents",
    "stats",
    "pot",
    "common"
  ],
  "environment": "development"
}
```

### 🔧 Status del Sistema
```
GET /api/common/status/
```
**Descripción**: Status detallado de componentes del sistema
**Autenticación**: No requerida (público)
**Uso**: Monitoreo detallado, debugging

**Respuesta**:
```json
{
  "database": "connected",
  "cache": "active",
  "middleware": "loaded",
  "apps_loaded": 12,
  "debug_mode": true,
  "environment": "development"
}
```

## 🐛 HERRAMIENTAS DE DEBUG

### 🌐 CORS Debug
```
GET /api/common/cors-debug/
```
**Descripción**: Herramienta de debug para problemas de CORS
**Autenticación**: No requerida (público)
**Uso**: Debugging de problemas de CORS en desarrollo

**Respuesta**:
```json
{
  "success": true,
  "message": "CORS debug information",
  "cors_config": {
    "CORS_ALLOW_ALL_ORIGINS": false,
    "CORS_ALLOW_CREDENTIALS": true,
    "CORS_ALLOWED_ORIGINS": [
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "REQUEST_ORIGIN": "http://localhost:3000",
    "IS_ORIGIN_ALLOWED": true,
    "CSRF_COOKIE_SECURE": false,
    "SESSION_COOKIE_SECURE": false,
    "CSRF_TRUSTED_ORIGINS": [
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ]
  },
  "auth_header": "Bearer eyJ...",
  "csrf_token": "abc123def456...",
  "cors_headers": {
    "Access-Control-Allow-Origin": "Check response headers",
    "Access-Control-Allow-Methods": "Check response headers",
    "Access-Control-Allow-Headers": "Check response headers",
    "Access-Control-Allow-Credentials": "Check response headers"
  },
  "cookies": {
    "sessionid": "xyz789...",
    "csrftoken": "abc123..."
  }
}
```

## 🔒 CÓDIGOS DE ESTADO HTTP

### 200 - OK
- **Health checks exitosos**: Todos los servicios funcionando correctamente
- **Información del sistema**: Datos obtenidos exitosamente
- **CORS debug**: Información de configuración disponible

### 503 - Service Unavailable
- **Health check fallido**: Uno o más servicios críticos no disponibles
- **Base de datos desconectada**: Error de conectividad a DB
- **Cache no disponible**: Error de conectividad a cache (no crítico)

### 500 - Internal Server Error
- **Error interno**: Error no manejado en el servidor
- **Configuración incorrecta**: Problemas de configuración del sistema

## 📝 NOTAS DE USO

### 🔓 Endpoints Públicos
Todos los endpoints de Common son **públicos** (no requieren autenticación):
- Diseñados para monitoreo automático
- Accesibles desde load balancers y sistemas de monitoreo
- No exponen información sensible

### 🏥 Monitoreo en Producción
```bash
# Health check para load balancer
curl -f http://localhost:8000/api/common/health/simple/ || exit 1

# Health check completo para monitoreo
curl http://localhost:8000/api/common/health/ | jq '.status'

# Verificar base de datos específicamente
curl http://localhost:8000/api/common/health/database/ | jq '.database.status'
```

### 🐛 Debugging CORS
Si tienes problemas de CORS:
1. Visita `/api/common/cors-debug/`
2. Verifica que tu origen esté en `CORS_ALLOWED_ORIGINS`
3. Confirma que `IS_ORIGIN_ALLOWED` sea `true`
4. Revisa las cookies y headers

### 📊 Interpretación de Health Checks

#### Estado "healthy"
- Todos los servicios funcionan correctamente
- Memoria del sistema < 90%
- Base de datos responde a queries
- Cache funciona (si está configurado)

#### Estado "unhealthy"
- Uno o más servicios críticos fallan
- Memoria del sistema > 95%
- Base de datos no responde
- Error interno del sistema

#### Estado "warning"
- Servicios funcionan pero con degradación
- Memoria del sistema entre 90-95%
- Cache no disponible (no crítico)
- Tiempos de respuesta elevados

## 🔧 CONFIGURACIÓN

### 🏥 Health Checks
Los health checks verifican automáticamente:
- **Base de datos**: Ejecuta `SELECT 1` para verificar conectividad
- **Cache**: Escribe y lee un valor de prueba
- **Memoria**: Usa `psutil` si está disponible para verificar uso de memoria
- **Tiempo de respuesta**: Mide el tiempo total de verificación

### 📊 Dependencias Opcionales
```bash
# Para monitoreo de memoria avanzado
pip install psutil

# Para mejor logging JSON
pip install python-json-logger
```

### 🔒 Configuración en Settings
```python
# Configuración de logging para Common
LOGGING = {
    'loggers': {
        'security': {
            'handlers': ['security_file'],
            'level': 'INFO',
        },
        'api.requests': {
            'handlers': ['api_file'],
            'level': 'INFO',
        }
    }
}

# Configuración de middleware
MIDDLEWARE = [
    'apps.common.middleware.SecurityHeadersMiddleware',
    'apps.common.middleware.api_logging.APILoggingMiddleware',
]
```

## 🚀 INTEGRACIÓN

### 🐳 Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/common/health/simple/ || exit 1
```

### ☸️ Kubernetes Probes
```yaml
livenessProbe:
  httpGet:
    path: /api/common/health/simple/
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/common/health/
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 📊 Monitoreo con Prometheus
```python
# Métricas custom para Prometheus (opcional)
from prometheus_client import Counter, Histogram

health_check_requests = Counter('health_check_requests_total', 'Health check requests')
health_check_duration = Histogram('health_check_duration_seconds', 'Health check duration')
```

## 📋 CASOS DE USO

### 🔧 DevOps / SRE
- **Load balancer health checks**: `/health/simple/`
- **Monitoring dashboard**: `/health/`
- **Database monitoring**: `/health/database/`
- **Cache monitoring**: `/health/cache/`

### 🐛 Developers
- **CORS debugging**: `/cors-debug/`
- **Version verification**: `/version/`
- **System status**: `/status/`
- **General debugging**: `/health/`

### 🤖 Automated Systems
- **CI/CD health verification**: `/health/simple/`
- **Deployment validation**: `/health/`
- **Service discovery**: `/version/` + `/status/`