# Módulo de Usuarios (Users)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelo User](#modelo-user)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [Servicios (Services)](#servicios-services)
- [Signals](#signals)
- [URLs](#urls)
- [Permisos](#permisos)
- [Roles del Sistema](#roles-del-sistema)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Users** gestiona usuarios del sistema Lateral 360°, soportando múltiples roles con campos específicos según el tipo de usuario.

### Características Principales

- 👥 **Múltiples Roles**: Owner, Developer, Admin
- 📝 **Perfiles Especializados**: Campos específicos para desarrolladores
- 🔐 **Autenticación JWT**: Integración con sistema de autenticación
- ✅ **Verificación de Email**: Sistema de verificación (preparado)
- 📊 **Perfiles Completos**: Información detallada por tipo de usuario

---

## Modelo User

### `User`

Modelo principal extendido de `AbstractUser`.

**Ubicación**: `apps/users/models.py`

#### Campos Base (Todos los usuarios)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `email` | EmailField | Email (único, usado para login) |
| `username` | CharField | Username (único) |
| `first_name` | CharField | Nombre |
| `last_name` | CharField | Apellido |
| `phone` | CharField(20) | Teléfono (opcional) |
| `role` | CharField | Rol: owner, developer, admin |
| `is_verified` | Boolean | Si email está verificado |
| `is_active` | Boolean | Si cuenta está activa |
| `is_staff` | Boolean | Si puede acceder al admin |
| `is_superuser` | Boolean | Si tiene todos los permisos |
| `created_at` | DateTime | Fecha de creación |
| `updated_at` | DateTime | Última actualización |

#### Campos Específicos de Desarrolladores

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `developer_type` | CharField | Tipo: constructora, fondo_inversion, inversionista, otro |
| `person_type` | CharField | Tipo de persona: natural, juridica |
| `legal_name` | CharField(200) | Nombre legal/empresa (para jurídicas) |
| `document_type` | CharField(20) | Tipo de documento: CC, NIT, CE, PASSPORT, TI |
| `document_number` | CharField(50) | Número de documento |
| `ciudades_interes` | JSONField | Lista de ciudades de interés |
| `modelos_pago_preferidos` | JSONField | Modelos de pago preferidos |
| `usos_preferidos` | JSONField | Usos de suelo preferidos |

#### Propiedades Útiles

```python
# Nombre completo
user.full_name  # "Juan Pérez"

# Verificación de roles
user.is_owner      # Boolean
user.is_developer  # Boolean
user.is_admin      # Boolean

# Información de desarrollador
if user.is_developer:
    print(user.legal_name)
    print(user.ciudades_interes)
```

#### Métodos Importantes

```python
# Verificar email
user.verify_email()

# Desactivar usuario
user.deactivate()

# Reactivar usuario
user.activate()

# Cambiar rol
user.change_role('developer')
```

---

## Serializers

### `UserSerializer`

Serializer completo para lectura de usuarios.

**Ubicación**: serializers.py

#### Campos Incluidos

```python
fields = [
    'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
    'phone', 'role', 'role_display',
    'is_verified', 'is_active', 'is_staff',
    'created_at', 'updated_at',
    # Campos de developer (si aplica)
    'developer_type', 'developer_type_display',
    'person_type', 'person_type_display',
    'legal_name', 'document_type', 'document_number',
    'ciudades_interes', 'modelos_pago_preferidos', 'usos_preferidos'
]
```

#### Ejemplo de Respuesta (Developer)

```json
{
  "id": "uuid",
  "email": "developer@lateral360.com",
  "username": "developer",
  "first_name": "Carlos",
  "last_name": "Desarrollador",
  "full_name": "Carlos Desarrollador",
  "phone": "+57 300 123 4567",
  "role": "developer",
  "role_display": "Desarrollador",
  "is_verified": true,
  "is_active": true,
  "developer_type": "constructora",
  "developer_type_display": "Constructora",
  "person_type": "juridica",
  "person_type_display": "Persona Jurídica",
  "legal_name": "Constructora ABC S.A.S.",
  "document_type": "NIT",
  "document_number": "900123456",
  "ciudades_interes": ["Medellín", "Envigado"],
  "modelos_pago_preferidos": ["contado", "financiado"],
  "usos_preferidos": ["residencial", "comercial"],
  "created_at": "2024-01-15T10:00:00Z"
}
```

#### Ejemplo de Respuesta (Owner)

```json
{
  "id": "uuid",
  "email": "owner@lateral360.com",
  "username": "owner",
  "first_name": "Juan",
  "last_name": "Pérez",
  "full_name": "Juan Pérez",
  "phone": "+57 300 987 6543",
  "role": "owner",
  "role_display": "Propietario",
  "is_verified": false,
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### `UserUpdateSerializer`

Serializer para actualizar perfil de usuario.

**Ubicación**: serializers.py

#### Campos Editables

```python
fields = [
    'first_name', 'last_name', 'phone',
    # Para developers
    'legal_name', 'document_number',
    'ciudades_interes', 'modelos_pago_preferidos', 'usos_preferidos'
]
```

#### Campos NO Editables

- `email` (requiere verificación)
- `username` (único e inmutable)
- `role` (solo admin puede cambiar)
- `is_verified`, `is_active` (solo admin)

#### Ejemplo de Request

```json
{
  "first_name": "Carlos",
  "last_name": "Constructor",
  "phone": "+57 300 123 4567",
  "ciudades_interes": ["Medellín", "Envigado", "Itagüí"],
  "usos_preferidos": ["residencial", "comercial", "mixto"]
}
```

---

### `DeveloperProfileSerializer`

Serializer específico para perfil de desarrollador.

**Ubicación**: serializers.py

#### Campos

```python
fields = [
    'developer_type', 'person_type', 'legal_name',
    'document_type', 'document_number',
    'ciudades_interes', 'modelos_pago_preferidos', 'usos_preferidos'
]
```

---

## Vistas (Views)

### `UserViewSet`

ViewSet principal para gestión de usuarios.

**Ubicación**: views.py

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/users/` | Listar usuarios | Admin |
| GET | `/api/users/{id}/` | Detalle de usuario | Admin o mismo usuario |
| PATCH | `/api/users/{id}/` | Actualizar usuario | Admin o mismo usuario |
| DELETE | `/api/users/{id}/` | Desactivar usuario | Admin |
| GET | `/api/users/me/` | Usuario actual | Authenticated |
| PATCH | `/api/users/me/update_profile/` | Actualizar perfil | Authenticated |
| GET | `/api/users/developers/` | Listar developers | Authenticated |
| GET | `/api/users/stats/` | Estadísticas | Admin |

---

#### GET /api/users/ - Listar Usuarios

**Permisos**: Admin

**Query Params**:
- `role`: Filtrar por rol (owner, developer, admin)
- `is_active`: Filtrar por estado (true/false)
- `is_verified`: Filtrar por verificación (true/false)
- `search`: Buscar por email, username, nombre
- `ordering`: Ordenar (-created_at, email, role)

**Ejemplo Request**:

```bash
GET /api/users/?role=developer&is_active=true&ordering=-created_at
Authorization: Bearer {admin_token}
```

**Ejemplo Response**:

```json
{
  "count": 50,
  "next": "http://api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "email": "developer@example.com",
      "full_name": "Carlos Desarrollador",
      "role": "developer",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### GET /api/users/me/ - Usuario Actual

**Permisos**: Authenticated

**Descripción**: Retorna información completa del usuario actual.

**Ejemplo Request**:

```bash
GET /api/users/me/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "user",
  "first_name": "Juan",
  "last_name": "Pérez",
  "full_name": "Juan Pérez",
  "role": "owner",
  "is_verified": true,
  "is_active": true,
  ...
}
```

---

#### PATCH /api/users/me/update_profile/ - Actualizar Perfil

**Permisos**: Authenticated

**Descripción**: Permite al usuario actualizar su propio perfil.

**Request Body**:

```json
{
  "first_name": "Juan Carlos",
  "phone": "+57 300 999 8888",
  "ciudades_interes": ["Medellín", "Bello"]
}
```

**Response Success**:

```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": "uuid",
    "first_name": "Juan Carlos",
    "phone": "+57 300 999 8888",
    ...
  }
}
```

---

#### GET /api/users/developers/ - Listar Desarrolladores

**Permisos**: Authenticated

**Descripción**: Lista todos los desarrolladores activos (útil para owners al asignar acceso a lotes).

**Query Params**:
- `developer_type`: Filtrar por tipo (constructora, fondo_inversion, etc.)
- `person_type`: Filtrar por tipo de persona (natural, juridica)
- `search`: Buscar por nombre, email o empresa

**Response**:

```json
{
  "count": 25,
  "results": [
    {
      "id": "uuid",
      "email": "developer@example.com",
      "full_name": "Carlos Desarrollador",
      "legal_name": "Constructora ABC S.A.S.",
      "developer_type": "constructora",
      "person_type": "juridica"
    }
  ]
}
```

---

#### GET /api/users/stats/ - Estadísticas

**Permisos**: Admin

**Response**:

```json
{
  "total_users": 500,
  "active_users": 450,
  "verified_users": 400,
  "by_role": {
    "owner": 300,
    "developer": 180,
    "admin": 20
  },
  "by_developer_type": {
    "constructora": 80,
    "fondo_inversion": 50,
    "inversionista": 40,
    "otro": 10
  },
  "new_users_last_30_days": 45
}
```

---

## Servicios (Services)

### `UserService`

Servicio con lógica de negocio de usuarios.

**Ubicación**: services.py

#### Métodos

##### `create_user(email, password, role, **kwargs)`

Crea un nuevo usuario.

```python
from apps.users.services import UserService

user = UserService.create_user(
    email='new@example.com',
    password='SecurePass123!',
    role='owner',
    first_name='Juan',
    last_name='Pérez'
)
```

---

##### `update_user_profile(user, data)`

Actualiza perfil de usuario.

```python
updated_user = UserService.update_user_profile(
    user=user,
    data={
        'first_name': 'Nuevo Nombre',
        'phone': '+57 300 111 2222'
    }
)
```

---

##### `get_developers_by_criteria(criteria)`

Obtiene developers que coincidan con criterios.

```python
developers = UserService.get_developers_by_criteria({
    'developer_type': 'constructora',
    'ciudades_interes__contains': 'Medellín'
})
```

---

##### `verify_user_email(user)`

Marca email como verificado.

```python
UserService.verify_user_email(user)
```

---

##### `deactivate_user(user, reason)`

Desactiva un usuario.

```python
UserService.deactivate_user(
    user=user,
    reason='Solicitud del usuario'
)
```

---

## Signals

### `create_user_profile`

Signal que se ejecuta después de crear un usuario.

**Ubicación**: signals.py

**Trigger**: `post_save` en modelo `User`

**Funcionalidad**:
- Si es developer y no tiene perfil completo → enviar email recordatorio
- Log de creación de usuario
- Inicializar campos JSON si están vacíos

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        logger.info(f"✅ Nuevo usuario creado: {instance.email} (role: {instance.role})")
        
        # Inicializar campos JSON para developers
        if instance.is_developer:
            if not instance.ciudades_interes:
                instance.ciudades_interes = []
            if not instance.modelos_pago_preferidos:
                instance.modelos_pago_preferidos = []
            if not instance.usos_preferidos:
                instance.usos_preferidos = []
            instance.save(update_fields=['ciudades_interes', 'modelos_pago_preferidos', 'usos_preferidos'])
```

---

## URLs

**Ubicación**: urls.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'users'

router = DefaultRouter()
router.register(r'', views.UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Endpoints Generados**:
- `GET /api/users/`
- `GET /api/users/{id}/`
- `PATCH /api/users/{id}/`
- `DELETE /api/users/{id}/`
- `GET /api/users/me/`
- `PATCH /api/users/me/update_profile/`
- `GET /api/users/developers/`
- `GET /api/users/stats/`

---

## Permisos

### `IsOwnerOrAdmin`

Permiso para verificar que el usuario sea propietario del recurso o admin.

**Ubicación**: permissions.py

```python
class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permite acceso al owner del objeto o admins
    """
    def has_object_permission(self, request, view, obj):
        # Admins tienen acceso total
        if request.user.is_admin:
            return True
        
        # Verificar ownership
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return obj == request.user
```

### Uso en Vistas

```python
from apps.users.permissions import IsOwnerOrAdmin

class MyView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
```

---

## Roles del Sistema

### Owner (Propietario)

**Descripción**: Propietarios de lotes que quieren venderlos o desarrollarlos.

**Permisos**:
- ✅ Registrar lotes
- ✅ Ver sus propios lotes
- ✅ Subir documentos de sus lotes
- ✅ Solicitar análisis urbanísticos de sus lotes
- ✅ Ver notificaciones
- ✅ Gestionar desarrolladores con acceso a sus lotes
- ❌ Ver lotes de otros propietarios

**Campos Específicos**: Ninguno adicional

---

### Developer (Desarrollador)

**Descripción**: Constructoras, fondos de inversión, inversionistas que buscan lotes.

**Permisos**:
- ✅ Ver lotes activos y verificados
- ✅ Agregar lotes a favoritos
- ✅ Solicitar análisis de cualquier lote
- ✅ Definir criterios de búsqueda
- ✅ Recibir recomendaciones de lotes
- ❌ Registrar lotes propios
- ❌ Ver lotes no verificados

**Campos Específicos**:
- `developer_type`: Tipo de desarrollador
- `person_type`: Natural o jurídica
- `legal_name`: Nombre de empresa (jurídicas)
- `document_type` y `document_number`: Identificación
- `ciudades_interes`: Ciudades donde buscan lotes
- `modelos_pago_preferidos`: Formas de pago preferidas
- `usos_preferidos`: Tipos de uso de suelo de interés

---

### Admin (Administrador)

**Descripción**: Personal de Lateral 360° que gestiona la plataforma.

**Permisos**:
- ✅ Ver todos los lotes
- ✅ Verificar/rechazar lotes
- ✅ Validar/rechazar documentos
- ✅ Generar análisis con IA
- ✅ Aprobar análisis
- ✅ Ver estadísticas completas
- ✅ Gestionar usuarios
- ✅ Acceso al admin de Django

**Campos Específicos**: Ninguno adicional

---

## Ejemplos de Uso

### 1. Obtener Información del Usuario Actual

```bash
GET /api/users/me/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Juan Pérez",
  "role": "owner",
  "is_verified": true
}
```

---

### 2. Actualizar Perfil

```bash
PATCH /api/users/me/update_profile/
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Juan Carlos",
  "phone": "+57 300 999 8888"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "user": {
    "first_name": "Juan Carlos",
    "phone": "+57 300 999 8888",
    ...
  }
}
```

---

### 3. Developer Actualiza Preferencias

```bash
PATCH /api/users/me/update_profile/
Authorization: Bearer {developer_token}
Content-Type: application/json

{
  "ciudades_interes": ["Medellín", "Envigado", "Itagüí"],
  "usos_preferidos": ["residencial", "comercial", "mixto"],
  "modelos_pago_preferidos": ["contado", "financiado"]
}
```

---

### 4. Admin Lista Developers

```bash
GET /api/users/developers/?developer_type=constructora
Authorization: Bearer {admin_token}
```

**Response**:

```json
{
  "count": 15,
  "results": [
    {
      "id": "uuid",
      "email": "constructora@example.com",
      "legal_name": "Constructora ABC S.A.S.",
      "developer_type": "constructora",
      "person_type": "juridica"
    }
  ]
}
```

---

### 5. Admin Ve Estadísticas

```bash
GET /api/users/stats/
Authorization: Bearer {admin_token}
```

**Response**: Ver ejemplo en sección de vistas

---

### 6. Uso desde Código Python

```python
from apps.users.models import User
from apps.users.services import UserService

# Crear developer
developer = UserService.create_user(
    email='new_developer@example.com',
    password='SecurePass123!',
    role='developer',
    first_name='Carlos',
    last_name='Constructor',
    developer_type='constructora',
    person_type='juridica',
    legal_name='Constructora XYZ S.A.S.',
    document_type='NIT',
    document_number='900999999'
)

# Actualizar preferencias
developer.ciudades_interes = ['Medellín', 'Envigado']
developer.usos_preferidos = ['residencial', 'comercial']
developer.save()

# Verificar roles
if developer.is_developer:
    print(f"Developer: {developer.legal_name}")

# Buscar developers
developers = User.objects.filter(
    role='developer',
    is_active=True,
    ciudades_interes__contains='Medellín'
)
```

---

## Admin de Django

### UserAdmin

**Ubicación**: admin.py

#### Características

- **Lista**: email, full_name, role, is_active, is_verified, created_at
- **Filtros**: role, is_active, is_verified, is_staff, created_at
- **Búsqueda**: Por email, username, nombre, apellido
- **Acciones**:
  - Verificar emails seleccionados
  - Activar usuarios
  - Desactivar usuarios
- **Fieldsets**: Agrupados por:
  - Información Personal
  - Información de Developer (si aplica)
  - Permisos y Estado
  - Fechas

---

## Estructura de Carpetas

```
apps/users/
├── __init__.py
├── admin.py              # Admin de Django
├── apps.py              # Configuración de la app
├── models.py            # Modelo User
├── permissions.py       # Permisos personalizados
├── serializers.py       # Serializers
├── services.py          # UserService
├── signals.py           # Signals
├── urls.py              # Rutas
└── views.py             # ViewSet principal
```

---

## Validaciones

### Validación de Email Único

```python
# Al crear usuario
if User.objects.filter(email=email.lower()).exists():
    raise ValidationError('Email ya está registrado')
```

### Validación de Username Único

```python
# Al crear usuario
if User.objects.filter(username=username).exists():
    raise ValidationError('Username ya está en uso')
```

### Validación de Campos de Developer

```python
# Persona jurídica debe tener NIT
if person_type == 'juridica' and document_type != 'NIT':
    raise ValidationError('Personas jurídicas deben usar NIT')

# Persona jurídica debe tener legal_name
if person_type == 'juridica' and not legal_name:
    raise ValidationError('Nombre de empresa es obligatorio para jurídicas')

# Persona natural no puede usar NIT
if person_type == 'natural' and document_type == 'NIT':
    raise ValidationError('Personas naturales no pueden usar NIT')
```

---

## Troubleshooting

### Problema: "Solo puedes actualizar tu propio perfil"

**Causa**: Usuario intenta editar perfil de otro usuario.

**Solución**: Usar endpoint `/api/users/me/update_profile/` para editar propio perfil.

---

### Problema: "Username ya está en uso"

**Causa**: Username duplicado.

**Solución**: El sistema genera username automático si no se proporciona. Si se proporciona manualmente, debe ser único.

---

### Problema: Campos de developer no se guardan

**Causa**: Usuario no tiene role='developer'.

**Solución**: Los campos específicos de developer solo se guardan si `role='developer'`.

---

## Próximas Mejoras

- [ ] **Verificación de Email**: Envío de código por email
- [ ] **2FA**: Autenticación de dos factores
- [ ] **Avatar**: Foto de perfil
- [ ] **Bio**: Campo de biografía
- [ ] **Redes Sociales**: Links a LinkedIn, sitio web
- [ ] **Preferencias**: Configuración de notificaciones
- [ ] **Historial de Actividad**: Log de acciones del usuario

---