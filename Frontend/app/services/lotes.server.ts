import { API_URL } from "~/utils/api.server";
import { fetchWithAuth, getAccessTokenFromCookies } from "~/utils/auth.server";

// Define interfaces for the backend models
export interface Lote {
  id?: number; // Only optional when creating
  nombre: string;
  cbml: string;
  direccion: string;
  area?: number;
  descripcion?: string;
  matricula?: string;
  codigo_catastral?: string;
  barrio?: string;
  estrato?: number;
  latitud?: number;
  longitud?: number;
  tratamiento_pot?: string;
  uso_suelo?: string;
  clasificacion_suelo?: string;
  metadatos?: Record<string, any>;
  status?: string;
  owner?: number | string;
  created_at?: string;
  updated_at?: string;
  fecha_creacion?: string;
  // Nuevos campos para documentación requerida
  doc_ctl_subido?: boolean;
  doc_planos_subido?: boolean;
  doc_topografia_subido?: boolean;
  limite_tiempo_docs?: string;
  tiempo_restante?: number; // En segundos
  documentos_requeridos?: {
    ctl: boolean;
    planos: boolean;
    topografia: boolean;
  };
}

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

// Obtener los lotes del usuario autenticado usando el endpoint correcto
export async function getMisLotes(request: Request, searchQuery?: string) {
  console.log(`Obteniendo lotes propios ${searchQuery ? `con búsqueda: ${searchQuery}` : ''}`);
  
  try {
    // Construir endpoint con parámetros de búsqueda según la documentación
    let endpoint = `${API_URL}/api/lotes/lotes/`;
    
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
    
    // Ensure we're returning the results array from the API
    return { 
      lotes: data.results || [], 
      count: data.count || 0,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error obteniendo lotes:", error);
    throw error;
  }
}

/**
 * Obtener lotes de un usuario específico (admin only)
 */
export async function getUserLotes(request: Request, userId: string, filters?: {
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let endpoint = `${API_URL}/api/lotes/usuario/${userId}/`;
    
    // Build query parameters
    if (filters) {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    console.log(`[Lotes] Fetching user lotes from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Lotes] Error fetching user lotes:`, response.status, errorText);
      throw new Error(`Error fetching user lotes: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Received ${data.results?.length || 0} user lotes`);
    
    return { 
      lotes: data.results || [], 
      count: data.count || 0,
      next: data.next,
      previous: data.previous,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error in getUserLotes:", error);
    throw error;
  }
}

/**
 * Obtener todos los lotes (admin only)
 */
export async function getAllLotes(request: Request, filters?: {
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let endpoint = `${API_URL}/api/lotes/`;
    
    // Build query parameters
    if (filters) {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    console.log(`[Lotes] Fetching all lotes from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Lotes] Error fetching all lotes:`, response.status, errorText);
      throw new Error(`Error fetching all lotes: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Received ${data.results?.length || 0} lotes`);
    
    return { 
      lotes: data.results || [], 
      count: data.count || 0,
      next: data.next,
      previous: data.previous,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error in getAllLotes:", error);
    throw error;
  }
}

/**
 * Búsqueda avanzada de lotes con filtros
 */
export async function searchLotes(request: Request, filters: {
  search?: string;
  area_min?: number;
  area_max?: number;
  estrato?: number;
  barrio?: string;
  uso_suelo?: string;
  clasificacion_suelo?: string;
  tratamiento_pot?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let endpoint = `${API_URL}/api/lotes/search/`;
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.area_min) params.append('area_min', filters.area_min.toString());
    if (filters.area_max) params.append('area_max', filters.area_max.toString());
    if (filters.estrato) params.append('estrato', filters.estrato.toString());
    if (filters.barrio) params.append('barrio', filters.barrio);
    if (filters.uso_suelo) params.append('uso_suelo', filters.uso_suelo);
    if (filters.clasificacion_suelo) params.append('clasificacion_suelo', filters.clasificacion_suelo);
    if (filters.tratamiento_pot) params.append('tratamiento_pot', filters.tratamiento_pot);
    if (filters.ordering) params.append('ordering', filters.ordering);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    
    console.log(`[Lotes] Searching lotes from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Lotes] Error searching lotes:`, response.status, errorText);
      throw new Error(`Error searching lotes: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Found ${data.results?.length || 0} lotes matching search criteria`);
    
    return { 
      lotes: data.results || [], 
      count: data.count || 0,
      next: data.next,
      previous: data.previous,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error in searchLotes:", error);
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
      : `${API_URL}/api/lotes/lotes/stats/`;
      
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
  
  const lotes =
    Array.isArray((lotesResponse as any).lotes)
      ? (lotesResponse as any).lotes
      : Array.isArray((lotesResponse as any).data)
      ? (lotesResponse as any).data
      : [];
  
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

/**
 * Función para obtener tratamientos POT usando el servicio POT dedicado
 */
export async function getTratamientosPOT(request: Request) {
  try {
    // Importar y usar el servicio POT dedicado
    const { getTratamientosActivosPOT } = await import("~/services/pot.server");
    
    console.log(`[POT] Obteniendo tratamientos POT activos`);
    
    const resultado = await getTratamientosActivosPOT(request);
    
    console.log(`[POT] Se obtuvieron ${resultado.tratamientos.length} tratamientos POT`);
    
    return { 
      tratamientos: resultado.tratamientos, 
      headers: resultado.headers 
    };
  } catch (error) {
    console.error("[POT] Error obteniendo tratamientos POT:", error);
    // Intentar con función alternativa en caso de error
    return await getTratamientosPOTFromList(request);
  }
}

/**
 * Función alternativa para obtener tratamientos usando el endpoint de lista JSON
 */
async function getTratamientosPOTFromList(request: Request) {
  try {
    // En caso de que el endpoint principal no funcione, cargar desde archivo estático
    const tratamientosPredefinidos = [
      { codigo: 'CN1', nombre: 'Consolidación Nivel 1', descripcion: 'Tratamiento de consolidación urbanística nivel 1' },
      { codigo: 'CN2', nombre: 'Consolidación Nivel 2', descripcion: 'Tratamiento de consolidación urbanística nivel 2' },
      { codigo: 'CN3', nombre: 'Consolidación Nivel 3', descripcion: 'Tratamiento de consolidación urbanística nivel 3' },
      { codigo: 'CN4', nombre: 'Consolidación Nivel 4', descripcion: 'Tratamiento de consolidación urbanística nivel 4' },
      { codigo: 'R', nombre: 'Redesarrollo', descripcion: 'Tratamiento de redesarrollo urbano' },
      { codigo: 'D', nombre: 'Desarrollo', descripcion: 'Tratamiento de desarrollo urbano' },
      { codigo: 'C', nombre: 'Conservación', descripción: 'Tratamiento de conservación patrimonial' }
    ];
    
    console.log(`[POT] Usando tratamientos predefinidos: ${tratamientosPredefinidos.length} elementos`);
    
    return { 
      tratamientos: tratamientosPredefinidos, 
      headers: new Headers() 
    };
  } catch (error) {
    console.error("[POT] Error cargando tratamientos predefinidos:", error);
    return { tratamientos: [], headers: new Headers() };
  }
}

/**
 * Obtener tratamiento POT por CBML usando el servicio POT dedicado
 */
export async function getTratamientoPorCBML(request: Request, cbml: string) {
  try {
    // Importar y usar el servicio POT dedicado
    const { getNormativaPorCBML } = await import("~/services/pot.server");
    
    console.log(`[POT] Obteniendo normativa POT por CBML ${cbml}`);
    
    const resultado = await getNormativaPorCBML(request, cbml);
    
    console.log(`[POT] Normativa POT recibida para CBML ${cbml}`);
    
    return {
      tratamiento: {
        ...resultado.normativa,
        encontrado: resultado.normativa.codigo_tratamiento !== ""
      },
      headers: resultado.headers
    };
  } catch (error) {
    console.error(`[POT] Error obteniendo normativa POT para CBML ${cbml}:`, error);
    // En caso de error, devolver un objeto que indique que no se encontraron datos
    return {
      tratamiento: {
        encontrado: false,
        mensaje: "Error al obtener normativa POT",
        error: error instanceof Error ? error.message : String(error)
      },
      headers: new Headers()
    };
  }
}

/**
 * Calcular aprovechamiento urbanístico según tratamiento POT usando el servicio POT dedicado
 */
export async function calcularAprovechamiento(request: Request, data: {
  codigo_tratamiento?: string;
  area_lote?: number;
  tipologia?: string;
}) {
  try {
    // Importar y usar el servicio POT dedicado
    const { calcularAprovechamiento: calcularAprovechamientoPOT } = await import("~/services/pot.server");
    
    console.log(`[POT] Calculando aprovechamiento con servicio POT`);
    
    // Validar datos requeridos
    if (!data.codigo_tratamiento || !data.area_lote || !data.tipologia) {
      throw new Error("Se requieren codigo_tratamiento, area_lote y tipologia para calcular aprovechamiento");
    }
    
    const resultado = await calcularAprovechamientoPOT(request, {
      codigo_tratamiento: data.codigo_tratamiento,
      area_lote: data.area_lote,
      tipologia: data.tipologia
    });
    
    console.log(`[POT] Cálculo de aprovechamiento completado`);
    
    return {
      calculo: resultado.calculo,
      headers: resultado.headers
    };
  } catch (error) {
    console.error(`[POT] Error calculando aprovechamiento:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo lote en el sistema usando el endpoint correcto
 */
export async function createLote(request: Request, loteData: any) {
  try {
    console.log("[Lotes] Creando lote con datos:", loteData);
    
    // Usar el endpoint correcto según la documentación: POST /api/lotes/
    const endpoint = `${API_URL}/api/lotes/`;
    
    console.log(`[Lotes] Creando lote con endpoint: ${endpoint}`);

    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loteData),
    });

    if (!res.ok) {
      console.error(`[Lotes] Error creando lote: ${res.status} ${res.statusText}`);
      
      try {
        const errorData = await res.json();
        console.error("[Lotes] Detalles del error:", errorData);
        
        const errorMessage = errorData.error || errorData.message || errorData.detail || 
                           JSON.stringify(errorData) || `Error en la solicitud: ${res.status} ${res.statusText}`;
        
        throw new Error(errorMessage);
      } catch (jsonError) {
        throw new Error(`Error en la solicitud: ${res.status} ${res.statusText}`);
      }
    }

    const result = await res.json();
    console.log(`[Lotes] Lote creado exitosamente:`, result);
    return { lote: result, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Lotes] Error en createLote:", error);
    throw error;
  }
}

/**
 * Crear lote desde datos de MapGIS usando el endpoint especializado
 */
export async function createLoteFromMapGis(request: Request, loteData: any) {
  try {
    console.log("[Lotes] Creando lote desde MapGIS con datos:", loteData);
    
    // Usar el endpoint especializado para crear desde MapGIS
    const endpoint = `${API_URL}/api/lotes/create-from-mapgis/`;
    
    console.log(`[Lotes] Creando lote desde MapGIS con endpoint: ${endpoint}`);

    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loteData),
    });

    if (!res.ok) {
      console.error(`[Lotes] Error creando lote desde MapGIS: ${res.status} ${res.statusText}`);
      
      try {
        const errorData = await res.json();
        console.error("[Lotes] Detalles del error:", errorData);
        
        const errorMessage = errorData.error || errorData.message || errorData.detail || 
                           JSON.stringify(errorData) || `Error en la solicitud: ${res.status} ${res.statusText}`;
        
        throw new Error(errorMessage);
      } catch (jsonError) {
        throw new Error(`Error en la solicitud: ${res.status} ${res.statusText}`);
      }
    }

    const result = await res.json();
    console.log(`[Lotes] Lote creado desde MapGIS exitosamente:`, result);
    return { lote: result, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Lotes] Error en createLoteFromMapGis:", error);
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

// Obtener los datos POT de un lote específico por CBML
export async function getLotePotData(request: Request, cbml: string) {
  console.log(`Obteniendo datos POT para el lote con CBML: ${cbml}`);
  
  try {
    // Endpoint correcto según la documentación
    const endpoint = `${API_URL}/api/pot/normativa/cbml/?cbml=${encodeURIComponent(cbml)}`;
    console.log(`[POT] Fetching from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`[POT] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[POT] Cuerpo de respuesta de error: ${errorText}`);
      
      // Si es un 404, devolvemos un objeto vacío en lugar de lanzar un error
      if (response.status === 404) {
        console.warn(`[POT] No se encontraron datos POT para el CBML ${cbml}, continuando con datos vacíos`);
        return {
          potData: { 
            encontrado: false,
            mensaje: "No se encontraron datos POT para este CBML" 
          },
          headers: setCookieHeaders
        };
      }
      
      throw new Error(`Error al obtener datos POT: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[POT] Datos POT recibidos para CBML ${cbml}`);
    
    return {
      potData: {
        ...data,
        encontrado: true
      },
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[POT] Error obteniendo datos POT para CBML ${cbml}:`, error);
    // En caso de error, devolver un objeto que indique que no se encontraron datos
    return {
      potData: {
        encontrado: false,
        mensaje: "Error al obtener datos POT",
        error: error instanceof Error ? error.message : String(error)
      },
      headers: new Headers()
    };
  }
}

/**
 * SISTEMA DE FAVORITOS - Endpoints según documentación
 */

/**
 * Obtener lotes favoritos del usuario autenticado
 */
export async function getFavoriteLotes(request: Request, filters?: {
  ordering?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let endpoint = `${API_URL}/api/lotes/favorites/`;
    
    // Build query parameters
    if (filters) {
      const params = new URLSearchParams();
      
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    console.log(`[Favorites] Fetching favorite lotes from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Favorites] Error fetching favorite lotes:`, response.status, errorText);
      throw new Error(`Error fetching favorite lotes: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Favorites] Received ${data.results?.length || 0} favorite lotes`);
    
    return { 
      favorites: data.results || [], 
      count: data.count || 0,
      next: data.next,
      previous: data.previous,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Favorites] Error in getFavoriteLotes:", error);
    throw error;
  }
}

/**
 * Agregar lote a favoritos
 */
export async function addLoteToFavorites(request: Request, loteId: number, notes?: string) {
  try {
    const endpoint = `${API_URL}/api/lotes/favorites/`;
    
    console.log(`[Favorites] Adding lote ${loteId} to favorites`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        lote: loteId,
        notes: notes || ''
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Favorites] Error adding to favorites:`, response.status, errorText);
      throw new Error(`Error adding to favorites: ${response.status} ${errorText}`);
    }
    
    const favorite = await response.json();
    console.log(`[Favorites] Lote ${loteId} added to favorites successfully`);
    
    return { favorite, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Favorites] Error in addLoteToFavorites:", error);
    throw error;
  }
}

/**
 * Remover lote de favoritos
 */
export async function removeLoteFromFavorites(request: Request, favoriteId: number) {
  try {
    const endpoint = `${API_URL}/api/lotes/favorites/${favoriteId}/`;
    
    console.log(`[Favorites] Removing favorite ${favoriteId}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Favorites] Error removing from favorites:`, response.status, errorText);
      throw new Error(`Error removing from favorites: ${response.status} ${errorText}`);
    }
    
    console.log(`[Favorites] Favorite ${favoriteId} removed successfully`);
    
    return { success: true, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Favorites] Error in removeLoteFromFavorites:", error);
    throw error;
  }
}

/**
 * Toggle estado de favorito de un lote
 */
export async function toggleLoteFavorite(request: Request, loteId: number) {
  try {
    const endpoint = `${API_URL}/api/lotes/favorites/toggle/`;
    
    console.log(`[Favorites] Toggling favorite status for lote ${loteId}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lote_id: loteId }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Favorites] Error toggling favorite:`, response.status, errorText);
      throw new Error(`Error toggling favorite: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[Favorites] Favorite status toggled for lote ${loteId}:`, result);
    
    return { 
      isFavorite: result.is_favorite,
      message: result.message,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Favorites] Error in toggleLoteFavorite:", error);
    throw error;
  }
}

/**
 * Verificar si un lote es favorito
 */
export async function checkLoteIsFavorite(request: Request, loteId: number) {
  try {
    const endpoint = `${API_URL}/api/lotes/favorites/check/?lote_id=${loteId}`;
    
    console.log(`[Favorites] Checking if lote ${loteId} is favorite`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Favorites] Error checking favorite status:`, response.status, errorText);
      throw new Error(`Error checking favorite status: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[Favorites] Favorite status for lote ${loteId}:`, result);
    
    return { 
      isFavorite: result.is_favorite,
      favoriteId: result.favorite_id,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Favorites] Error in checkLoteIsFavorite:", error);
    throw error;
  }
}