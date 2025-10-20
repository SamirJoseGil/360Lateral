# Documentación de Endpoints - Módulo Users

## Resumen General
El módulo `users` gestiona la autenticación, perfiles y solicitudes de usuarios del sistema Lateral 360°.

## Endpoints Principales

### 1. Gestión de Usuarios

#### `GET /api/users/`
- **Descripción**: Listar usuarios (solo admin)
- **Permisos**: Admin únicamente
- **Parámetros**: Ninguno
- **Respuesta**:
```json
[
  {
    "id": "uuid",
    "email": "usuario@email.com",
    "username": "usuario123",
    "first_name": "Nombre",
    "last_name": "Apellido",
    "full_name": "Nombre Apellido",
    "phone": "+57123456789",
    "company": "Empresa Ejemplo",
    "role": "owner|admin|developer",
    "is_verified": true,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### `POST /api/users/`
- **Descripción**: Crear nuevo usuario (solo admin)
- **Permisos**: Admin únicamente
- **Body**:
```json
{
  "email": "nuevo@email.com",
  "username": "nuevouser",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "phone": "+57123456789",
  "company": "Empresa",
  "role": "owner|admin|developer"
}
```

#### `GET /api/users/<id>/`
- **Descripción**: Obtener detalles de un usuario específico
- **Permisos**: Admin o usuario propietario
- **Respuesta**: Igual que GET /api/users/ pero un solo objeto

#### `PUT /api/users/<id>/`
- **Descripción**: Actualizar usuario
- **Permisos**: Admin o usuario propietario
- **Body**: Campos a actualizar del usuario

#### `DELETE /api/users/<id>/`
- **Descripción**: Eliminar usuario
- **Permisos**: Solo admin
- **Respuesta**: 204 No Content

#### `GET /api/users/me/`
- **Descripción**: Obtener datos del usuario autenticado
- **Permisos**: Usuario autenticado
- **Respuesta**: 
```json
{
  "id": "uuid",
  "email": "usuario@email.com",
  "username": "usuario123",
  "first_name": "Nombre",
  "last_name": "Apellido", 
  "full_name": "Nombre Apellido",
  "phone": "+57123456789",
  "company": "Empresa",
  "role": "owner",
  "is_verified": true,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "role_fields": {
    // Campos específicos según el rol
    // Para owner:
    "document_type": "CC",
    "document_number": "12345678",
    "address": "Calle 123 #45-67",
    "id_verification_file": "url_del_archivo",
    "lots_count": 2
    // Para developer:
    // "company_name": "Empresa Dev",
    // "company_nit": "123456789",
    // "position": "Arquitecto",
    // "experience_years": 5,
    // "portfolio_url": "https://portfolio.com",
    // "focus_area": "residential"
    // Para admin:
    // "department": "normativa",
    // "permissions_scope": "limited"
  }
}
```

#### `PUT/PATCH /api/users/me/update/`
- **Descripción**: Actualizar perfil del usuario autenticado
- **Permisos**: Usuario autenticado
- **Body** (campos permitidos según rol):

**Para Owner (owner):**
```json
{
  "first_name": "Nuevo Nombre",
  "last_name": "Nuevo Apellido",
  "phone": "+57987654321",
  "company": "Nueva Empresa",
  "document_type": "CC",
  "document_number": "87654321",
  "address": "Nueva dirección",
  "id_verification_file": "archivo_cedula.pdf"
}
```

**Para Developer (developer):**
```json
{
  "first_name": "Nuevo Nombre", 
  "last_name": "Nuevo Apellido",
  "phone": "+57987654321",
  "company": "Empresa Personal",
  "company_name": "Constructora XYZ",
  "company_nit": "987654321",
  "position": "Gerente de Proyectos",
  "experience_years": 8,
  "portfolio_url": "https://miportfolio.com",
  "focus_area": "commercial"
}
```

**Para Admin (admin):**
```json
{
  "first_name": "Nuevo Nombre",
  "last_name": "Nuevo Apellido", 
  "phone": "+57987654321",
  "company": "Lateral 360",
  "department": "soporte_tecnico",
  "permissions_scope": "full"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Perfil actualizado correctamente",
  "user": {
    // Datos completos del usuario actualizado
  }
}
```

### 2. Solicitudes de Usuario (UserRequests)

#### `GET /api/users/requests/`
- **Descripción**: Listar solicitudes del usuario
- **Permisos**: Usuario autenticado (ve solo las suyas, admin ve todas)
- **Parámetros de consulta**:
  - `type`: Filtrar por tipo (access, feature, support, developer, project, other)
  - `status`: Filtrar por estado (pending, in_review, approved, rejected, completed)
  - `search`: Buscar en título y descripción
- **Respuesta**:
```json
[
  {
    "id": 1,
    "user": "uuid",
    "user_name": "usuario123",
    "request_type": "access",
    "request_type_display": "Access Request",
    "title": "Solicitud de acceso",
    "status": "pending",
    "status_display": "Pending",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### `POST /api/users/requests/`
- **Descripción**: Crear nueva solicitud
- **Permisos**: Usuario autenticado
- **Body**:
```json
{
  "request_type": "access|feature|support|developer|project|other",
  "title": "Título de la solicitud",
  "description": "Descripción detallada",
  "reference_id": "opcional",
  "metadata": {}
}
```

#### `GET /api/users/requests/<id>/`
- **Descripción**: Obtener detalles de una solicitud
- **Permisos**: Propietario de la solicitud o admin
- **Respuesta**:
```json
{
  "id": 1,
  "user": "uuid",
  "user_name": "usuario123",
  "request_type": "access",
  "request_type_display": "Access Request",
  "title": "Solicitud de acceso",
  "description": "Descripción completa",
  "status": "pending",
  "status_display": "Pending",
  "reference_id": "REF123",
  "metadata": {},
  "reviewer": "uuid",
  "reviewer_name": "admin",
  "review_notes": "Notas del revisor",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### `PUT /api/users/requests/<id>/`
- **Descripción**: Actualizar solicitud
- **Permisos**: Propietario o admin
- **Body**:
```json
{
  "description": "Nueva descripción",
  "metadata": {}
}
```

#### `DELETE /api/users/requests/<id>/`
- **Descripción**: Eliminar solicitud
- **Permisos**: Propietario o admin

### 3. Endpoints Especiales para Solicitudes

#### `GET /api/users/requests/my_requests/`
- **Descripción**: Obtener todas las solicitudes del usuario actual
- **Permisos**: Usuario autenticado
- **Parámetros**: `type`, `status` (opcionales)

#### `GET /api/users/requests/summary/`
- **Descripción**: Resumen de estados de solicitudes del usuario
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "total": 10,
  "pending": 3,
  "approved": 5,
  "rejected": 2,
  "by_type": {
    "access": 4,
    "feature": 3,
    "support": 3
  }
}
```

#### `GET /api/users/requests/recent_updates/`
- **Descripción**: Actualizaciones recientes en solicitudes
- **Permisos**: Usuario autenticado
- **Parámetros**:
  - `days`: Días hacia atrás (default: 30)
  - `limit`: Límite de resultados (default: 10)

## Notas Importantes

### Roles y Permisos
- **admin**: Acceso completo a todos los usuarios y solicitudes
- **owner**: Solo puede ver/editar su perfil y gestionar sus solicitudes
- **developer**: Puede ver usuarios relacionados y gestionar sus solicitudes

### Autenticación
Todos los endpoints requieren autenticación JWT excepto endpoints públicos específicos.

### Filtros y Búsqueda
- Soporte para filtrado por múltiples campos
- Búsqueda de texto en títulos y descripciones
- Ordenamiento por fecha de creación/actualización

### Paginación
Los endpoints de listado incluyen paginación automática con metadatos de página.