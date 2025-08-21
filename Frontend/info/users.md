# 👥 API de Usuarios - Lateral 360°

Documentación completa de los endpoints de usuarios con implementación de seguridad robusta.

---

## 📋 Resumen de Endpoints de Usuarios

| Endpoint | Método | Autenticación | Permisos | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/auth/register/` | POST | ❌ Público | `AllowAny` | Registro de nuevo usuario |
| `/api/auth/login/` | POST | ❌ Público | `AllowAny` | Inicio de sesión |
| `/api/auth/logout/` | POST | ✅ Requerida | `IsAuthenticated` | Cierre de sesión |
| `/api/auth/users/me/` | GET | ✅ Requerida | `IsAuthenticated` | Perfil del usuario actual |
| `/api/auth/change-password/` | POST | ✅ Requerida | `IsAuthenticated` | Cambiar contraseña |
| `/api/users/` | GET | ✅ Requerida | `CanManageUsers` | Listar usuarios (filtrado) |
| `/api/users/{id}/` | GET | ✅ Requerida | `CanManageUsers` | Detalles de usuario |
| `/api/users/{id}/` | PUT | ✅ Requerida | `CanManageUsers` | Actualizar usuario |
| `/api/users/{id}/` | DELETE | ✅ Requerida | `IsAdminOnly` | Eliminar usuario |

---

## 🔐 Sistema de Seguridad Implementado

### **Niveles de Autenticación**

#### 🚫 **Público (AllowAny)**
- Solo registro y login
- Rate limiting aplicado
- Validaciones estrictas

#### 🔑 **Autenticado (IsAuthenticated)**
- Requiere token JWT válido
- Headers: `Authorization: Bearer <token>`
- Token expira en 15 minutos

#### 👥 **Gestión de Usuarios (CanManageUsers)**
- **Admin**: Acceso completo a todos los usuarios
- **Usuario normal**: Solo acceso a su propio perfil
- Validación automática de permisos

#### 🛡️ **Solo Admin (IsAdminOnly)**
- Exclusivo para administradores
- Operaciones críticas como eliminación
- Verificación de rol requerida

---

## 🚀 Endpoints Detallados

### **1. Registro de Usuario**

**`POST /api/auth/register/`**

#### Seguridad Implementada:
- ✅ Rate limiting: **3 registros por IP por hora**
- ✅ Validación de contraseña fuerte obligatoria
- ✅ Sanitización de todos los campos de entrada
- ✅ Verificación de email único
- ✅ Username con caracteres seguros únicamente

#### Request:
```json
{
  "email": "usuario@example.com",
  "username": "usuario123",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+57 300 123 4567",
  "company": "Mi Empresa"
}
```

#### Response Exitosa:
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "username": "usuario123",
    "first_name": "Juan",
    "last_name": "Pérez",
    "phone": "+57 300 123 4567",
    "company": "Mi Empresa",
    "role": "owner",
    "date_joined": "2024-01-15T10:30:00Z",
    "is_active": true
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

#### Validaciones de Seguridad:
- **Email**: Único, formato válido, convertido a minúsculas
- **Username**: Único, solo alfanumérico + guiones, mínimo 3 caracteres
- **Password**: Mínimo 8 caracteres, mayús/minús/número/especial
- **Nombres**: Sanitizados contra XSS/injection
- **Teléfono**: Formato validado si se proporciona

---

### **2. Inicio de Sesión**

**`POST /api/auth/login/`**

#### Seguridad Implementada:
- ✅ Rate limiting: **5 intentos por IP en 5 minutos**
- ✅ Rate limiting: **5 intentos por email en 15 minutos**
- ✅ Bloqueo temporal tras intentos fallidos
- ✅ Logging de intentos exitosos y fallidos
- ✅ Tokens JWT seguros generados

#### Request:
```json
{
  "email": "usuario@example.com",
  "password": "SecurePass123!"
}
```

#### Response Exitosa:
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "username": "usuario123",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "owner"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

#### Response de Error (Rate Limited):
```json
{
  "error": "Account temporarily locked",
  "message": "Demasiados intentos fallidos. Intente más tarde."
}
```

---

### **3. Perfil de Usuario**

**`GET /api/auth/users/me/`**

#### Seguridad Implementada:
- ✅ Requiere autenticación JWT
- ✅ Solo retorna datos del usuario autenticado
- ✅ Campos filtrados según permisos

#### Headers Requeridos:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

#### Response:
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "username": "usuario123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+57 300 123 4567",
  "company": "Mi Empresa",
  "role": "owner",
  "date_joined": "2024-01-15T10:30:00Z",
  "is_active": true
}
```

---

### **4. Listar Usuarios**

**`GET /api/users/`**

#### Seguridad Implementada:
- ✅ Requiere autenticación JWT
- ✅ Filtrado automático según rol:
  - **Admin**: Ve todos los usuarios
  - **Usuario normal**: Solo ve su propio perfil
- ✅ Campos limitados para usuarios no admin

#### Headers Requeridos:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

#### Response para Admin:
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "email": "admin@example.com",
      "username": "admin",
      "first_name": "Admin",
      "last_name": "Sistema",
      "role": "admin",
      "is_active": true
    },
    {
      "id": 2,
      "email": "user@example.com",
      "username": "user123",
      "first_name": "Usuario",
      "last_name": "Normal",
      "role": "owner",
      "is_active": true
    }
  ]
}
```

#### Response para Usuario Normal:
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 2,
      "email": "user@example.com",
      "username": "user123",
      "first_name": "Usuario",
      "last_name": "Normal",
      "role": "owner",
      "is_active": true
    }
  ]
}
```

---

### **5. Detalles de Usuario**

**`GET /api/users/{id}/`**

#### Seguridad Implementada:
- ✅ Solo admin o el mismo usuario pueden acceder
- ✅ Campos limitados según permisos
- ✅ Error 403 si no tiene permisos

#### Ejemplo de Acceso:
```bash
# Admin puede ver cualquier usuario
GET /api/users/5/
Authorization: Bearer <admin_token>

# Usuario normal solo puede ver su propio perfil
GET /api/users/2/  # Solo si ID = usuario autenticado
Authorization: Bearer <user_token>
```

#### Response con Campos Limitados (No Admin):
```json
{
  "id": 5,
  "first_name": "Juan",
  "last_name": "Pérez",
  "company": "Mi Empresa"
}
```

---

### **6. Actualizar Usuario**

**`PUT /api/users/{id}/`**

#### Seguridad Implementada:
- ✅ Solo admin o el mismo usuario pueden modificar
- ✅ Campos restringidos para usuarios no admin
- ✅ Validaciones de seguridad en todos los campos
- ✅ Logging de modificaciones

#### Campos Restringidos para No Admin:
```json
// ❌ PROHIBIDO para usuarios normales
{
  "role": "admin",        // Solo admin puede cambiar roles
  "is_staff": true,       // Solo admin puede cambiar staff
  "is_superuser": true,   // Solo admin puede cambiar superuser
  "is_active": false      // Solo admin puede desactivar
}
```

#### Request Válido (Usuario Normal):
```json
{
  "first_name": "Juan Carlos",
  "last_name": "Pérez García",
  "phone": "+57 300 999 8888",
  "company": "Nueva Empresa S.A.S"
}
```

---

### **7. Cambiar Contraseña**

**`POST /api/auth/change-password/`**

#### Seguridad Implementada:
- ✅ Requiere contraseña actual para verificación
- ✅ Validación de contraseña fuerte obligatoria
- ✅ Verificación de que la nueva sea diferente
- ✅ Logging de cambios de contraseña

#### Request:
```json
{
  "current_password": "PasswordVieja123!",
  "new_password": "NuevaPasswordSegura456@",
  "new_password_confirm": "NuevaPasswordSegura456@"
}
```

#### Headers Requeridos:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json
```

---

### **8. Eliminar Usuario**

**`DELETE /api/users/{id}/`**

#### Seguridad Implementada:
- ✅ **Solo administradores** pueden eliminar usuarios
- ✅ **No puede eliminarse a sí mismo** (protección admin)
- ✅ Logging crítico de eliminaciones
- ✅ Validación de permisos estricta

#### Headers Requeridos:
```http
Authorization: Bearer <admin_token>
```

#### Response Exitosa:
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

#### Response de Error (No Admin):
```json
{
  "error": true,
  "message": "Acceso denegado",
  "status_code": 403
}
```

---

## 🔒 Configuración de Tokens JWT

### **Configuración Actual:**
- **Access Token**: 15 minutos de duración
- **Refresh Token**: 1 día de duración
- **Rotación**: Automática en cada refresh
- **Blacklist**: Tokens invalidados tras logout

### **Uso de Tokens:**

#### Obtener Token:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### Usar Token:
```bash
curl -X GET http://localhost:8000/api/auth/users/me/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

#### Refresh Token:
```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }'
```

---

## 🛡️ Sistema de Roles y Permisos

### **Roles Disponibles:**

#### 🔴 **Admin**
- **Permisos**: Acceso completo al sistema
- **Usuarios**: Puede ver, crear, modificar y eliminar cualquier usuario
- **Lotes**: Acceso total a todos los lotes
- **Documentos**: Acceso a todos los documentos
- **Scraping**: Acceso a funciones administrativas de MapGIS

#### 🟡 **Owner (Propietario)**
- **Permisos**: Gestión de sus propios recursos
- **Usuarios**: Solo puede ver y modificar su propio perfil
- **Lotes**: Solo puede gestionar sus propios lotes
- **Documentos**: Solo documentos de sus lotes
- **Scraping**: Acceso a funciones básicas

#### 🔵 **Developer**
- **Permisos**: Solo lectura con fines de desarrollo
- **Usuarios**: Solo su propio perfil
- **Lotes**: Lectura de todos los lotes
- **Documentos**: Lectura de todos los documentos
- **Scraping**: Acceso limitado

### **Matriz de Permisos por Endpoint:**

| Endpoint | Admin | Owner | Developer |
|----------|-------|-------|-----------|
| `GET /api/users/` | ✅ Todos | ✅ Solo él | ✅ Solo él |
| `PUT /api/users/{id}/` | ✅ Cualquiera | ✅ Solo él | ✅ Solo él |
| `DELETE /api/users/{id}/` | ✅ Cualquiera | ❌ Negado | ❌ Negado |
| `GET /api/users/{id}/` | ✅ Cualquiera | ✅ Solo él | ✅ Solo él |

---

## 📝 Ejemplos de Uso por Rol

### **Como Administrador:**

#### Listar todos los usuarios:
```bash
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <admin_token>"
```

#### Modificar cualquier usuario:
```bash
curl -X PUT http://localhost:8000/api/users/5/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "developer",
    "is_active": true,
    "first_name": "Nuevo Nombre"
  }'
```

#### Eliminar usuario:
```bash
curl -X DELETE http://localhost:8000/api/users/5/ \
  -H "Authorization: Bearer <admin_token>"
```

### **Como Usuario Owner:**

#### Ver mi propio perfil:
```bash
curl -X GET http://localhost:8000/api/auth/users/me/ \
  -H "Authorization: Bearer <owner_token>"
```

#### Actualizar mi perfil:
```bash
curl -X PUT http://localhost:8000/api/users/2/ \
  -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan Carlos",
    "phone": "+57 300 999 8888"
  }'
```

#### ❌ Intentar ver otro usuario (Bloqueado):
```bash
curl -X GET http://localhost:8000/api/users/3/ \
  -H "Authorization: Bearer <owner_token>"

# Response: 403 Forbidden
{
  "error": true,
  "message": "Acceso denegado",
  "status_code": 403
}
```

---

## 🔍 Rate Limiting Detallado

### **Límites por Endpoint:**

| Endpoint | Límite | Ventana | Bloqueo |
|----------|--------|---------|---------|
| `/api/auth/register/` | 3 intentos | Por hora | IP bloqueada 1h |
| `/api/auth/login/` | 5 intentos | Por 5 min | IP bloqueada 15min |
| `/api/auth/login/` (por email) | 5 intentos | Por 15 min | Email bloqueado 15min |
| `/api/users/` | 100 requests | Por hora | Límite general |

### **Respuesta de Rate Limit:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in 300 seconds"
}
```

---

## 🧪 Testing de Seguridad

### **1. Test de Autenticación**

```bash
# Sin token - debe fallar
curl -X GET http://localhost:8000/api/users/
# Response: 401 Unauthorized

# Con token inválido - debe fallar
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer invalid_token"
# Response: 401 Unauthorized

# Con token válido - debe funcionar
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <valid_token>"
# Response: 200 OK
```

### **2. Test de Autorización**

```bash
# Usuario normal intenta ver otro perfil
curl -X GET http://localhost:8000/api/users/999/ \
  -H "Authorization: Bearer <user_token>"
# Response: 403 Forbidden o 404 Not Found

# Usuario normal intenta cambiar rol
curl -X PUT http://localhost:8000/api/users/2/ \
  -H "Authorization: Bearer <user_token>" \
  -d '{"role": "admin"}'
# Response: 400 Bad Request (campo restringido)
```

### **3. Test de Rate Limiting**

```bash
# Realizar 6 intentos de login rápidos
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/auth/login/ \
    -d '{"email": "test@test.com", "password": "wrong"}'
done
# El 6to debería ser bloqueado con 429
```

---

## 📊 Logging y Monitoreo

### **Eventos Registrados:**

#### Eventos de Autenticación:
```log
[SECURITY] 2024-01-15 10:30:00 INFO {"event_type": "RESPONSE_SENT", "ip": "192.168.1.100", "user_email": "u***@example.com", "path": "/api/auth/login/", "status_code": 200}
```

#### Eventos de Autorización:
```log
[SECURITY] 2024-01-15 10:35:00 WARNING Permission denied for user 2 on /api/users/3/
```

#### Rate Limiting:
```log
[SECURITY] 2024-01-15 10:40:00 WARNING Rate limit exceeded for IP 192.168.1.100 on path /api/auth/login/
```

### **Archivos de Log:**
- **`logs/security.log`**: Eventos de seguridad
- **`logs/django.log`**: Log general de Django

---

## ⚡ Ejemplos de Código para Frontend

### **JavaScript - Sistema de Login**

```javascript
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api/auth';
    this.token = localStorage.getItem('access_token');
  }
  
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      if (response.status === 429) {
        throw new Error('Demasiados intentos. Intente más tarde.');
      }
      
      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }
      
      const data = await response.json();
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  async getProfile() {
    const response = await fetch(`${this.baseURL}/users/me/`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }
    
    return response.json();
  }
  
  async updateProfile(userData) {
    const profile = await this.getProfile();
    
    const response = await fetch(`http://localhost:8000/api/users/${profile.id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar perfil');
    }
    
    return response.json();
  }
  
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
```

---

## 🔧 Configuración para Desarrollo

### **Variables de Entorno Necesarias:**

```env
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=1440

# Redis for Rate Limiting
REDIS_URL=redis://localhost:6379/1

# Security
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### **Instalación de Dependencias:**

```bash
pip install django-redis python-magic bleach
```

### **Middleware Requerido en Settings:**

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'app.middleware.SecurityHeadersMiddleware',
    'app.middleware.RateLimitMiddleware',
    'app.middleware.SecurityLoggingMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

---

## 🚨 Códigos de Error Comunes

| Código | Significado | Causa Común |
|--------|-------------|-------------|
| **401** | No autorizado | Token ausente, inválido o expirado |
| **403** | Acceso denegado | Usuario sin permisos para el recurso |
| **429** | Rate limit | Demasiadas requests en poco tiempo |
| **400** | Datos inválidos | Campos requeridos o formato incorrecto |

---

## ✅ Checklist de Implementación

### **Para Desarrolladores:**
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias adicionales
- [ ] Actualizar MIDDLEWARE en settings
- [ ] Crear directorio `logs/`
- [ ] Probar endpoints con diferentes roles
- [ ] Verificar rate limiting funcional

### **Para Frontend:**
- [ ] Implementar manejo de tokens JWT
- [ ] Manejar errores 401/403 apropiadamente
- [ ] Implementar refresh automático de tokens
- [ ] Mostrar mensajes de error de rate limit
- [ ] Validar permisos antes de mostrar UI

---

**🔐 El sistema de usuarios ahora está completamente seguro y listo para producción.**