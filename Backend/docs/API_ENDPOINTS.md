# 📚 API Endpoints - Lateral 360°

Documentación completa de todos los endpoints del backend.

**Base URL**: `http://localhost:8000/api`

**Autenticación**: La mayoría de endpoints requieren JWT token en el header:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication (`/api/auth/`)

### 1. Login
**Endpoint**: `POST /api/auth/login/`  
**Autenticación**: No requerida  
**Descripción**: Autentica usuario y retorna tokens JWT

**Request Body**:
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response 200 OK**:
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
            "username": "johndoe",
            "first_name": "John",
            "last_name": "Doe",
            "role": "owner",
            "is_verified": true
        }
    }
}
```

**Response 401 Unauthorized**:
```json
{
    "success": false,
    "message": "Credenciales inválidas"
}
```

---

### 2. Register
**Endpoint**: `POST /api/auth/register/`  
**Autenticación**: No requerida  
**Descripción**: Registra un nuevo usuario

**Request Body**:
```json
{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "owner",
    "phone": "+57 300 123 4567",
    "company": "Example Corp"
}
```

**Response 201 Created**:
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
            "username": "newuser",
            "role": "owner"
        }
    }
}
```

---

### 3. Logout
**Endpoint**: `POST /api/auth/logout/`  
**Autenticación**: Requerida  
**Descripción**: Invalida el refresh token

**Request Body**:
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response 200 OK**:
```json
{
    "success": true,
    "message": "Logout exitoso"
}
```

---

### 4. Current User
**Endpoint**: `GET /api/auth/me/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene información del usuario autenticado

**Response 200 OK**:
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
        "company": "Example Corp",
        "is_verified": true
    }
}
```

---

### 5. Change Password
**Endpoint**: `POST /api/auth/change-password/`  
**Autenticación**: Requerida  
**Descripción**: Cambia la contraseña del usuario

**Request Body**:
```json
{
    "current_password": "OldPassword123!",
    "new_password": "NewPassword123!"
}
```

**Response 200 OK**:
```json
{
    "success": true,
    "message": "Contraseña actualizada exitosamente"
}
```

---

### 6. Refresh Token
**Endpoint**: `POST /api/auth/token/refresh/`  
**Autenticación**: No requerida  
**Descripción**: Renueva el access token

**Request Body**:
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response 200 OK**:
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### 7. Verify Token
**Endpoint**: `POST /api/auth/token/verify/`  
**Autenticación**: No requerida  
**Descripción**: Verifica si un token es válido

**Request Body**:
```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response 200 OK**:
```json
{
    "success": true,
    "message": "Token válido"
}
```

---

## 👥 Users (`/api/users/`)

### 1. List Users
**Endpoint**: `GET /api/users/`  
**Autenticación**: Requerida (Admin)  
**Descripción**: Lista todos los usuarios

**Query Parameters**:
- `page` (int): Número de página
- `page_size` (int): Tamaño de página
- `search` (string): Buscar por nombre o email

**Response 200 OK**:
```json
{
    "count": 50,
    "next": "http://localhost:8000/api/users/?page=2",
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

---

### 2. Create User
**Endpoint**: `POST /api/users/`  
**Autenticación**: Requerida (Admin)  
**Descripción**: Crea un nuevo usuario

**Request Body**:
```json
{
    "email": "user@example.com",
    "username": "username",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123!",
    "role": "owner",
    "phone": "+57 300 123 4567"
}
```

**Response 201 Created**:
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "role": "owner"
}
```

---

### 3. User Detail
**Endpoint**: `GET /api/users/{uuid}/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene detalles de un usuario específico

**Response 200 OK**:
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
    "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. Update User
**Endpoint**: `PUT /api/users/{uuid}/`  
**Autenticación**: Requerida  
**Descripción**: Actualiza un usuario

**Request Body**:
```json
{
    "first_name": "John",
    "last_name": "Doe Updated",
    "phone": "+57 300 999 8888",
    "company": "New Company"
}
```

**Response 200 OK**:
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe Updated",
    "phone": "+57 300 999 8888",
    "company": "New Company"
}
```

---

### 5. Current User Profile
**Endpoint**: `GET /api/users/me/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene el perfil del usuario actual

**Response 200 OK**:
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "role": "owner"
}
```

---

## 🏘️ Lotes (`/api/lotes/`)

### 1. List Lotes
**Endpoint**: `GET /api/lotes/`  
**Autenticación**: Requerida  
**Descripción**: Lista lotes del usuario

**Query Parameters**:
- `page` (int): Número de página
- `search` (string): Buscar por CBML, dirección
- `status` (string): Filtrar por estado (active, pending, archived)
- `comuna` (int): Filtrar por comuna
- `ordering` (string): Ordenar (-created_at, area, etc)

**Response 200 OK**:
```json
{
    "count": 25,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "cbml": "01010010010010",
            "matricula": "001-123456",
            "direccion": "Carrera 43A #1-50",
            "area": 500.00,
            "barrio": "El Poblado",
            "comuna": 14,
            "estrato": 6,
            "status": "active",
            "owner": {
                "id": "uuid",
                "email": "owner@example.com",
                "full_name": "John Doe"
            },
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

---

### 2. Create Lote
**Endpoint**: `POST /api/lotes/`  
**Autenticación**: Requerida (Owner/Admin)  
**Descripción**: Crea un nuevo lote

**Request Body**:
```json
{
    "cbml": "01010010010010",
    "matricula": "001-123456",
    "direccion": "Carrera 43A #1-50",
    "area": 500.00,
    "barrio": "El Poblado",
    "comuna": 14,
    "estrato": 6
}
```

**Response 201 Created**:
```json
{
    "id": "uuid",
    "cbml": "01010010010010",
    "matricula": "001-123456",
    "direccion": "Carrera 43A #1-50",
    "area": 500.00,
    "status": "pending",
    "owner": {
        "id": "uuid",
        "email": "owner@example.com"
    }
}
```

---

### 3. Lote Detail
**Endpoint**: `GET /api/lotes/{uuid}/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene detalles completos de un lote

**Response 200 OK**:
```json
{
    "id": "uuid",
    "cbml": "01010010010010",
    "matricula": "001-123456",
    "direccion": "Carrera 43A #1-50",
    "area": 500.00,
    "area_construida": 300.00,
    "frente": 10.00,
    "fondo": 50.00,
    "barrio": "El Poblado",
    "comuna": 14,
    "estrato": 6,
    "status": "active",
    "tratamiento_urbanistico": "Consolidación Nivel 1",
    "uso_suelo": "Residencial",
    "altura_maxima": 30.00,
    "indice_ocupacion": 0.70,
    "indice_construccion": 3.50,
    "avaluo_catastral": 500000000,
    "valor_comercial": 800000000,
    "owner": {
        "id": "uuid",
        "email": "owner@example.com",
        "full_name": "John Doe"
    },
    "ubicacion": {
        "type": "Point",
        "coordinates": [-75.5636, 6.2476]
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. Búsqueda por CBML (Pública)
**Endpoint**: `POST /api/lotes/public/cbml/`  
**Autenticación**: No requerida  
**Descripción**: Busca lote en MapGIS por CBML

**Request Body**:
```json
{
    "cbml": "01010010010010"
}
```

**Response 200 OK**:
```json
{
    "success": true,
    "data": {
        "cbml": "01010010010010",
        "direccion": "Carrera 43A #1-50",
        "area": 500.00,
        "barrio": "El Poblado",
        "comuna": "14",
        "tratamiento": "Consolidación Nivel 1",
        "uso_suelo": "Residencial",
        "geometria": {
            "type": "Polygon",
            "coordinates": [[[-75.5636, 6.2476], ...]]
        }
    }
}
```

---

### 5. Búsqueda por Matrícula (Pública)
**Endpoint**: `POST /api/lotes/public/matricula/`  
**Autenticación**: No requerida  
**Descripción**: Busca lote por matrícula inmobiliaria

**Request Body**:
```json
{
    "matricula": "001-123456"
}
```

**Response 200 OK**:
```json
{
    "success": true,
    "data": {
        "cbml": "01010010010010",
        "matricula": "001-123456",
        "direccion": "Carrera 43A #1-50",
        "area": 500.00
    }
}
```

---

### 6. Búsqueda por Dirección (Pública)
**Endpoint**: `POST /api/lotes/public/direccion/`  
**Autenticación**: No requerida  
**Descripción**: Busca lotes por dirección

**Request Body**:
```json
{
    "direccion": "Carrera 43A"
}
```

**Response 200 OK**:
```json
{
    "success": true,
    "data": {
        "count": 5,
        "results": [
            {
                "cbml": "01010010010010",
                "direccion": "Carrera 43A #1-50",
                "area": 500.00
            },
            {
                "cbml": "01010010010011",
                "direccion": "Carrera 43A #2-30",
                "area": 450.00
            }
        ]
    }
}
```

---

### 7. Análisis Urbanístico
**Endpoint**: `GET /api/lotes/{uuid}/analysis/`  
**Autenticación**: Requerida  
**Descripción**: Genera análisis urbanístico completo

**Response 200 OK**:
```json
{
    "success": true,
    "data": {
        "lote_id": "uuid",
        "cbml": "01010010010010",
        "potencial_constructivo": {
            "area_maxima_construccion": 1750.00,
            "pisos_maximos": 5,
            "area_construible_piso": 350.00,
            "area_vendible_estimada": 1400.00
        },
        "normativa": {
            "tratamiento": "Consolidación Nivel 1",
            "uso_principal": "Residencial",
            "usos_compatibles": ["Comercial", "Institucional"],
            "altura_maxima": 30.00,
            "indice_ocupacion": 0.70,
            "indice_construccion": 3.50,
            "retiros": {
                "frontal": 5.00,
                "lateral": 3.00,
                "posterior": 3.00
            }
        },
        "valoracion": {
            "avaluo_catastral": 500000000,
            "valor_comercial_estimado": 800000000,
            "valor_m2": 1600000,
            "potencial_venta": 2240000000
        }
    }
}
```

---

## 📋 POT (`/api/pot/`)

### 1. List Tratamientos
**Endpoint**: `GET /api/pot/lista/`  
**Autenticación**: Requerida  
**Descripción**: Lista tratamientos urbanísticos disponibles

**Response 200 OK**:
```json
{
    "count": 7,
    "results": [
        {
            "codigo": "CN1",
            "nombre": "Consolidación Nivel 1",
            "descripcion": "...",
            "indice_ocupacion": 0.70,
            "indice_construccion": 3.50,
            "altura_maxima": 30.00
        }
    ]
}
```

---

### 2. Detalle Tratamiento
**Endpoint**: `GET /api/pot/detalle/{codigo}/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene detalles de un tratamiento específico

**Response 200 OK**:
```json
{
    "codigo": "CN1",
    "nombre": "Consolidación Nivel 1",
    "descripcion": "...",
    "indice_ocupacion": 0.70,
    "indice_construccion": 3.50,
    "altura_maxima": 30.00,
    "retiro_frontal": 5.00,
    "retiro_lateral": 3.00,
    "retiro_posterior": 3.00
}
```

---

### 3. Consultar Normativa por CBML
**Endpoint**: `GET /api/pot/normativa/cbml/?cbml=01010010010010`  
**Autenticación**: Requerida  
**Descripción**: Consulta normativa POT para un CBML

**Query Parameters**:
- `cbml` (string, required): Código CBML del lote

**Response 200 OK**:
```json
{
    "cbml": "01010010010010",
    "tratamiento_encontrado": "Consolidación Nivel 1",
    "codigo_tratamiento": "CN1",
    "normativa": {
        "codigo": "CN1",
        "nombre": "Consolidación Nivel 1",
        "indice_ocupacion": 0.70,
        "indice_construccion": 3.50
    }
}
```

---

### 4. Calcular Aprovechamiento
**Endpoint**: `POST /api/pot/aprovechamiento/calcular/`  
**Autenticación**: Requerida  
**Descripción**: Calcula aprovechamiento urbanístico

**Request Body**:
```json
{
    "codigo_tratamiento": "CN1",
    "area_lote": 500,
    "tipologia": "multifamiliar"
}
```

**Response 200 OK**:
```json
{
    "success": true,
    "area_maxima_construccion": 1750.00,
    "area_maxima_ocupacion": 350.00,
    "pisos_maximos": 5
}
```

---

## 📄 Documents (`/api/documents/`)

### 1. List Documents
**Endpoint**: `GET /api/documents/documents/`  
**Autenticación**: Requerida  
**Descripción**: Lista documentos del usuario

**Query Parameters**:
- `document_type` (string): Filtrar por tipo
- `lote` (uuid): Filtrar por lote
- `ordering` (string): Ordenar resultados

**Response 200 OK**:
```json
{
    "count": 10,
    "results": [
        {
            "id": 1,
            "title": "Escritura Lote Poblado",
            "document_type": "escritura",
            "file": "http://localhost:8000/media/documents/escritura.pdf",
            "file_size": 1024000,
            "mime_type": "application/pdf",
            "lote": "uuid",
            "user": "uuid",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

---

### 2. Upload Document
**Endpoint**: `POST /api/documents/documents/upload/`  
**Autenticación**: Requerida  
**Descripción**: Sube un nuevo documento

**Request Body** (multipart/form-data):
```
title: "Escritura Lote Poblado"
document_type: "escritura"
file: [archivo]
lote: "uuid" (opcional)
description: "Descripción del documento" (opcional)
```

**Response 201 Created**:
```json
{
    "id": 1,
    "title": "Escritura Lote Poblado",
    "document_type": "escritura",
    "file": "http://localhost:8000/media/documents/escritura.pdf",
    "file_size": 1024000
}
```

---

### 3. Document Detail
**Endpoint**: `GET /api/documents/documents/{id}/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene detalles de un documento

**Response 200 OK**:
```json
{
    "id": 1,
    "title": "Escritura Lote Poblado",
    "document_type": "escritura",
    "file": "http://localhost:8000/media/documents/escritura.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "description": "Escritura del lote",
    "lote": {
        "id": "uuid",
        "cbml": "01010010010010"
    },
    "user": {
        "id": "uuid",
        "email": "user@example.com"
    },
    "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 4. Download Document
**Endpoint**: `GET /api/documents/documents/{id}/download/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene URL de descarga

**Response 200 OK**:
```json
{
    "download_url": "http://localhost:8000/media/documents/escritura.pdf",
    "file_name": "escritura.pdf",
    "file_size": 1024000,
    "mime_type": "application/pdf"
}
```

---

### 5. Document Types
**Endpoint**: `GET /api/documents/documents/types/`  
**Autenticación**: Requerida  
**Descripción**: Lista tipos de documento disponibles

**Response 200 OK**:
```json
[
    {"value": "escritura", "label": "Escritura Pública"},
    {"value": "cedula_catastral", "label": "Cédula Catastral"},
    {"value": "plano", "label": "Planos Arquitectónicos"},
    {"value": "foto", "label": "Fotografías"},
    {"value": "otro", "label": "Otros"}
]
```

---

## 📊 Stats (`/api/stats/`)

### 1. Record Event
**Endpoint**: `POST /api/stats/events/record/`  
**Autenticación**: Requerida  
**Descripción**: Registra un evento de usuario

**Request Body**:
```json
{
    "type": "view",
    "name": "home_page",
    "value": {
        "page": "/",
        "referrer": "https://google.com"
    }
}
```

**Response 201 Created**:
```json
{
    "success": true,
    "message": "Evento registrado exitosamente",
    "data": {
        "id": "uuid",
        "type": "view",
        "name": "home_page",
        "timestamp": "2024-01-15T10:30:00Z"
    }
}
```

---

### 2. Dashboard Summary
**Endpoint**: `GET /api/stats/dashboard/summary/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene resumen de métricas para dashboard

**Response 200 OK**:
```json
{
    "total_usuarios": {
        "count": 150,
        "label": "Total Usuarios",
        "link": "/users"
    },
    "proyectos_activos": {
        "count": 45,
        "label": "Proyectos Activos",
        "link": "/projects"
    },
    "pendientes_validacion": {
        "count": 12,
        "label": "Pendientes de Validación",
        "link": "/validations"
    },
    "eventos_recientes": {
        "count": 234,
        "label": "Eventos Recientes",
        "link": "/activity"
    }
}
```

---

### 3. User Activity
**Endpoint**: `GET /api/stats/user-activity/{user_id}/`  
**Autenticación**: Requerida  
**Descripción**: Obtiene actividad de un usuario

**Query Parameters**:
- `days` (int): Días hacia atrás (default: 30)

**Response 200 OK**:
```json
{
    "total_events": 150,
    "events_by_type": {
        "view": 80,
        "click": 50,
        "submit": 20
    },
    "recent_events": [
        {
            "id": "uuid",
            "type": "view",
            "name": "lote_detail",
            "timestamp": "2024-01-15T10:30:00Z"
        }
    ],
    "first_activity": {
        "timestamp": "2024-01-01T00:00:00Z"
    },
    "last_activity": {
        "timestamp": "2024-01-15T10:30:00Z"
    }
}
```

---

## 🏥 Health Checks (`/health/`)

### 1. System Health
**Endpoint**: `GET /health/`  
**Autenticación**: No requerida  
**Descripción**: Health check general del sistema

**Response 200 OK**:
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
        "database": "ok",
        "cache": "ok"
    }
}
```

---

### 2. Database Health
**Endpoint**: `GET /health/database/`  
**Autenticación**: No requerida  
**Descripción**: Verifica conexión a base de datos

**Response 200 OK**:
```json
{
    "status": "ok",
    "database": "postgresql",
    "connected": true,
    "version": "PostgreSQL 15.3",
    "response_time_ms": 5.23
}
```

---

### 3. Redis Health
**Endpoint**: `GET /health/redis/`  
**Autenticación**: No requerida  
**Descripción**: Verifica conexión a Redis

**Response 200 OK**:
```json
{
    "status": "ok",
    "cache": "connected",
    "response_time_ms": 2.15
}
```

---

## 📝 Códigos de Estado HTTP

- **200 OK**: Solicitud exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Eliminación exitosa
- **400 Bad Request**: Datos inválidos
- **401 Unauthorized**: Autenticación requerida
- **403 Forbidden**: Sin permisos
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

---

## 🔒 Autenticación

Todos los endpoints protegidos requieren JWT token:

```bash
curl -H "Authorization: Bearer <access_token>" \
     http://localhost:8000/api/lotes/
```

---

## 📦 Paginación

Los endpoints de lista usan paginación:

**Query Parameters**:
- `page`: Número de página (default: 1)
- `page_size`: Tamaño de página (default: 20, max: 100)

**Response**:
```json
{
    "count": 100,
    "next": "http://localhost:8000/api/lotes/?page=2",
    "previous": null,
    "results": [...]
}
```

---

## 🔍 Filtrado y Búsqueda

Muchos endpoints soportan filtrado:

```bash
# Filtrar
GET /api/lotes/?status=active&comuna=14

# Buscar
GET /api/lotes/?search=poblado

# Ordenar
GET /api/lotes/?ordering=-created_at
```

---

## 📚 Documentación Interactiva

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

---

**Última actualización**: Octubre 2024  
**Versión**: 1.0.0
