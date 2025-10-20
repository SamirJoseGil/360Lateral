# Stats Module - Lateral 360°

## Descripción

Módulo de estadísticas y análisis para la plataforma Lateral 360°. Recopila y procesa métricas de uso, eventos de usuario y datos analíticos.

## Características

- Recopilación de eventos de usuario
- Estadísticas de uso de la plataforma
- Métricas de rendimiento
- Reportes personalizados
- Dashboard de analytics

## Estructura

```
stats/
├── __init__.py
├── apps.py              # Configuración de la app
├── models.py            # Modelos de estadísticas
├── serializers.py       # Serializadores para API
├── views.py             # Vistas de API
├── urls.py              # Rutas de la API
├── services.py          # Lógica de negocio
└── README.md            # Esta documentación
```

## Modelos

### Event

Modelo para registrar eventos de usuario.

**Campos:**
- `id`: AutoField (Primary Key)
- `user`: ForeignKey (User, nullable)
- `event_type`: CharField (choices)
- `event_name`: CharField
- `event_data`: JSONField
- `ip_address`: GenericIPAddressField
- `user_agent`: TextField
- `timestamp`: DateTimeField
- `session_id`: CharField

**Tipos de eventos:**
- `view` - Visualización de página
- `click` - Click en elemento
- `submit` - Envío de formulario
- `search` - Búsqueda realizada
- `download` - Descarga de archivo
- `login` - Inicio de sesión
- `logout` - Cierre de sesión
- `error` - Error en la aplicación

## API Endpoints

### 1. Record Event

Registra un nuevo evento.

**Endpoint:** `POST /api/stats/events/`

**Request:**
```json
{
    "event_type": "view",
    "event_name": "home_page",
    "event_data": {
        "page": "/",
        "referrer": "https://google.com"
    }
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "Evento registrado exitosamente"
}
```

### 2. Get Statistics

Obtiene estadísticas agregadas.

**Endpoint:** `GET /api/stats/summary/`

**Query Parameters:**
- `start_date`: Fecha inicio (YYYY-MM-DD)
- `end_date`: Fecha fin (YYYY-MM-DD)
- `event_type`: Tipo de evento a filtrar

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "total_events": 1500,
        "unique_users": 250,
        "events_by_type": {
            "view": 800,
            "click": 450,
            "submit": 200,
            "search": 50
        },
        "top_pages": [
            {
                "page": "/lotes",
                "views": 350
            },
            {
                "page": "/dashboard",
                "views": 280
            }
        ]
    }
}
```

### 3. User Analytics

Obtiene analytics de un usuario específico.

**Endpoint:** `GET /api/stats/user/{user_id}/`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "user_id": "uuid",
        "total_events": 85,
        "last_activity": "2024-01-15T10:30:00Z",
        "most_visited_pages": [
            "/lotes",
            "/dashboard"
        ],
        "activity_by_day": {
            "2024-01-15": 25,
            "2024-01-14": 30,
            "2024-01-13": 30
        }
    }
}
```

## Servicios

### StatsService

Servicio para procesamiento de estadísticas.

**Métodos principales:**

```python
class StatsService:
    @staticmethod
    def record_event(event_type, event_name, event_data, user=None, request=None):
        """Registra un evento en el sistema"""
    
    @staticmethod
    def get_summary_stats(start_date=None, end_date=None, event_type=None):
        """Obtiene estadísticas resumen"""
    
    @staticmethod
    def get_user_analytics(user_id, days=30):
        """Obtiene analytics de un usuario"""
    
    @staticmethod
    def get_popular_content(content_type='page', limit=10):
        """Obtiene contenido más popular"""
```

## Uso

### Registrar Evento desde el Backend

```python
from apps.stats.services import StatsService

# Registrar un evento
StatsService.record_event(
    event_type='view',
    event_name='lote_detail',
    event_data={'lote_id': lote.id},
    user=request.user,
    request=request
)
```

### Registrar Evento desde el Frontend

```typescript
// services/stats.server.ts
export async function recordEvent(
    request: Request,
    event: {
        type: string;
        name: string;
        value?: any;
    }
) {
    try {
        await fetch('/api/stats/events/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_type: event.type,
                event_name: event.name,
                event_data: event.value || {}
            })
        });
    } catch (error) {
        console.error('Error recording event:', error);
    }
}
```

## Dashboard de Analytics

El módulo incluye vistas para visualizar estadísticas:

- Eventos por día
- Usuarios activos
- Páginas más visitadas
- Conversiones
- Rendimiento de la aplicación

## Performance

### Optimizaciones

1. **Async Event Recording**: Los eventos se registran de forma asíncrona
2. **Batch Processing**: Eventos se procesan en lotes para mejor rendimiento
3. **Indexing**: Índices optimizados en campos de búsqueda frecuente
4. **Aggregation**: Uso de agregaciones de base de datos para estadísticas

### Configuración de Performance

```python
# settings.py
STATS_BATCH_SIZE = 100  # Número de eventos por lote
STATS_ASYNC_PROCESSING = True  # Procesamiento asíncrono
STATS_RETENTION_DAYS = 90  # Días de retención de eventos
```

## Privacy

El módulo respeta la privacidad del usuario:

- No se almacenan datos sensibles
- IPs se pueden anonimizar
- Cumplimiento con GDPR
- Opciones de opt-out para usuarios

## Limpieza de Datos

Script para limpiar eventos antiguos:

```bash
# Ejecutar mensualmente
python manage.py cleanup_old_events --days=90
```

## Testing

```bash
# Ejecutar tests del módulo
python manage.py test apps.stats
```

## Referencias

- [Google Analytics Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/v1)
- [Mixpanel Documentation](https://developer.mixpanel.com/docs)
