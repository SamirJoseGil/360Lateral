import { API_URL, fetchWithAuth } from "~/utils/auth.server";

// Constante para la URL base de la API de estadísticas
const STATS_API_URL = `${API_URL}/api/stats`;

// Tipos para las estadísticas
export interface EventData {
  type: 'view' | 'search' | 'action' | 'api' | 'error' | 'other';
  name: string;
  value?: Record<string, any>;
  session_id?: string;
}

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
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${STATS_API_URL}/events/record/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    
    if (!res.ok) {
      console.error(`[Stats] Error registrando evento: ${res.status}`);
      throw new Error(`Error registrando evento: ${res.status}`);
    }
    
    const data = await res.json();
    return {
      event: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error en recordEvent:", error);
    // No lanzamos error para evitar interrumpir el flujo de la aplicación
    return {
      event: null,
      headers: new Headers()
    };
  }
}

// Función para obtener el resumen diario más reciente
export async function getLatestSummary(request: Request) {
  console.log("[Stats] Obteniendo resumen diario más reciente");
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${STATS_API_URL}/summaries/latest/`);
    
    if (!res.ok) {
      console.error(`[Stats] Error obteniendo resumen: ${res.status}`);
      throw new Error(`Error obteniendo resumen: ${res.status}`);
    }
    
    const data = await res.json();
    return {
      summary: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error en getLatestSummary:", error);
    throw error;
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
    // Construir URL con parámetros
    let url = `${STATS_API_URL}/over-time/`;
    const params = new URLSearchParams();
    
    if (options.start_date) params.append('start_date', options.start_date);
    if (options.end_date) params.append('end_date', options.end_date);
    if (options.interval) params.append('interval', options.interval);
    if (options.type) params.append('type', options.type);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, url);
    
    if (!res.ok) {
      console.error(`[Stats] Error obteniendo estadísticas temporales: ${res.status}`);
      throw new Error(`Error obteniendo estadísticas temporales: ${res.status}`);
    }
    
    const data = await res.json();
    return {
      timeSeriesData: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error en getStatsOverTime:", error);
    throw error;
  }
}

// Función para obtener la actividad del usuario actual
export async function getUserActivity(request: Request, days?: number) {
  console.log(`[Stats] Obteniendo actividad del usuario: ${days || 30} días`);
  
  try {
    let url = `${STATS_API_URL}/user-activity/`;
    if (days) url += `?days=${days}`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, url);
    
    if (!res.ok) {
      console.error(`[Stats] Error obteniendo actividad del usuario: ${res.status}`);
      throw new Error(`Error obteniendo actividad del usuario: ${res.status}`);
    }
    
    const data = await res.json();
    return {
      activity: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error en getUserActivity:", error);
    throw error;
  }
}

// Función para obtener estadísticas del dashboard administrativo (solo admin)
export async function getAdminDashboardStats(request: Request, days?: number) {
  console.log(`[Stats] Obteniendo estadísticas de dashboard admin: ${days || 30} días`);
  
  try {
    let url = `${STATS_API_URL}/dashboard/`;
    if (days) url += `?days=${days}`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, url);
    
    if (!res.ok) {
      console.error(`[Stats] Error obteniendo estadísticas de dashboard admin: ${res.status}`);
      throw new Error(`Error obteniendo estadísticas de dashboard admin: ${res.status}`);
    }
    
    const data = await res.json();
    return {
      dashboardStats: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Stats] Error en getAdminDashboardStats:", error);
    throw error;
  }
}

// Función para obtener actividad de un usuario específico (solo admin)
export async function getUserActivityById(request: Request, userId: string, days?: number) {
  console.log(`[Stats] Obteniendo actividad del usuario ${userId}: ${days || 30} días`);
  
  try {
    let url = `${STATS_API_URL}/user-activity/${userId}/`;
    if (days) url += `?days=${days}`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, url);
    
    if (!res.ok) {
      console.error(`[Stats] Error obteniendo actividad del usuario ${userId}: ${res.status}`);
      throw new Error(`Error obteniendo actividad del usuario ${userId}: ${res.status}`);
    }
    
    const data = await res.json();
    return {
      activity: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[Stats] Error en getUserActivityById (${userId}):`, error);
    throw error;
  }
}

// Utility function - Get session ID from cookies or generate one
export function getOrCreateSessionId(request: Request): string {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return generateSessionId();
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('l360_session_id='));
  
  if (sessionCookie) {
    return sessionCookie.split('=')[1];
  }
  
  return generateSessionId();
}

function generateSessionId(): string {
  return `s_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}
