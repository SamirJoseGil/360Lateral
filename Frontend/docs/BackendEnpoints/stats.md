# Documentación de Endpoints - Módulo Stats

## Resumen General
El módulo `stats` gestiona la recopilación, procesamiento y visualización de estadísticas del sistema Lateral 360°. Incluye métricas de usuarios, eventos, documentos y actividad general.

## Endpoints Principales

### 1. Gestión de Eventos Estadísticos

#### `GET /api/stats/events/`
- **Descripción**: Listar todos los eventos estadísticos
- **Permisos**: Usuarios autenticados (lectura), Admin (escritura)
- **Parámetros de consulta**:
  - `limit`: Número máximo de resultados
  - `offset`: Desplazamiento para paginación
- **Respuesta**:
```json
{
  "count": 150,
  "next": "http://api/stats/events/?limit=20&offset=20",
  "previous": null,
  "results": [
    {
      "id": 1,
      "type": "view",
      "name": "dashboard_visit",
      "value": {"page": "main", "duration": 120},
      "timestamp": "2024-01-15T10:30:00Z",
      "user_id": "uuid-string",
      "session_id": "session123",
      "ip_address": "192.168.1.100"
    }
  ]
}
```

#### `POST /api/stats/events/`
- **Descripción**: Crear un nuevo evento estadístico
- **Permisos**: Admin únicamente
- **Body**:
```json
{
  "type": "view|search|action|api|error|other",
  "name": "nombre_del_evento",
  "value": {"datos": "adicionales"},
  "session_id": "session123"
}
```

#### `POST /api/stats/events/record/`
- **Descripción**: Endpoint simplificado para registrar eventos (uso frontend)
- **Permisos**: Usuario autenticado
- **Body**:
```json
{
  "type": "action",
  "name": "button_click",
  "value": {"button": "save", "context": "user_profile"}
}
```
- **Respuesta**:
```json
{
  "message": "Evento registrado correctamente"
}
```

#### `GET /api/stats/events/types/`
- **Descripción**: Obtener tipos de eventos disponibles
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
[
  {"value": "view", "label": "Vista de página"},
  {"value": "search", "label": "Búsqueda"},
  {"value": "action", "label": "Acción de usuario"},
  {"value": "api", "label": "Llamada a API"},
  {"value": "error", "label": "Error"},
  {"value": "other", "label": "Otro"}
]
```

### 2. Dashboard de Estadísticas

#### `GET /api/stats/dashboard/`
- **Descripción**: Obtener estadísticas generales del dashboard
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `days`: Número de días a considerar (default: 30)
- **Respuesta**:
```json
{
  "users": {
    "total": 156
  },
  "lotes": {
    "total": 89,
    "activos": 67,
    "inactivos": 22
  },
  "documentos": {
    "total": 234,
    "pendientes": 12,
    "aceptados": 200,
    "rechazados": 22
  },
  "actividad_reciente": {
    "recent_events": [...],
    "active_users": 45,
    "activity_by_type": {
      "view": 120,
      "action": 89
    }
  },
  "summary": {
    "total_usuarios": 156,
    "proyectos_activos": 67,
    "pendientes_validacion": 12,
    "eventos_recientes": 89
  }
}
```

#### `GET /api/stats/dashboard/summary/`
- **Descripción**: Obtener resumen para tarjetas del dashboard
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "total_usuarios": {
    "count": 156,
    "label": "Total Usuarios",
    "link": "/users"
  },
  "proyectos_activos": {
    "count": 67,
    "label": "Proyectos Activos", 
    "link": "/projects"
  },
  "pendientes_validacion": {
    "count": 12,
    "label": "Pendientes de Validación",
    "link": "/validations"
  },
  "eventos_recientes": {
    "count": 89,
    "label": "Eventos Recientes",
    "link": "/activity"
  }
}
```

#### `GET /api/stats/dashboard/users/`
- **Descripción**: Estadísticas específicas de usuarios
- **Permisos**: Admin únicamente
- **Respuesta**:
```json
{
  "total": 156
}
```

#### `GET /api/stats/dashboard/lotes/`
- **Descripción**: Estadísticas específicas de lotes
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "total": 89,
  "activos": 67,
  "inactivos": 22
}
```

#### `GET /api/stats/dashboard/documentos/`
- **Descripción**: Estadísticas específicas de documentos
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "total": 234,
  "pendientes": 12,
  "aceptados": 200,
  "rechazados": 22
}
```

#### `GET /api/stats/dashboard/recent-activity/`
- **Descripción**: Actividad reciente en el sistema
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `days`: Días a considerar (default: 7)
- **Respuesta**:
```json
{
  "recent_events": [
    {
      "id": 1,
      "type": "action",
      "name": "user_login",
      "timestamp": "2024-01-15T10:30:00Z",
      "user_id": "uuid-string"
    }
  ],
  "active_users": 45,
  "activity_by_type": {
    "view": 120,
    "action": 89,
    "search": 34
  }
}
```

### 3. Estadísticas de Eventos

#### `GET /api/stats/events/dashboard/`
- **Descripción**: Dashboard específico de eventos
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `days`: Días a considerar (default: 30)
- **Respuesta**:
```json
{
  "total_events": 1247,
  "event_types": [
    {"type": "view", "count": 456},
    {"type": "action", "count": 234}
  ],
  "daily_events": [
    {"date": "2024-01-15", "count": 67},
    {"date": "2024-01-14", "count": 89}
  ],
  "period_days": 30
}
```

#### `GET /api/stats/events/daily/`
- **Descripción**: Eventos diarios agregados
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `days`: Días a considerar (default: 30)
- **Respuesta**:
```json
{
  "daily_counts": [
    {"date": "2024-01-15", "count": 67},
    {"date": "2024-01-14", "count": 89}
  ],
  "total_count": 1247,
  "days_period": 30
}
```

#### `GET /api/stats/events/counts/`
- **Descripción**: Conteos de eventos por tipo
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `days`: Días a considerar (default: 30)
- **Respuesta**:
```json
[
  {"type": "view", "count": 456, "percentage": 36.6},
  {"type": "action", "count": 234, "percentage": 18.8},
  {"type": "search", "count": 123, "percentage": 9.9}
]
```

#### `GET /api/stats/events/types/`
- **Descripción**: Distribución de eventos por tipo
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `days`: Días a considerar (default: 30)
- **Respuesta**:
```json
{
  "total": 1247,
  "distribution": [
    {"type": "view", "count": 456, "percentage": 36.6},
    {"type": "action", "count": 234, "percentage": 18.8}
  ]
}
```

### 4. Gráficos y Visualizaciones

#### `GET /api/stats/charts/`
- **Descripción**: Obtener todos los datos de gráficos
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "lotes_summary": {
    "total": 89,
    "activos": 67,
    "inactivos": 22
  },
  "documents_count": 234,
  "documents_by_month": [
    {"mes": "Ene", "count": 23, "valor": 23},
    {"mes": "Feb", "count": 34, "valor": 34}
  ],
  "event_distribution": [
    {"type": "Vistas", "count": 456, "percentage": 36.6}
  ]
}
```

#### `GET /api/stats/charts/lotes-summary/`
- **Descripción**: Resumen de lotes para gráficos
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "total": 89,
  "activos": 67,
  "inactivos": 22
}
```

#### `GET /api/stats/charts/documents-count/`
- **Descripción**: Conteo total de documentos
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "count": 234
}
```

#### `GET /api/stats/charts/documents-by-month/`
- **Descripción**: Documentos procesados por mes
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `year`: Año específico (default: año actual)
- **Respuesta**:
```json
[
  {"mes": "Ene", "count": 23, "valor": 23},
  {"mes": "Feb", "count": 34, "valor": 34},
  {"mes": "Mar", "count": 28, "valor": 28}
]
```

### 5. Endpoints de Utilidad

#### `GET /api/stats/over-time/`
- **Descripción**: Estadísticas agregadas a lo largo del tiempo
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `start_date`: Fecha inicio (YYYY-MM-DD)
  - `end_date`: Fecha fin (YYYY-MM-DD)
  - `interval`: Intervalo (day, week, month)
  - `type`: Filtrar por tipo de evento
- **Respuesta**:
```json
[
  {"period": "2024-01-15T00:00:00Z", "count": 67},
  {"period": "2024-01-16T00:00:00Z", "count": 89}
]
```

#### `GET /api/stats/user-activity/`
- **Descripción**: Actividad del usuario autenticado
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `days`: Días a considerar (default: 30)
- **Respuesta**:
```json
{
  "total_events": 45,
  "events_by_type": {
    "view": 23,
    "action": 12,
    "search": 10
  },
  "recent_events": [...],
  "first_activity": {...},
  "last_activity": {...}
}
```

#### `GET /api/stats/user-activity/{user_id}/`
- **Descripción**: Actividad de un usuario específico
- **Permisos**: Usuario autenticado (propio perfil) o Admin
- **Parámetros de consulta**:
  - `days`: Días a considerar (default: 30)

## Tipos de Eventos Disponibles

| Tipo | Descripción | Ejemplo de Uso |
|------|-------------|----------------|
| `view` | Vista de página | Visita al dashboard, ver perfil |
| `search` | Búsqueda | Buscar lotes, filtrar documentos |
| `action` | Acción de usuario | Crear lote, subir documento |
| `api` | Llamada a API | Requests externos, webhooks |
| `error` | Error del sistema | Errores 500, fallos de validación |
| `other` | Otros eventos | Eventos personalizados |

## Características Técnicas

### Caching
- Dashboard general: 5 minutos
- Resumen de tarjetas: 2 minutos  
- Estadísticas de usuarios: 10 minutos
- Gráficos: 5 minutos

### Backup System
- Los eventos se guardan en archivo de respaldo si falla la BD
- Recuperación automática cuando se restaura la conexión
- Logs detallados para auditoría

### Performance
- Índices optimizados en campos frecuentemente consultados
- Queries eficientes con agregaciones en BD
- Resúmenes diarios pre-calculados para consultas rápidas

### Permisos
- **Lectura**: Usuarios autenticados pueden ver estadísticas generales
- **Escritura**: Solo admins pueden crear eventos directamente
- **Registro simplificado**: Todos los usuarios autenticados pueden usar `/events/record/`
- **Estadísticas de usuarios**: Solo admins pueden ver estadísticas de otros usuarios

## Códigos de Estado HTTP

- **200 OK**: Consulta exitosa
- **201 Created**: Evento creado exitosamente
- **400 Bad Request**: Datos inválidos en el request
- **401 Unauthorized**: Usuario no autenticado
- **403 Forbidden**: Sin permisos para la operación
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

## Ejemplos de Uso

### Registrar un evento desde el frontend
```javascript
fetch('/api/stats/events/record/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'action',
    name: 'document_upload',
    value: {
      document_type: 'cedula',
      file_size: 1024576
    }
  })
})
```

### Obtener datos para dashboard
```javascript
const dashboardData = await fetch('/api/stats/dashboard/summary/')
  .then(res => res.json())
```

### Filtrar eventos por fecha
```javascript
const events = await fetch('/api/stats/over-time/?start_date=2024-01-01&end_date=2024-01-31&interval=day')
  .then(res => res.json())
```