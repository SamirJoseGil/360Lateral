// filepath: d:\Accesos Directos\Escritorio\frontendx\app\services\lotes.server.ts
import { API_URL } from "~/utils/api.server";
import { fetchWithAuth } from "~/utils/auth.server";
import { getAccessTokenFromCookies } from "~/utils/auth.server";

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

// Obtener los lotes del usuario autenticado
export async function getMisLotes(request: Request, searchQuery?: string) {
  console.log(`Obteniendo lotes propios ${searchQuery ? `con búsqueda: ${searchQuery}` : ''}`);
  
  try {
    // Construir endpoint con parámetros de búsqueda si es necesario
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

// Función para obtener tratamientos POT
export async function getTratamientosPOT(request: Request) {
  try {
    // Según la documentación, el endpoint correcto es /api/pot/tratamientos/
    const endpoint = `${API_URL}/api/pot/tratamientos/`;
    console.log(`[POT] Obteniendo tratamientos POT desde: ${endpoint}`);
    
    // Usar fetchWithAuth en lugar de fetch directa para manejar cookies y tokens
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`[POT] Error obteniendo tratamientos: ${response.status} ${response.statusText}`);
      // Intentar con el endpoint alternativo si el principal falla
      return await getTratamientosPOTAlternativo(request);
    }

    const data = await response.json();
    console.log(`[POT] Se obtuvieron ${data.results?.length || 0} tratamientos POT`);
    
    return { 
      tratamientos: data.results || data, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[POT] Error obteniendo tratamientos POT:", error);
    // Intentar con el endpoint alternativo en caso de error
    return await getTratamientosPOTAlternativo(request);
  }
}

// Función alternativa para obtener tratamientos usando endpoint secundario
async function getTratamientosPOTAlternativo(request: Request) {
  try {
    const endpoint = `${API_URL}/api/pot/lista/`;
    console.log(`[POT] Intentando obtener tratamientos POT desde endpoint alternativo: ${endpoint}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!response.ok) {
      console.error(`[POT] Error en endpoint alternativo: ${response.status} ${response.statusText}`);
      return { tratamientos: [], headers: new Headers() };
    }

    const data = await response.json();
    console.log(`[POT] Se obtuvieron ${Array.isArray(data) ? data.length : 'algunos'} tratamientos POT desde endpoint alternativo`);
    
    // El formato podría ser diferente, adaptamos la respuesta
    const tratamientos = Array.isArray(data) ? data : 
                        data.results ? data.results : 
                        [];
    
    return { 
      tratamientos, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[POT] Error obteniendo tratamientos POT (alternativo):", error);
    return { tratamientos: [], headers: new Headers() };
  }
}

/**
 * Crea un nuevo lote en el sistema
 */
export async function createLote(request: Request, loteData: any) {
  try {
    // Verificar que tenemos datos mínimos requeridos para crear un lote
    if (!loteData.nombre || (!loteData.cbml && !loteData.direccion)) {
      throw new Error("Se requiere nombre y CBML o dirección para crear un lote");
    }
    
    // Eliminar campos relacionados con POT que podrían estar causando problemas
    const loteDataLimpio = { ...loteData };
    delete loteDataLimpio.tratamiento_pot;
    
    // Si hay metadatos.pot.aprovechamiento_urbano, eliminar el tratamiento
    if (loteDataLimpio.metadatos?.pot?.aprovechamiento_urbano?.tratamiento) {
      delete loteDataLimpio.metadatos.pot.aprovechamiento_urbano.tratamiento;
    }
    
    // Convertir el objeto a FormData para evitar el error "_mutable"
    const formData = new FormData();
    
    // Agregar los campos básicos al FormData
    formData.append('nombre', loteDataLimpio.nombre || '');
    formData.append('cbml', loteDataLimpio.cbml || '');
    formData.append('direccion', loteDataLimpio.direccion || '');
    if (loteDataLimpio.area) formData.append('area', loteDataLimpio.area.toString());
    if (loteDataLimpio.descripcion) formData.append('descripcion', loteDataLimpio.descripcion);
    if (loteDataLimpio.matricula) formData.append('matricula', loteDataLimpio.matricula);
    if (loteDataLimpio.codigo_catastral) formData.append('codigo_catastral', loteDataLimpio.codigo_catastral);
    if (loteDataLimpio.barrio) formData.append('barrio', loteDataLimpio.barrio);
    if (loteDataLimpio.estrato) formData.append('estrato', loteDataLimpio.estrato.toString());
    if (loteDataLimpio.uso_suelo) formData.append('uso_suelo', loteDataLimpio.uso_suelo);
    if (loteDataLimpio.clasificacion_suelo) formData.append('clasificacion_suelo', loteDataLimpio.clasificacion_suelo);
    if (loteDataLimpio.latitud) formData.append('latitud', loteDataLimpio.latitud.toString());
    if (loteDataLimpio.longitud) formData.append('longitud', loteDataLimpio.longitud.toString());
    if (loteDataLimpio.status) formData.append('status', loteDataLimpio.status);
    if (loteDataLimpio.owner) formData.append('owner', loteDataLimpio.owner.toString());
    
    // Si hay metadatos, agregarlos como JSON string
    if (loteDataLimpio.metadatos && Object.keys(loteDataLimpio.metadatos).length > 0) {
      formData.append('metadatos', JSON.stringify(loteDataLimpio.metadatos));
    }

    // Usar el endpoint correcto según la documentación
    const endpoint = `${API_URL}/api/lotes/create/`;
    
    console.log(`[Lotes] Creando lote con endpoint: ${endpoint}`);
    console.log(`[Lotes] Usando FormData para enviar datos`);

    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      // No incluir Content-Type, el navegador lo establecerá automáticamente con el boundary
      body: formData,
    });

    if (!res.ok) {
      console.error(`[Lotes] Error creando lote: ${res.status} ${res.statusText}`);
      
      try {
        // Intentar obtener los detalles del error desde la respuesta
        const errorData = await res.json();
        console.error("[Lotes] Detalles del error:", errorData);
        
        const errorMessage = errorData.error || errorData.message || errorData.detail || 
                           JSON.stringify(errorData) || `Error en la solicitud: ${res.status} ${res.statusText}`;
        
        throw new Error(errorMessage);
      } catch (jsonError) {
        // Si no podemos parsear el error como JSON, usar el mensaje genérico
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