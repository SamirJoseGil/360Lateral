# Módulo de Solicitudes (Contact/Support)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelos](#modelos)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [URLs](#urls)
- [Permisos y Validaciones](#permisos-y-validaciones)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Solicitudes** gestiona las peticiones, quejas, reclamos, sugerencias y consultas de los usuarios del sistema Lateral 360°. Permite a los usuarios comunicarse con el equipo de soporte y a los administradores gestionar estas solicitudes de manera organizada.

### Características Principales

- 📨 **Múltiples Tipos**: Consulta, PQR, Soporte técnico, Solicitud de información
- 🎯 **Prioridades**: Baja, Normal, Alta, Urgente
- 🔄 **Estados**: Nueva, En proceso, Respondida, Cerrada
- 📎 **Archivos Adjuntos**: Soporte para imágenes y documentos
- 👤 **Asignación**: Asignar solicitudes a administradores específicos
- 📧 **Notificaciones**: Alertas automáticas al usuario cuando se responde
- 📊 **Seguimiento**: Historial completo de la solicitud

---

## Modelos

### `Solicitud`

Modelo principal para gestión de solicitudes y soporte.

**Ubicación**: `apps/solicitudes/models.py`

#### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | AutoField | ID secuencial |
| `usuario` | FK(User) | Usuario que crea la solicitud |
| `tipo` | CharField | Tipo: consulta, pqr, soporte_tecnico, informacion |
| `asunto` | CharField(200) | Asunto de la solicitud |
| `descripcion` | TextField | Descripción detallada |
| `prioridad` | CharField | Prioridad: baja, normal, alta, urgente |
| `estado` | CharField | Estado: nueva, en_proceso, respondida, cerrada |
| `asignado_a` | FK(User) | Admin asignado (opcional) |
| `respuesta` | TextField | Respuesta del administrador |
| `fecha_respuesta` | DateTime | Cuándo se respondió |
| `archivo_adjunto` | FileField | Archivo opcional |
| `created_at` | DateTime | Fecha de creación |
| `updated_at` | DateTime | Última actualización |
| `metadatos` | JSONField | Información adicional |

#### Tipos de Solicitud

- **consulta**: Consulta General
- **pqr**: Petición, Queja o Reclamo
- **soporte_tecnico**: Soporte Técnico
- **informacion**: Solicitud de Información

#### Estados

- **nueva**: Nueva (recién creada)
- **en_proceso**: En Proceso
- **respondida**: Respondida
- **cerrada**: Cerrada

#### Prioridades

- **baja**: Baja
- **normal**: Normal
- **alta**: Alta
- **urgente**: Urgente

#### Métodos Importantes

```python
# Asignar a un admin
solicitud.asignar(admin_user)

# Responder solicitud
solicitud.responder(
    respuesta='Gracias por contactarnos...',
    admin_user=admin
)

# Cerrar solicitud
solicitud.cerrar()

# Reabrir solicitud
solicitud.reabrir()

# Propiedades útiles
solicitud.esta_nueva       # Boolean
solicitud.esta_en_proceso  # Boolean
solicitud.esta_respondida  # Boolean
solicitud.esta_cerrada     # Boolean
solicitud.tiempo_respuesta # timedelta o None
```

#### Validaciones Automáticas

En el método `clean()`:

```python
def clean(self):
    # Si tiene respuesta, debe tener fecha_respuesta
    if self.respuesta and not self.fecha_respuesta:
        self.fecha_respuesta = timezone.now()
    
    # Si está respondida o cerrada, debe tener respuesta
    if self.estado in ['respondida', 'cerrada'] and not self.respuesta:
        raise ValidationError({
            'respuesta': 'Debe proporcionar una respuesta para cambiar el estado'
        })
```

---

## Serializers

### `SolicitudSerializer`

Serializer completo para lectura de solicitudes.

**Ubicación**: `apps/solicitudes/serializers.py`

#### Campos Incluidos

```python
fields = [
    'id', 'usuario', 'usuario_email', 'usuario_nombre',
    'tipo', 'tipo_display', 'asunto', 'descripcion',
    'prioridad', 'prioridad_display',
    'estado', 'estado_display',
    'asignado_a', 'asignado_a_nombre',
    'respuesta', 'fecha_respuesta',
    'archivo_adjunto', 'archivo_adjunto_url',
    'created_at', 'updated_at',
    'tiempo_respuesta_display',
    'esta_nueva', 'esta_en_proceso', 'esta_respondida', 'esta_cerrada',
    'metadatos'
]
```

#### Ejemplo de Respuesta

```json
{
  "id": 123,
  "usuario": "user-uuid",
  "usuario_email": "user@example.com",
  "usuario_nombre": "Juan Pérez",
  "tipo": "consulta",
  "tipo_display": "Consulta General",
  "asunto": "Consulta sobre lotes en El Poblado",
  "descripcion": "Quisiera saber qué documentos necesito...",
  "prioridad": "normal",
  "prioridad_display": "Normal",
  "estado": "respondida",
  "estado_display": "Respondida",
  "asignado_a": "admin-uuid",
  "asignado_a_nombre": "Admin Soporte",
  "respuesta": "Gracias por contactarnos. Los documentos requeridos son...",
  "fecha_respuesta": "2024-01-15T15:30:00Z",
  "archivo_adjunto": "/media/solicitudes/archivo.pdf",
  "archivo_adjunto_url": "http://localhost:8000/media/solicitudes/archivo.pdf",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T15:30:00Z",
  "tiempo_respuesta_display": "5 horas, 30 minutos",
  "esta_nueva": false,
  "esta_respondida": true
}
```

---

### `SolicitudCreateSerializer`

Serializer para crear solicitudes.

**Ubicación**: `apps/solicitudes/serializers.py`

#### Campos Requeridos

```python
fields = [
    'tipo',           # consulta, pqr, soporte_tecnico, informacion
    'asunto',         # Asunto (max 200 caracteres)
    'descripcion',    # Descripción detallada
    'prioridad',      # baja, normal, alta, urgente (opcional, default: normal)
    'archivo_adjunto' # Archivo opcional
]
```

#### Validaciones

```python
def validate_asunto(self, value):
    if len(value) < 10:
        raise ValidationError('El asunto debe tener al menos 10 caracteres')
    return value

def validate_descripcion(self, value):
    if len(value) < 20:
        raise ValidationError('La descripción debe tener al menos 20 caracteres')
    return value
```

#### Ejemplo de Request

```json
{
  "tipo": "consulta",
  "asunto": "Consulta sobre documentos requeridos",
  "descripcion": "Quisiera saber qué documentos necesito para registrar un lote en la plataforma",
  "prioridad": "normal"
}
```

---

### `SolicitudRespuestaSerializer`

Serializer para responder solicitudes (solo admins).

**Ubicación**: `apps/solicitudes/serializers.py`

#### Campos

```python
respuesta = serializers.CharField(required=True, min_length=10)
cerrar = serializers.BooleanField(default=False)  # Si cerrar después de responder
```

#### Ejemplo de Request

```json
{
  "respuesta": "Gracias por contactarnos. Los documentos requeridos son: CBML, matrícula inmobiliaria y escrituras del lote.",
  "cerrar": false
}
```

---

## Vistas (Views)

### `SolicitudViewSet`

ViewSet principal para operaciones CRUD.

**Ubicación**: `apps/solicitudes/views.py`

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/solicitudes/` | Listar solicitudes | Authenticated |
| POST | `/api/solicitudes/` | Crear solicitud | Authenticated |
| GET | `/api/solicitudes/{id}/` | Detalle de solicitud | Owner o Admin |
| PATCH | `/api/solicitudes/{id}/` | Actualizar solicitud | Admin |
| DELETE | `/api/solicitudes/{id}/` | Eliminar solicitud | Admin |
| GET | `/api/solicitudes/mis_solicitudes/` | Solicitudes del usuario | Authenticated |
| POST | `/api/solicitudes/{id}/responder/` | Responder solicitud | Admin |
| POST | `/api/solicitudes/{id}/asignar/` | Asignar a admin | Admin |
| POST | `/api/solicitudes/{id}/cerrar/` | Cerrar solicitud | Admin |
| POST | `/api/solicitudes/{id}/reabrir/` | Reabrir solicitud | Admin |
| GET | `/api/solicitudes/estadisticas/` | Estadísticas | Admin |

---

#### GET /api/solicitudes/ - Listar Solicitudes

**Permisos**: Authenticated

**Query Params**:
- `tipo`: Filtrar por tipo
- `estado`: Filtrar por estado
- `prioridad`: Filtrar por prioridad
- `asignado_a`: UUID del admin asignado
- `search`: Buscar por asunto o descripción
- `ordering`: Ordenar (-created_at, estado, prioridad)

**Filtrado por Rol**:
- **Admin**: Ve todas las solicitudes
- **Usuario normal**: Solo sus propias solicitudes

**Ejemplo Request**:

```bash
GET /api/solicitudes/?estado=nueva&prioridad=alta&ordering=-created_at
Authorization: Bearer {token}
```

**Ejemplo Response**:

```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 123,
      "tipo": "soporte_tecnico",
      "asunto": "Error al subir documento",
      "estado": "nueva",
      "prioridad": "alta",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/solicitudes/ - Crear Solicitud

**Permisos**: Authenticated

**Content-Type**: multipart/form-data (si incluye archivo)

**Request Body**:

```json
{
  "tipo": "consulta",
  "asunto": "Consulta sobre proceso de verificación",
  "descripcion": "Quisiera saber cuánto tiempo tarda el proceso de verificación de mi lote",
  "prioridad": "normal"
}
```

**Con archivo adjunto** (FormData):

```javascript
const formData = new FormData();
formData.append('tipo', 'soporte_tecnico');
formData.append('asunto', 'Error en la plataforma');
formData.append('descripcion', 'Adjunto captura del error');
formData.append('prioridad', 'alta');
formData.append('archivo_adjunto', fileInput.files[0]);
```

**Response Success (201)**:

```json
{
  "id": 124,
  "usuario": "user-uuid",
  "tipo": "consulta",
  "asunto": "Consulta sobre proceso de verificación",
  "estado": "nueva",
  "prioridad": "normal",
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

**Asignación Automática**: El `usuario` se asigna desde `request.user`

---

#### POST /api/solicitudes/{id}/responder/ - Responder Solicitud

**Permisos**: Admin

**Request Body**:

```json
{
  "respuesta": "Gracias por contactarnos. El proceso de verificación toma entre 24-48 horas hábiles.",
  "cerrar": false
}
```

**Response Success**:

```json
{
  "success": true,
  "message": "Solicitud respondida exitosamente",
  "solicitud": {
    "id": 124,
    "estado": "respondida",
    "respuesta": "Gracias por contactarnos...",
    "fecha_respuesta": "2024-01-15T15:00:00Z",
    ...
  }
}
```

**Qué Hace**:
1. Valida que `respuesta` no esté vacía
2. Guarda respuesta en la solicitud
3. Cambia estado a `respondida`
4. Registra `fecha_respuesta`
5. Si `cerrar=true`, cambia estado a `cerrada`
6. Notifica al usuario (si hay integración con notificaciones)

---

#### POST /api/solicitudes/{id}/asignar/ - Asignar a Admin

**Permisos**: Admin

**Request Body**:

```json
{
  "admin_id": "admin-uuid"
}
```

**Response Success**:

```json
{
  "success": true,
  "message": "Solicitud asignada a Admin Soporte",
  "solicitud": {
    "id": 124,
    "asignado_a": "admin-uuid",
    "asignado_a_nombre": "Admin Soporte",
    "estado": "en_proceso",
    ...
  }
}
```

**Validaciones**:
- El usuario debe ser admin
- El usuario debe estar activo

---

#### POST /api/solicitudes/{id}/cerrar/ - Cerrar Solicitud

**Permisos**: Admin

**Request Body**: Vacío

**Response Success**:

```json
{
  "success": true,
  "message": "Solicitud cerrada exitosamente",
  "solicitud": {
    "id": 124,
    "estado": "cerrada",
    ...
  }
}
```

**Validación**: Solo se pueden cerrar solicitudes respondidas

---

#### POST /api/solicitudes/{id}/reabrir/ - Reabrir Solicitud

**Permisos**: Admin

**Request Body**: Vacío

**Response Success**:

```json
{
  "success": true,
  "message": "Solicitud reabierta exitosamente",
  "solicitud": {
    "id": 124,
    "estado": "en_proceso",
    ...
  }
}
```

---

#### GET /api/solicitudes/mis_solicitudes/ - Mis Solicitudes

**Permisos**: Authenticated

**Descripción**: Retorna solo las solicitudes del usuario actual.

**Response**:

```json
{
  "count": 5,
  "results": [
    {
      "id": 123,
      "tipo": "consulta",
      "asunto": "Consulta sobre documentos",
      "estado": "respondida",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### GET /api/solicitudes/estadisticas/ - Estadísticas

**Permisos**: Admin

**Response**:

```json
{
  "total": 150,
  "por_estado": {
    "nueva": 10,
    "en_proceso": 15,
    "respondida": 100,
    "cerrada": 25
  },
  "por_tipo": {
    "consulta": 80,
    "pqr": 30,
    "soporte_tecnico": 25,
    "informacion": 15
  },
  "por_prioridad": {
    "baja": 50,
    "normal": 70,
    "alta": 25,
    "urgente": 5
  },
  "tiempo_respuesta_promedio": "4 horas, 23 minutos",
  "pendientes_asignacion": 5
}
```

---

## URLs

**Ubicación**: `apps/solicitudes/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'solicitudes'

router = DefaultRouter()
router.register(r'', views.SolicitudViewSet, basename='solicitud')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Endpoints Generados**:
- `GET /api/solicitudes/`
- `POST /api/solicitudes/`
- `GET /api/solicitudes/{id}/`
- `PATCH /api/solicitudes/{id}/`
- `DELETE /api/solicitudes/{id}/`
- `GET /api/solicitudes/mis_solicitudes/`
- `POST /api/solicitudes/{id}/responder/`
- `POST /api/solicitudes/{id}/asignar/`
- `POST /api/solicitudes/{id}/cerrar/`
- `POST /api/solicitudes/{id}/reabrir/`
- `GET /api/solicitudes/estadisticas/`

---

## Permisos y Validaciones

### Permisos por Rol

| Acción | Owner/Developer | Admin |
|--------|-----------------|-------|
| **Crear solicitud** | ✅ | ✅ |
| **Ver solicitudes** | ✅ Solo suyas | ✅ Todas |
| **Ver detalle** | ✅ Solo suyas | ✅ Todas |
| **Responder** | ❌ | ✅ |
| **Asignar** | ❌ | ✅ |
| **Cerrar** | ❌ | ✅ |
| **Reabrir** | ❌ | ✅ |

### Validaciones Automáticas

#### En Serializer

```python
def validate_asunto(self, value):
    if len(value) < 10:
        raise ValidationError('El asunto debe tener al menos 10 caracteres')
    return value

def validate_descripcion(self, value):
    if len(value) < 20:
        raise ValidationError('La descripción debe tener al menos 20 caracteres')
    return value
```

#### En Modelo

```python
def clean(self):
    # Si está respondida o cerrada, debe tener respuesta
    if self.estado in ['respondida', 'cerrada'] and not self.respuesta:
        raise ValidationError({
            'respuesta': 'Debe proporcionar una respuesta para cambiar el estado'
        })
```

---

## Flujo de Trabajo

### Flujo de una Solicitud

Searched codebase for "Perfecto, sigamos con solicitudes #file:solicitudes.md #codebase ", 8 results

Voy a crear la documentación completa del módulo de Solicitudes.

# Módulo de Solicitudes (Contact/Support)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelos](#modelos)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [URLs](#urls)
- [Permisos y Validaciones](#permisos-y-validaciones)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Solicitudes** gestiona las peticiones, quejas, reclamos, sugerencias y consultas de los usuarios del sistema Lateral 360°. Permite a los usuarios comunicarse con el equipo de soporte y a los administradores gestionar estas solicitudes de manera organizada.

### Características Principales

- 📨 **Múltiples Tipos**: Consulta, PQR, Soporte técnico, Solicitud de información
- 🎯 **Prioridades**: Baja, Normal, Alta, Urgente
- 🔄 **Estados**: Nueva, En proceso, Respondida, Cerrada
- 📎 **Archivos Adjuntos**: Soporte para imágenes y documentos
- 👤 **Asignación**: Asignar solicitudes a administradores específicos
- 📧 **Notificaciones**: Alertas automáticas al usuario cuando se responde
- 📊 **Seguimiento**: Historial completo de la solicitud

---

## Modelos

### `Solicitud`

Modelo principal para gestión de solicitudes y soporte.

**Ubicación**: `apps/solicitudes/models.py`

#### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | AutoField | ID secuencial |
| `usuario` | FK(User) | Usuario que crea la solicitud |
| `tipo` | CharField | Tipo: consulta, pqr, soporte_tecnico, informacion |
| `asunto` | CharField(200) | Asunto de la solicitud |
| `descripcion` | TextField | Descripción detallada |
| `prioridad` | CharField | Prioridad: baja, normal, alta, urgente |
| `estado` | CharField | Estado: nueva, en_proceso, respondida, cerrada |
| `asignado_a` | FK(User) | Admin asignado (opcional) |
| `respuesta` | TextField | Respuesta del administrador |
| `fecha_respuesta` | DateTime | Cuándo se respondió |
| `archivo_adjunto` | FileField | Archivo opcional |
| `created_at` | DateTime | Fecha de creación |
| `updated_at` | DateTime | Última actualización |
| `metadatos` | JSONField | Información adicional |

#### Tipos de Solicitud

- **consulta**: Consulta General
- **pqr**: Petición, Queja o Reclamo
- **soporte_tecnico**: Soporte Técnico
- **informacion**: Solicitud de Información

#### Estados

- **nueva**: Nueva (recién creada)
- **en_proceso**: En Proceso
- **respondida**: Respondida
- **cerrada**: Cerrada

#### Prioridades

- **baja**: Baja
- **normal**: Normal
- **alta**: Alta
- **urgente**: Urgente

#### Métodos Importantes

```python
# Asignar a un admin
solicitud.asignar(admin_user)

# Responder solicitud
solicitud.responder(
    respuesta='Gracias por contactarnos...',
    admin_user=admin
)

# Cerrar solicitud
solicitud.cerrar()

# Reabrir solicitud
solicitud.reabrir()

# Propiedades útiles
solicitud.esta_nueva       # Boolean
solicitud.esta_en_proceso  # Boolean
solicitud.esta_respondida  # Boolean
solicitud.esta_cerrada     # Boolean
solicitud.tiempo_respuesta # timedelta o None
```

#### Validaciones Automáticas

En el método `clean()`:

```python
def clean(self):
    # Si tiene respuesta, debe tener fecha_respuesta
    if self.respuesta and not self.fecha_respuesta:
        self.fecha_respuesta = timezone.now()
    
    # Si está respondida o cerrada, debe tener respuesta
    if self.estado in ['respondida', 'cerrada'] and not self.respuesta:
        raise ValidationError({
            'respuesta': 'Debe proporcionar una respuesta para cambiar el estado'
        })
```

---

## Serializers

### `SolicitudSerializer`

Serializer completo para lectura de solicitudes.

**Ubicación**: serializers.py

#### Campos Incluidos

```python
fields = [
    'id', 'usuario', 'usuario_email', 'usuario_nombre',
    'tipo', 'tipo_display', 'asunto', 'descripcion',
    'prioridad', 'prioridad_display',
    'estado', 'estado_display',
    'asignado_a', 'asignado_a_nombre',
    'respuesta', 'fecha_respuesta',
    'archivo_adjunto', 'archivo_adjunto_url',
    'created_at', 'updated_at',
    'tiempo_respuesta_display',
    'esta_nueva', 'esta_en_proceso', 'esta_respondida', 'esta_cerrada',
    'metadatos'
]
```

#### Ejemplo de Respuesta

```json
{
  "id": 123,
  "usuario": "user-uuid",
  "usuario_email": "user@example.com",
  "usuario_nombre": "Juan Pérez",
  "tipo": "consulta",
  "tipo_display": "Consulta General",
  "asunto": "Consulta sobre lotes en El Poblado",
  "descripcion": "Quisiera saber qué documentos necesito...",
  "prioridad": "normal",
  "prioridad_display": "Normal",
  "estado": "respondida",
  "estado_display": "Respondida",
  "asignado_a": "admin-uuid",
  "asignado_a_nombre": "Admin Soporte",
  "respuesta": "Gracias por contactarnos. Los documentos requeridos son...",
  "fecha_respuesta": "2024-01-15T15:30:00Z",
  "archivo_adjunto": "/media/solicitudes/archivo.pdf",
  "archivo_adjunto_url": "http://localhost:8000/media/solicitudes/archivo.pdf",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T15:30:00Z",
  "tiempo_respuesta_display": "5 horas, 30 minutos",
  "esta_nueva": false,
  "esta_respondida": true
}
```

---

### `SolicitudCreateSerializer`

Serializer para crear solicitudes.

**Ubicación**: serializers.py

#### Campos Requeridos

```python
fields = [
    'tipo',           # consulta, pqr, soporte_tecnico, informacion
    'asunto',         # Asunto (max 200 caracteres)
    'descripcion',    # Descripción detallada
    'prioridad',      # baja, normal, alta, urgente (opcional, default: normal)
    'archivo_adjunto' # Archivo opcional
]
```

#### Validaciones

```python
def validate_asunto(self, value):
    if len(value) < 10:
        raise ValidationError('El asunto debe tener al menos 10 caracteres')
    return value

def validate_descripcion(self, value):
    if len(value) < 20:
        raise ValidationError('La descripción debe tener al menos 20 caracteres')
    return value
```

#### Ejemplo de Request

```json
{
  "tipo": "consulta",
  "asunto": "Consulta sobre documentos requeridos",
  "descripcion": "Quisiera saber qué documentos necesito para registrar un lote en la plataforma",
  "prioridad": "normal"
}
```

---

### `SolicitudRespuestaSerializer`

Serializer para responder solicitudes (solo admins).

**Ubicación**: serializers.py

#### Campos

```python
respuesta = serializers.CharField(required=True, min_length=10)
cerrar = serializers.BooleanField(default=False)  # Si cerrar después de responder
```

#### Ejemplo de Request

```json
{
  "respuesta": "Gracias por contactarnos. Los documentos requeridos son: CBML, matrícula inmobiliaria y escrituras del lote.",
  "cerrar": false
}
```

---

## Vistas (Views)

### `SolicitudViewSet`

ViewSet principal para operaciones CRUD.

**Ubicación**: views.py

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/solicitudes/` | Listar solicitudes | Authenticated |
| POST | `/api/solicitudes/` | Crear solicitud | Authenticated |
| GET | `/api/solicitudes/{id}/` | Detalle de solicitud | Owner o Admin |
| PATCH | `/api/solicitudes/{id}/` | Actualizar solicitud | Admin |
| DELETE | `/api/solicitudes/{id}/` | Eliminar solicitud | Admin |
| GET | `/api/solicitudes/mis_solicitudes/` | Solicitudes del usuario | Authenticated |
| POST | `/api/solicitudes/{id}/responder/` | Responder solicitud | Admin |
| POST | `/api/solicitudes/{id}/asignar/` | Asignar a admin | Admin |
| POST | `/api/solicitudes/{id}/cerrar/` | Cerrar solicitud | Admin |
| POST | `/api/solicitudes/{id}/reabrir/` | Reabrir solicitud | Admin |
| GET | `/api/solicitudes/estadisticas/` | Estadísticas | Admin |

---

#### GET /api/solicitudes/ - Listar Solicitudes

**Permisos**: Authenticated

**Query Params**:
- `tipo`: Filtrar por tipo
- `estado`: Filtrar por estado
- `prioridad`: Filtrar por prioridad
- `asignado_a`: UUID del admin asignado
- `search`: Buscar por asunto o descripción
- `ordering`: Ordenar (-created_at, estado, prioridad)

**Filtrado por Rol**:
- **Admin**: Ve todas las solicitudes
- **Usuario normal**: Solo sus propias solicitudes

**Ejemplo Request**:

```bash
GET /api/solicitudes/?estado=nueva&prioridad=alta&ordering=-created_at
Authorization: Bearer {token}
```

**Ejemplo Response**:

```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 123,
      "tipo": "soporte_tecnico",
      "asunto": "Error al subir documento",
      "estado": "nueva",
      "prioridad": "alta",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/solicitudes/ - Crear Solicitud

**Permisos**: Authenticated

**Content-Type**: multipart/form-data (si incluye archivo)

**Request Body**:

```json
{
  "tipo": "consulta",
  "asunto": "Consulta sobre proceso de verificación",
  "descripcion": "Quisiera saber cuánto tiempo tarda el proceso de verificación de mi lote",
  "prioridad": "normal"
}
```

**Con archivo adjunto** (FormData):

```javascript
const formData = new FormData();
formData.append('tipo', 'soporte_tecnico');
formData.append('asunto', 'Error en la plataforma');
formData.append('descripcion', 'Adjunto captura del error');
formData.append('prioridad', 'alta');
formData.append('archivo_adjunto', fileInput.files[0]);
```

**Response Success (201)**:

```json
{
  "id": 124,
  "usuario": "user-uuid",
  "tipo": "consulta",
  "asunto": "Consulta sobre proceso de verificación",
  "estado": "nueva",
  "prioridad": "normal",
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

**Asignación Automática**: El `usuario` se asigna desde `request.user`

---

#### POST /api/solicitudes/{id}/responder/ - Responder Solicitud

**Permisos**: Admin

**Request Body**:

```json
{
  "respuesta": "Gracias por contactarnos. El proceso de verificación toma entre 24-48 horas hábiles.",
  "cerrar": false
}
```

**Response Success**:

```json
{
  "success": true,
  "message": "Solicitud respondida exitosamente",
  "solicitud": {
    "id": 124,
    "estado": "respondida",
    "respuesta": "Gracias por contactarnos...",
    "fecha_respuesta": "2024-01-15T15:00:00Z",
    ...
  }
}
```

**Qué Hace**:
1. Valida que `respuesta` no esté vacía
2. Guarda respuesta en la solicitud
3. Cambia estado a `respondida`
4. Registra `fecha_respuesta`
5. Si `cerrar=true`, cambia estado a `cerrada`
6. Notifica al usuario (si hay integración con notificaciones)

---

#### POST /api/solicitudes/{id}/asignar/ - Asignar a Admin

**Permisos**: Admin

**Request Body**:

```json
{
  "admin_id": "admin-uuid"
}
```

**Response Success**:

```json
{
  "success": true,
  "message": "Solicitud asignada a Admin Soporte",
  "solicitud": {
    "id": 124,
    "asignado_a": "admin-uuid",
    "asignado_a_nombre": "Admin Soporte",
    "estado": "en_proceso",
    ...
  }
}
```

**Validaciones**:
- El usuario debe ser admin
- El usuario debe estar activo

---

#### POST /api/solicitudes/{id}/cerrar/ - Cerrar Solicitud

**Permisos**: Admin

**Request Body**: Vacío

**Response Success**:

```json
{
  "success": true,
  "message": "Solicitud cerrada exitosamente",
  "solicitud": {
    "id": 124,
    "estado": "cerrada",
    ...
  }
}
```

**Validación**: Solo se pueden cerrar solicitudes respondidas

---

#### POST /api/solicitudes/{id}/reabrir/ - Reabrir Solicitud

**Permisos**: Admin

**Request Body**: Vacío

**Response Success**:

```json
{
  "success": true,
  "message": "Solicitud reabierta exitosamente",
  "solicitud": {
    "id": 124,
    "estado": "en_proceso",
    ...
  }
}
```

---

#### GET /api/solicitudes/mis_solicitudes/ - Mis Solicitudes

**Permisos**: Authenticated

**Descripción**: Retorna solo las solicitudes del usuario actual.

**Response**:

```json
{
  "count": 5,
  "results": [
    {
      "id": 123,
      "tipo": "consulta",
      "asunto": "Consulta sobre documentos",
      "estado": "respondida",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### GET /api/solicitudes/estadisticas/ - Estadísticas

**Permisos**: Admin

**Response**:

```json
{
  "total": 150,
  "por_estado": {
    "nueva": 10,
    "en_proceso": 15,
    "respondida": 100,
    "cerrada": 25
  },
  "por_tipo": {
    "consulta": 80,
    "pqr": 30,
    "soporte_tecnico": 25,
    "informacion": 15
  },
  "por_prioridad": {
    "baja": 50,
    "normal": 70,
    "alta": 25,
    "urgente": 5
  },
  "tiempo_respuesta_promedio": "4 horas, 23 minutos",
  "pendientes_asignacion": 5
}
```

---

## URLs

**Ubicación**: urls.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'solicitudes'

router = DefaultRouter()
router.register(r'', views.SolicitudViewSet, basename='solicitud')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Endpoints Generados**:
- `GET /api/solicitudes/`
- `POST /api/solicitudes/`
- `GET /api/solicitudes/{id}/`
- `PATCH /api/solicitudes/{id}/`
- `DELETE /api/solicitudes/{id}/`
- `GET /api/solicitudes/mis_solicitudes/`
- `POST /api/solicitudes/{id}/responder/`
- `POST /api/solicitudes/{id}/asignar/`
- `POST /api/solicitudes/{id}/cerrar/`
- `POST /api/solicitudes/{id}/reabrir/`
- `GET /api/solicitudes/estadisticas/`

---

## Permisos y Validaciones

### Permisos por Rol

| Acción | Owner/Developer | Admin |
|--------|-----------------|-------|
| **Crear solicitud** | ✅ | ✅ |
| **Ver solicitudes** | ✅ Solo suyas | ✅ Todas |
| **Ver detalle** | ✅ Solo suyas | ✅ Todas |
| **Responder** | ❌ | ✅ |
| **Asignar** | ❌ | ✅ |
| **Cerrar** | ❌ | ✅ |
| **Reabrir** | ❌ | ✅ |

### Validaciones Automáticas

#### En Serializer

```python
def validate_asunto(self, value):
    if len(value) < 10:
        raise ValidationError('El asunto debe tener al menos 10 caracteres')
    return value

def validate_descripcion(self, value):
    if len(value) < 20:
        raise ValidationError('La descripción debe tener al menos 20 caracteres')
    return value
```

#### En Modelo

```python
def clean(self):
    # Si está respondida o cerrada, debe tener respuesta
    if self.estado in ['respondida', 'cerrada'] and not self.respuesta:
        raise ValidationError({
            'respuesta': 'Debe proporcionar una respuesta para cambiar el estado'
        })
```

---

## Flujo de Trabajo

### Flujo de una Solicitud

```
┌──────────┐
│  NUEVA   │ ← Usuario crea solicitud
└────┬─────┘
     │
     ├─ Admin asigna ──► ┌──────────────┐
     │                    │  EN_PROCESO  │
     │                    └──────┬───────┘
     │                           │
     │                           ├─ Admin responde
     │                           │
     └───────────────────────────▼
                          ┌──────────────┐
                          │  RESPONDIDA  │
                          └──────┬───────┘
                                 │
                                 ├─ Admin cierra ──► ┌─────────┐
                                 │                    │ CERRADA │
                                 │                    └────┬────┘
                                 │                         │
                                 └─────────────────────────┴─ Admin reabre ──► EN_PROCESO
```

### Descripción de Estados

#### `nueva` (Nueva)

- Estado inicial cuando se crea
- Esperando asignación o respuesta
- Color: Azul

#### `en_proceso` (En Proceso)

- Asignada a un admin
- Siendo trabajada
- Color: Amarillo

#### `respondida` (Respondida)

- Admin ha respondido
- Usuario puede ver la respuesta
- Puede ser cerrada o reabierta
- Color: Verde

#### `cerrada` (Cerrada)

- Solicitud finalizada
- No se pueden hacer más cambios (a menos que se reabra)
- Color: Gris

---

## Ejemplos de Uso

### 1. Usuario Crea Solicitud de Consulta

**Request**:

```bash
POST /api/solicitudes/
Authorization: Bearer {token}
Content-Type: application/json

{
  "tipo": "consulta",
  "asunto": "Consulta sobre verificación de lote",
  "descripcion": "Quisiera saber cuánto tiempo tarda la verificación de mi lote y qué documentos adicionales puedo proporcionar para acelerar el proceso",
  "prioridad": "normal"
}
```

**Response (201)**:

```json
{
  "id": 125,
  "usuario": "user-uuid",
  "tipo": "consulta",
  "tipo_display": "Consulta General",
  "asunto": "Consulta sobre verificación de lote",
  "estado": "nueva",
  "estado_display": "Nueva",
  "prioridad": "normal",
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

---

### 2. Usuario Crea Solicitud con Archivo Adjunto

**JavaScript (FormData)**:

```javascript
const formData = new FormData();
formData.append('tipo', 'soporte_tecnico');
formData.append('asunto', 'Error al subir documento');
formData.append('descripcion', 'Al intentar subir el CTL, aparece un error. Adjunto captura de pantalla del problema.');
formData.append('prioridad', 'alta');
formData.append('archivo_adjunto', screenshotFile);

fetch('http://localhost:8000/api/solicitudes/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log('Solicitud creada:', data));
```

---

### 3. Admin Asigna Solicitud

**Request**:

```bash
POST /api/solicitudes/125/asignar/
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "admin_id": "admin-uuid"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Solicitud asignada a Admin Soporte",
  "solicitud": {
    "id": 125,
    "asignado_a": "admin-uuid",
    "asignado_a_nombre": "Admin Soporte",
    "estado": "en_proceso"
  }
}
```

---

### 4. Admin Responde Solicitud

**Request**:

```bash
POST /api/solicitudes/125/responder/
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "respuesta": "Gracias por contactarnos. El proceso de verificación de lotes toma entre 24-48 horas hábiles. Para acelerar el proceso, asegúrate de tener el CBML y la matrícula inmobiliaria completos. Si tienes estos documentos, puedes adjuntarlos en la sección de documentos del lote.",
  "cerrar": false
}
```

**Response**:

```json
{
  "success": true,
  "message": "Solicitud respondida exitosamente",
  "solicitud": {
    "id": 125,
    "estado": "respondida",
    "respuesta": "Gracias por contactarnos...",
    "fecha_respuesta": "2024-01-15T15:00:00Z",
    "tiempo_respuesta_display": "5 horas"
  }
}
```

---

### 5. Usuario Ve Sus Solicitudes

**Request**:

```bash
GET /api/solicitudes/mis_solicitudes/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "count": 3,
  "results": [
    {
      "id": 125,
      "tipo": "consulta",
      "asunto": "Consulta sobre verificación de lote",
      "estado": "respondida",
      "respuesta": "Gracias por contactarnos...",
      "created_at": "2024-01-15T10:00:00Z",
      "fecha_respuesta": "2024-01-15T15:00:00Z"
    },
    {
      "id": 120,
      "tipo": "soporte_tecnico",
      "asunto": "Error al subir documento",
      "estado": "cerrada",
      "created_at": "2024-01-10T09:00:00Z"
    }
  ]
}
```

---

### 6. Admin Cierra Solicitud

**Request**:

```bash
POST /api/solicitudes/125/cerrar/
Authorization: Bearer {admin_token}
```

**Response**:

```json
{
  "success": true,
  "message": "Solicitud cerrada exitosamente",
  "solicitud": {
    "id": 125,
    "estado": "cerrada"
  }
}
```

---

### 7. Admin Ve Estadísticas

**Request**:

```bash
GET /api/solicitudes/estadisticas/
Authorization: Bearer {admin_token}
```

**Response**: Ver ejemplo en sección de vistas

---

## Admin de Django

### SolicitudAdmin

**Ubicación**: admin.py

#### Características

- **Lista**: ID, usuario, tipo, asunto, estado, prioridad, created_at
- **Filtros**: Por tipo, estado, prioridad, asignado_a, created_at
- **Búsqueda**: Por asunto, descripción, respuesta, usuario email
- **Badges**: Colores según estado y prioridad
- **Actions**: Asignar múltiples, cerrar múltiples, exportar a CSV
- **Inlines**: No aplica
- **Readonly**: id, usuario, created_at, fecha_respuesta

---

## Estructura de Carpetas

```
apps/solicitudes/
├── __init__.py
├── admin.py              # Admin de Django
├── apps.py              # Configuración de la app
├── models.py            # Modelo Solicitud
├── serializers.py       # Serializers
├── urls.py              # Rutas
└── views.py             # ViewSet principal
```

---

## Troubleshooting

### Problema: "El asunto debe tener al menos 10 caracteres"

**Causa**: Asunto muy corto.

**Solución**: Proporcionar un asunto más descriptivo (mínimo 10 caracteres).

---

### Problema: "La descripción debe tener al menos 20 caracteres"

**Causa**: Descripción muy breve.

**Solución**: Proporcionar más detalles en la descripción (mínimo 20 caracteres).

---

### Problema: No puedo cerrar la solicitud

**Causa**: La solicitud no ha sido respondida.

**Solución**: Primero responder la solicitud, luego cerrarla.

---

## Próximas Mejoras

- [ ] **Chat en Tiempo Real**: WebSocket para chat directo con soporte
- [ ] **Categorías**: Sub-categorías para mejor organización
- [ ] **Templates de Respuesta**: Respuestas predefinidas para casos comunes
- [ ] **SLA Tracking**: Seguimiento de tiempos de respuesta comprometidos
- [ ] **Encuestas de Satisfacción**: Rating después de cerrar solicitud
- [ ] **Base de Conocimiento**: FAQs generadas desde solicitudes comunes
- [ ] **Email Integration**: Responder desde email

---

**Última actualización**: 2024-01-15


Made changes.