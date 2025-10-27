import { API_URL } from "~/utils/api.server";
import { fetchWithAuth, getAccessTokenFromCookies } from "~/utils/auth.server";

// Define interfaces for the backend models
export interface Lote {
  id?: number;
  nombre: string;
  cbml: string;
  direccion: string;
  area?: number;
  descripcion?: string;
  matricula?: string;
  codigo_catastral?: string;
  barrio?: string;
  // ✅ ELIMINADO: comuna - campo que no existe en el backend
  estrato?: number;
  latitud?: number;
  longitud?: number;
  tratamiento_pot?: string;
  uso_suelo?: string;
  clasificacion_suelo?: string;
  metadatos?: Record<string, any>;
  status?: string;
  estado?: string;  // Backend usa 'estado'
  owner?: number | string;
  usuario?: number;  // Backend usa 'usuario'
  // Campos de timestamp - mapeo de nombres
  created_at?: string;
  updated_at?: string;
  fecha_creacion?: string;  // Backend usa fecha_creacion
  fecha_actualizacion?: string;  // Backend usa fecha_actualizacion
  // Campos de verificación
  is_verified?: boolean;
  verified_by?: number | string;
  verified_at?: string;
  rejection_reason?: string;
  // Campos de documentación
  doc_ctl_subido?: boolean;
  doc_planos_subido?: boolean;
  doc_topografia_subido?: boolean;
  limite_tiempo_docs?: string;
  tiempo_restante?: number;
  documentos_requeridos?: {
    ctl: boolean;
    planos: boolean;
    topografia: boolean;
  };
  // Campos para favoritos
  is_favorite?: boolean;
  is_visible?: boolean;
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
    // Usar el endpoint correcto según la documentación: GET /api/lotes/
    let endpoint = `${API_URL}/api/lotes/`;
    
    if (searchQuery) {
      endpoint += `?search=${encodeURIComponent(searchQuery)}`;
    }
    
    console.log(`[Lotes] Fetching from endpoint: ${endpoint}`);
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      
      // Si es 404, puede que el endpoint no exista, intentar con el endpoint principal
      if (response.status === 404) {
        console.log(`[Lotes] Endpoint /lotes/ no encontrado, intentando con endpoint principal`);
        return await getAllLotes(request, { search: searchQuery });
      }
      
      throw new Error(`Error al obtener lotes: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Datos recibidos: { hasResults: ${!!data}, count: ${data.count || 0} }`);
    
    // Ensure we're returning the results array from the API
    return { 
      lotes: data.results || data || [], 
      count: data.count || data.length || 0,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error obteniendo lotes:", error);
    
    // Fallback: intentar obtener todos los lotes y filtrar del lado del cliente
    try {
      console.log("[Lotes] Intentando fallback con endpoint principal");
      const fallbackResult = await getAllLotes(request, { search: searchQuery });
      return fallbackResult;
    } catch (fallbackError) {
      console.error("[Lotes] Fallback también falló:", fallbackError);
      throw error; // Lanzar el error original
    }
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
    // Usar el endpoint correcto según la documentación
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
      
      // Si es 404, el endpoint puede no existir, usar filtro en endpoint principal
      if (response.status === 404) {
        console.log(`[Lotes] Endpoint de usuario específico no encontrado, usando filtro en endpoint principal`);
        
        // Intentar obtener todos los lotes y filtrar por usuario (esto requiere que el backend filtre correctamente)
        const allLotesResponse = await getAllLotes(request, {
          ...filters,
          // Nota: esto asume que el backend puede filtrar por usuario de alguna manera
          // Si no es así, necesitaríamos una implementación diferente
        });
        
        return allLotesResponse;
      }
      
      throw new Error(`Error fetching user lotes: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Lotes] Received ${data.results?.length || 0} user lotes`);
    
    return { 
      lotes: data.results || data || [], 
      count: data.count || data.length || 0,
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
 * Obtener todos los lotes (admin only) - Con mapeo de campos correcto
 */
export async function getAllLotes(request: Request, filters?: {
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    console.log("[Lotes] Fetching all lotes (admin)");
    
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    
    // ✅ Mapear ordering al nombre correcto del campo
    if (filters?.ordering) {
      let ordering = filters.ordering;
      
      // Mapeo de nombres de campos
      const fieldMapping: Record<string, string> = {
        'created_at': 'fecha_creacion',
        '-created_at': '-fecha_creacion',
        'updated_at': 'fecha_actualizacion',
        '-updated_at': '-fecha_actualizacion',
      };
      
      ordering = fieldMapping[ordering] || ordering;
      params.append('ordering', ordering);
    }
    
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/lotes/?${params.toString()}`
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error fetching lotes: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    
    return {
      lotes: data.results || [],
      count: data.count || 0,
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
      : `${API_URL}/api/lotes/stats/`;
      
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
  
  try {
    if (userId) {
      // Si se especificó un usuario, obtenemos sus lotes
      lotesResponse = await getUserLotes(request, userId);
    } else {
      // Si no se especificó, usamos los lotes del usuario autenticado
      lotesResponse = await getMisLotes(request);
    }
    
    const lotes = lotesResponse.lotes || [];
    
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
      headers: lotesResponse.headers || new Headers()
    };
  } catch (error) {
    console.error("[Lotes] Error generando estadísticas de respaldo:", error);
    
    // Devolver estadísticas vacías en caso de error total
    return {
      stats: {
        total: 0,
        area_total: 0,
        por_estado: { active: 0, pending: 0, archived: 0 },
        por_estrato: {},
        documentacion_completa: 0
      },
      headers: new Headers()
    };
  }
}

// Obtener un lote específico por ID
export async function getLoteById(request: Request, loteId: string) {
  console.log(`Obteniendo detalles del lote ${loteId}`);
  
  try {
    const endpoint = `${API_URL}/api/lotes/${loteId}/`;
    console.log(`[Lotes] Fetching from endpoint: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Lotes] Error en la respuesta de la API: ${response.status} ${response.statusText}`);
      console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      
      // Manejo específico de errores
      if (response.status === 403) {
        throw new Error("No tienes permisos para ver este lote. Solo puedes ver lotes verificados y activos.");
      }
      
      if (response.status === 404) {
        throw new Error("El lote no existe o ha sido eliminado.");
      }
      
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
 * Crear lote con datos automáticos desde MapGIS
 */
export async function createLoteFromMapGIS(request: Request, loteData: {
  cbml?: string;
  matricula?: string;
  nombre: string;
  direccion: string;
  descripcion: string;
  barrio?: string;
  estrato?: number;
}) {
  try {
    console.log("[Lotes] Creating lote from MapGIS");
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/lotes/create-from-mapgis/`,
      {
        method: 'POST',
        body: JSON.stringify(loteData)
      }
    );
    
    const responseData = await res.json();
    
    if (!res.ok) {
      console.error(`[Lotes] Error creating lote:`, responseData);
      throw new Error(responseData.message || 'Error al crear lote');
    }
    
    console.log(`[Lotes] Lote created successfully:`, responseData.data?.lote?.id);
    
    return {
      success: true,
      lote: responseData.data?.lote,
      message: responseData.message,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Lotes] Error in createLoteFromMapGIS:", error);
    throw error;
  }
}

/**
 * Obtener datos completos de MapGIS y crear sugerencia de lote
 */
export async function suggestLoteFromMapGis(request: Request, cbml: string) {
  try {
    console.log("[Lotes] Obteniendo sugerencia de lote para CBML:", cbml);
    
    // Primero obtener datos de MapGIS
    const endpoint = `${API_URL}/api/lotes/scrap/cbml/`;
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cbml }),
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener datos de MapGIS: ${response.status}`);
    }
    
    const mapgisResult = await response.json();
    
    if (!mapgisResult.encontrado) {
      throw new Error(`No se encontraron datos para el CBML: ${cbml}`);
    }
    
    const datos = mapgisResult.datos;
    
    // Crear sugerencia de lote con todos los campos mapeados
    const suggestion = {
      nombre: `Lote ${cbml}`,
      cbml: cbml,
      direccion: datos.direccion || '',
      area: datos.area_lote_m2 || 0,
      clasificacion_suelo: datos.clasificacion_suelo || '',
      uso_suelo: datos.uso_suelo?.categoria_uso || '',
      tratamiento_pot: datos.aprovechamiento_urbano?.tratamiento || '',
      barrio: datos.barrio || '',
      restricciones_ambientales: datos.restricciones_ambientales || {},
      aprovechamiento_urbano: datos.aprovechamiento_urbano || {},
      descripcion: generateAutoDescription(datos),
      metadatos: {
        mapgis_data: datos,
        auto_filled: true,
        suggestion_date: new Date().toISOString()
      }
    };
    
    return {
      suggestion,
      mapgis_data: datos,
      headers: setCookieHeaders
    };
    
  } catch (error) {
    console.error("[Lotes] Error en suggestLoteFromMapGis:", error);
    throw error;
  }
}

/**
 * Generar descripción automática basada en datos de MapGIS
 */
function generateAutoDescription(mapgisData: any): string {
  let description = "Lote registrado con información de MapGIS:\n\n";
  
  if (mapgisData.area_lote) {
    description += `📐 Área: ${mapgisData.area_lote}\n`;
  }
  
  if (mapgisData.clasificacion_suelo) {
    description += `🏙️ Clasificación: ${mapgisData.clasificacion_suelo}\n`;
  }
  
  if (mapgisData.uso_suelo?.categoria_uso) {
    description += `🏗️ Uso: ${mapgisData.uso_suelo.categoria_uso}\n`;
    if (mapgisData.uso_suelo.subcategoria_uso) {
      description += `   Subcategoría: ${mapgisData.uso_suelo.subcategoria_uso}\n`;
    }
  }
  
  if (mapgisData.aprovechamiento_urbano?.tratamiento) {
    description += `📋 Tratamiento: ${mapgisData.aprovechamiento_urbano.tratamiento}\n`;
  }
  
  if (mapgisData.aprovechamiento_urbano?.densidad_habitacional_max) {
    description += `🏠 Densidad máx: ${mapgisData.aprovechamiento_urbano.densidad_habitacional_max} viv/ha\n`;
  }
  
  if (mapgisData.restricciones_ambientales) {
    description += `\n⚠️ Restricciones ambientales:\n`;
    if (mapgisData.restricciones_ambientales.amenaza_riesgo) {
      description += `• ${mapgisData.restricciones_ambientales.amenaza_riesgo}\n`;
    }
    if (mapgisData.restricciones_ambientales.retiros_rios) {
      description += `• ${mapgisData.restricciones_ambientales.retiros_rios}\n`;
    }
  }
  
  return description;
}

/**
 * Verificar un lote (admin only)
 */
export async function verifyLote(request: Request, loteId: string) {
  try {
    console.log(`[Lotes] Verificando lote ${loteId}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/${loteId}/verify/`,
      { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'verify' })  // ✅ Incluir action en body
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Lotes] Error verificando lote: ${res.status} - ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(errorData.error || errorData.message || `Error ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`[Lotes] ✅ Lote verificado exitosamente`);
    
    return { 
      data, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error en verifyLote:", error);
    throw error;
  }
}

/**
 * Rechazar un lote (admin only)
 */
export async function rejectLote(request: Request, loteId: string, reason: string) {
  try {
    console.log(`[Lotes] Rechazando lote ${loteId}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/${loteId}/verify/`,  // ✅ Mismo endpoint
      { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'reject',  // ✅ Action: reject
          reason 
        })
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Lotes] Error rechazando lote: ${res.status} - ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(errorData.error || errorData.message || `Error ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`[Lotes] ✅ Lote rechazado exitosamente`);
    
    return { 
      data, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error en rejectLote:", error);
    throw error;
  }
}

/**
 * Archivar un lote (admin only)
 */
export async function archiveLote(request: Request, loteId: string) {
  try {
    console.log(`[Lotes] Archivando lote ${loteId}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/${loteId}/archive/`,
      { method: 'POST' }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error archivando lote: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    return { data, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Lotes] Error en archiveLote:", error);
    throw error;
  }
}

/**
 * Reactivar un lote (admin only)
 */
export async function reactivateLote(request: Request, loteId: string) {
  try {
    console.log(`[Lotes] Reactivando lote ${loteId}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/${loteId}/reactivate/`,
      { method: 'POST' }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error reactivando lote: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    return { data, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Lotes] Error en reactivateLote:", error);
    throw error;
  }
}

/**
 * Obtener lotes pendientes de verificación (admin only)
 */
export async function getPendingLotes(request: Request) {
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/pending-verification/`
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error obteniendo lotes pendientes: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    return { 
      lotes: data.results || [], 
      count: data.count || 0,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error en getPendingLotes:", error);
    throw error;
  }
}

/**
 * Agregar lote a favoritos
 * ✅ CORREGIDO: Usar UUID en lugar de número
 */
export async function addLoteToFavorites(request: Request, loteId: string, notas?: string) {
  try {
    console.log(`[Favorites] Agregando lote ${loteId} a favoritos (UUID)`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/favorites/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          lote: loteId,  // ✅ Enviar UUID como string
          notas: notas || ''
        })
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error(`[Favorites] Error agregando favorito:`, errorData);
      throw new Error(errorData.error || errorData.message || `Error ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`[Favorites] ✅ Lote agregado a favoritos`);
    
    return { 
      success: data.success,
      message: data.message,
      data: data.data,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Favorites] Error en addLoteToFavorites:", error);
    throw error;
  }
}

/**
 * Remover lote de favoritos
 * ✅ CORREGIDO: Usar UUID en lugar de número
 */
export async function removeLoteFromFavorites(request: Request, loteId: string) {
  try {
    console.log(`[Favorites] Removiendo lote ${loteId} de favoritos (UUID)`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/favorites/remove_by_lote/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          lote_id: loteId  // ✅ Enviar UUID como string
        })
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error(`[Favorites] Error removiendo favorito:`, errorData);
      throw new Error(errorData.error || errorData.message || `Error ${res.status}`);
    }
    
    const data = await res.json();
    console.log(`[Favorites] ✅ Lote removido de favoritos`);
    
    return { 
      success: data.success,
      message: data.message,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Favorites] Error en removeLoteFromFavorites:", error);
    throw error;
  }
}

/**
 * Verificar si un lote es favorito
 * ✅ CORREGIDO: Usar UUID en lugar de número
 */
export async function checkIfFavorite(request: Request, loteId: string) {
  try {
    console.log(`[Favorites] Verificando si lote ${loteId} es favorito (UUID)`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/favorites/check/?lote_id=${loteId}`  // ✅ Usar UUID
    );
    
    if (!res.ok) {
      console.warn(`[Favorites] Check returned ${res.status}, assuming not favorite`);
      return { 
        is_favorite: false, 
        headers: setCookieHeaders 
      };
    }
    
    const data = await res.json();
    console.log(`[Favorites] Lote ${loteId} favorito: ${data.is_favorite}`);
    
    return { 
      is_favorite: data.is_favorite || false, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Favorites] Error en checkIfFavorite:", error);
    return { 
      is_favorite: false, 
      headers: new Headers() 
    };
  }
}

/**
 * Toggle favorito - agregar o remover
 * ✅ CORREGIDO: Usar UUID (string) en lugar de número
 */
export async function toggleLoteFavorite(request: Request, loteId: string) {
  try {
    console.log(`[Favorites] Toggling favorite for lote ${loteId} (UUID)`);
    
    // Primero verificar si ya es favorito
    const checkResult = await checkIfFavorite(request, loteId);
    
    if (checkResult.is_favorite) {
      // Si ya es favorito, removerlo
      const removeResult = await removeLoteFromFavorites(request, loteId);
      
      return {
        success: removeResult.success,
        isFavorite: false,
        message: removeResult.message || 'Lote removido de favoritos',
        headers: removeResult.headers
      };
    } else {
      // Si no es favorito, agregarlo
      const addResult = await addLoteToFavorites(request, loteId);
      
      return {
        success: addResult.success,
        isFavorite: true,
        message: addResult.message || 'Lote agregado a favoritos',
        headers: addResult.headers
      };
    }
  } catch (error) {
    console.error("[Favorites] Error en toggleLoteFavorite:", error);
    throw error;
  }
}

/**
 * Verificar si un lote es favorito - con alias para compatibilidad
 * ✅ CORREGIDO: Usar string (UUID) en lugar de número
 */
export async function checkLoteIsFavorite(request: Request, loteId: string) {
  return await checkIfFavorite(request, loteId);
}

/**
 * Actualizar un lote existente
 */
export async function updateLote(request: Request, loteId: string, data: Partial<Lote>) {
  try {
    console.log(`[Lotes] Actualizando lote ${loteId}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/${loteId}/update/`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error actualizando lote: ${res.status} ${errorText}`);
    }
    
    const result = await res.json();
    return { lote: result.lote || result, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Lotes] Error en updateLote:", error);
    throw error;
  }
}

/**
 * Eliminar un lote
 */
export async function deleteLote(request: Request, loteId: string) {
  try {
    console.log(`[Lotes] Eliminando lote ${loteId}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/${loteId}/delete/`,
      { method: 'DELETE' }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error eliminando lote: ${res.status} ${errorText}`);
    }
    
    return { success: true, headers: setCookieHeaders };
  } catch (error) {
    console.error("[Lotes] Error en deleteLote:", error);
    throw error;
  }
}

/**
 * Obtener lotes disponibles para developers (verificados y activos)
 */
export async function getAvailableLotes(request: Request, filters?: {
  search?: string;
  area_min?: number;
  area_max?: number;
  estrato?: number;
  barrio?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    console.log("[Lotes] Obteniendo lotes disponibles para developer");
    
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.area_min) params.append('area_min', filters.area_min.toString());
    if (filters?.area_max) params.append('area_max', filters.area_max.toString());
    if (filters?.estrato) params.append('estrato', filters.estrato.toString());
    if (filters?.barrio) params.append('barrio', filters.barrio);
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const endpoint = `${API_URL}/api/lotes/available/?${params.toString()}`;
    console.log(`[Lotes] Fetching from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Lotes] Error fetching available lotes: ${res.status} ${errorText}`);
      
      // Si es 404, el endpoint no existe, usar fallback
      if (res.status === 404) {
        console.log("[Lotes] Endpoint /available/ no encontrado, usando fallback");
        return await getAvailableLotesFallback(request, filters);
      }
      
      throw new Error(`Error fetching available lotes: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    
    console.log(`[Lotes] ${data.count || data.results?.length || 0} lotes disponibles obtenidos`);
    
    return {
      lotes: data.results || [],
      count: data.count || 0,
      next: data.next,
      previous: data.previous,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Lotes] Error en getAvailableLotes:", error);
    
    // Intentar fallback
    try {
      console.log("[Lotes] Intentando fallback para lotes disponibles");
      return await getAvailableLotesFallback(request, filters);
    } catch (fallbackError) {
      console.error("[Lotes] Fallback también falló:", fallbackError);
      throw error;
    }
  }
}

/**
 * Fallback para obtener lotes disponibles usando el endpoint principal
 */
async function getAvailableLotesFallback(request: Request, filters?: any) {
  console.log("[Lotes] Usando fallback - obteniendo todos los lotes y filtrando");
  
  try {
    // Usar el endpoint principal y filtrar en el cliente
    const allLotesResult = await getAllLotes(request, {
      ...filters,
      // Agregar filtros adicionales si es posible
    });
    
    // Filtrar solo lotes que deberían estar disponibles para developers
    // Nota: esto es una aproximación, idealmente el backend debería hacer este filtrado
    const availableLotes = (allLotesResult.lotes || []).filter((lote: any) => {
      // Filtros básicos que un developer debería ver
      return lote.status === 'active' || lote.estado === 'active';
    });
    
    console.log(`[Lotes] Fallback: ${availableLotes.length} lotes filtrados de ${allLotesResult.lotes?.length || 0} total`);
    
    return {
      lotes: availableLotes,
      count: availableLotes.length,
      next: null,
      previous: null,
      headers: allLotesResult.headers
    };
  } catch (error) {
    console.error("[Lotes] Error en fallback:", error);
    
    // Último recurso: devolver array vacío
    return {
      lotes: [],
      count: 0,
      next: null,
      previous: null,
      headers: new Headers()
    };
  }
}

/**
 * Obtener lotes favoritos del usuario
 */
export async function getFavoriteLotes(request: Request) {
  try {
    console.log('[Favorites] Fetching favorite lotes');
    
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/lotes/favorites/`
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Favorites] Error fetching favorites: ${res.status} ${errorText}`);
      
      // En caso de error, retornar array vacío en lugar de lanzar error
      return { 
        favorites: [], 
        count: 0,
        headers: setCookieHeaders 
      };
    }
    
    const data = await res.json();
    
    console.log(`[Favorites] ✅ Fetched ${data.results?.length || data.length || 0} favorites`);
    
    return { 
      favorites: data.results || data || [], 
      count: data.count || (data.results?.length || data.length || 0),
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Favorites] Error en getFavoriteLotes:", error);
    
    // Retornar datos vacíos en caso de error en lugar de lanzar
    return { 
      favorites: [], 
      count: 0, 
      headers: new Headers() 
    };
  }
}