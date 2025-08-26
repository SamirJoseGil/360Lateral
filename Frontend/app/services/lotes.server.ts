// filepath: d:\Accesos Directos\Escritorio\frontendx\app\services\lotes.server.ts
import { fetchWithAuth } from "~/utils/auth.server";

// URL base para las operaciones de lotes
const BASE_URL = "http://localhost:8000/api/lotes/";

// Tipos
export type Lote = {
  id: number;
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
  tratamiento_pot?: string;
  uso_suelo?: string;
  status: "active" | "pending" | "archived";
  owner: {
    id: number;
    name: string;
    email?: string;
  };
  documentos?: Documento[];
  restricciones?: Restriccion[];
  created_at: string;
  updated_at?: string;
};

export type Documento = {
  id: number;
  nombre: string;
  tipo: "escritura" | "plano" | "certificado_libertad" | "otro";
  archivo_url?: string;
  validado: boolean;
  fecha_subida: string;
  tamaño?: string;
};

export type Restriccion = {
  tipo: string;
  descripcion: string;
};

export type Analisis = {
  id: number;
  lote_id: number;
  tipo: "aprovechamiento" | "factibilidad" | "otro";
  fecha: string;
  resultado: "favorable" | "desfavorable" | "en_revision";
  detalles?: string;
};

export type LotesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Lote[];
};

export type LoteStats = {
  totalLotes: number;
  areaTotal: number;
  valorEstimado: number;
  lotesActivos: number;
  lotesPendientes: number;
  documentosCompletos: number;
  documentosPendientes: number;
};

// Obtener todos los lotes del usuario autenticado
export async function getMisLotes(request: Request, searchQuery?: string) {
  console.log(`Obteniendo lotes propios ${searchQuery ? `con búsqueda: ${searchQuery}` : ''}`);
  
  try {
    // Usar el endpoint dedicado para los lotes del usuario actual
    let endpoint = "/api/lotes/mis-lotes/";
    
    // Agregar parámetro de búsqueda si se proporciona
    if (searchQuery) {
      endpoint += `?search=${encodeURIComponent(searchQuery)}`;
    }
    
    console.log(`[Lotes] Fetching from endpoint: ${endpoint}`);
    const response = await fetchWithAuth(request, endpoint);
    
    // Verificar si la respuesta existe y tiene la estructura esperada
    if (!response || !response.res) {
      console.error("[Lotes] Respuesta inválida de fetchWithAuth en getMisLotes");
      return null;
    }

    if (!response.res.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.res.status} ${response.res.statusText}`);
      
      // Intentar leer el cuerpo del error
      try {
        const errorText = await response.res.text();
        console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      } catch (e) {
        console.error("[Lotes] No se pudo leer el cuerpo de la respuesta de error");
      }
      
      return null;
    }
    
    // Parsear la respuesta
    const data = await response.res.json();
    console.log("[Lotes] Datos recibidos:", { 
      hasResults: !!data.results, 
      count: data.count || 0
    });
    
    return { 
      lotes: data.results || [], 
      total: data.count || 0, 
      headers: response.setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error en getMisLotes:", error);
    return null;
  }
}

// Obtener lotes de un usuario específico (solo para admin)
export async function getLotesByUserId(request: Request, userId: string, searchQuery?: string) {
  console.log(`Obteniendo lotes del usuario ${userId}`);
  
  try {
    // Construir URL con parámetros de búsqueda si existen
    let url = `${BASE_URL}usuario/${userId}/`;
    if (searchQuery) {
      url += `?search=${encodeURIComponent(searchQuery)}`;
    }
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, url);
    
    if (!res.ok) {
      console.error(`Error obteniendo lotes del usuario ${userId}: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error obteniendo lotes: ${errorText}`);
    }
    
    const data = await res.json();
    
    return {
      lotes: data.results as Lote[],
      total: data.count,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en getLotesByUserId (${userId}):`, error);
    throw error;
  }
}

// Obtener estadísticas de lotes de un usuario
export async function getUserLotesStats(request: Request, userId?: string) {
  console.log(`Obteniendo estadísticas de lotes ${userId ? `del usuario ${userId}` : 'propios'}`);
  
  try {
    // Usar el endpoint dedicado para las estadísticas, si se proporciona userId será para ese usuario
    // de lo contrario será para el usuario autenticado actual
    let endpoint = userId 
      ? `/api/lotes/usuario/${userId}/stats/` 
      : "/api/lotes/mis-lotes/stats/";
      
    console.log(`[Lotes] Fetching stats from endpoint: ${endpoint}`);
    const response = await fetchWithAuth(request, endpoint);
    
    // Verificar si la respuesta existe y tiene la estructura esperada
    if (!response || !response.res) {
      console.error("[Lotes] Respuesta inválida de fetchWithAuth en getUserLotesStats");
      return null;
    }

    if (!response.res.ok) {
      console.error(`[Lotes] Error en la respuesta de la API: ${response.res.status} ${response.res.statusText}`);
      
      // Intentar leer el cuerpo del error
      try {
        const errorText = await response.res.text();
        console.error(`[Lotes] Cuerpo de respuesta de error: ${errorText}`);
      } catch (e) {
        console.error("[Lotes] No se pudo leer el cuerpo de la respuesta de error");
      }
      
      return null;
    }
    
    // Depurar la respuesta
    const data = await response.res.json();
    console.log("[Lotes] Datos de estadísticas recibidos:", data);
    
    // Asegurar una estructura consistente
    const defaultStats = {
      totalLotes: 0,
      areaTotal: 0,
      valor_total: 0,
      documentosCompletos: 0
    };
    
    return { 
      stats: data || defaultStats, 
      headers: response.setCookieHeaders 
    };
  } catch (error) {
    console.error("[Lotes] Error en getUserLotesStats:", error);
    return null;
  }
}

// Obtener detalles de un lote por ID
export async function getLoteById(request: Request, loteId: string) {
  console.log(`Obteniendo detalles del lote ${loteId}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}${loteId}/`);
    
    if (!res.ok) {
      console.error(`Error obteniendo lote ${loteId}: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error obteniendo lote: ${errorText}`);
    }
    
    const lote = await res.json();
    
    return {
      lote: lote as Lote,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en getLoteById (${loteId}):`, error);
    throw error;
  }
}

// Crear un nuevo lote
export async function createLote(request: Request, loteData: Omit<Lote, 'id' | 'created_at' | 'owner'>) {
  console.log(`Creando nuevo lote: ${loteData.nombre}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loteData)
    });
    
    if (!res.ok) {
      console.error(`Error creando lote: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error creando lote: ${errorText}`);
    }
    
    const lote = await res.json();
    
    return {
      lote: lote as Lote,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("Error en createLote:", error);
    throw error;
  }
}

// Actualizar un lote existente
export async function updateLote(request: Request, loteId: string, loteData: Partial<Lote>) {
  console.log(`Actualizando lote ${loteId}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}${loteId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loteData)
    });
    
    if (!res.ok) {
      console.error(`Error actualizando lote ${loteId}: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error actualizando lote: ${errorText}`);
    }
    
    const lote = await res.json();
    
    return {
      lote: lote as Lote,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en updateLote (${loteId}):`, error);
    throw error;
  }
}

// Eliminar un lote (solo admin)
export async function deleteLote(request: Request, loteId: string) {
  console.log(`Eliminando lote ${loteId}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}${loteId}/`, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      console.error(`Error eliminando lote ${loteId}: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error eliminando lote: ${errorText}`);
    }
    
    return {
      success: true,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en deleteLote (${loteId}):`, error);
    throw error;
  }
}

// Obtener documentos de un lote
export async function getLoteDocumentos(request: Request, loteId: string) {
  console.log(`Obteniendo documentos del lote ${loteId}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}${loteId}/documentos/`);
    
    if (!res.ok) {
      console.error(`Error obteniendo documentos del lote ${loteId}: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error obteniendo documentos: ${errorText}`);
    }
    
    const documentos = await res.json();
    
    return {
      documentos: documentos as Documento[],
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en getLoteDocumentos (${loteId}):`, error);
    throw error;
  }
}

// Subir un documento a un lote
export async function uploadDocumento(request: Request, loteId: string, formData: FormData) {
  console.log(`Subiendo documento para el lote ${loteId}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}${loteId}/documentos/`, {
      method: 'POST',
      body: formData // FormData ya tiene el Content-Type adecuado para multipart/form-data
    });
    
    if (!res.ok) {
      console.error(`Error subiendo documento: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error subiendo documento: ${errorText}`);
    }
    
    const documento = await res.json();
    
    return {
      documento: documento as Documento,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en uploadDocumento (${loteId}):`, error);
    throw error;
  }
}

// Solicitar un análisis para un lote
export async function solicitarAnalisis(
  request: Request, 
  loteId: string, 
  tipoAnalisis: string, 
  incluirVIS: boolean = false
) {
  console.log(`Solicitando análisis tipo ${tipoAnalisis} para lote ${loteId}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}aprovechamiento/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lote_id: loteId,
        tipo_calculo: tipoAnalisis,
        incluir_vis: incluirVIS
      })
    });
    
    if (!res.ok) {
      console.error(`Error solicitando análisis: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error solicitando análisis: ${errorText}`);
    }
    
    const resultado = await res.json();
    
    return {
      resultado,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en solicitarAnalisis (${loteId}):`, error);
    throw error;
  }
}

// Obtener listado de tratamientos POT disponibles
export async function getTratamientosPOT(request: Request) {
  console.log('Obteniendo tratamientos POT disponibles');
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}tratamientos/`);
    
    if (!res.ok) {
      console.error(`Error obteniendo tratamientos: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error obteniendo tratamientos: ${errorText}`);
    }
    
    const tratamientos = await res.json();
    
    return {
      tratamientos,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error('Error en getTratamientosPOT:', error);
    throw error;
  }
}

// Consultas especializadas
export async function consultaPorCBML(request: Request, cbml: string) {
  console.log(`Consultando por CBML: ${cbml}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}scrap/cbml/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cbml })
    });
    
    if (!res.ok) {
      console.error(`Error en consulta CBML: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error en consulta CBML: ${errorText}`);
    }
    
    const resultado = await res.json();
    
    return {
      resultado,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en consultaPorCBML (${cbml}):`, error);
    throw error;
  }
}

export async function consultaPorMatricula(request: Request, matricula: string) {
  console.log(`Consultando por matrícula: ${matricula}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}scrap/matricula/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ matricula })
    });
    
    if (!res.ok) {
      console.error(`Error en consulta matrícula: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error en consulta matrícula: ${errorText}`);
    }
    
    const resultado = await res.json();
    
    return {
      resultado,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en consultaPorMatricula (${matricula}):`, error);
    throw error;
  }
}

export async function consultaPorDireccion(request: Request, direccion: string) {
  console.log(`Consultando por dirección: ${direccion}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}scrap/direccion/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ direccion })
    });
    
    if (!res.ok) {
      console.error(`Error en consulta dirección: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error en consulta dirección: ${errorText}`);
    }
    
    const resultado = await res.json();
    
    return {
      resultado,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en consultaPorDireccion (${direccion}):`, error);
    throw error;
  }
}