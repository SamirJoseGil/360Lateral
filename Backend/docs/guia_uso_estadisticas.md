# Guía de Uso: Módulo de Estadísticas

## Introducción

El módulo de Estadísticas de 360Lateral permite registrar, analizar y visualizar eventos y métricas del sistema. Esta guía detalla los pasos para utilizar las diferentes funcionalidades mediante la API REST.

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Registro de Eventos](#registro-de-eventos)
3. [Consulta de Eventos](#consulta-de-eventos)
4. [Resúmenes Diarios](#resúmenes-diarios)
5. [Estadísticas a lo Largo del Tiempo](#estadísticas-a-lo-largo-del-tiempo)
6. [Actividad de Usuario](#actividad-de-usuario)
7. [Dashboard de Administración](#dashboard-de-administración)
8. [Anexos y Referencias](#anexos-y-referencias)

## Requisitos Previos

Para utilizar la API de Estadísticas necesitas:

- Tener una cuenta válida en la plataforma
- Obtener un token de autenticación JWT
- Incluir el token en el encabezado de todas las peticiones:
  ```
  Authorization: Bearer {tu_token_jwt}
  ```

## Registro de Eventos

### Endpoint para Registrar un Evento Estadístico

```
POST /api/stats/events/
Content-Type: application/json
```

### Endpoint Simplificado para Registrar un Evento

```
POST /api/stats/events/record/
Content-Type: application/json
```

### Datos Requeridos

- `type` (texto): Tipo de evento (valores válidos: 'view', 'search', 'action', 'api', 'error', 'other')
- `name` (texto): Nombre descriptivo del evento

### Datos Opcionales

- `value` (objeto JSON): Datos adicionales asociados al evento
- `user_id` (texto/UUID): ID del usuario relacionado (se detecta automáticamente si el usuario está autenticado)
- `session_id` (texto): Identificador de sesión del cliente
- `ip_address` (texto): Dirección IP (se detecta automáticamente si no se proporciona)

### Ejemplo de Solicitud

```bash
curl -X POST \
  -H "Authorization: Bearer {tu_token_jwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "view",
    "name": "lote_detail",
    "value": {
      "lote_id": 5,
      "section": "informacion_general"
    },
    "session_id": "user_session_12345"
  }' \
  "http://api.360lateral.com/api/stats/events/record/"
```

### Respuesta Exitosa (código 201 Created)

```json
{
  "id": 123,
  "type": "view",
  "name": "lote_detail",
  "value": {
    "lote_id": 5,
    "section": "informacion_general"
  },
  "timestamp": "2023-11-16T14:30:25Z",
  "user_id": 1,
  "session_id": "user_session_12345",
  "ip_address": "192.168.1.1"
}
```

## Consulta de Eventos

### Endpoint para Listar Eventos

```
GET /api/stats/events/
```

Los usuarios regulares solo pueden ver eventos registrados por ellos mismos. Los administradores pueden ver todos los eventos.

### Obtener los Tipos de Eventos Disponibles

```
GET /api/stats/events/types/
```

### Obtener los Eventos Más Recientes

```
GET /api/stats/events/recent/
```

### Obtener un Evento Específico

```
GET /api/stats/events/{id}/
```

### Ejemplos de Solicitudes

#### Listar Todos los Eventos

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/stats/events/"
```

#### Filtrar por Tipo de Evento

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/stats/events/?type=view"
```

## Resúmenes Diarios

Los resúmenes diarios agregan métricas para optimizar consultas y visualizaciones.

### Endpoint para Listar Resúmenes Diarios

```
GET /api/stats/summaries/
```

### Obtener el Resumen del Día Actual

```
GET /api/stats/summaries/latest/
```

### Filtrar por Rango de Fechas

```
GET /api/stats/summaries/?start_date=2023-10-01&end_date=2023-10-31
```

### Recalcular Métricas para una Fecha (Solo Administradores)

```
POST /api/stats/summaries/recalculate/
Content-Type: application/json
```

Datos requeridos:
- `date` (texto): Fecha en formato "YYYY-MM-DD"

### Ejemplo de Solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/stats/summaries/latest/"
```

### Respuesta Exitosa (código 200 OK)

```json
{
  "id": 45,
  "date": "2023-11-16",
  "metrics": {
    "total_events": 256,
    "events_by_type": {
      "view": 120,
      "search": 45,
      "action": 80,
      "api": 8,
      "error": 3,
      "other": 0
    },
    "unique_users": 18,
    "unique_sessions": 25,
    "top_events": [
      {
        "name": "lote_detail",
        "count": 45
      },
      {
        "name": "home_page",
        "count": 32
      }
    ]
  },
  "created_at": "2023-11-16T00:05:00Z",
  "updated_at": "2023-11-16T23:55:00Z"
}
```

## Estadísticas a lo Largo del Tiempo

Permite visualizar tendencias de eventos a lo largo del tiempo.

### Endpoint para Estadísticas a lo Largo del Tiempo

```
GET /api/stats/over-time/
```

### Parámetros de Consulta

- `start_date` (opcional): Fecha de inicio en formato "YYYY-MM-DD"
- `end_date` (opcional): Fecha de fin en formato "YYYY-MM-DD"
- `interval` (opcional): Intervalo de agrupación ('day', 'week', 'month'). Por defecto: 'day'
- `type` (opcional): Filtrar por tipo de evento

### Ejemplo de Solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/stats/over-time/?start_date=2023-10-15&end_date=2023-11-15&interval=day&type=view"
```

### Respuesta Exitosa (código 200 OK)

```json
[
  {
    "period": "2023-10-15T00:00:00Z",
    "count": 45
  },
  {
    "period": "2023-10-16T00:00:00Z",
    "count": 52
  },
  {
    "period": "2023-10-17T00:00:00Z",
    "count": 38
  }
]
```

## Actividad de Usuario

Permite consultar la actividad específica de un usuario.

### Endpoint para Actividad del Usuario Actual

```
GET /api/stats/user-activity/
```

### Endpoint para Actividad de un Usuario Específico (Solo Admin o Usuario Mismo)

```
GET /api/stats/user-activity/{user_id}/
```

### Parámetros de Consulta

- `days` (opcional): Número de días a considerar. Por defecto: 30

### Ejemplo de Solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/stats/user-activity/?days=15"
```

### Respuesta Exitosa (código 200 OK)

```json
{
  "total_events": 125,
  "events_by_type": {
    "view": 80,
    "search": 25,
    "action": 18,
    "api": 2,
    "error": 0,
    "other": 0
  },
  "recent_events": [
    {
      "name": "lote_detail",
      "type": "view",
      "timestamp": "2023-11-16T15:30:00Z",
      "value": {
        "lote_id": 8
      }
    },
    {
      "name": "search_lotes",
      "type": "search",
      "timestamp": "2023-11-16T15:25:00Z",
      "value": {
        "query": "zona norte",
        "filters": {
          "estrato": 4
        }
      }
    }
  ],
  "first_activity": {
    "id": 2356,
    "type": "view",
    "name": "login_page",
    "value": {},
    "timestamp": "2023-11-01T08:15:00Z",
    "user_id": 1,
    "session_id": "user_session_12345",
    "ip_address": "192.168.1.1"
  },
  "last_activity": {
    "id": 3201,
    "type": "view",
    "name": "lote_detail",
    "value": {
      "lote_id": 8
    },
    "timestamp": "2023-11-16T15:30:00Z",
    "user_id": 1,
    "session_id": "user_session_12345",
    "ip_address": "192.168.1.1"
  }
}
```

## Dashboard de Administración

Endpoint especializado para obtener datos resumidos para el dashboard administrativo.

### Endpoint para el Dashboard (Solo Administradores)

```
GET /api/stats/dashboard/
```

### Parámetros de Consulta

- `days` (opcional): Número de días a considerar. Por defecto: 30

### Ejemplo de Solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/stats/dashboard/?days=7"
```

### Respuesta Exitosa (código 200 OK)

```json
{
  "total_events": 1560,
  "unique_users": 45,
  "period": "2023-11-10 to 2023-11-16",
  "daily_data": [
    {
      "date": "2023-11-10",
      "metrics": {
        "total_events": 210,
        "events_by_type": {
          "view": 120,
          "search": 45,
          "action": 35,
          "api": 8,
          "error": 2,
          "other": 0
        },
        "unique_users": 18
      }
    },
    {
      "date": "2023-11-11",
      "metrics": {
        "total_events": 195,
        "events_by_type": {
          "view": 115,
          "search": 40,
          "action": 30,
          "api": 7,
          "error": 3,
          "other": 0
        },
        "unique_users": 16
      }
    }
  ]
}
```

## Anexos y Referencias

### Tipos de Eventos Soportados

| Tipo      | Descripción                             | Ejemplos                                 |
|-----------|----------------------------------------|-----------------------------------------|
| view      | Visualización de páginas               | home_page, lote_detail, search_results  |
| search    | Búsquedas realizadas                   | search_lotes, filter_by_estrato         |
| action    | Acciones del usuario                   | create_lote, download_document          |
| api       | Llamadas a la API                      | api_request, external_service_call      |
| error     | Errores registrados                    | form_validation_error, api_error        |
| other     | Otros eventos                          | custom_event, misc                      |

### Recomendaciones de Uso

1. **Consistencia en nombres**: Utiliza nombres consistentes para los eventos para facilitar el análisis.
2. **Estructura de value**: Organiza los datos en el campo `value` de manera coherente para cada tipo de evento.
3. **Session ID**: Si es posible, proporciona un identificador de sesión consistente para seguir la actividad del usuario a través de múltiples eventos.
4. **Filtrado eficiente**: Utiliza los parámetros de filtrado disponibles para optimizar las consultas.

### Ejemplos de Registros de Eventos Comunes

#### Registro de vista de página

```json
{
  "type": "view",
  "name": "lote_detail",
  "value": {
    "lote_id": 5,
    "referrer": "search_results"
  }
}
```

#### Registro de búsqueda

```json
{
  "type": "search",
  "name": "search_lotes",
  "value": {
    "query": "zona residencial",
    "filters": {
      "estrato": 4,
      "area_min": 150
    },
    "results_count": 8
  }
}
```

#### Registro de acción

```json
{
  "type": "action",
  "name": "document_upload",
  "value": {
    "document_id": 25,
    "document_type": "plano",
    "lote_id": 5,
    "file_size": 2500000
  }
}
```

#### Registro de error

```json
{
  "type": "error",
  "name": "form_validation",
  "value": {
    "form": "create_lote",
    "fields": ["area", "cbml"],
    "error_messages": {
      "area": "Valor no numérico",
      "cbml": "Campo requerido"
    }
  }
}
```

---

Para cualquier problema o consulta adicional, contacta al equipo de soporte en: soporte@360lateral.com