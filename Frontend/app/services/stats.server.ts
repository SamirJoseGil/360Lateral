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

// Función para obtener la actividad del usuario actual
export async function getUserActivity(request: Request, days?: number) {
  console.log(`[Stats] Obteniendo actividad del usuario: ${days || 30} días`);
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const headers = new Headers();
    
    // Sin token, no se puede obtener actividad del usuario
    if (!token) {
      return { activity: null, headers };
    }
    
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/user/?days=${days || 30}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      return { activity: null, headers };
    }
    
    const data = await response.json();
    
    return {
      activity: data,
      headers
    };
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return { 
      activity: null, 
      headers: new Headers() 
    };
  }
}

// Función para obtener estadísticas del dashboard administrativo (solo admin)
export async function getAdminDashboardStats(request: Request, days?: number) {
  console.log(`[Stats] Obteniendo estadísticas de dashboard admin: ${days || 30} días`);
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const headers = new Headers();
    
    if (process.env.NODE_ENV === "development" || !token) {
      // Devolver datos simulados
      return {
        dashboardStats: {
          unique_users: 128,
          daily_data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            metrics: {
              total_events: 45 + Math.floor(Math.random() * 20),
              events_by_type: {
                view: 20 + Math.floor(Math.random() * 10),
                search: 15 + Math.floor(Math.random() * 10),
                action: 5 + Math.floor(Math.random() * 5),
                error: 5 + Math.floor(Math.random() * 5)
              }
            }
          })),
          total_events: 1200
        },
        headers
      };
    }
    
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/dashboard/`, {
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
      dashboardStats: data,
      headers
    };
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return { 
      dashboardStats: {
        unique_users: 0,
        daily_data: [],
        total_events: 0
      }, 
      headers: new Headers() 
    };
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
 * Obtiene actividad reciente para el dashboard
 */
export async function getRecentActivity(request: Request, days: number = 7) {
  console.log(`[Stats] Obteniendo actividad reciente de los últimos ${days} días`);
  
  try {
    const token = await getAccessTokenFromCookies(request);
    const headers = new Headers();
    
    if (process.env.NODE_ENV === "development" || !token) {
      return {
        recentActivity: {
          recent_events: [
            {
              id: 3201,
              type: "view",
              name: "lote_detail",
              timestamp: new Date().toISOString(),
              user_id: 1
            },
            {
              id: 3200,
              type: "search",
              name: "search_lotes",
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              user_id: 1
            }
          ],
          active_users: 25,
          activity_by_type: {
            view: 320,
            search: 145,
            action: 80,
            api: 35,
            error: 12,
            other: 5
          }
        },
        headers
      };
    }
    
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/dashboard/recent-activity/?days=${days}`, {
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
      recentActivity: data,
      headers
    };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return { 
      recentActivity: {
        recent_events: [],
        active_users: 0,
        activity_by_type: {}
      }, 
      headers: new Headers() 
    };
  }
}

// Nueva función para obtener el resumen del dashboard
export async function getDashboardSummary(request: Request) {
  try {
    const endpoint = `${API_URL}/api/stats/dashboard/summary/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo resumen del dashboard: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    const summary = await response.json();
    return { 
      summary, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo resumen del dashboard:', error);
    throw error;
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
export async function getDocumentsByMonth(request: Request) {
  try {
    const endpoint = `${API_URL}/api/stats/charts/documents-by-month/`;
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
    const endpoint = `${API_URL}/api/stats/events/dashboard/?days=${days}`;
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
    const endpoint = `${API_URL}/api/stats/events/counts/?days=${days}`;
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
    const endpoint = `${API_URL}/api/stats/events/daily/?days=${days}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo eventos diarios: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    // Esta respuesta es un array directo de objetos {date, count}
    const dailyEvents = await response.json();
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
    const endpoint = `${API_URL}/api/stats/events/types/?days=${days}`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`Error obteniendo tipos de eventos: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
    }
    
    // Esta respuesta es un array directo de objetos {type, count, percentage}
    const eventTypes = await response.json();
    return { 
      eventTypes, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error('Error obteniendo tipos de eventos:', error);
    throw error;
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
