# API de Estado de Solicitudes de Usuarios

## Introducción

Esta API permite a los usuarios (tanto desarrolladores como propietarios) consultar el estado de sus solicitudes en el sistema 360Lateral. Las solicitudes pueden incluir peticiones de acceso, solicitudes de características, aplicaciones de desarrollador, entre otras.

## Modelos

### UserRequest (Solicitud de Usuario)

Modelo que representa una solicitud de un usuario:

- **id**: Identificador único de la solicitud
- **user**: Usuario que realizó la solicitud
- **request_type**: Tipo de solicitud (acceso, característica, soporte, desarrollador, proyecto, otro)
- **title**: Título de la solicitud
- **description**: Descripción detallada de la solicitud
- **status**: Estado actual (pendiente, en revisión, aprobado, rechazado, completado)
- **reference_id**: ID de referencia (opcional)
- **metadata**: Datos adicionales en formato JSON
- **reviewer**: Usuario que revisó la solicitud
- **review_notes**: Notas del revisor
- **created_at**: Fecha de creación
- **updated_at**: Fecha de última actualización

## Endpoints Disponibles

### Listar Mis Solicitudes

Este endpoint permite a un usuario ver todas sus solicitudes.

```
GET /api/users/requests/my_requests/
```

#### Parámetros Opcionales

- `type`: Filtrar por tipo de solicitud
- `status`: Filtrar por estado de la solicitud

#### Respuesta

```json
[
  {
    "id": 1,
    "user": 2,
    "user_name": "jperez",
    "request_type": "developer",
    "request_type_display": "Developer Application",
    "title": "Solicitud para ser desarrollador",
    "status": "in_review",
    "status_display": "In Review",
    "created_at": "2023-09-01T14:30:45Z",
    "updated_at": "2023-09-02T10:15:22Z"
  },
  {
    "id": 3,
    "user": 2,
    "user_name": "jperez",
    "request_type": "access",
    "request_type_display": "Access Request",
    "title": "Acceso a módulo de estadísticas",
    "status": "approved",
    "status_display": "Approved",
    "created_at": "2023-09-05T09:22:10Z",
    "updated_at": "2023-09-06T14:05:38Z"
  }
]
```

### Detalle de una Solicitud

Este endpoint permite ver los detalles completos de una solicitud específica.

```
GET /api/users/requests/{id}/
```

#### Respuesta

```json
{
  "id": 1,
  "user": 2,
  "user_name": "jperez",
  "request_type": "developer",
  "request_type_display": "Developer Application",
  "title": "Solicitud para ser desarrollador",
  "description": "Me gustaría unirme como desarrollador para contribuir al proyecto X...",
  "status": "in_review",
  "status_display": "In Review",
  "reference_id": "DEV-2023-001",
  "metadata": {
    "github_profile": "https://github.com/jperez",
    "experience_years": 5
  },
  "reviewer": 1,
  "reviewer_name": "admin",
  "review_notes": "Verificando antecedentes y experiencia",
  "created_at": "2023-09-01T14:30:45Z",
  "updated_at": "2023-09-02T10:15:22Z"
}
```

### Crear una Nueva Solicitud

Este endpoint permite crear una nueva solicitud.

```
POST /api/users/requests/
```

#### Datos de Solicitud

```json
{
  "request_type": "feature",
  "title": "Nueva funcionalidad de calendario",
  "description": "Sería útil tener un calendario para gestionar los eventos...",
  "metadata": {
    "priority": "medium",
    "affected_modules": ["dashboard", "events"]
  }
}
```

#### Respuesta

```json
{
  "id": 5,
  "user": 2,
  "user_name": "jperez",
  "request_type": "feature",
  "request_type_display": "Feature Request",
  "title": "Nueva funcionalidad de calendario",
  "status": "pending",
  "status_display": "Pending",
  "created_at": "2023-09-10T15:20:30Z",
  "updated_at": "2023-09-10T15:20:30Z"
}
```

### Resumen de Estado de Solicitudes

Este endpoint proporciona un resumen de las solicitudes del usuario por estado y tipo.

```
GET /api/users/requests/summary/
```

#### Respuesta

```json
{
  "total": 4,
  "pending": 1,
  "approved": 2,
  "rejected": 1,
  "by_type": {
    "access": 2,
    "developer": 1,
    "feature": 1
  }
}
```

### Actualizaciones Recientes

Este endpoint proporciona las actualizaciones recientes de las solicitudes del usuario.

```
GET /api/users/requests/recent_updates/
```

#### Parámetros Opcionales

- `days`: Número de días para buscar (por defecto: 30)
- `limit`: Número máximo de actualizaciones a devolver (por defecto: 10)

#### Respuesta

```json
[
  {
    "id": 3,
    "user": 2,
    "user_name": "jperez",
    "request_type": "access",
    "request_type_display": "Access Request",
    "title": "Acceso a módulo de estadísticas",
    "status": "approved",
    "status_display": "Approved",
    "created_at": "2023-09-05T09:22:10Z",
    "updated_at": "2023-09-06T14:05:38Z"
  },
  {
    "id": 1,
    "user": 2,
    "user_name": "jperez",
    "request_type": "developer",
    "request_type_display": "Developer Application",
    "title": "Solicitud para ser desarrollador",
    "status": "in_review",
    "status_display": "In Review",
    "created_at": "2023-09-01T14:30:45Z",
    "updated_at": "2023-09-02T10:15:22Z"
  }
]
```

## Integración con Frontend

### Ejemplo de Panel de Estado de Solicitudes

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RequestStatusDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch requests with optional filtering
        const queryParams = new URLSearchParams();
        if (filter.type) queryParams.append('type', filter.type);
        if (filter.status) queryParams.append('status', filter.status);
        
        const [requestsResponse, summaryResponse] = await Promise.all([
          axios.get(`/api/users/requests/my_requests/?${queryParams}`),
          axios.get('/api/users/requests/summary/')
        ]);
        
        setRequests(requestsResponse.data);
        setSummary(summaryResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching request data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div>Cargando estado de solicitudes...</div>;

  return (
    <div className="request-status-dashboard">
      <h1>Estado de Mis Solicitudes</h1>
      
      {summary && (
        <div className="status-summary">
          <div className="summary-card">
            <h3>Total</h3>
            <div className="count">{summary.total}</div>
          </div>
          <div className="summary-card pending">
            <h3>Pendientes</h3>
            <div className="count">{summary.pending}</div>
          </div>
          <div className="summary-card approved">
            <h3>Aprobadas</h3>
            <div className="count">{summary.approved}</div>
          </div>
          <div className="summary-card rejected">
            <h3>Rechazadas</h3>
            <div className="count">{summary.rejected}</div>
          </div>
        </div>
      )}
      
      <div className="filter-controls">
        <div className="filter-group">
          <label>Tipo:</label>
          <select 
            name="type" 
            value={filter.type} 
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="access">Acceso</option>
            <option value="feature">Característica</option>
            <option value="developer">Desarrollador</option>
            <option value="project">Proyecto</option>
            <option value="support">Soporte</option>
            <option value="other">Otro</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Estado:</label>
          <select 
            name="status" 
            value={filter.status} 
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="in_review">En Revisión</option>
            <option value="approved">Aprobado</option>
            <option value="rejected">Rechazado</option>
            <option value="completed">Completado</option>
          </select>
        </div>
      </div>
      
      <div className="requests-list">
        <h2>Mis Solicitudes</h2>
        
        {requests.length === 0 ? (
          <p>No se encontraron solicitudes con los filtros seleccionados.</p>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.request_type_display}</td>
                  <td>{request.title}</td>
                  <td>
                    <span className={`status-badge ${request.status}`}>
                      {request.status_display}
                    </span>
                  </td>
                  <td>{new Date(request.updated_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => window.location.href = `/requests/${request.id}`}>
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="new-request">
        <button onClick={() => window.location.href = '/requests/new'}>
          Nueva Solicitud
        </button>
      </div>
    </div>
  );
};

export default RequestStatusDashboard;
```

## Notas

- Todos los endpoints requieren autenticación.
- Los usuarios solo pueden ver y modificar sus propias solicitudes.
- Los usuarios con permisos de staff pueden ver todas las solicitudes.
- El sistema mantiene un registro de todas las actualizaciones para cada solicitud.
- Las solicitudes pueden incluir metadatos personalizados según el tipo de solicitud.