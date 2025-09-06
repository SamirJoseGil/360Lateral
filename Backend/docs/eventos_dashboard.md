# Documentación: Dashboard de Eventos

## Introducción

El Dashboard de Eventos proporciona una visualización de los eventos registrados en el sistema 360Lateral. Este dashboard muestra tanto la actividad reciente como la distribución de eventos por tipo, permitiendo una rápida comprensión de cómo se está utilizando el sistema.

## Endpoints Disponibles

### Tabla de Eventos Recientes

Este endpoint proporciona una lista de los eventos más recientes en formato tabular, ideal para mostrar en un widget de actividad reciente.

```
GET /api/stats/dashboard/events/table/
```

#### Parámetros

- `limit` (opcional): Número máximo de eventos a retornar. Por defecto: 10

#### Respuesta

```json
[
  {
    "evento": "lote_detail",
    "tipo": "view",
    "usuario": "Usuario 1",
    "fecha": "04/09/2025, 21:18:06"
  },
  {
    "evento": "search_lotes",
    "tipo": "search",
    "usuario": "Usuario 1",
    "fecha": "04/09/2025, 21:13:06"
  }
]
```

### Distribución de Eventos por Tipo

Este endpoint proporciona estadísticas sobre la distribución de eventos por tipo, incluyendo conteo y porcentaje del total.

```
GET /api/stats/dashboard/events/distribution/
```

#### Respuesta

```json
[
  {
    "type": "view",
    "count": 320,
    "percentage": 53.6
  },
  {
    "type": "search",
    "count": 145,
    "percentage": 24.3
  },
  {
    "type": "action",
    "count": 80,
    "percentage": 13.4
  },
  {
    "type": "api",
    "count": 35,
    "percentage": 5.9
  },
  {
    "type": "error",
    "count": 12,
    "percentage": 2.0
  },
  {
    "type": "other",
    "count": 5,
    "percentage": 0.8
  }
]
```

## Integración con Frontend

### Visualización de Tabla de Actividad Reciente

```javascript
// Ejemplo con React y Axios
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecentActivityTable = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('/api/stats/dashboard/events/table/');
        setEvents(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recent events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchEvents, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Cargando eventos recientes...</p>;

  return (
    <div className="recent-activity">
      <h2>Actividad Reciente</h2>
      <p>Últimos eventos registrados en el sistema</p>
      
      <table className="events-table">
        <thead>
          <tr>
            <th>EVENTO</th>
            <th>TIPO</th>
            <th>USUARIO</th>
            <th>FECHA</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={index}>
              <td>{event.evento}</td>
              <td>
                <span className={`tag ${event.tipo}`}>{event.tipo}</span>
              </td>
              <td>{event.usuario}</td>
              <td>{event.fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <a href="/statistics">Ver todas las estadísticas</a>
    </div>
  );
};

export default RecentActivityTable;
```

### Visualización de Distribución por Tipo

```javascript
// Ejemplo con React y Axios
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EventsDistribution = () => {
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const response = await axios.get('/api/stats/dashboard/events/distribution/');
        setDistribution(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events distribution:', error);
        setLoading(false);
      }
    };

    fetchDistribution();
    // Actualizar cada 10 minutos
    const interval = setInterval(fetchDistribution, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Cargando distribución de eventos...</p>;

  return (
    <div className="events-distribution">
      <h2>Distribución por Tipo de Evento</h2>
      
      {distribution.map((item) => (
        <div key={item.type} className="distribution-item">
          <div className="type">{item.type}</div>
          <div className="bar-container">
            <div 
              className={`bar ${item.type}`} 
              style={{ width: `${item.percentage}%` }}
            ></div>
          </div>
          <div className="count">
            {item.count} ({item.percentage}%)
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventsDistribution;
```

## Notas

- La tabla de eventos muestra eventos en orden cronológico invertido (más reciente primero).
- La distribución de eventos se ordena por frecuencia (tipos más comunes primero).
- Todos los endpoints requieren autenticación.
- Se aplica caché en algunos endpoints para mejorar el rendimiento.