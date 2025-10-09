import { fetchWithAuth, getAccessTokenFromCookies } from "~/utils/auth.server";

// Constante para la URL base de la API
const API_URL = process.env.API_URL || "http://localhost:8000";

// Generar UUID simple para sesiones
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Tipos actualizados según la documentación del API
export interface EventData {
  type: 'view' | 'search' | 'action' | 'api' | 'error' | 'other';
  name: string;
  value?: Record<string, any>;
}

export interface DashboardStats {
  users: {
    total: number;
  };
  lotes: {
    total: number;
    activos: number;
    inactivos: number;
  };
  documentos: {
    total: number;
    pendientes: number;
    aceptados: number;
    rechazados: number;
  };
  actividad_reciente: {
    recent_events: Array<any>;
    active_users: number;
    activity_by_type: Record<string, number>;
  };
  summary: {
    total_usuarios: number;
    proyectos_activos: number;
    pendientes_validacion: number;
    eventos_recientes: number;
  };
}

export interface EventsDashboard {
  total_events: number;
  event_types: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  daily_events: Array<{
    date: string;
    count: number;
  }>;
  period_days: number;
}

export interface ChartData {
  lotes_summary: {
    total: number;
    activos: number;
    inactivos: number;
  };
  documents_count: number;
  documents_by_month: Array<{
    mes: string;
    count: number;
    valor: number;
  }>;
  event_distribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

// === FUNCIONES PRINCIPALES SEGÚN DOCUMENTACIÓN ===

// Función para registrar un evento estadístico
export async function recordEvent(request: Request, eventData: EventData) {
  try {
    // ✅ TEMPORAL: Deshabilitar stats hasta que se arregle la BD
    console.log("[Stats] Event recording disabled temporarily:", eventData);
    return;
    
    // ✅ CÓDIGO ORIGINAL (comentado temporalmente)
    /*
    const response = await fetch(`${API_URL}/api/stats/events/record/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });
    // ...rest of original code...
    */
  } catch (error) {
    console.warn("[Stats] Error recording event (ignored):", error);
  }
}

// Función para obtener el dashboard general de estadísticas
export async function getDashboardStats(request: Request, days: number = 30) {
  console.log(`[Stats] Obteniendo dashboard general (${days} días)`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/dashboard/?days=${days}`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo dashboard: ${res.status}`);
      throw new Error(`Error fetching dashboard: ${res.status}`);
    }

    const dashboardStats = await res.json();

    return {
      dashboardStats,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getDashboardStats:", error);
    throw error;
  }
}

// Función para obtener resumen del dashboard
export async function getDashboardSummary(request: Request) {
  console.log("[Stats] Obteniendo resumen del dashboard");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/dashboard/summary/`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo resumen: ${res.status}`);
      throw new Error(`Error fetching dashboard summary: ${res.status}`);
    }

    const dashboardSummary = await res.json();

    return {
      dashboardSummary,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getDashboardSummary:", error);
    throw error;
  }
}

// Función para obtener estadísticas de eventos
export async function getEventsDashboard(request: Request, days: number = 30) {
  console.log(`[Stats] Obteniendo dashboard de eventos (${days} días)`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/events/dashboard/?days=${days}`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo dashboard de eventos: ${res.status}`);
      throw new Error(`Error fetching events dashboard: ${res.status}`);
    }

    const eventsDashboard = await res.json();

    return {
      eventsDashboard,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getEventsDashboard:", error);
    throw error;
  }
}

// Función para obtener eventos diarios
export async function getDailyEvents(request: Request, days: number = 30) {
  console.log(`[Stats] Obteniendo eventos diarios (${days} días)`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/events/daily/?days=${days}`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo eventos diarios: ${res.status}`);
      throw new Error(`Error fetching daily events: ${res.status}`);
    }

    const dailyEvents = await res.json();

    return {
      dailyEvents: dailyEvents.daily_counts || [],
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getDailyEvents:", error);
    throw error;
  }
}

// Función para obtener conteos de eventos por tipo
export async function getEventsCounts(request: Request, days: number = 30) {
  console.log(`[Stats] Obteniendo conteos de eventos (${days} días)`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/events/counts/?days=${days}`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo conteos de eventos: ${res.status}`);
      throw new Error(`Error fetching events counts: ${res.status}`);
    }

    const eventsCounts = await res.json();

    return {
      eventsCounts,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getEventsCounts:", error);
    throw error;
  }
}

// Función para obtener tipos de eventos
export async function getEventTypes(request: Request, days: number = 30) {
  console.log(`[Stats] Obteniendo tipos de eventos (${days} días)`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/events/types/?days=${days}`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo tipos de eventos: ${res.status}`);
      throw new Error(`Error fetching event types: ${res.status}`);
    }

    const eventTypes = await res.json();

    return {
      eventTypes: eventTypes.distribution || [],
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getEventTypes:", error);
    throw error;
  }
}

// Función para obtener actividad del usuario
export async function getUserActivity(request: Request, days: number = 30) {
  console.log(`[Stats] Obteniendo actividad del usuario (${days} días)`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/user-activity/?days=${days}`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo actividad del usuario: ${res.status}`);
      throw new Error(`Error fetching user activity: ${res.status}`);
    }

    const activity = await res.json();

    return {
      activity,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getUserActivity:", error);
    throw error;
  }
}

// Función para obtener actividad reciente
export async function getRecentActivity(request: Request, days: number = 7, limit: number = 10) {
  console.log(`[Stats] Obteniendo actividad reciente (${days} días, ${limit} items)`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/dashboard/recent-activity/?days=${days}&limit=${limit}`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo actividad reciente: ${res.status}`);
      throw new Error(`Error fetching recent activity: ${res.status}`);
    }

    const recentActivity = await res.json();

    return {
      recentActivity,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getRecentActivity:", error);
    throw error;
  }
}

// === FUNCIONES PARA GRÁFICOS ===

// Función para obtener todos los datos de gráficos
export async function getAllChartData(request: Request) {
  console.log("[Stats] Obteniendo todos los datos de gráficos");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/charts/`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo datos de gráficos: ${res.status}`);
      throw new Error(`Error fetching chart data: ${res.status}`);
    }

    const chartData = await res.json();

    return {
      chartData,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getAllChartData:", error);
    throw error;
  }
}

// Función para obtener resumen de lotes
export async function getLotesSummary(request: Request) {
  console.log("[Stats] Obteniendo resumen de lotes");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/charts/lotes-summary/`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo resumen de lotes: ${res.status}`);
      throw new Error(`Error fetching lotes summary: ${res.status}`);
    }

    const lotesSummary = await res.json();

    return {
      lotesSummary,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getLotesSummary:", error);
    throw error;
  }
}

// Función para obtener conteo de documentos
export async function getDocumentsCount(request: Request) {
  console.log("[Stats] Obteniendo conteo de documentos");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/charts/documents-count/`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo conteo de documentos: ${res.status}`);
      throw new Error(`Error fetching documents count: ${res.status}`);
    }

    const documentsCount = await res.json();

    return {
      documentsCount,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getDocumentsCount:", error);
    throw error;
  }
}

// Función para obtener documentos por mes
export async function getDocumentsByMonth(request: Request, year?: number) {
  console.log(`[Stats] Obteniendo documentos por mes${year ? ` (año ${year})` : ''}`);
  
  try {
    const endpoint = year 
      ? `${API_URL}/api/stats/charts/documents-by-month/?year=${year}`
      : `${API_URL}/api/stats/charts/documents-by-month/`;
      
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo documentos por mes: ${res.status}`);
      throw new Error(`Error fetching documents by month: ${res.status}`);
    }

    const documentsByMonth = await res.json();

    return {
      documentsByMonth,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getDocumentsByMonth:", error);
    throw error;
  }
}

// Función para obtener distribución de eventos
export async function getEventDistribution(request: Request) {
  console.log("[Stats] Obteniendo distribución de eventos");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/charts/event-distribution/`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo distribución de eventos: ${res.status}`);
      
      // Fallback: intentar obtener desde el endpoint de eventos
      try {
        const fallbackRes = await fetchWithAuth(request, `${API_URL}/api/stats/events/types/`);
        if (fallbackRes.res.ok) {
          const fallbackData = await fallbackRes.res.json();
          return {
            eventDistribution: { distribution: fallbackData },
            headers: fallbackRes.setCookieHeaders
          };
        }
      } catch (fallbackError) {
        console.error("[Stats] Fallback también falló:", fallbackError);
      }
      
      throw new Error(`Error fetching event distribution: ${res.status}`);
    }

    const eventDistribution = await res.json();

    return {
      eventDistribution,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getEventDistribution:", error);
    throw error;
  }
}

// === FUNCIONES ESPECÍFICAS PARA USUARIOS ===

// Función para obtener estadísticas de usuarios
export async function getUsersStats(request: Request) {
  console.log("[Stats] Obteniendo estadísticas de usuarios");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/dashboard/users/`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo estadísticas de usuarios: ${res.status}`);
      throw new Error(`Error fetching users stats: ${res.status}`);
    }

    const usersStats = await res.json();

    return {
      usersStats,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getUsersStats:", error);
    throw error;
  }
}

// Función para obtener estadísticas de lotes
export async function getLotesStats(request: Request) {
  console.log("[Stats] Obteniendo estadísticas de lotes");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/dashboard/lotes/`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo estadísticas de lotes: ${res.status}`);
      throw new Error(`Error fetching lotes stats: ${res.status}`);
    }

    const lotesStats = await res.json();

    return {
      lotesStats,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getLotesStats:", error);
    throw error;
  }
}

// Función para obtener estadísticas de documentos
export async function getDocumentosStats(request: Request) {
  console.log("[Stats] Obteniendo estadísticas de documentos");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/dashboard/documentos/`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo estadísticas de documentos: ${res.status}`);
      throw new Error(`Error fetching documentos stats: ${res.status}`);
    }

    const documentosStats = await res.json();

    return {
      documentosStats,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getDocumentosStats:", error);
    throw error;
  }
}

// === FUNCIONES DE UTILIDAD ===

// Función para obtener estadísticas a lo largo del tiempo
export async function getStatsOverTime(request: Request, options: {
  start_date?: string;
  end_date?: string;
  interval?: 'day' | 'week' | 'month';
  type?: string;
}) {
  console.log(`[Stats] Obteniendo estadísticas a lo largo del tiempo: ${JSON.stringify(options)}`);
  
  try {
    // Construir parámetros de consulta
    const params = new URLSearchParams();
    if (options.start_date) params.append('start_date', options.start_date);
    if (options.end_date) params.append('end_date', options.end_date);
    if (options.interval) params.append('interval', options.interval);
    if (options.type) params.append('type', options.type);

    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/stats/over-time/?${params.toString()}`);

    if (!res.ok) {
      console.error(`[Stats] Error obteniendo estadísticas a lo largo del tiempo: ${res.status}`);
      throw new Error(`Error fetching stats over time: ${res.status}`);
    }

    const timeSeriesData = await res.json();

    return {
      timeSeriesData,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error in getStatsOverTime:", error);
    throw error;
  }
}

// Utility function - Get session ID from cookies or generate one
export function getOrCreateSessionId(request: Request): string {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";").map(cookie => cookie.trim());
  const sessionCookie = cookies.find(cookie => cookie.startsWith("l360_stats_sid="));
  
  if (sessionCookie) {
    return sessionCookie.split("=")[1];
  }
  
  return uuid();
}