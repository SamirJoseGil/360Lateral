# Authentication Module - Lateral 360°

## Descripción

Módulo de autenticación para la plataforma Lateral 360°. Implementa autenticación basada en JWT (JSON Web Tokens) con refresh tokens y manejo de sesiones seguras.

## Características

- Autenticación JWT con tokens de acceso y refresco
- Registro de usuarios con validación de datos
- Cambio y recuperación de contraseña
- Verificación de email
- Manejo de sesiones seguras
- Rate limiting para prevenir ataques de fuerza bruta
- Logging de actividades de autenticación

## Estructura

```
authentication/
├── __init__.py
├── apps.py           # Configuración de la app
├── models.py         # No tiene modelos propios, usa User de apps.users
├── serializers.py    # Serializadores para requests/responses
├── views.py          # Vistas de API
├── urls.py           # Rutas de la API
├── permissions.py    # Permisos personalizados
└── README.md         # Esta documentación
```

## API Endpoints

### 1. Login

Autentica un usuario y retorna tokens JWT.

**Endpoint:** `POST /api/auth/login/`

**Request:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Login exitoso",
    "data": {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "user": {
            "id": "uuid",
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "owner"
        }
    }
}
```

**Error Responses:**
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: Credenciales incorrectas
- `429 Too Many Requests`: Demasiados intentos de login

### 2. Register

Registra un nuevo usuario en el sistema.

**Endpoint:** `POST /api/auth/register/`

**Request:**
```json
{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "role": "owner",
    "phone": "+57 300 123 4567",
    "company": "Example Corp"
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "Usuario registrado exitosamente",
    "data": {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "user": {
            "id": "uuid",
            "email": "newuser@example.com",
            "role": "owner"
        }
    }
}
```

**Validaciones:**
- Email único
- Contraseña mínimo 8 caracteres
- Username único
- Role válido (owner, developer, admin)

### 3. Logout

Invalida el refresh token del usuario.

**Endpoint:** `POST /api/auth/logout/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Logout exitoso"
}
```

### 4. Me (Current User)

Obtiene información del usuario autenticado.

**Endpoint:** `GET /api/auth/me/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "email": "user@example.com",
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe",
        "role": "owner",
        "phone": "+57 300 123 4567",
        "is_verified": true
    }
}
```

### 5. Token Refresh

Renueva el access token usando el refresh token.

**Endpoint:** `POST /api/auth/token/refresh/`

**Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 6. Token Verify

Verifica si un token es válido.

**Endpoint:** `POST /api/auth/token/verify/`

**Request:**
```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Token válido"
}
```

### 7. Change Password

Cambia la contraseña del usuario autenticado.

**Endpoint:** `POST /api/auth/change-password/`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
    "current_password": "OldPassword123!",
    "new_password": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Contraseña actualizada exitosamente"
}
```

## Serializers

### LoginSerializer

Valida credenciales de login.

**Campos:**
- `email`: EmailField, requerido
- `password`: CharField, requerido, write_only

### RegisterSerializer

Valida datos de registro de usuario.

**Campos:**
- `email`: EmailField, requerido, único
- `username`: CharField, requerido, único
- `password`: CharField, requerido, validación de complejidad
- `password_confirm`: CharField, requerido, debe coincidir con password
- `first_name`: CharField, requerido
- `last_name`: CharField, requerido
- `role`: ChoiceField, requerido
- `phone`: CharField, opcional
- `company`: CharField, opcional

**Validaciones personalizadas:**
```python
def validate(self, attrs):
    if attrs['password'] != attrs['password_confirm']:
        raise ValidationError("Las contraseñas no coinciden")
    return attrs

def validate_password(self, value):
    validate_password(value)  # Django password validators
    return value
```

### UserSerializer

Serializa datos del usuario para respuestas.

**Campos:**
- `id`: UUIDField, read_only
- `email`: EmailField
- `username`: CharField
- `first_name`: CharField
- `last_name`: CharField
- `full_name`: SerializerMethodField
- `role`: ChoiceField
- `phone`: CharField
- `company`: CharField
- `is_verified`: BooleanField
- `created_at`: DateTimeField, read_only

## Seguridad

### JWT Configuration

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### Rate Limiting

Implementado para prevenir ataques de fuerza bruta:

```python
LOGIN_RATE_LIMIT = {
    'ip': '5/hour',      # 5 intentos por hora por IP
    'user': '10/hour',   # 10 intentos por hora por usuario
}

REGISTRATION_RATE_LIMIT = {
    'ip': '3/hour',      # 3 registros por hora por IP
}
```

### Password Validation

Reglas de contraseña:
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- No puede ser similar al username o email
- No puede ser una contraseña común

### Account Lockout

Después de 5 intentos fallidos:
- Cuenta bloqueada por 30 minutos
- Email de notificación al usuario
- Log de intento de acceso no autorizado

## Logging

Todas las operaciones de autenticación se registran:

```python
logger.info(f"Login successful: {user.email}")
logger.warning(f"Failed login attempt: {email}")
logger.error(f"Authentication error: {str(e)}")
```

Logs incluyen:
- Timestamp
- Tipo de operación
- Usuario afectado
- IP address
- User agent
- Resultado (éxito/fallo)

## Testing

### Unit Tests

```python
# tests/test_authentication.py
class LoginTestCase(TestCase):
    def test_login_success(self):
        """Test login with valid credentials"""
        
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        
    def test_login_rate_limit(self):
        """Test rate limiting on login"""
```

### Integration Tests

```python
class AuthenticationFlowTestCase(TestCase):
    def test_complete_auth_flow(self):
        """Test complete authentication flow"""
        # 1. Register
        # 2. Login
        # 3. Access protected resource
        # 4. Refresh token
        # 5. Logout
```

### Ejecutar Tests

```bash
# Todos los tests de authentication
python manage.py test apps.authentication

# Tests específicos
python manage.py test apps.authentication.tests.test_views.LoginTestCase

# Con coverage
coverage run manage.py test apps.authentication
coverage report
```

## Uso en Frontend

### Login Flow

```typescript
// Ejemplo en TypeScript
async function login(email: string, password: string) {
    const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
        throw new Error('Login failed');
    }
    
    const data = await response.json();
    
    // Guardar tokens
    localStorage.setItem('access_token', data.data.access);
    localStorage.setItem('refresh_token', data.data.refresh);
    
    return data.data.user;
}
```

### Protected Requests

```typescript
async function fetchProtectedResource() {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch('/api/protected-resource/', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    
    if (response.status === 401) {
        // Token expirado, intentar refresh
        await refreshToken();
        // Reintentar request
    }
    
    return response.json();
}
```

### Token Refresh

```typescript
async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    const response = await fetch('/api/auth/token/refresh/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
        // Refresh falló, redirigir a login
        window.location.href = '/login';
        return;
    }
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    
    if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
    }
}
```

## Troubleshooting

### Error: "Token has expired"

**Causa:** El access token ha expirado (60 minutos por defecto).

**Solución:** Usar el refresh token para obtener un nuevo access token.

### Error: "Invalid credentials"

**Causa:** Email o contraseña incorrectos.

**Solución:** Verificar credenciales. Después de 5 intentos fallidos, la cuenta se bloqueará temporalmente.

### Error: "Too many requests"

**Causa:** Se excedió el límite de rate limiting.

**Solución:** Esperar antes de intentar nuevamente. Los límites se resetean cada hora.

### Error: "Email already registered"

**Causa:** El email ya está en uso por otro usuario.

**Solución:** Usar un email diferente o recuperar la contraseña si olvidó su cuenta.

## Best Practices

### Seguridad

1. **Nunca** almacenar tokens en localStorage en producción - usar httpOnly cookies
2. Siempre usar HTTPS en producción
3. Implementar CSRF protection para cookies
4. Rotar tokens regularmente
5. Implementar account lockout después de intentos fallidos

### Performance

1. Cachear user data después de authentication
2. Usar connection pooling para la base de datos
3. Implementar request throttling
4. Usar async operations cuando sea posible

### Mantenimiento

1. Monitorear intentos de login fallidos
2. Revisar logs de seguridad regularmente
3. Mantener actualizadas las dependencias de seguridad
4. Realizar auditorías de seguridad periódicas

## Referencias

- [Django REST Framework - Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [Simple JWT Documentation](https://django-rest-framework-simplejwt.readthedocs.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
