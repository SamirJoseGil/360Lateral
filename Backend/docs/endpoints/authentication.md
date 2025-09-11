# Documentación de Endpoints - Módulo Authentication

## Resumen General
El módulo `authentication` maneja todos los aspectos de autenticación y autorización del sistema Lateral 360°, incluyendo registro, login, logout, cambio de contraseñas y recuperación de cuentas.

## Endpoints de Autenticación

### 1. Registro de Usuario

#### `POST /api/auth/register/`
- **Descripción**: Registrar un nuevo usuario en el sistema
- **Permisos**: Público (AllowAny)
- **Body**:
```json
{
  "email": "nuevo@email.com",
  "username": "nuevouser",
  "password": "MiPassword123!",
  "password_confirm": "MiPassword123!",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "phone": "+57123456789",
  "company": "Empresa Ejemplo",
  "role": "owner"
}
```
- **Validaciones**:
  - Email único
  - Username único
  - Contraseña mínimo 8 caracteres con mayúsculas, minúsculas y números
  - Confirmación de contraseña debe coincidir
- **Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": "uuid",
      "email": "nuevo@email.com",
      "name": "Nombre Apellido",
      "role": "owner"
    }
  }
}
```

### 2. Inicio de Sesión

#### `POST /api/auth/login/`
- **Descripción**: Autenticar usuario existente
- **Permisos**: Público (AllowAny)
- **Body**:
```json
{
  "email": "usuario@email.com",
  "password": "MiPassword123!"
}
```
- **Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": "uuid",
      "email": "usuario@email.com",
      "name": "Nombre Apellido",
      "role": "owner"
    }
  }
}
```
- **Errores**:
```json
{
  "non_field_errors": ["Credenciales inválidas"]
}
```

### 3. Cierre de Sesión

#### `POST /api/auth/logout/`
- **Descripción**: Cerrar sesión del usuario actual
- **Permisos**: Usuario autenticado
- **Headers**: 
  - `Authorization: Bearer <access_token>`
- **Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```
- **Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

### 4. Renovación de Token

#### `POST /api/auth/token/refresh/`
- **Descripción**: Renovar token de acceso usando refresh token
- **Permisos**: Público (AllowAny)
- **Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```
- **Respuesta exitosa**:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Endpoints de Gestión de Contraseñas

### 5. Cambio de Contraseña

#### `POST /api/auth/change-password/`
- **Descripción**: Cambiar contraseña del usuario autenticado
- **Permisos**: Usuario autenticado
- **Headers**: 
  - `Authorization: Bearer <access_token>`
- **Body**:
```json
{
  "current_password": "PasswordActual123!",
  "new_password": "NuevoPassword456!"
}
```
- **Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Contraseña cambiada exitosamente"
}
```

### 6. Solicitar Restablecimiento de Contraseña

#### `POST /api/auth/password-reset/`
- **Descripción**: Solicitar enlace para restablecer contraseña
- **Permisos**: Público (AllowAny)
- **Body**:
```json
{
  "email": "usuario@email.com"
}
```
- **Respuesta**:
```json
{
  "success": true,
  "message": "Si el correo electrónico existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña."
}
```
- **Nota**: Por seguridad, siempre retorna éxito sin revelar si el email existe

### 7. Confirmar Restablecimiento de Contraseña

#### `POST /api/auth/password-reset/confirm/`
- **Descripción**: Restablecer contraseña usando token del email
- **Permisos**: Público (AllowAny)
- **Body**:
```json
{
  "token": "token_del_email",
  "password": "NuevaPassword123!",
  "password_confirm": "NuevaPassword123!"
}
```
- **Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Contraseña restablecida exitosamente"
}
```
- **Error**:
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

## Endpoint de Utilidad

### 8. Token CSRF

#### `GET /api/auth/csrf/`
- **Descripción**: Obtener token CSRF para formularios
- **Permisos**: Público (AllowAny)
- **Respuesta**:
```json
{
  "csrfToken": "token_csrf_aqui"
}
```

## Características de Seguridad

### Autenticación JWT
- **Access Token**: Válido por 15 minutos (configurable)
- **Refresh Token**: Válido por 7 días (configurable)
- **Blacklisting**: Los tokens pueden ser invalidados en logout

### Logging de Seguridad
- Todos los eventos de autenticación se registran
- Intentos fallidos de login se monitorean
- IPs se registran para auditoría

### Validaciones de Contraseña
- Mínimo 8 caracteres
- Debe incluir mayúsculas y minúsculas
- Debe incluir números
- Django password validators aplicados

### Reset de Contraseña
- Tokens seguros generados
- Expiración de 24 horas (configurable)
- Almacenamiento en cache con TTL
- Tokens se invalidan tras uso

## Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Usuario registrado exitosamente
- **400 Bad Request**: Datos inválidos o error de validación
- **401 Unauthorized**: Credenciales inválidas o token expirado
- **404 Not Found**: Endpoint no encontrado
- **500 Internal Server Error**: Error del servidor

## Ejemplos de Uso

### Flujo de Registro y Login
1. `POST /api/auth/register/` - Crear cuenta
2. Verificar email (si está implementado)
3. `POST /api/auth/login/` - Iniciar sesión
4. Usar access token en headers para requests autenticados

### Flujo de Renovación de Token
1. Cuando access token expira (401), usar refresh token
2. `POST /api/auth/token/refresh/` con refresh token
3. Actualizar access token en aplicación cliente

### Flujo de Reset de Contraseña
1. `POST /api/auth/password-reset/` con email
2. Usuario recibe email con enlace
3. `POST /api/auth/password-reset/confirm/` con token y nueva contraseña