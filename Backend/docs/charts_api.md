# Documentación de API de Gráficos para Dashboard

## Introducción

Esta API proporciona los datos necesarios para generar visualizaciones y gráficos en el dashboard de 360Lateral. Los endpoints están diseñados para mostrar estadísticas de lotes, documentos procesados por mes, y distribución de eventos por tipo.

## Endpoints Disponibles

### Todos los Datos de Gráficos

Este endpoint devuelve todos los datos necesarios para los gráficos del dashboard en una sola llamada.

```
GET /api/stats/charts/
```

#### Respuesta

```json
{
  "lotes_summary": {
    "total": 128,
    "activos": 187,
    "inactivos": -59
  },
  "documents_count": 423,
  "documents_by_month": [
    { "mes": "Ene", "count": 22, "valor": 22 },
    { "mes": "Feb", "count": 48, "valor": 48 },
    { "mes": "Mar", "count": 41, "valor": 41 },
    { "mes": "Abr", "count": 57, "valor": 57 },
    { "mes": "May", "count": 50, "valor": 50 },
    { "mes": "Jun", "count": 28, "valor": 28 },
    { "mes": "Jul", "count": 32, "valor": 32 },
    { "mes": "Ago", "count": 32, "valor": 32 },
    { "mes": "Sep", "count": 47, "valor": 47 },
    { "mes": "Oct", "count": 0, "valor": 0 },
    { "mes": "Nov", "count": 0, "valor": 0 },
    { "mes": "Dic", "count": 0, "valor": 0 }
  ],
  "event_distribution": [
    { "type": "Vistas", "count": 156, "percentage": 36.9 },
    { "type": "Búsquedas", "count": 124, "percentage": 29.3 },
    { "type": "Acciones", "count": 87, "percentage": 20.6 },
    { "type": "Errores", "count": 56, "percentage": 13.2 }
  ]
}
```

### Resumen de Lotes

Este endpoint proporciona estadísticas sobre los lotes en el sistema.

```
GET /api/stats/charts/lotes-summary/
```

#### Respuesta

```json
{
  "total": 128,
  "activos": 187,
  "inactivos": -59
}
```

### Conteo Total de Documentos

Este endpoint devuelve el conteo total de documentos en el sistema.

```
GET /api/stats/charts/documents-count/
```

#### Respuesta

```json
{
  "count": 423
}
```

### Documentos Procesados por Mes

Este endpoint proporciona el conteo de documentos procesados por mes para un año específico.

```
GET /api/stats/charts/documents-by-month/
```

#### Parámetros Opcionales

- `year` (opcional): Año para el cual obtener las estadísticas. Por defecto es el año actual.

#### Respuesta

```json
[
  { "mes": "Ene", "count": 22, "valor": 22 },
  { "mes": "Feb", "count": 48, "valor": 48 },
  { "mes": "Mar", "count": 41, "valor": 41 },
  { "mes": "Abr", "count": 57, "valor": 57 },
  { "mes": "May", "count": 50, "valor": 50 },
  { "mes": "Jun", "count": 28, "valor": 28 },
  { "mes": "Jul", "count": 32, "valor": 32 },
  { "mes": "Ago", "count": 32, "valor": 32 },
  { "mes": "Sep", "count": 47, "valor": 47 },
  { "mes": "Oct", "count": 0, "valor": 0 },
  { "mes": "Nov", "count": 0, "valor": 0 },
  { "mes": "Dic", "count": 0, "valor": 0 }
]
```

### Distribución por Tipo de Evento

Este endpoint proporciona estadísticas sobre la distribución de eventos por tipo.

```
GET /api/stats/charts/event-distribution/
```

#### Parámetros Opcionales

- `days` (opcional): Número de días anteriores para los cuales obtener las estadísticas. Por defecto es 30 días.

#### Respuesta

```json
[
  { "type": "Vistas", "count": 156, "percentage": 36.9 },
  { "type": "Búsquedas", "count": 124, "percentage": 29.3 },
  { "type": "Acciones", "count": 87, "percentage": 20.6 },
  { "type": "Errores", "count": 56, "percentage": 13.2 }
]
```

## Integración con Frontend

### Ejemplo de Uso con React y Chart.js

#### Gráfico de Barras para Documentos por Mes

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';

const DocumentsByMonthChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/stats/charts/documents-by-month/');
        
        const labels = response.data.map(item => item.mes);
        const values = response.data.map(item => item.count);
        
        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Documentos Procesados',
              data: values,
              backgroundColor: '#4285F4',
              borderWidth: 0,
              borderRadius: 4
            }
          ]
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div>Cargando datos del gráfico...</div>;
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Documentos Procesados por Mes',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default DocumentsByMonthChart;
```

#### Gráfico de Barras Horizontales para Distribución de Eventos

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';

const EventDistributionChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/stats/charts/event-distribution/');
        
        const labels = response.data.map(item => item.type);
        const values = response.data.map(item => item.count);
        const percentages = response.data.map(item => item.percentage);
        
        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Conteo de Eventos',
              data: values,
              backgroundColor: '#4285F4',
              borderWidth: 0,
              borderRadius: 4
            }
          ]
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div>Cargando datos del gráfico...</div>;
  
  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Distribución por Tipo de Evento',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default EventDistributionChart;
```

## Notas

- Todos los endpoints requieren autenticación.
- Los datos se almacenan en caché durante 5 minutos para mejorar el rendimiento.
- Si un año específico no tiene datos para algún mes, el valor devuelto será 0.
- El conteo de documentos por mes y la distribución de eventos son aproximados y pueden variar ligeramente según la configuración del servidor de base de datos.