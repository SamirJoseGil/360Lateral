# API de Estadísticas de Eventos

## Introducción

La API de Estadísticas de Eventos proporciona métricas y datos analíticos sobre los eventos registrados en la plataforma 360Lateral. Permite monitorear el uso del sistema, incluyendo el total de eventos, usuarios únicos, sesiones y errores.

## Endpoints Disponibles

### Dashboard de Eventos

Este endpoint proporciona todos los datos necesarios para el dashboard de eventos en una sola llamada.

```
GET /api/stats/events/dashboard/
```

#### Parámetros Opcionales

- `days` (opcional): Número de días para incluir en las estadísticas (por defecto: 30)

#### Respuesta

```json
{
  "total_events": 128,
  "unique_users": 45,
  "sessions": 87,
  "errors": 12,
  "daily_events": [
    { "date": "2023-09-01", "count": 15 },
    { "date": "2023-09-02", "count": 23 },
    ...
  ],
  "event_types": [
    { "type": "view", "count": 65, "percentage": 50.8 },
    { "type": "search", "count": 32, "percentage": 25.0 },
    { "type": "action", "count": 19, "percentage": 14.8 },
    { "type": "error", "count": 12, "percentage": 9.4 }
  ]
}
```

### Contadores de Eventos

Este endpoint proporciona solo los contadores principales de eventos.

```
GET /api/stats/events/counts/
```

#### Parámetros Opcionales

- `days` (opcional): Número de días para incluir en las estadísticas (por defecto: 30)

#### Respuesta

```json
{
  "total_events": 128,
  "unique_users": 45,
  "sessions": 87,
  "errors": 12
}
```

### Eventos Diarios

Este endpoint proporciona el conteo de eventos por día para un período específico.

```
GET /api/stats/events/daily/
```

#### Parámetros Opcionales

- `days` (opcional): Número de días para incluir en las estadísticas (por defecto: 30)

#### Respuesta

```json
[
  { "date": "2023-09-01", "count": 15 },
  { "date": "2023-09-02", "count": 23 },
  { "date": "2023-09-03", "count": 18 },
  ...
]
```

### Distribución por Tipo de Evento

Este endpoint proporciona la distribución de eventos por tipo.

```
GET /api/stats/events/types/
```

#### Parámetros Opcionales

- `days` (opcional): Número de días para incluir en las estadísticas (por defecto: 30)

#### Respuesta

```json
[
  { "type": "view", "count": 65, "percentage": 50.8 },
  { "type": "search", "count": 32, "percentage": 25.0 },
  { "type": "action", "count": 19, "percentage": 14.8 },
  { "type": "error", "count": 12, "percentage": 9.4 }
]
```

## Integración con Frontend

### Ejemplo para Dashboard de Eventos

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EventDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    total_events: 0,
    unique_users: 0,
    sessions: 0,
    errors: 0,
    daily_events: [],
    event_types: []
  });
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/stats/events/dashboard/?days=${days}`);
        setDashboardData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading) return <div>Cargando datos del dashboard...</div>;

  return (
    <div className="event-dashboard">
      <div className="filter">
        <label>
          Últimos
          <select value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="90">90 días</option>
          </select>
        </label>
      </div>

      <div className="metric-cards">
        <div className="metric-card">
          <h3>Total Eventos</h3>
          <div className="value">{dashboardData.total_events}</div>
          <div className="caption">Últimos {days} días</div>
        </div>
        <div className="metric-card">
          <h3>Usuarios Únicos</h3>
          <div className="value">{dashboardData.unique_users}</div>
          <div className="caption">Últimos {days} días</div>
        </div>
        <div className="metric-card">
          <h3>Sesiones</h3>
          <div className="value">{dashboardData.sessions}</div>
          <div className="caption">Últimos {days} días</div>
        </div>
        <div className="metric-card">
          <h3>Errores Registrados</h3>
          <div className="value">{dashboardData.errors}</div>
          <div className="caption">Últimos {days} días</div>
        </div>
      </div>

      {/* Aquí se podrían añadir gráficos para daily_events y event_types */}
    </div>
  );
};

export default EventDashboard;
```

## Notas

- Todos los endpoints requieren autenticación.
- Los datos se almacenan en caché durante 2-5 minutos para mejorar el rendimiento.
- Para registrar eventos adecuadamente, asegúrate de utilizar el endpoint `/api/stats/events/` con el método POST para crear nuevos eventos.
- Las sesiones se contabilizan solo cuando el campo `session_id` está presente en los eventos.
- Los usuarios únicos se cuentan basándose en el campo `user_id` de los eventos registrados.