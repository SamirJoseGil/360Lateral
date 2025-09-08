import { fetchWithAuth, getAccessTokenFromCookies } from "~/utils/auth.server";
import { v4 as uuid } from "uuid";
import { API_URL } from "~/utils/api.server";


// Constante para la URL base de la API de estadísticas
const STATS_API_URL = `${API_URL}/api/stats`;

// Tipos para las estadísticas
export interface EventData {
  type: 'view' | 'search' | 'action' | 'api' | 'error' | 'other';
  name: string;
  value?: Record<string, any>;
  session_id?: string;
}

// Tipos de eventos disponibles según el backend
export const STAT_TYPES = [
  'view', 'search', 'action', 'api', 'error', 'other'
];

export interface StatsSummary {
  id: number;
  date: string;
  metrics: {
    total_events: number;
    events_by_type: Record<string, number>;
    unique_users: number;
    unique_sessions: number;
    top_events: Array<{ name: string; count: number }>;
  };
  created_at: string;
  updated_at: string;
}

export interface TimeSeriesPoint {
  period: string;
  count: number;
}

export interface UserActivity {
  total_events: number;
  events_by_type: Record<string, number>;
  recent_events: Array<{
    name: string;
    type: string;
    timestamp: string;
    value: Record<string, any>;
  }>;
  first_activity: any;
  last_activity: any;
}

export interface AdminDashboardStats {
  total_events: number;
  unique_users: number;
  period: string;
  daily_data: Array<{
    date: string;
    metrics: {
      total_events: number;
      events_by_type: Record<string, number>;
      unique_users: number;
    }
  }>;
}

// Función para registrar un evento estadístico
export async function recordEvent(request: Request, eventData: EventData) {
  console.log(`[Stats] Registrando evento: ${eventData.type} - ${eventData.name}`);
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const sessionId = getOrCreateSessionId(request);
    
    const headers = new Headers();
    
    // Si no hay token, aún registraremos eventos anónimos
    const authHeader = token ? `Bearer ${token}` : "";
    
    // Establecer cookies independientemente del éxito de la llamada a la API
    headers.append("Set-Cookie", `l360_stats_sid=${sessionId}; Path=/; Max-Age=${60 * 60 * 24 * 365}; HttpOnly; SameSite=Lax`);
    
    // Sin necesidad de llamar realmente a la API en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("Evento de estadísticas:", eventData);
      return { success: true, headers };
    }
    
    // Llamar a la API de estadísticas
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    console.log(`[Stats] Enviando evento a ${apiUrl}/api/stats/events/record/`);
    console.log(`[Stats] Datos: ${JSON.stringify({
      session_id: sessionId,
      type: eventData.type,
      name: eventData.name,
      value: eventData.value || {}
    })}`);
    
    const response = await fetch(`${apiUrl}/api/stats/events/record/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify({
        session_id: sessionId,
        type: eventData.type,
        name: eventData.name,
        value: eventData.value || {}
      })
    });
    
    // Devolver resultado con cookie de sesión
    return { 
      success: response.ok,
      headers
    };
  } catch (error) {
    console.error("Error registrando evento:", error);
    return { 
      success: false,
      headers: new Headers()
    };
  }
}

// Función para obtener el resumen diario más reciente
export async function getLatestSummary(request: Request) {
  console.log("[Stats] Obteniendo resumen diario más reciente");
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const headers = new Headers();
    
    // Datos simulados para desarrollo
    if (process.env.NODE_ENV === "development" || !token) {
      return {
        summary: {
          timestamp: new Date().toISOString(),
          metrics: {
            unique_users: 128,
            unique_sessions: 187,
            total_events: 423,
            events_by_type: {
              view: 156,
              search: 124,
              action: 87,
              error: 56
            },
            top_events: [
              { name: "home_view", count: 52 },
              { name: "lot_search", count: 35 },
              { name: "document_upload", count: 22 },
              { name: "analysis_report", count: 18 }
            ]
          }
        },
        headers
      };
    }
    
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/summaries/latest/`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      return {
        summary: {
          timestamp: new Date().toISOString(),
          metrics: {
            unique_users: 0,
            unique_sessions: 0,
            total_events: 0,
            events_by_type: {}
          }
        },
        headers
      };
    }
    
    const data = await response.json();
    
    return {
      summary: data,
      headers
    };
  } catch (error) {
    console.error("Error fetching summary:", error);
    return { 
      summary: {
        timestamp: new Date().toISOString(),
        metrics: {
          unique_users: 0,
          unique_sessions: 0,
          total_events: 0,
          events_by_type: {}
        }
      }, 
      headers: new Headers() 
    };
  }
}

// Función para obtener estadísticas a lo largo del tiempo
export async function getStatsOverTime(request: Request, options: {
  start_date?: string;
  end_date?: string;
  interval?: 'day' | 'week' | 'month';
  type?: string;
}) {
  console.log(`[Stats] Obteniendo estadísticas a lo largo del tiempo: ${JSON.stringify(options)}`);
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const headers = new Headers();
    
    // Datos simulados para desarrollo
    if (process.env.NODE_ENV === "development" || !token) {
      const now = new Date();
      const defaultEnd = now.toISOString().split('T')[0];
      const defaultStart = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const mockData = generateMockTimeSeriesData({
        start_date: options.start_date || defaultStart,
        end_date: options.end_date || defaultEnd,
        interval: options.interval,
        type: options.type
      });
      return {
        timeSeriesData: mockData,
        headers
      };
    }
    
    // Construir cadena de consulta
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
      if (value) queryParams.append(key, value);
    }
    
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/over-time/?${queryParams.toString()}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      return {
        timeSeriesData: [],
        headers
      };
    }
    
    const data = await response.json();
    
    return {
      timeSeriesData: data.results || [],
      headers
    };
  } catch (error) {
    console.error("Error fetching stats over time:", error);
    return { 
      timeSeriesData: [], 
      headers: new Headers() 
    };
  }
}

/**
 * Obtiene actividad del usuario actual
 */
export async function getUserActivity(request: Request) {
  try {
    // Este endpoint debe ser revisado para asegurar que coincida con la documentación
    const endpoint = `${API_URL}/api/stats/dashboard/recent-activity/?user=current`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo actividad del usuario: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const activity = await response.json();
    return {
      activity,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error('Error obteniendo actividad del usuario:', error);
    throw error;
  }
}

/**
 * Obtiene actividad reciente del sistema
 */
export async function getRecentActivity(request: Request, limit: number = 10) {
  try {
    // Según la documentación actualizada, este endpoint es correcto
    const endpoint = `${API_URL}/api/stats/dashboard/recent-activity/?limit=${limit}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo actividad reciente: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const recentActivity = await response.json();
    return {
      recentActivity,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de usuarios para el dashboard
 */
export async function getUsersStats(request: Request) {
  console.log("[Stats] Obteniendo estadísticas de usuarios");
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const headers = new Headers();
    
    if (process.env.NODE_ENV === "development" || !token) {
      return {
        usersStats: {
          total: 125
        },
        headers
      };
    }
    
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/dashboard/users/`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      usersStats: data,
      headers
    };
  } catch (error) {
    console.error("Error fetching users stats:", error);
    return { 
      usersStats: {
        total: 0
      }, 
      headers: new Headers() 
    };
  }
}

/**
 * Obtiene estadísticas de lotes para el dashboard
 */
export async function getLotesStats(request: Request) {
  console.log("[Stats] Obteniendo estadísticas de lotes");
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const headers = new Headers();
    
    if (process.env.NODE_ENV === "development" || !token) {
      return {
        lotesStats: {
          total: 500,
          activos: 450,
          inactivos: 50
        },
        headers
      };
    }
    
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/dashboard/lotes/`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      lotesStats: data,
      headers
    };
  } catch (error) {
    console.error("Error fetching lotes stats:", error);
    return { 
      lotesStats: {
        total: 0,
        activos: 0,
        inactivos: 0
      }, 
      headers: new Headers() 
    };
  }
}

/**
 * Obtiene estadísticas de documentos para el dashboard
 */
export async function getDocumentosStats(request: Request) {
  console.log("[Stats] Obteniendo estadísticas de documentos");
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const headers = new Headers();
    
    if (process.env.NODE_ENV === "development" || !token) {
      return {
        documentosStats: {
          total: 1200,
          pendientes: 50,
          aceptados: 1100,
          rechazados: 50
        },
        headers
      };
    }
    
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/dashboard/documentos/`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      documentosStats: data,
      headers
    };
  } catch (error) {
    console.error("Error fetching documentos stats:", error);
    return { 
      documentosStats: {
        total: 0,
        pendientes: 0,
        aceptados: 0,
        rechazados: 0
      }, 
      headers: new Headers() 
    };
  }
}

/**
 * Obtiene el resumen del dashboard
 */
export async function getDashboardSummary(request: Request) {
  try {
    // Según la documentación de Swagger, este endpoint es correcto
    const endpoint = `${API_URL}/api/stats/dashboard/summary/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo resumen del dashboard: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const dashboardSummary = await response.json();
    return { 
      dashboardSummary, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo resumen del dashboard:', error);
    return { 
      dashboardSummary: {
        users_count: 0,
        documents_count: 0,
        lotes_count: 0,
        recent_activity: []
      },
      headers: new Headers() 
    };
  }
}

/**
 * Obtiene los eventos recientes para mostrar en formato de tabla en el dashboard
 */
export async function getDashboardEventsTable(request: Request, limit: number = 10) {
  try {
    const endpoint = `${API_URL}/api/stats/dashboard/events/table/?limit=${limit}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo tabla de eventos: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const eventsTableData = await response.json();
    return { 
      eventsTableData, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo tabla de eventos:', error);
    throw error;
  }
}

/**
 * Obtiene la distribución de eventos por tipo para mostrar en el gráfico del dashboard
 */
export async function getDashboardEventsDistribution(request: Request) {
  try {
    const endpoint = `${API_URL}/api/stats/dashboard/events/distribution/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo distribución de eventos: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const eventsDistribution = await response.json();
    return { 
      eventsDistribution, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo distribución de eventos:', error);
    throw error;
  }
}

/**
 * Obtiene todos los datos de gráficos en una sola solicitud
 */
export async function getAllChartData(request: Request) {
  try {
    const endpoint = `${API_URL}/api/stats/charts/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo datos de gráficos: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const chartData = await response.json();
    return { 
      chartData, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo datos de gráficos:', error);
    throw error;
  }
}

/**
 * Obtiene el resumen de estadísticas de lotes
 */
export async function getLotesSummary(request: Request) {
  try {
    const endpoint = `${API_URL}/api/stats/charts/lotes-summary/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo resumen de lotes: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const lotesSummary = await response.json();
    return { 
      lotesSummary, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo resumen de lotes:', error);
    throw error;
  }
}

/**
 * Obtiene el recuento total de documentos
 */
export async function getDocumentsCount(request: Request) {
  try {
    const endpoint = `${API_URL}/api/stats/charts/documents-count/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo recuento de documentos: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const documentsCount = await response.json();
    return { 
      documentsCount, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo recuento de documentos:', error);
    throw error;
  }
}

/**
 * Obtiene el recuento de documentos por mes
 */
export async function getDocumentsByMonth(request: Request, year?: number) {
  try {
    // Según la documentación actualizada, este endpoint es correcto
    const endpoint = `${API_URL}/api/stats/charts/documents-by-month/${year ? `?year=${year}` : ''}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo documentos por mes: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const documentsByMonth = await response.json();
    return {
      documentsByMonth,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error('Error obteniendo documentos por mes:', error);
    throw error;
  }
}

/**
 * Obtiene la distribución de eventos por tipo
 */
export async function getEventDistribution(request: Request) {
  try {
    // Según la documentación actualizada, este endpoint es correcto
    const endpoint = `${API_URL}/api/stats/charts/event-distribution/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo distribución de eventos: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const eventDistribution = await response.json();
    return {
      eventDistribution,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error('Error obteniendo distribución de eventos:', error);
    throw error;
  }
}

/**
 * Obtiene datos completos del dashboard de eventos
 */
export async function getEventsDashboard(request: Request, days: number = 30) {
  try {
    // Usando la ruta confirmada en la documentación actualizada
    const endpoint = `${API_URL}/api/stats/dashboard/events/?days=${days}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo dashboard de eventos: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    // Esta respuesta incluye directamente total_events, unique_users, sessions, errors, etc.
    const eventsDashboard = await response.json();
    return { 
      eventsDashboard, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo dashboard de eventos:', error);
    throw error;
  }
}

/**
 * Obtiene métricas de conteo de eventos
 */
export async function getEventsCounts(request: Request, days: number = 30) {
  try {
    // Según la documentación actualizada, usamos el endpoint correcto de dashboard/events
    const endpoint = `${API_URL}/api/stats/dashboard/events/?days=${days}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo conteos de eventos: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    // Esta respuesta incluye directamente total_events, unique_users, sessions, errors
    const eventsCounts = await response.json();
    return { 
      eventsCounts, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo conteos de eventos:', error);
    throw error;
  }
}

/**
 * Obtiene conteos diarios de eventos
 */
export async function getDailyEvents(request: Request, days: number = 30) {
  try {
    // Según la documentación de Swagger y los logs de error, debemos usar la ruta del dashboard
    const endpoint = `${API_URL}/api/stats/dashboard/events/?days=${days}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo eventos diarios: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    // La respuesta del endpoint de dashboard contiene daily_events dentro del objeto
    const dashboardData = await response.json();
    const dailyEvents = dashboardData.daily_events || [];
    
    return { 
      dailyEvents, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo eventos diarios:', error);
    throw error;
  }
}

/**
 * Obtiene distribución de tipos de eventos
 */
export async function getEventTypes(request: Request, days: number = 30) {
  try {
    // Según la documentación de Swagger, esta es la ruta correcta
    const endpoint = `${API_URL}/api/stats/events/types/?days=${days}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo tipos de eventos: ${response.status} ${response.statusText}`);
      // Si hay un error, intentemos obtener los datos del endpoint de dashboard como alternativa
      return getEventTypesFromDashboard(request, days);
    }
    
    // Esta respuesta es un array directo de objetos {type, count, percentage}
    const eventTypes = await response.json();
    return { 
      eventTypes, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo tipos de eventos:', error);
    // En caso de error, intentemos obtener los datos del endpoint de dashboard como alternativa
    return getEventTypesFromDashboard(request, days);
  }
}

/**
 * Obtiene tipos de eventos desde el endpoint de dashboard como fallback
 */
async function getEventTypesFromDashboard(request: Request, days: number = 30) {
  try {
    const endpoint = `${API_URL}/api/stats/dashboard/events/?days=${days}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo tipos de eventos desde dashboard: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    // La respuesta del dashboard contiene event_types dentro del objeto
    const dashboardData = await response.json();
    const eventTypes = dashboardData.event_types || [];
    
    return { 
      eventTypes, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo tipos de eventos desde dashboard:', error);
    return { eventTypes: [], headers: new Headers() };
  }
}

// Utility function - Get session ID from cookies or generate one
export function getOrCreateSessionId(request: Request): string {
  // Verificar cookies en busca de un ID de sesión existente
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";").map(cookie => cookie.trim());
  const sessionCookie = cookies.find(cookie => cookie.startsWith("l360_stats_sid="));
  
  if (sessionCookie) {
    return sessionCookie.split("=")[1];
  }
  
  // No se encontró ningún ID de sesión, crear uno nuevo
  return uuid();
}

// Helper function to generate mock time series data
function generateMockTimeSeriesData(params: {
  start_date: string;
  end_date: string;
  interval?: string;
  type?: string;
}) {
  const start = new Date(params.start_date);
  const end = new Date(params.end_date);
  
  const data = [];
  const currentDate = new Date(start);
  
  // Determinar tamaño del paso según el intervalo
  let step = 1;
  let stepUnit: 'day' | 'month' = 'day';
  
  if (params.interval === 'week') {
    step = 7;
  } else if (params.interval === 'month') {
    stepUnit = 'month';
  }
  
  // Generar puntos de datos
  while (currentDate <= end) {
    data.push({
      period: currentDate.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 50) + 10,
      type: params.type || 'all'
    });
    
    // Avanzar al siguiente período
    if (stepUnit === 'day') {
      currentDate.setDate(currentDate.getDate() + step);
    } else {
      currentDate.setMonth(currentDate.getMonth() + step);
    }
  }
  
  return data;
}
