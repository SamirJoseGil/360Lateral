# Módulo de Autenticación (Authentication)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [Servicios (Services)](#servicios-services)
- [URLs](#urls)
- [Signals](#signals)
- [Seguridad](#seguridad)
- [Rate Limiting](#rate-limiting)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Autenticación** maneja todo el proceso de registro, login, logout y gestión de sesiones de usuarios en Lateral 360°. Utiliza **JWT (JSON Web Tokens)** para autenticación stateless y segura.

### Características Principales

- 🔐 **Autenticación JWT**: Tokens de acceso y refresh
- 📝 **Registro de Usuarios**: Múltiples roles (Owner, Developer, Admin)
- 🔑 **Gestión de Contraseñas**: Cambio y recuperación
- 🛡️ **Rate Limiting**: Protección contra ataques de fuerza bruta
- 📊 **Logging de Seguridad**: Auditoría de intentos de login
- ✅ **Validación Robusta**: Campos específicos por rol

---

## Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **djangorestframework-simplejwt** | Tokens JWT |
| **django-ratelimit** | Límite de intentos |
| **django.contrib.auth** | Sistema de autenticación base |
| **bcrypt/pbkdf2** | Hash de contraseñas |

---

## Serializers

### `LoginSerializer`

Serializer para autenticación de usuarios.

**Ubicación**: `apps/authentication/serializers.py`

#### Campos

```python
email = serializers.EmailField(required=True)
password = serializers.CharField(required=True, write_only=True)
```

#### Validaciones

```python
def validate_email(self, value):
    """Normalizar email a minúsculas"""
    return value.lower().strip()
```

#### Ejemplo de Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

---

### `RegisterSerializer`

Serializer para registro de nuevos usuarios.

**Ubicación**: `apps/authentication/serializers.py`

#### Campos por Rol

##### Campos Comunes (Todos los roles)

```python
email = serializers.EmailField(required=True)
username = serializers.CharField(required=False)  # Se genera automáticamente si no se proporciona
password = serializers.CharField(required=True, write_only=True)
password_confirm = serializers.CharField(required=True, write_only=True)
first_name = serializers.CharField(required=True)
last_name = serializers.CharField(required=True)
role = serializers.ChoiceField(choices=['owner', 'developer', 'admin'])
phone = serializers.CharField(required=False)
```

##### Campos Específicos para Desarrolladores

```python
developer_type = serializers.ChoiceField(
    choices=['constructora', 'fondo_inversion', 'inversionista', 'otro'],
    required=False
)
person_type = serializers.ChoiceField(
    choices=['natural', 'juridica'],
    required=False
)
legal_name = serializers.CharField(required=False)
document_type = serializers.ChoiceField(
    choices=['CC', 'NIT', 'CE', 'PASSPORT', 'TI'],
    required=False
)
document_number = serializers.CharField(required=False)
```

#### Validaciones Especiales

##### Validación de Contraseñas

```python
def validate(self, attrs):
    if attrs['password'] != attrs['password_confirm']:
        raise ValidationError({
            'password_confirm': 'Las contraseñas no coinciden'
        })
    return attrs
```

##### Validación para Desarrolladores

```python
if role == 'developer':
    # Campos obligatorios
    if not attrs.get('developer_type'):
        raise ValidationError({'developer_type': 'El tipo de desarrollador es obligatorio'})
    
    if not attrs.get('person_type'):
        raise ValidationError({'person_type': 'El tipo de persona es obligatorio'})
    
    # Persona jurídica requiere NIT
    if person_type == 'juridica':
        if document_type != 'NIT':
            raise ValidationError({'document_type': 'Personas jurídicas deben usar NIT'})
        
        if not attrs.get('legal_name'):
            raise ValidationError({'legal_name': 'El nombre de la empresa es obligatorio'})
    
    # Persona natural no puede usar NIT
    if person_type == 'natural' and document_type == 'NIT':
        raise ValidationError({'document_type': 'Personas naturales no pueden usar NIT'})
```

#### Generación Automática de Username

```python
if not validated_data.get('username'):
    base_username = validated_data.get('email').split('@')[0]
    username = base_username
    counter = 1
    
    # Buscar username único
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
    
    validated_data['username'] = username
```

#### Ejemplo de Request (Developer)

```json
{
  "email": "developer@lateral360.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Carlos",
  "last_name": "Constructora",
  "role": "developer",
  "phone": "+57 300 123 4567",
  "developer_type": "constructora",
  "person_type": "juridica",
  "legal_name": "Constructora ABC S.A.S.",
  "document_type": "NIT",
  "document_number": "900123456"
}
```

#### Ejemplo de Request (Owner)

```json
{
  "email": "owner@lateral360.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Juan",
  "last_name": "Pérez",
  "role": "owner",
  "phone": "+57 300 987 6543"
}
```

---

### `ChangePasswordSerializer`

Serializer para cambio de contraseña.

**Ubicación**: `apps/authentication/serializers.py`

#### Campos

```python
current_password = serializers.CharField(required=True, write_only=True)
new_password = serializers.CharField(
    required=True,
    write_only=True,
    validators=[validate_password]  # Validación de Django
)
```

#### Validación

```python
def validate_current_password(self, value):
    """Validar que la contraseña actual sea correcta"""
    user = self.context['request'].user
    
    if not user.check_password(value):
        raise ValidationError('Contraseña actual incorrecta')
    
    return value
```

---

## Vistas (Views)

### `login_view`

Endpoint de login con JWT.

**Ubicación**: `apps/authentication/views.py`

#### Endpoint


Searched codebase for "No necesito que escribas la respuesta en la terminal, solamente que coloques el codigo en el archivo, dicho esto sigamos con el de la carpeta authentication #file:authentication.md #codebase ", no results

# Módulo de Autenticación (Authentication)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [Servicios (Services)](#servicios-services)
- [URLs](#urls)
- [Signals](#signals)
- [Seguridad](#seguridad)
- [Rate Limiting](#rate-limiting)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Autenticación** maneja todo el proceso de registro, login, logout y gestión de sesiones de usuarios en Lateral 360°. Utiliza **JWT (JSON Web Tokens)** para autenticación stateless y segura.

### Características Principales

- 🔐 **Autenticación JWT**: Tokens de acceso y refresh
- 📝 **Registro de Usuarios**: Múltiples roles (Owner, Developer, Admin)
- 🔑 **Gestión de Contraseñas**: Cambio y recuperación
- 🛡️ **Rate Limiting**: Protección contra ataques de fuerza bruta
- 📊 **Logging de Seguridad**: Auditoría de intentos de login
- ✅ **Validación Robusta**: Campos específicos por rol

---

## Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **djangorestframework-simplejwt** | Tokens JWT |
| **django-ratelimit** | Límite de intentos |
| **django.contrib.auth** | Sistema de autenticación base |
| **bcrypt/pbkdf2** | Hash de contraseñas |

---

## Serializers

### `LoginSerializer`

Serializer para autenticación de usuarios.

**Ubicación**: `apps/authentication/serializers.py`

#### Campos

```python
email = serializers.EmailField(required=True)
password = serializers.CharField(required=True, write_only=True)
```

#### Validaciones

```python
def validate_email(self, value):
    """Normalizar email a minúsculas"""
    return value.lower().strip()
```

#### Ejemplo de Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

---

### `RegisterSerializer`

Serializer para registro de nuevos usuarios.

**Ubicación**: serializers.py

#### Campos por Rol

##### Campos Comunes (Todos los roles)

```python
email = serializers.EmailField(required=True)
username = serializers.CharField(required=False)  # Se genera automáticamente si no se proporciona
password = serializers.CharField(required=True, write_only=True)
password_confirm = serializers.CharField(required=True, write_only=True)
first_name = serializers.CharField(required=True)
last_name = serializers.CharField(required=True)
role = serializers.ChoiceField(choices=['owner', 'developer', 'admin'])
phone = serializers.CharField(required=False)
```

##### Campos Específicos para Desarrolladores

```python
developer_type = serializers.ChoiceField(
    choices=['constructora', 'fondo_inversion', 'inversionista', 'otro'],
    required=False
)
person_type = serializers.ChoiceField(
    choices=['natural', 'juridica'],
    required=False
)
legal_name = serializers.CharField(required=False)
document_type = serializers.ChoiceField(
    choices=['CC', 'NIT', 'CE', 'PASSPORT', 'TI'],
    required=False
)
document_number = serializers.CharField(required=False)
```

#### Validaciones Especiales

##### Validación de Contraseñas

```python
def validate(self, attrs):
    if attrs['password'] != attrs['password_confirm']:
        raise ValidationError({
            'password_confirm': 'Las contraseñas no coinciden'
        })
    return attrs
```

##### Validación para Desarrolladores

```python
if role == 'developer':
    # Campos obligatorios
    if not attrs.get('developer_type'):
        raise ValidationError({'developer_type': 'El tipo de desarrollador es obligatorio'})
    
    if not attrs.get('person_type'):
        raise ValidationError({'person_type': 'El tipo de persona es obligatorio'})
    
    # Persona jurídica requiere NIT
    if person_type == 'juridica':
        if document_type != 'NIT':
            raise ValidationError({'document_type': 'Personas jurídicas deben usar NIT'})
        
        if not attrs.get('legal_name'):
            raise ValidationError({'legal_name': 'El nombre de la empresa es obligatorio'})
    
    # Persona natural no puede usar NIT
    if person_type == 'natural' and document_type == 'NIT':
        raise ValidationError({'document_type': 'Personas naturales no pueden usar NIT'})
```

#### Generación Automática de Username

```python
if not validated_data.get('username'):
    base_username = validated_data.get('email').split('@')[0]
    username = base_username
    counter = 1
    
    # Buscar username único
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
    
    validated_data['username'] = username
```

#### Ejemplo de Request (Developer)

```json
{
  "email": "developer@lateral360.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Carlos",
  "last_name": "Constructora",
  "role": "developer",
  "phone": "+57 300 123 4567",
  "developer_type": "constructora",
  "person_type": "juridica",
  "legal_name": "Constructora ABC S.A.S.",
  "document_type": "NIT",
  "document_number": "900123456"
}
```

#### Ejemplo de Request (Owner)

```json
{
  "email": "owner@lateral360.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Juan",
  "last_name": "Pérez",
  "role": "owner",
  "phone": "+57 300 987 6543"
}
```

---

### `ChangePasswordSerializer`

Serializer para cambio de contraseña.

**Ubicación**: serializers.py

#### Campos

```python
current_password = serializers.CharField(required=True, write_only=True)
new_password = serializers.CharField(
    required=True,
    write_only=True,
    validators=[validate_password]  # Validación de Django
)
```

#### Validación

```python
def validate_current_password(self, value):
    """Validar que la contraseña actual sea correcta"""
    user = self.context['request'].user
    
    if not user.check_password(value):
        raise ValidationError('Contraseña actual incorrecta')
    
    return value
```

---

## Vistas (Views)

### `login_view`

Endpoint de login con JWT.

**Ubicación**: views.py

#### Endpoint

```
POST /api/auth/login/
```

#### Rate Limit

- **5 intentos cada 15 minutos** por IP

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "user",
      "first_name": "Juan",
      "last_name": "Pérez",
      "role": "owner",
      "is_verified": true,
      "is_active": true
    }
  }
}
```

#### Response Error (401)

```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

#### Flujo Interno

```python
1. Validar datos con LoginSerializer
2. Buscar usuario por email (case-insensitive)
3. Verificar contraseña con user.check_password()
4. Verificar que user.is_active == True
5. Generar tokens JWT (refresh + access)
6. Log de login exitoso
7. Retornar tokens + datos del usuario
```

#### Logging

```python
logger.info("=" * 60)
logger.info("🔐 LOGIN REQUEST RECEIVED")
logger.info(f"   Remote Address: {request.META.get('REMOTE_ADDR')}")
logger.info(f"   User-Agent: {request.META.get('HTTP_USER_AGENT')}")
logger.info("=" * 60)
logger.info(f"✅ Successful login: {user.email} (role: {user.role})")
```

---

### `register_view`

Endpoint de registro de nuevos usuarios.

**Ubicación**: views.py

#### Endpoint

```
POST /api/auth/register/
```

#### Rate Limit

- **3 registros por hora** por IP

#### Request Body (Developer)

```json
{
  "email": "developer@lateral360.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Carlos",
  "last_name": "Desarrollador",
  "role": "developer",
  "phone": "+57 300 123 4567",
  "developer_type": "constructora",
  "person_type": "juridica",
  "legal_name": "Constructora ABC S.A.S.",
  "document_type": "NIT",
  "document_number": "900123456"
}
```

#### Response Success (201)

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "uuid",
      "email": "developer@lateral360.com",
      "username": "developer",
      "first_name": "Carlos",
      "last_name": "Desarrollador",
      "role": "developer",
      "developer_type": "constructora",
      "person_type": "juridica",
      "legal_name": "Constructora ABC S.A.S.",
      "document_type": "NIT",
      "document_number": "900123456",
      "is_verified": false,
      "is_active": true
    }
  }
}
```

#### Response Error (400)

```json
{
  "success": false,
  "message": "El email ya está registrado. Intenta con otro o inicia sesión.",
  "errors": {
    "email": "Ya existe un usuario con este email"
  }
}
```

#### Flujo Interno

```python
1. Validar datos con RegisterSerializer
2. Verificar email único
3. Generar username automático si no se proporciona
4. Validar campos específicos según role
5. Crear usuario con contraseña hasheada
6. Generar tokens JWT automáticamente
7. Log de registro exitoso
8. Retornar tokens + datos del usuario
```

---

### `logout_view`

Endpoint de logout (invalida refresh token).

**Ubicación**: views.py

#### Endpoint

```
POST /api/auth/logout/
```

#### Permisos

- **Authenticated** (requiere token válido)

#### Request Body

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

#### Flujo Interno

```python
1. Obtener refresh token del request
2. Agregar token a blacklist
3. Log de logout
4. Retornar confirmación
```

---

### `me_view`

Obtener información del usuario actual.

**Ubicación**: views.py

#### Endpoint

```
GET /api/auth/me/
```

#### Permisos

- **Authenticated**

#### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "owner",
    "is_verified": true,
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### `change_password_view`

Cambiar contraseña del usuario actual.

**Ubicación**: views.py

#### Endpoint

```
POST /api/auth/change-password/
```

#### Permisos

- **Authenticated**

#### Request Body

```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

#### Response Error (400)

```json
{
  "success": false,
  "message": "Datos inválidos",
  "errors": {
    "current_password": "Contraseña actual incorrecta"
  }
}
```

---

## Servicios (Services)

### `AuthService`

Servicio auxiliar para operaciones de autenticación.

**Ubicación**: services.py

#### Métodos

##### `authenticate_user(email, password)`

```python
user = AuthService.authenticate_user(
    email='user@example.com',
    password='SecurePass123!'
)

if user:
    print(f"Usuario autenticado: {user.email}")
else:
    print("Credenciales inválidas")
```

##### `generate_tokens(user)`

```python
access_token, refresh_token = AuthService.generate_tokens(user)

print(f"Access Token: {access_token}")
print(f"Refresh Token: {refresh_token}")
```

##### `create_user(email, password, **kwargs)`

```python
user = AuthService.create_user(
    email='new@example.com',
    password='SecurePass123!',
    first_name='Nuevo',
    last_name='Usuario',
    role='owner'
)
```

---

## URLs

**Ubicación**: urls.py

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

app_name = 'authentication'

urlpatterns = [
    # Auth endpoints
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('logout/', logout_view, name='logout'),
    path('me/', me_view, name='me'),
    
    # Password management
    path('change-password/', change_password_view, name='change-password'),
    path('password-reset/', password_reset_request_view, name='password-reset'),
    path('password-reset/confirm/', password_reset_confirm_view, name='password-reset-confirm'),
    
    # JWT token management
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
]
```

### Endpoints Disponibles

| Endpoint | Método | Descripción | Rate Limit |
|----------|--------|-------------|------------|
| `/api/auth/login/` | POST | Login | 5/15min |
| `/api/auth/register/` | POST | Registro | 3/1h |
| `/api/auth/logout/` | POST | Logout | - |
| `/api/auth/me/` | GET | Usuario actual | - |
| `/api/auth/change-password/` | POST | Cambiar contraseña | - |
| `/api/auth/token/refresh/` | POST | Refrescar token | - |
| `/api/auth/token/verify/` | POST | Verificar token | - |

---

## Signals

### Signals de Seguridad

**Ubicación**: signals.py

#### `user_logged_in`

Log cuando un usuario inicia sesión exitosamente.

```python
@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    ip = _get_client_ip(request)
    logger.info(f"Successful login: User '{user.email}' from IP {ip}")
```

#### `user_logged_out`

Log cuando un usuario cierra sesión.

```python
@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    ip = _get_client_ip(request)
    logger.info(f"User logged out: '{user.email}' from IP {ip}")
```

#### `user_login_failed`

Log cuando falla un intento de inicio de sesión.

```python
@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs):
    username = credentials.get('username', '')
    username_safe = f"{username[:3]}{'*' * (len(username) - 3)}"
    ip = _get_client_ip(request)
    logger.warning(f"Failed login attempt for '{username_safe}' from IP {ip}")
```

---

## Seguridad

### Hash de Contraseñas

Django utiliza **PBKDF2** con SHA256 por defecto:

```python
# Al crear usuario
user.set_password('SecurePass123!')

# Al verificar
if user.check_password('SecurePass123!'):
    # Contraseña correcta
```

### Validación de Contraseñas

Django valida contraseñas según:
- **Longitud mínima**: 8 caracteres
- **No muy común**: No puede ser una contraseña común
- **No solo numérica**: Debe contener letras
- **No muy similar a datos del usuario**: No puede ser similar al email/nombre

```python
from django.contrib.auth.password_validation import validate_password

try:
    validate_password('SecurePass123!', user=user)
except ValidationError as e:
    print(e.messages)
```

### Protección CSRF

- **JWT no requiere CSRF**: Los tokens se envían en headers
- **CORS configurado**: Solo orígenes permitidos
- **HTTPS recomendado**: En producción

---

## Rate Limiting

### Configuración

**Ubicación**: views.py

```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='5/15m', method='POST', block=True)
def login_view(request):
    # 5 intentos cada 15 minutos por IP
    pass

@ratelimit(key='ip', rate='3/1h', method='POST', block=True)
def register_view(request):
    # 3 registros por hora por IP
    pass
```

### Respuesta cuando se excede el límite

```json
{
  "detail": "Request was throttled. Expected available in 900 seconds."
}
```

### Bypass para Testing

En `settings/base.py`:

```python
# Deshabilitar rate limiting en testing
if TESTING:
    RATELIMIT_ENABLE = False
```

---

## Ejemplos de Uso

### 1. Login de Usuario

```bash
# Request
POST /api/auth/login/
Content-Type: application/json

{
  "email": "owner@lateral360.com",
  "password": "SecurePass123!"
}

# Response (200)
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "refresh": "eyJ0eXAiOiJKV1Qi...",
    "access": "eyJ0eXAiOiJKV1Qi...",
    "user": {
      "id": "uuid",
      "email": "owner@lateral360.com",
      "role": "owner"
    }
  }
}
```

### 2. Registro de Desarrollador

```bash
# Request
POST /api/auth/register/
Content-Type: application/json

{
  "email": "developer@lateral360.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Carlos",
  "last_name": "Constructor",
  "role": "developer",
  "developer_type": "constructora",
  "person_type": "juridica",
  "legal_name": "Constructora ABC S.A.S.",
  "document_type": "NIT",
  "document_number": "900123456"
}

# Response (201)
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "refresh": "...",
    "access": "...",
    "user": {...}
  }
}
```

### 3. Uso de Token en Requests

```bash
# Usar access token en header
GET /api/lotes/
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
```

### 4. Refrescar Token

```bash
# Request
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}

# Response (200)
{
  "access": "eyJ0eXAiOiJKV1Qi..."
}
```

### 5. Cambiar Contraseña

```bash
# Request
POST /api/auth/change-password/
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
Content-Type: application/json

{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}

# Response (200)
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

### 6. Logout

```bash
# Request
POST /api/auth/logout/
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}

# Response (200)
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

## Configuración JWT

**Ubicación**: `Backend/config/settings/base.py`

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}
```

---

## Testing

### Test de Login

```python
from django.test import TestCase
from apps.users.models import User

class LoginTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123!',
            role='owner'
        )
    
    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])
```

---

## Troubleshooting

### Problema: "Credenciales inválidas"

**Causa**: Email o contraseña incorrectos, o usuario inactivo.

**Solución**:
- Verificar que el email esté correcto (case-insensitive)
- Verificar que la contraseña sea correcta
- Verificar que `user.is_active == True`

---

### Problema: "Request was throttled"

**Causa**: Se excedió el rate limit.

**Solución**:
- Esperar el tiempo indicado
- En desarrollo, deshabilitar rate limiting en settings

---

### Problema: Token expirado

**Causa**: Access token expiró (1 hora).

**Solución**:
- Usar refresh token para obtener nuevo access token
- Endpoint: `POST /api/auth/token/refresh/`

---

## Próximas Mejoras

- [ ] **2FA**: Autenticación de dos factores
- [ ] **OAuth**: Login con Google, Facebook
- [ ] **Recuperación de contraseña**: Por email
- [ ] **Verificación de email**: Envío de código
- [ ] **Sesiones concurrentes**: Límite de dispositivos
- [ ] **Biometría**: Soporte para huella/Face ID

---

**Última actualización**: 2024-01-15


Made changes.