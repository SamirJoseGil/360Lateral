# 🌐 Documentación de Endpoints del Backend

Esta documentación describe todos los endpoints disponibles en el backend API de Django para la aplicación 360Lateral.

---

## 📋 Información General

- **Base URL:** `http://localhost:8000/api`
- **Autenticación:** JWT (JSON Web Tokens)
- **Formato:** JSON
- **Versionado:** No versionado (por ahora)

---

## 🔐 Autenticación

### Headers Requeridos

Para endpoints autenticados:

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Tokens

- **Access Token:** Válido por 1 hora
- **Refresh Token:** Válido por 7 días (con remember me) o 1 día
- Almacenamiento: Cookies HTTP-only en el frontend

---

## 📚 Índice de Endpoints

### Autenticación
- [POST /api/auth/register/](#post-apiauthregister)
- [POST /api/auth/login/](#post-apiauthlogin)
- [POST /api/auth/logout/](#post-apiauthlogout)
- [POST /api/auth/token/refresh/](#post-apiauthtokenrefresh)
- [GET /api/auth/me/](#get-apiauthme)

### Usuarios
- [GET /api/users/](#get-apiusers)
- [POST /api/users/](#post-apiusers)
- [GET /api/users/{id}/](#get-apiusersid)
- [PUT /api/users/{id}/](#put-apiusersid)
- [DELETE /api/users/{id}/](#delete-apiusersid)
- [GET /api/users/me/](#get-apiusersme)
- [PUT /api/users/me/update/](#put-apiusersmeupdate)

### Lotes
- [GET /api/lotes/](#get-apilotes)
- [POST /api/lotes/](#post-apilotes)
- [GET /api/lotes/{id}/](#get-apilotesid)
- [PUT /api/lotes/{id}/](#put-apilotesid)
- [DELETE /api/lotes/{id}/](#delete-apilotesid)
- [GET /api/lotes/search/](#get-apilotessearch)
- [GET /api/lotes/available/](#get-apilotesavailable)
- [POST /api/lotes/{id}/verify/](#post-apilotesidverify)

### Documentos
- [GET /api/documents/documents/](#get-apidocumentsdocuments)
- [POST /api/documents/documents/](#post-apidocumentsdocuments)
- [GET /api/documents/lote/{id}/](#get-apidocumentsloteid)
- [DELETE /api/documents/documents/{id}/](#delete-apidocumentsdocumentsid)

### POT (Normativa)
- [GET /api/pot/tratamientos/](#get-apipottratamientos)
- [GET /api/pot/lista/](#get-apipotlista)
- [GET /api/pot/detalle/{codigo}/](#get-apipotdetallecodigo)
- [GET /api/pot/normativa/cbml/](#get-apipotnormativacbml)
- [POST /api/pot/aprovechamiento/calcular/](#post-apipotaprovechamientocalcular)

### Favoritos
- [GET /api/lotes/favorites/](#get-apilotesfavorites)
- [POST /api/lotes/favorites/](#post-apilotesfavorites)
- [DELETE /api/lotes/favorites/{id}/](#delete-apilotesfavoritesid)
- [POST /api/lotes/favorites/toggle/](#post-apilotesfavoritestoggle)

### Notificaciones
- [GET /api/notifications/](#get-apinotifications)
- [GET /api/notifications/unread_count/](#get-apinotificationsunread_count)
- [POST /api/notifications/{id}/mark_read/](#post-apinotificationsidmark_read)
- [POST /api/notifications/mark_all_read/](#post-apinotificationsmark_all_read)

### Análisis
- [GET /api/analisis/](#get-apianalisis)
- [POST /api/analisis/](#post-apianalisis)
- [GET /api/analisis/{id}/](#get-apianalisisid)
- [GET /api/analisis/mis_analisis/](#get-apianalisismi_analisis)

---

# 🔐 Autenticación

## POST /api/auth/register/

Registra un nuevo usuario en el sistema.

### Request

```http
POST /api/auth/register/
Content-Type: application/json
```

**Body:**
```json
{
    "email": "user@example.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+57 300 123 4567",
    "role": "owner",
    
    // Campos específicos de developer (opcional)
    "developer_type": "constructora",
    "person_type": "natural",
    "document_type": "CC",
    "document_number": "123456789"
}
```

### Response (201 Created)

```json
{
    "success": true,
    "message": "Usuario registrado exitosamente",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "owner",
        "is_active": true,
        "is_verified": false,
        "created_at": "2025-01-01T00:00:00Z"
    },
    "tokens": {
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token"
    }
}
```

### Errores

- **400 Bad Request:** Validación fallida
- **409 Conflict:** Email ya registrado

---

## POST /api/auth/login/

Autentica un usuario existente.

### Request

```http
POST /api/auth/login/
Content-Type: application/json
```

**Body:**
```json
{
    "email": "user@example.com",
    "password": "SecurePass123"
}
```

### Response (200 OK)

```json
{
    "success": true,
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "owner",
        "is_active": true,
        "is_verified": true
    },
    "tokens": {
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token"
    }
}
```

### Errores

- **401 Unauthorized:** Credenciales inválidas
- **403 Forbidden:** Usuario inactivo o no verificado

---

## POST /api/auth/logout/

Cierra la sesión del usuario e invalida el refresh token.

### Request

```http
POST /api/auth/logout/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "refresh": "jwt_refresh_token"
}
```

### Response (200 OK)

```json
{
    "success": true,
    "message": "Sesión cerrada correctamente"
}
```

---

## POST /api/auth/token/refresh/

Refresca el access token usando el refresh token.

### Request

```http
POST /api/auth/token/refresh/
Content-Type: application/json
```

**Body:**
```json
{
    "refresh": "jwt_refresh_token"
}
```

### Response (200 OK)

```json
{
    "access": "new_jwt_access_token"
}
```

### Errores

- **401 Unauthorized:** Refresh token inválido o expirado

---

## GET /api/auth/me/

Obtiene información completa del usuario autenticado.

### Request

```http
GET /api/auth/me/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "email": "user@example.com",
        "username": "user123",
        "first_name": "John",
        "last_name": "Doe",
        "full_name": "John Doe",
        "phone": "+57 300 123 4567",
        "role": "owner",
        "is_active": true,
        "is_verified": true,
        "created_at": "2025-01-01T00:00:00Z",
        "role_fields": {
            "document_type": "CC",
            "document_number": "123456789",
            "address": "Calle 123"
        }
    }
}
```

---

# 👥 Usuarios

## GET /api/users/

Lista usuarios (solo admin).

### Request

```http
GET /api/users/?page=1&role=owner&search=john
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (int): Número de página
- `page_size` (int): Items por página (default: 20)
- `role` (string): Filtrar por rol
- `is_active` (boolean): Filtrar por estado activo
- `is_verified` (boolean): Filtrar por verificación
- `search` (string): Buscar por nombre/email

### Response (200 OK)

```json
{
    "count": 100,
    "next": "http://api/users/?page=2",
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "owner",
            "is_active": true,
            "is_verified": true,
            "created_at": "2025-01-01T00:00:00Z"
        }
    ]
}
```

---

## POST /api/users/

Crea un nuevo usuario (solo admin).

### Request

```http
POST /api/users/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "developer",
    "is_verified": true
}
```

### Response (201 Created)

```json
{
    "id": "uuid",
    "email": "newuser@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "developer",
    "is_active": true,
    "is_verified": true,
    "created_at": "2025-01-01T00:00:00Z"
}
```

---

## GET /api/users/{id}/

Obtiene detalle de un usuario específico (admin o propio).

### Request

```http
GET /api/users/{uuid}/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "user123",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+57 300 123 4567",
    "role": "owner",
    "is_active": true,
    "is_verified": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z",
    "last_login": "2025-01-02T10:00:00Z",
    "role_fields": {
        // Campos específicos del rol
    }
}
```

---

## PUT /api/users/{id}/

Actualiza un usuario existente (admin o propio).

### Request

```http
PUT /api/users/{uuid}/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "first_name": "John Updated",
    "phone": "+57 300 999 8888",
    "is_active": true
}
```

### Response (200 OK)

```json
{
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John Updated",
    "phone": "+57 300 999 8888",
    // ... resto de campos
}
```

---

## DELETE /api/users/{id}/

Elimina un usuario (solo admin).

### Request

```http
DELETE /api/users/{uuid}/
Authorization: Bearer {access_token}
```

### Response (204 No Content)

---

## PUT /api/users/me/update/

Actualiza el perfil del usuario autenticado.

### Request

```http
PUT /api/users/me/update/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+57 300 123 4567",
    "document_type": "CC",
    "document_number": "987654321"
}
```

### Response (200 OK)

```json
{
    "success": true,
    "message": "Perfil actualizado correctamente",
    "user": {
        // Datos actualizados del usuario
    }
}
```

---

# 🏘️ Lotes

## GET /api/lotes/

Lista lotes del usuario autenticado (owner) o todos (admin).

### Request

```http
GET /api/lotes/?status=active&search=lote&page=1
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (int): Número de página
- `page_size` (int): Items por página (default: 20)
- `status` (string): pending, active, rejected, archived
- `is_verified` (boolean): Filtrar por verificación
- `search` (string): Buscar por nombre/dirección/CBML
- `ordering` (string): created_at, -created_at, area, -area

### Response (200 OK)

```json
{
    "count": 50,
    "next": "http://api/lotes/?page=2",
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "nombre": "Lote Ejemplo",
            "direccion": "Calle 123",
            "ciudad": "Medellín",
            "area": 250,
            "cbml": "12345678901",
            "latitud": 6.244203,
            "longitud": -75.581215,
            "status": "active",
            "is_verified": true,
            "owner": "uuid",
            "owner_name": "John Doe",
            "created_at": "2025-01-01T00:00:00Z"
        }
    ]
}
```

---

## POST /api/lotes/

Crea un nuevo lote.

### Request

```http
POST /api/lotes/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
nombre: Lote Ejemplo
direccion: Calle 123
ciudad: Medellín
area: 250
cbml: 12345678901
latitud: 6.244203
longitud: -75.581215
barrio: Poblado
estrato: 5
valor: 500000000
forma_pago: contado
es_comisionista: true
carta_autorizacion: [File]
```

### Response (201 Created)

```json
{
    "id": "uuid",
    "nombre": "Lote Ejemplo",
    "direccion": "Calle 123",
    "ciudad": "Medellín",
    "area": 250,
    "cbml": "12345678901",
    "status": "pending",
    "is_verified": false,
    "created_at": "2025-01-01T00:00:00Z"
}
```

---

## GET /api/lotes/{id}/

Obtiene detalle de un lote específico.

### Request

```http
GET /api/lotes/{uuid}/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "id": "uuid",
    "nombre": "Lote Ejemplo",
    "direccion": "Calle 123",
    "ciudad": "Medellín",
    "barrio": "Poblado",
    "area": 250,
    "cbml": "12345678901",
    "matricula": "ABC-123",
    "codigo_catastral": "CAT-456",
    "latitud": 6.244203,
    "longitud": -75.581215,
    "estrato": 5,
    "uso_suelo": "Residencial",
    "clasificacion_suelo": "Urbano",
    "tratamiento_pot": "CN1",
    "valor": 500000000,
    "forma_pago": "contado",
    "es_comisionista": false,
    "status": "active",
    "is_verified": true,
    "owner": "uuid",
    "owner_name": "John Doe",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z",
    "verified_at": "2025-01-02T10:00:00Z"
}
```

---

## PUT /api/lotes/{id}/

Actualiza un lote existente (owner o admin).

### Request

```http
PUT /api/lotes/{uuid}/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "nombre": "Lote Actualizado",
    "area": 300,
    "valor": 600000000
}
```

### Response (200 OK)

```json
{
    "id": "uuid",
    "nombre": "Lote Actualizado",
    "area": 300,
    // ... resto de campos actualizados
}
```

---

## DELETE /api/lotes/{id}/

Elimina un lote (owner o admin).

### Request

```http
DELETE /api/lotes/{uuid}/
Authorization: Bearer {access_token}
```

### Response (204 No Content)

---

## GET /api/lotes/search/

Búsqueda avanzada de lotes (developers).

### Request

```http
GET /api/lotes/search/?area_min=100&area_max=500&estrato=5&barrio=Poblado
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `search` (string): Texto general
- `ciudad` (string): Ciudad
- `zona` (string): Zona
- `barrio` (string): Barrio
- `area_min` (float): Área mínima
- `area_max` (float): Área máxima
- `precio_min` (float): Precio mínimo
- `precio_max` (float): Precio máximo
- `tratamiento` (string): Tratamiento POT
- `estrato` (int): Estrato socioeconómico
- `ordering` (string): area, -area, precio, -precio

### Response (200 OK)

```json
{
    "count": 25,
    "results": [
        // Array de lotes
    ]
}
```

---

## GET /api/lotes/available/

Lista lotes verificados y activos (developers).

### Request

```http
GET /api/lotes/available/?page=1
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "count": 30,
    "results": [
        // Solo lotes con status="active" y is_verified=true
    ]
}
```

---

## POST /api/lotes/{id}/verify/

Verifica un lote (solo admin).

### Request

```http
POST /api/lotes/{uuid}/verify/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "success": true,
    "message": "Lote verificado correctamente",
    "lote": {
        "id": "uuid",
        "is_verified": true,
        "status": "active",
        "verified_at": "2025-01-02T10:00:00Z"
    }
}
```

---

# 📄 Documentos

## GET /api/documents/documents/

Lista documentos del usuario autenticado.

### Request

```http
GET /api/documents/documents/?lote={uuid}
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `lote` (uuid): Filtrar por lote
- `document_type` (string): Tipo de documento
- `status` (string): pendiente, aprobado, rechazado

### Response (200 OK)

```json
{
    "count": 10,
    "results": [
        {
            "id": "uuid",
            "document_type": "ctl",
            "title": "CTL Lote 123",
            "description": "Certificado actualizado",
            "file": "http://localhost:8000/media/documentos/ctl_123.pdf",
            "file_url": "http://localhost:8000/media/documentos/ctl_123.pdf",
            "file_name": "ctl_123.pdf",
            "file_size": 1024000,
            "lote": "uuid",
            "uploaded_by": "uuid",
            "status": "pendiente",
            "created_at": "2025-01-01T00:00:00Z"
        }
    ]
}
```

---

## POST /api/documents/documents/

Sube un nuevo documento.

### Request

```http
POST /api/documents/documents/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
archivo: [File]
document_type: ctl
title: CTL Lote 123
description: Certificado actualizado
lote: {uuid}
```

### Response (201 Created)

```json
{
    "id": "uuid",
    "document_type": "ctl",
    "title": "CTL Lote 123",
    "file": "http://localhost:8000/media/documentos/ctl_123.pdf",
    "lote": "uuid",
    "status": "pendiente",
    "created_at": "2025-01-01T00:00:00Z"
}
```

---

## GET /api/documents/lote/{id}/

Obtiene todos los documentos de un lote específico.

### Request

```http
GET /api/documents/lote/{uuid}/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "count": 5,
    "documents": [
        // Array de documentos del lote
    ]
}
```

---

## DELETE /api/documents/documents/{id}/

Elimina un documento (owner o admin).

### Request

```http
DELETE /api/documents/documents/{uuid}/
Authorization: Bearer {access_token}
```

### Response (204 No Content)

---

# 📋 POT (Normativa)

## GET /api/pot/tratamientos/

Lista todos los tratamientos POT con paginación.

### Request

```http
GET /api/pot/tratamientos/?page=1&activo=true
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (int): Número de página
- `page_size` (int): Items por página
- `activo` (boolean): Solo tratamientos activos

### Response (200 OK)

```json
{
    "count": 50,
    "results": [
        {
            "id": 1,
            "codigo": "CN1",
            "nombre": "Consolidación Nivel 1",
            "descripcion": "...",
            "indice_ocupacion": "0.6",
            "indice_construccion": "2.0",
            "altura_maxima": 5,
            "activo": true
        }
    ]
}
```

---

## GET /api/pot/lista/

Lista simple de tratamientos activos (sin paginación).

### Request

```http
GET /api/pot/lista/
```

### Response (200 OK)

```json
{
    "tratamientos": [
        {
            "codigo": "CN1",
            "nombre": "Consolidación Nivel 1"
        }
    ]
}
```

---

## GET /api/pot/detalle/{codigo}/

Obtiene detalle completo de un tratamiento por código.

### Request

```http
GET /api/pot/detalle/CN1/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "id": 1,
    "codigo": "CN1",
    "nombre": "Consolidación Nivel 1",
    "descripcion": "...",
    "indice_ocupacion": "0.6",
    "indice_construccion": "2.0",
    "altura_maxima": 5,
    "retiro_frontal": "3.0",
    "retiro_lateral": "2.0",
    "retiro_posterior": "3.0",
    "frentes_minimos": [
        {
            "tipo_vivienda": "VIS",
            "frente_minimo": 5.0
        }
    ],
    "areas_minimas_lote": [
        {
            "tipo_vivienda": "VIS",
            "area_minima": 35.0
        }
    ],
    "areas_minimas_vivienda": [
        {
            "tipo_vivienda": "VIS",
            "area_minima": 42.0
        }
    ],
    "activo": true
}
```

---

## GET /api/pot/normativa/cbml/

Obtiene normativa POT completa para un CBML.

### Request

```http
GET /api/pot/normativa/cbml/?cbml=12345678901
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `cbml` (string): Código CBML de 11 dígitos

### Response (200 OK)

```json
{
    "cbml": "12345678901",
    "tratamiento_encontrado": "Consolidación Nivel 1",
    "codigo_tratamiento": "CN1",
    "normativa": {
        // Objeto completo del tratamiento
    },
    "datos_mapgis": {
        "area_lote_m2": 250,
        "clasificacion_suelo": "Urbano",
        "aprovechamiento_urbano": {
            "tratamiento": "Consolidación Nivel 1",
            "densidad_habitacional_max": 150,
            "altura_normativa": 5
        }
    }
}
```

### Errores

- **404 Not Found:** CBML no encontrado en MapGIS

---

## POST /api/pot/aprovechamiento/calcular/

Calcula aprovechamiento urbanístico de un lote.

### Request

```http
POST /api/pot/aprovechamiento/calcular/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "codigo_tratamiento": "CN1",
    "area_lote": 250,
    "tipologia": "VIS"
}
```

### Response (200 OK)

```json
{
    "tratamiento": {
        "codigo": "CN1",
        "nombre": "Consolidación Nivel 1",
        "indice_ocupacion": 0.6,
        "indice_construccion": 2.0,
        "altura_maxima": 5
    },
    "calculos": {
        "area_lote": 250,
        "area_ocupada_maxima": 150,
        "area_construible_maxima": 500,
        "tipologia": "VIS"
    }
}
```

---

# ❤️ Favoritos

## GET /api/lotes/favorites/

Lista favoritos del usuario (developer).

### Request

```http
GET /api/lotes/favorites/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "count": 5,
    "results": [
        {
            "id": "uuid",
            "lote": "uuid",
            "lote_details": {
                // Objeto completo del lote
            },
            "notas": "Interesante para proyecto X",
            "created_at": "2025-01-01T00:00:00Z"
        }
    ]
}
```

---

## POST /api/lotes/favorites/

Agrega un lote a favoritos.

### Request

```http
POST /api/lotes/favorites/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "lote": "uuid",
    "notas": "Interesante para proyecto X"
}
```

### Response (201 Created)

```json
{
    "id": "uuid",
    "lote": "uuid",
    "notas": "Interesante para proyecto X",
    "created_at": "2025-01-01T00:00:00Z"
}
```

---

## DELETE /api/lotes/favorites/{id}/

Elimina un favorito.

### Request

```http
DELETE /api/lotes/favorites/{uuid}/
Authorization: Bearer {access_token}
```

### Response (204 No Content)

---

## POST /api/lotes/favorites/toggle/

Agrega o remueve un lote de favoritos.

### Request

```http
POST /api/lotes/favorites/toggle/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "lote_id": "uuid"
}
```

### Response (200 OK)

```json
{
    "is_favorite": true,
    "message": "Lote agregado a favoritos"
}
```

o

```json
{
    "is_favorite": false,
    "message": "Lote removido de favoritos"
}
```

---

# 🔔 Notificaciones

## GET /api/notifications/

Lista notificaciones del usuario.

### Request

```http
GET /api/notifications/?page=1&is_read=false
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (int): Número de página
- `page_size` (int): Items por página
- `is_read` (boolean): Filtrar por leídas/no leídas

### Response (200 OK)

```json
{
    "count": 15,
    "results": [
        {
            "id": "uuid",
            "type": "lote_aprobado",
            "type_display": "Lote Aprobado",
            "title": "Tu lote fue aprobado",
            "message": "El lote 'Lote Ejemplo' ha sido verificado y aprobado",
            "priority": "high",
            "priority_display": "Alta",
            "is_read": false,
            "action_url": "/owner/lote/uuid",
            "created_at": "2025-01-01T00:00:00Z",
            "time_ago": "hace 5 minutos"
        }
    ]
}
```

---

## GET /api/notifications/unread_count/

Obtiene contador de notificaciones no leídas.

### Request

```http
GET /api/notifications/unread_count/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "count": 5
}
```

---

## POST /api/notifications/{id}/mark_read/

Marca una notificación como leída.

### Request

```http
POST /api/notifications/{uuid}/mark_read/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "success": true,
    "message": "Notificación marcada como leída"
}
```

---

## POST /api/notifications/mark_all_read/

Marca todas las notificaciones como leídas.

### Request

```http
POST /api/notifications/mark_all_read/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "success": true,
    "message": "Todas las notificaciones marcadas como leídas",
    "count": 5
}
```

---

# 📊 Análisis

## GET /api/analisis/

Lista todos los análisis (admin).

### Request

```http
GET /api/analisis/?estado=completado
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `estado` (string): pendiente, en_proceso, completado, rechazado
- `tipo_analisis` (string): Tipo de análisis
- `analista` (uuid): Filtrar por analista

### Response (200 OK)

```json
{
    "count": 20,
    "results": [
        {
            "id": "uuid",
            "lote": "uuid",
            "lote_info": {
                "nombre": "Lote Ejemplo",
                "direccion": "Calle 123"
            },
            "tipo_analisis": "maximo_potencial",
            "tipo_analisis_display": "Máximo Potencial",
            "estado": "completado",
            "estado_display": "Completado",
            "incluir_vis": true,
            "created_at": "2025-01-01T00:00:00Z"
        }
    ]
}
```

---

## POST /api/analisis/

Crea una nueva solicitud de análisis.

### Request

```http
POST /api/analisis/
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
    "lote": "uuid",
    "tipo_analisis": "maximo_potencial",
    "incluir_vis": true,
    "comentarios_solicitante": "Requiero análisis para proyecto VIS"
}
```

### Response (201 Created)

```json
{
    "id": "uuid",
    "lote": "uuid",
    "tipo_analisis": "maximo_potencial",
    "estado": "pendiente",
    "incluir_vis": true,
    "created_at": "2025-01-01T00:00:00Z"
}
```

---

## GET /api/analisis/{id}/

Obtiene detalle de un análisis específico.

### Request

```http
GET /api/analisis/{uuid}/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "id": "uuid",
    "lote": "uuid",
    "lote_info": {
        "nombre": "Lote Ejemplo",
        "direccion": "Calle 123",
        "cbml": "12345678901",
        "area": 250
    },
    "tipo_analisis": "maximo_potencial",
    "tipo_analisis_display": "Máximo Potencial",
    "estado": "completado",
    "estado_display": "Completado",
    "incluir_vis": true,
    "comentarios_solicitante": "Requiero análisis para proyecto VIS",
    "observaciones_analista": "Análisis completado sin observaciones",
    "resultados": {
        "respuesta_ia": "# Análisis Urbanístico\n\n...",
        "aprobado_por": "admin@360lateral.com"
    },
    "analista_info": {
        "id": "uuid",
        "full_name": "Analista Uno",
        "email": "analista@360lateral.com"
    },
    "archivo_informe": "http://localhost:8000/media/analisis/informe_uuid.pdf",
    "created_at": "2025-01-01T00:00:00Z",
    "fecha_inicio_proceso": "2025-01-01T10:00:00Z",
    "fecha_completado": "2025-01-02T10:00:00Z",
    "tiempo_procesamiento_display": "1 día",
    "esta_completado": true
}
```

---

## GET /api/analisis/mis_analisis/

Lista análisis del usuario autenticado.

### Request

```http
GET /api/analisis/mis_analisis/
Authorization: Bearer {access_token}
```

### Response (200 OK)

```json
{
    "count": 5,
    "results": [
        // Array de análisis del usuario
    ]
}
```

---

# ⚠️ Códigos de Error Comunes

| Código | Significado | Descripción |
|--------|-------------|-------------|
| **400** | Bad Request | Datos inválidos o incompletos |
| **401** | Unauthorized | Token ausente, inválido o expirado |
| **403** | Forbidden | No tienes permisos para esta acción |
| **404** | Not Found | Recurso no encontrado |
| **409** | Conflict | Conflicto (ej: email ya existe) |
| **422** | Unprocessable Entity | Error de validación semántica |
| **500** | Internal Server Error | Error interno del servidor |

---

## Formato de Error Estándar

```json
{
    "error": "Descripción del error",
    "details": {
        "field": ["Mensaje de error específico"]
    },
    "code": "ERROR_CODE"
}
```

---

# 🔒 Notas de Seguridad

1. **Tokens JWT:** Siempre almacenar en cookies HTTP-only
2. **HTTPS:** Usar en producción para todas las peticiones
3. **Rate Limiting:** El backend implementa límites por IP
4. **CORS:** Solo orígenes permitidos pueden acceder
5. **Validación:** Todos los inputs son validados en el backend
6. **SQL Injection:** Django ORM previene inyección SQL
7. **XSS:** Sanitización automática de datos

---

# 📝 Mejores Prácticas

1. **Siempre incluir el token:** En el header Authorization
2. **Manejar refresh:** Implementar lógica de refresh automático
3. **Timeout:** Configurar timeouts apropiados
4. **Retry Logic:** Reintentar peticiones fallidas (max 3 veces)
5. **Error Handling:** Manejar todos los códigos de error
6. **Logging:** Loguear errores para debugging
7. **Cache:** Cachear respuestas cuando sea apropiado

---

**Última actualización:** Enero 2025  
**Versión del API:** 1.0  
**Framework Backend:** Django 4.x + Django REST Framework
