# Documentación Técnica: Módulo de Estadísticas

## Arquitectura y Componentes

El módulo de Estadísticas sigue una arquitectura orientada a servicios basada en Django y Django REST Framework. Este documento detalla los componentes técnicos y su integración.

## Estructura del Módulo

```
apps/stats/
├── models.py              # Modelos de datos
├── serializers.py         # Serializadores para API REST
├── urls.py                # Configuración de rutas
├── views.py               # Vistas y controladores
├── admin.py               # Configuración del admin
├── apps.py                # Configuración de la app
└── services/              # Capa de servicios
    ├── __init__.py
    └── stats_service.py   # Lógica de negocio para estadísticas
```

## Modelos de Datos

### Stat (Evento Estadístico)

```python
class Stat(models.Model):
    type = models.CharField(max_length=20, choices=STAT_TYPES)
    name = models.CharField(max_length=100)
    value = models.JSONField(default=dict)
    timestamp = models.DateTimeField(default=timezone.now)
    user_id = models.IntegerField(null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
```

Este modelo registra eventos individuales en el sistema.

### DailySummary (Resumen Diario)

```python
class DailySummary(models.Model):
    date = models.DateField(unique=True)
    metrics = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

Este modelo almacena resúmenes diarios precalculados para optimizar consultas.

## Capa de Servicios

El módulo utiliza una capa de servicios para encapsular la lógica de negocio principal y separarla de las vistas.

### StatsService

Clase principal que proporciona los siguientes métodos:

- `record_stat()`: Registra un nuevo evento estadístico
- `get_daily_summary()`: Obtiene el resumen diario para una fecha
- `calculate_daily_metrics()`: Calcula métricas para un día específico
- `get_stats_over_time()`: Obtiene estadísticas a lo largo del tiempo
- `get_user_activity()`: Obtiene la actividad de un usuario

## API REST

### ViewSets y Vistas

#### StatViewSet

- **Modelo**: `Stat`
- **Permisos**: `IsAdminOrReadOnly` (solo los administradores pueden modificar)
- **Acciones personalizadas**:
  - `types()`: Obtener tipos de estadísticas disponibles
  - `recent()`: Obtener eventos recientes
  - `record()`: Registrar un evento simplificado

#### DailySummaryViewSet

- **Modelo**: `DailySummary`
- **Permisos**: `IsAuthenticated`
- **Solo lectura**: Los resúmenes se generan automáticamente, no se crean manualmente
- **Acciones personalizadas**:
  - `latest()`: Obtener el resumen del día actual
  - `recalculate()`: Recalcular métricas para una fecha (solo admin)

#### Vistas Individuales

- `stats_over_time()`: Estadísticas agregadas en el tiempo
- `user_activity()`: Actividad de un usuario específico
- `dashboard_summary()`: Resumen para el dashboard (solo admin)

### Endpoints API

| Método | URL                                    | Descripción                           | Permisos       |
|--------|-----------------------------------------|---------------------------------------|----------------|
| GET    | `/api/stats/events/`                   | Listar eventos                        | Auth           |
| POST   | `/api/stats/events/`                   | Crear evento                          | Auth           |
| GET    | `/api/stats/events/{id}/`              | Obtener evento específico             | Auth+Propietario|
| PUT    | `/api/stats/events/{id}/`              | Actualizar evento (completo)          | Admin          |
| PATCH  | `/api/stats/events/{id}/`              | Actualizar evento (parcial)           | Admin          |
| DELETE | `/api/stats/events/{id}/`              | Eliminar evento                       | Admin          |
| GET    | `/api/stats/events/types/`             | Obtener tipos de eventos              | Auth           |
| GET    | `/api/stats/events/recent/`            | Obtener eventos recientes             | Auth           |
| POST   | `/api/stats/events/record/`            | Registrar evento simplificado         | Auth           |
| GET    | `/api/stats/summaries/`                | Listar resúmenes diarios              | Auth           |
| GET    | `/api/stats/summaries/{id}/`           | Obtener resumen diario específico     | Auth           |
| GET    | `/api/stats/summaries/latest/`         | Obtener resumen del día actual        | Auth           |
| POST   | `/api/stats/summaries/recalculate/`    | Recalcular métricas diarias           | Admin          |
| GET    | `/api/stats/over-time/`                | Obtener estadísticas en el tiempo     | Auth           |
| GET    | `/api/stats/user-activity/`            | Obtener actividad del usuario actual  | Auth           |
| GET    | `/api/stats/user-activity/{user_id}/`  | Obtener actividad de usuario específico | Auth+Owner/Admin |
| GET    | `/api/stats/dashboard/`                | Obtener resumen para dashboard        | Admin          |

## Serializadores

### StatSerializer

Serializador principal para el modelo `Stat`. Incluye todos los campos del modelo.

### StatCreateSerializer

Serializador especializado para la creación de eventos estadísticos. Incluye validaciones específicas para el campo `type`.

### DailySummarySerializer

Serializador para el modelo `DailySummary`. Incluye el campo `metrics` que contiene los datos agregados.

### StatsOverTimeSerializer, UserActivitySerializer, StatsSummarySerializer

Serializadores para endpoints específicos que devuelven estructuras de datos personalizadas.

## Flujos de Trabajo

### Registro de Eventos Estadísticos

1. **Cliente envía datos**: El cliente realiza una petición `POST` a `/api/stats/events/record/`
2. **Validación**: Se validan los datos según el `StatCreateSerializer`
3. **Complemento de datos**: Se agregan automáticamente `user_id` e `ip_address` si no se proporcionan
4. **Creación**: Se llama a `StatsService.record_stat()` para crear el evento
5. **Respuesta**: Se devuelve el objeto creado serializado

### Generación de Resúmenes Diarios

1. **Consulta inicial**: Se solicita un resumen diario mediante `/api/stats/summaries/latest/`
2. **Verificación**: Se comprueba si existe el resumen para la fecha solicitada
3. **Generación**: Si no existe o está vacío, se llama a `StatsService.calculate_daily_metrics()`
4. **Respuesta**: Se devuelve el resumen diario con todas las métricas calculadas

## Optimizaciones

### Resúmenes Precalculados

Los resúmenes diarios se calculan una vez al día y se almacenan en la base de datos para optimizar consultas frecuentes.

### Consultas Agrupadas

Para estadísticas a lo largo del tiempo, se utilizan funciones de agregación de la base de datos para reducir la cantidad de datos transferidos.

### Compatibilidad con Diferentes Motores de BD

El servicio `StatsService.get_stats_over_time()` tiene implementaciones específicas para PostgreSQL y una implementación genérica para otros motores.

## Consideraciones para Producción

### Rendimiento

- **Índices**: Los campos `type`, `user_id` y `timestamp` deben estar indexados
- **Particionamiento**: Considerar particionar la tabla `Stat` por fecha para grandes volúmenes de datos
- **Purga**: Implementar una política de purga para datos antiguos

### Mantenimiento

- **Tareas programadas**: Configurar una tarea programada para ejecutar `calculate_daily_metrics()` diariamente
- **Monitorización**: Vigilar el crecimiento de la tabla `Stat`

### Seguridad

- **Limitación de tasa**: Implementar rate limiting para prevenir abuso de los endpoints
- **Validación estricta**: Validar cuidadosamente los datos JSON en el campo `value`
- **Auditoría**: Los cambios manuales en eventos estadísticos deben ser auditados

## Extensiones Futuras

1. **Exportación de datos**: Endpoints para exportar estadísticas en formatos CSV/Excel
2. **Alertas**: Sistema de alertas basado en umbrales estadísticos
3. **Análisis avanzado**: Integración con herramientas de BI como Metabase o PowerBI
4. **Estadísticas en tiempo real**: Implementar WebSockets para actualizar dashboards en tiempo real
5. **Análisis predictivo**: Incorporar modelos de predicción basados en tendencias históricas

## Integración con Otros Módulos

### Módulo de Lotes

Las estadísticas pueden registrar eventos relacionados con lotes:
- Vistas de detalle de lote
- Búsquedas de lotes
- Creación/edición de lotes

### Módulo de Documentos

Las estadísticas pueden registrar eventos de documentos:
- Subidas de documentos
- Descargas de documentos
- Visualizaciones de documentos

## Referencias

- Django REST Framework: [https://www.django-rest-framework.org/](https://www.django-rest-framework.org/)
- Análisis de Datos con Django: [https://docs.djangoproject.com/en/stable/topics/db/aggregation/](https://docs.djangoproject.com/en/stable/topics/db/aggregation/)
- JSON Field en Django: [https://docs.djangoproject.com/en/stable/ref/models/fields/#jsonfield](https://docs.djangoproject.com/en/stable/ref/models/fields/#jsonfield)

---

Esta documentación es para uso interno de desarrolladores. Para la guía de usuario final, consulte `guia_uso_estadisticas.md`.