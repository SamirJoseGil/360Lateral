# 👥 API de Usuarios - Lateral 360°

Documentación de los endpoints de usuarios con implementación de seguridad.

---

## 📋 Endpoints de Usuarios

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/api/auth/register/` | POST | ❌ Público | Registro de nuevo usuario |
| `/api/auth/login/` | POST | ❌ Público | Inicio de sesión |
| `/api/auth/logout/` | POST | ✅ Requerida | Cierre de sesión |
| `/api/auth/change-password/` | POST | ✅ Requerida | Cambiar contraseña |
| `/api/users/me/` | GET | ✅ Requerida | **Perfil del usuario actual** |
| `/api/users/` | GET | ✅ Requerida | Listar usuarios (filtrado por rol) |
| `/api/users/{id}/` | GET/PUT | ✅ Requerida | Ver/Actualizar usuario |
| `/api/users/{id}/` | DELETE | ✅ Solo Admin | Eliminar usuario |

---

## 🔐 Sistema de Roles

### **Admin**
- Acceso completo a todos los usuarios y recursos
- Puede crear, modificar y eliminar cualquier usuario

### **Owner (Propietario)**
- Solo puede gestionar su propio perfil
- Acceso a sus propios lotes y documentos

### **Developer**
- Solo lectura de recursos
- Acceso limitado para desarrollo

---

## 🚀 Ejemplos de Uso

### **1. Registro de Usuario**
```bash
POST /api/auth/register/
{
  "email": "usuario@example.com",
  "username": "usuario123",
  "password": "SecurePass123!",
  "first_name": "Juan",
  "last_name": "Pérez"
}
```

### **2. Inicio de Sesión**
```bash
POST /api/auth/login/
{
  "email": "usuario@example.com",
  "password": "SecurePass123!"
}
```

### **3. Ver Perfil**
```bash
GET /api/auth/users/me/
Authorization: Bearer <token>
```

---

## 🔒 Seguridad Implementada

- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **JWT Tokens**: Autenticación segura con expiración
- **Validaciones**: Contraseñas fuertes y datos sanitizados
- **Permisos**: Sistema de roles granular
- **Logging**: Registro de eventos de seguridad

---

## 🛠️ Configuración

### Estructura de Configuración

El proyecto usa una **estructura modular de configuración**:

```
config/
├── settings/
│   ├── __init__.py
│   ├── base.py          # Configuraciones comunes
│   ├── development.py   # Desarrollo
│   ├── production.py    # Producción
│   ├── security.py      # Seguridad centralizada
│   └── testing.py       # Testing
└── settings.py          # Selector automático
```

### Variables de Entorno

```env
# Django Core
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DB_NAME=lateral360
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# JWT Security
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=1440

# Cache & Redis
REDIS_URL=redis://localhost:6379/1
REDIS_PASSWORD=your-redis-password

# CORS & Security
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
CSRF_TRUSTED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Security Settings
LOGIN_RATE_LIMIT_IP=5
REGISTRATION_RATE_LIMIT=3
ACCOUNT_LOCKOUT_ATTEMPTS=5
ACCOUNT_LOCKOUT_TIME=1800

# File Upload
MAX_UPLOAD_SIZE=10485760
ALLOWED_DOCUMENT_TYPES=pdf,doc,docx,jpg,jpeg,png,xlsx,xls

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Logging
SECURITY_LOG_RETENTION_DAYS=90
```

### Middleware de Seguridad

Los siguientes middleware están **activos** en el sistema:

- **SecurityHeadersMiddleware**: Headers de seguridad automáticos
- **RateLimitMiddleware**: Limitación de requests por IP
- **SecurityLoggingMiddleware**: Registro de eventos de seguridad
- **RequestValidationMiddleware**: Validación de requests entrantes

### Dependencias

```bash
pip install djangorestframework-simplejwt django-redis django-cors-headers
```

### Configuración por Entorno

```bash
# Desarrollo (por defecto)
python manage.py runserver

# Producción
export DJANGO_SETTINGS_MODULE=config.settings.production
python manage.py runserver

# Testing
export DJANGO_SETTINGS_MODULE=config.settings.testing
python manage.py test
```