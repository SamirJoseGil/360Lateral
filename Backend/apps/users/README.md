# Users Module - Lateral 360°

## Descripción

Módulo de gestión de usuarios para la plataforma Lateral 360°. Maneja perfiles de usuario, roles, permisos y solicitudes de usuario.

## Características

- Modelo de usuario personalizado con roles
- Perfiles de usuario con información adicional
- Sistema de solicitudes de usuario
- Gestión de permisos por rol
- Campos específicos según el rol del usuario
- Validación de email único
- Auditoría de acciones de usuario

## Estructura

```
users/
├── __init__.py
├── apps.py              # Configuración de la app
├── models.py            # Modelos User, UserProfile, UserRequest
├── serializers.py       # Serializadores para API
├── views.py             # Vistas de API
├── urls.py              # Rutas de la API
├── permissions.py       # Permisos personalizados
├── services.py          # Lógica de negocio
├── signals.py           # Señales de Django
├── admin.py             # Configuración del admin
└── README.md            # Esta documentación
```

## Modelos

### User

Modelo de usuario personalizado extendiendo AbstractUser.

**Campos Comunes:**
- `id`: UUIDField (Primary Key)
- `email`: EmailField (único)
- `username`: CharField (único)
- `first_name`: CharField
- `last_name`: CharField
- `phone`: CharField (opcional)
- `company`: CharField (opcional)
- `role`: CharField (choices: admin, owner, developer)
- `is_verified`: BooleanField
- `created_at`: DateTimeField
- `updated_at`: DateTimeField

**Campos para Owner:**
- `document_type`: CharField (CC, NIT, CE, PASSPORT, TI)
- `document_number`: CharField
- `address`: TextField
- `id_verification_file`: FileField
- `lots_count`: PositiveIntegerField

**Campos para Developer:**
- `company_name`: CharField
- `company_nit`: CharField
- `position`: CharField
- `experience_years`: PositiveIntegerField
- `portfolio_url`: URLField
- `focus_area`: CharField (residential, commercial, mixed, vis, industrial, other)

**Campos para Admin:**
- `department`: CharField
- `permissions_scope`: CharField (full, limited, readonly, department)

**Métodos:**
```python
def get_full_name(self) -> str:
    """Retorna nombre completo del usuario"""
    
def has_permission(self, permission_name: str) -> bool:
    """Verifica si el usuario tiene un permiso específico"""

@property
def is_admin(self) -> bool:
    """Verifica si el usuario es administrador"""

@property
def is_owner(self) -> bool:
    """Verifica si el usuario es propietario"""

@property
def is_developer(self) -> bool:
    """Verifica si el usuario es desarrollador"""
```

### UserProfile

Perfil adicional para cada usuario.

**Campos:**
- `user`: OneToOneField (User)
- `avatar`: ImageField
- `bio`: TextField
- `website`: URLField
- `linkedin`: URLField
- `location`: CharField
- `email_notifications`: BooleanField
- `sms_notifications`: BooleanField
- `language`: CharField (es, en)
- `timezone`: CharField
- `created_at`: DateTimeField
- `updated_at`: DateTimeField

### UserRequest

Solicitudes realizadas por usuarios.

**Campos:**
- `id`: AutoField (Primary Key)
- `user`: ForeignKey (User)
- `request_type`: CharField (access, feature, support, developer, project, other)
- `title`: CharField
- `description`: TextField
- `status`: CharField (pending, in_review, approved, rejected, completed)
- `reference_id`: CharField (opcional)
- `metadata`: JSONField
- `reviewer`: ForeignKey (User, nullable)
- `review_notes`: TextField (opcional)
- `created_at`: DateTimeField
- `updated_at`: DateTimeField

## API Endpoints

### 1. List/Create Users

Lista todos los usuarios o crea uno nuevo (solo admin).

**Endpoint:** `GET/POST /api/users/`

**GET Response (200 OK):**
```json
{
    "count": 10,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "email": "user@example.com",
            "username": "johndoe",
            "full_name": "John Doe",
            "role": "owner",
            "is_verified": true
        }
    ]
}
```

**POST Request:**
```json
{
    "email": "newuser@example.com",
    "username": "newuser",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "owner",
    "phone": "+57 300 123 4567"
}
```

### 2. User Detail

Obtiene, actualiza o elimina un usuario específico.

**Endpoint:** `GET/PUT/DELETE /api/users/{uuid}/`

**GET Response (200 OK):**
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "+57 300 123 4567",
    "company": "Example Corp",
    "role": "owner",
    "is_verified": true,
    "created_at": "2024-01-01T00:00:00Z",
    "role_fields": {
        "document_type": "CC",
        "document_number": "123456789",
        "address": "Calle 123",
        "lots_count": 5
    }
}
```

### 3. Current User

Obtiene información del usuario autenticado.

**Endpoint:** `GET /api/users/me/`

**Response (200 OK):**
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "role": "owner"
}
```

### 4. Update Profile

Actualiza el perfil del usuario autenticado.

**Endpoint:** `PUT/PATCH /api/users/me/update/`

**Request:**
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+57 300 123 4567",
    "address": "Nueva dirección"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Perfil actualizado correctamente",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "John Doe"
    }
}
```

### 5. User Requests

Gestiona las solicitudes de usuario.

**Endpoints:**
- `GET /api/users/requests/` - Lista todas las solicitudes
- `POST /api/users/requests/` - Crea nueva solicitud
- `GET /api/users/requests/{id}/` - Detalle de solicitud
- `PUT /api/users/requests/{id}/` - Actualiza solicitud
- `GET /api/users/requests/my_requests/` - Solicitudes del usuario actual
- `GET /api/users/requests/summary/` - Resumen de solicitudes

## Servicios

### RequestStatusService

Servicio para gestionar solicitudes de usuario.

**Métodos:**

```python
@staticmethod
def get_user_requests(user, request_type=None, status=None):
    """Obtiene todas las solicitudes de un usuario con filtros opcionales"""

@staticmethod
def get_request_details(request_id, user=None):
    """Obtiene detalles de una solicitud específica"""

@staticmethod
def get_request_status_summary(user):
    """Obtiene resumen de estados de solicitudes"""

@staticmethod
def get_recent_status_updates(user, days=30, limit=10):
    """Obtiene actualizaciones recientes de solicitudes"""
```

## Permisos

### IsOwnerOrAdmin

Permite acceso solo al propietario del objeto o administradores.

```python
class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Admin puede acceder a todo
        if request.user.is_admin:
            return True
        # Usuario puede acceder a su propio perfil
        return obj.user == request.user
```

### CanManageUsers

Permite gestión de usuarios según el rol.

```python
class CanManageUsers(permissions.BasePermission):
    def has_permission(self, request, view):
        # Lectura permitida para todos autenticados
        if request.method in permissions.SAFE_METHODS:
            return True
        # Modificación solo para admin
        return request.user.is_admin
```

## Señales

### create_user_profile

Crea automáticamente un perfil cuando se crea un usuario.

```python
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
```

### save_user_profile

Guarda el perfil cuando se actualiza el usuario.

```python
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
```

## Validaciones

### Email Único

```python
if User.objects.filter(email=email).exists():
    return Response({
        'success': False,
        'error': f'Ya existe un usuario con el email: {email}'
    }, status=400)
```

### Username Único

```python
# Auto-genera username único si es necesario
username = email.split('@')[0]
counter = 1
while User.objects.filter(username=username).exists():
    username = f"{original_username}{counter}"
    counter += 1
```

## Auditoría

### Logging de Acciones

```python
audit_log(
    action='USER_CREATED',
    user=request.user,
    details={'created_user_email': email},
    ip_address=get_client_ip(request)
)
```

### Campos de Auditoría

Todos los modelos incluyen:
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última modificación

## Testing

### Unit Tests

```bash
# Ejecutar todos los tests de users
python manage.py test apps.users

# Tests específicos
python manage.py test apps.users.tests.test_models
python manage.py test apps.users.tests.test_views
python manage.py test apps.users.tests.test_permissions
```

### Ejemplo de Test

```python
class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            role='owner'
        )
    
    def test_user_creation(self):
        """Test creación de usuario"""
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertTrue(self.user.is_owner)
    
    def test_profile_auto_creation(self):
        """Test que el perfil se crea automáticamente"""
        self.assertTrue(hasattr(self.user, 'profile'))
```

## Admin Interface

### Configuración del Admin

El módulo incluye configuración personalizada del admin para:
- Filtros por rol, estado activo, fecha de creación
- Búsqueda por email, nombre, username
- Ordenamiento por fecha de creación
- Campos de solo lectura para auditoría
- Visualización de campos según el rol

## Best Practices

### Seguridad

1. Validar siempre email único antes de crear usuario
2. Usar permisos apropiados para cada endpoint
3. Loggear todas las acciones importantes
4. Verificar permisos a nivel de objeto
5. No exponer información sensible en respuestas API

### Performance

1. Usar `select_related` y `prefetch_related` para optimizar queries
2. Implementar paginación en listas grandes
3. Cachear información de usuario cuando sea apropiado
4. Usar índices en campos frecuentemente consultados

### Mantenimiento

1. Mantener logs de auditoría por al menos 90 días
2. Revisar periódicamente usuarios inactivos
3. Limpiar perfiles sin verificar después de cierto tiempo
4. Monitorear intentos de acceso no autorizado

## Troubleshooting

### Error: "Email already exists"

**Causa:** El email ya está registrado.

**Solución:** Usar un email diferente o recuperar cuenta existente.

### Error: "UUID format invalid"

**Causa:** ID de usuario no es un UUID válido.

**Solución:** Verificar formato del UUID en la request.

### Error: "Permission denied"

**Causa:** Usuario no tiene permisos para la acción.

**Solución:** Verificar rol y permisos del usuario.

## Referencias

- [Django User Model](https://docs.djangoproject.com/en/4.2/ref/contrib/auth/)
- [Django Signals](https://docs.djangoproject.com/en/4.2/topics/signals/)
- [DRF Permissions](https://www.django-rest-framework.org/api-guide/permissions/)
