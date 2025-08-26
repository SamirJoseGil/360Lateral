// filepath: d:\Accesos Directos\Escritorio\frontendx\app\services\lotes.server.ts
import { API_URL, fetchWithAuth } from "~/utils/auth.server";

// Tipos y interfaces
export type Lote = {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion: string;
  area: number;
  codigo_catastral?: string;
  matricula?: string;
  cbml?: string;
  latitud?: number;
  longitud?: number;
  estrato?: number;
  owner: {
    id: string;
    name: string;
    email?: string;
  };
  tratamiento_pot?: string;
  uso_suelo?: string;
  status: "active" | "pending" | "archived";
  created_at: string;
  updated_at?: string;
};

export type LoteStats = {
  total: number;
  area_total: number;
  por_estado: {
    active: number;
    pending: number;
    archived: number;
  };
  por_estrato: {
    [estrato: string]: number;
  };
  documentacion_completa: number;
};

export type LotesResponse = {
  count: number;
  user_id?: string;
  user_name?: string;
  results: Lote[];
};

// Obtener los lotes del usuario autenticado
export async function getMisLotes(request: Request, searchQuery?: string) {
  console.log(`Obteniendo lotes propios ${searchQuery ? `con búsqueda: ${searchQuery}` : ''}`);
  
  try {
    // Construir endpoint con parámetros de búsqueda si es necesario
    let endpoint = `${API_URL}/api/lotes/mis-lotes/`;
    
    if (searchQuery) {
      endpoint += `?search=${encodeURIComponent(searchQuery)}`;
    }
    
    console.log(`[Lotes] Fetching from endpoint: ${endpoint}`);
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      throw new Error(`Error al obtener lotes: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Datos recibidos: { hasResults: ${!!data}, count: ${data.count || 0} }`);
    
    return {
      count: data.count || 0,
      results: data.results || [],
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Lotes] Error obteniendo lotes:", error);
    throw error;
  }
}

// Obtener estadísticas de lotes de un usuario (con fallback para el endpoint faltante)
export async function getUserLotesStats(request: Request, userId?: string) {
  console.log(`Obteniendo estadísticas de lotes ${userId ? `del usuario ${userId}` : 'propios'}`);
  
  try {
    // Definir el endpoint según si es el usuario autenticado u otro usuario
    let endpoint = userId
      ? `${API_URL}/api/lotes/usuario/${userId}/stats/`
      : `${API_URL}/api/lotes/mis-lotes/stats/`;
      
    console.log(`[Lotes] Fetching stats from endpoint: ${endpoint}`);
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    // Si la respuesta no es exitosa (lo que ocurre si el endpoint no existe)
    if (!response.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      
      // Si es un 404, significa que el endpoint no existe, generamos estadísticas a partir de los lotes
      if (response.status === 404) {
        console.log("[Lotes] Endpoint de estadísticas no encontrado, generando estadísticas a partir de lotes");
        return await generateStatsFromLotes(request, userId);
      }
      
      const errorText = await response.text();
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      throw new Error(`Error al obtener estadísticas: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("[Lotes] Estadísticas recibidas:", data);
    
    return {
      stats: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Lotes] Error obteniendo estadísticas:", error);
    
    // Si es cualquier error, intentamos generar estadísticas
    try {
      return await generateStatsFromLotes(request, userId);
    } catch (fallbackError) {
      console.error("[Lotes] Error al generar estadísticas de respaldo:", fallbackError);
      throw error; // Lanzar el error original
    }
  }
}

// Función de respaldo para generar estadísticas a partir de los lotes si el endpoint no existe
async function generateStatsFromLotes(request: Request, userId?: string) {
  console.log("[Lotes] Generando estadísticas a partir de los lotes");
  
  // Obtenemos los lotes primero
  let lotesResponse;
  
  if (userId) {
    // Si se especificó un usuario, obtenemos sus lotes
    const endpoint = `${API_URL}/api/lotes/usuario/${userId}/`;
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      throw new Error(`Error al obtener lotes del usuario ${userId}: ${response.statusText}`);
    }
    
    lotesResponse = {
      data: await response.json(),
      headers: setCookieHeaders
    };
  } else {
    // Si no se especificó, usamos los lotes del usuario autenticado
    lotesResponse = await getMisLotes(request);
  }
  
  const lotes = lotesResponse.results || [];
  
  // Calcular estadísticas basadas en los lotes disponibles
  const stats: LoteStats = {
    total: lotes.length,
    area_total: lotes.reduce((sum: number, lote: Lote) => sum + (lote.area || 0), 0),
    por_estado: {
      active: lotes.filter((lote: Lote) => lote.status === 'active').length,
      pending: lotes.filter((lote: Lote) => lote.status === 'pending').length,
      archived: lotes.filter((lote: Lote) => lote.status === 'archived').length
    },
    por_estrato: {},
    documentacion_completa: 0 // No tenemos info sobre documentación, así que lo dejamos en 0
  };
  
  // Calcular cantidad por estrato
  lotes.forEach((lote: Lote) => {
    if (lote.estrato) {
      const estrato = lote.estrato.toString();
      stats.por_estrato[estrato] = (stats.por_estrato[estrato] || 0) + 1;
    }
  });
  
  return {
    stats,
    headers: lotesResponse.headers
  };
}

// Obtener un lote específico por ID
export async function getLoteById(request: Request, loteId: string) {
  console.log(`Obteniendo detalles del lote ${loteId}`);
  
  try {
    const endpoint = `${API_URL}/api/lotes/${loteId}/`;
    console.log(`[Lotes] Fetching from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      throw new Error(`Error al obtener detalles del lote: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Detalles recibidos para lote ${loteId}`);
    
    return {
      lote: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[Lotes] Error obteniendo detalles del lote ${loteId}:`, error);
    throw error;
  }
}

// Crear un nuevo lote
export async function createLote(request: Request, loteData: Omit<Lote, 'id' | 'created_at' | 'updated_at'>) {
  console.log(`Creando nuevo lote: ${loteData.nombre}`);
  
  try {
    const endpoint = `${API_URL}/api/lotes/`;
    console.log(`[Lotes] POSTing to endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loteData)
    });
    
    if (!response.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      throw new Error(`Error al crear lote: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Lote creado con ID: ${data.id}`);
    
    return {
      lote: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Lotes] Error creando lote:", error);
    throw error;
  }
}

// Actualizar un lote existente
export async function updateLote(request: Request, loteId: string, loteData: Partial<Lote>) {
  console.log(`Actualizando lote ${loteId}`);
  
  try {
    const endpoint = `${API_URL}/api/lotes/${loteId}/`;
    console.log(`[Lotes] PATCHing to endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'PATCH', // Usar PATCH para actualización parcial
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loteData)
    });
    
    if (!response.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      throw new Error(`Error al actualizar lote: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Lote ${loteId} actualizado`);
    
    return {
      lote: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[Lotes] Error actualizando lote ${loteId}:`, error);
    throw error;
  }
}

// Eliminar un lote
export async function deleteLote(request: Request, loteId: string) {
  console.log(`Eliminando lote ${loteId}`);
  
  try {
    const endpoint = `${API_URL}/api/lotes/${loteId}/`;
    console.log(`[Lotes] DELETEing at endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      throw new Error(`Error al eliminar lote: ${response.statusText}`);
    }
    
    console.log(`[Lotes] Lote ${loteId} eliminado correctamente`);
    
    return {
      success: true,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[Lotes] Error eliminando lote ${loteId}:`, error);
    throw error;
  }
}

// Obtener tratamientos POT disponibles
export async function getTratamientosPOT(request: Request) {
  console.log("Obteniendo tratamientos POT disponibles");
  
  try {
    const endpoint = `${API_URL}/api/lotes/tratamientos/`;
    console.log(`[Lotes] Fetching tratamientos from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      throw new Error(`Error al obtener tratamientos POT: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Tratamientos POT recibidos: ${data.length || 0}`);
    
    return {
      tratamientos: data,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Lotes] Error obteniendo tratamientos POT:", error);
    
    // Si hay un error, devolver un array de fallback con datos comunes
    const fallbackTratamientos = [
      { id: 1, nombre: "Renovación urbana" },
      { id: 2, nombre: "Desarrollo" },
      { id: 3, nombre: "Consolidación" },
      { id: 4, nombre: "Conservación" },
      { id: 5, nombre: "Mejoramiento Integral" }
    ];
    
    console.log("[Lotes] Usando tratamientos POT de fallback");
    
    return {
      tratamientos: fallbackTratamientos,
      headers: {}
    };
  }
}