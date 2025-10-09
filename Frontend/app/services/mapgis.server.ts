// Este archivo ahora usa los endpoints correctos según la documentación de lotes
import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/api.server";

const FRONTEND_API_URL = process.env.API_URL || "http://localhost:8000";

export { 
  fetchMapGisData,
  mapGisEndpoints
} from "~/utils/api.server";

// Tipos específicos para MapGIS que pueden seguir siendo útiles
export type UsoSuelo = {
  categoria_uso: string;
  subcategoria_uso: string;
};

export type AprovechamientoUrbano = {
  tratamiento: string;
  densidad_habitacional_max?: number;
  altura_normativa?: string;
};

export type RestriccionesAmbientales = {
  amenaza_riesgo?: string;
  retiros_rios?: string;
};

// ✅ CORREGIDO: Interfaz actualizada con campos correctos
export type MapGisResponse = {
  success: boolean;
  encontrado?: boolean;
  message?: string;
  data?: any; // ✅ Cambiado de 'datos' a 'data'
  cbml_obtenido?: string;
  busqueda_origen?: string;
  errors?: Record<string, string[]>;
  // ✅ ELIMINADO: 'headers' no pertenece a la respuesta de datos
};

// ✅ CORREGIDO: Interfaz para datos específicos de MapGIS
export type MapGisLoteDetalle = {
  cbml?: string;
  matricula?: string;
  direccion?: string;
  area_lote_m2?: number;
  clasificacion_suelo?: string;
  barrio?: string;
  comuna?: string;
  estrato?: number;
  latitud?: number;
  longitud?: number;
  uso_suelo?: {
    categoria_uso?: string;
    subcategoria_uso?: string;
  };
  aprovechamiento_urbano?: {
    tratamiento?: string;
    densidad_habitacional_max?: number;
    altura_normativa?: string;
  };
  restricciones_ambientales?: {
    amenaza_riesgo?: string;
    retiros_rios?: string;
  };
};

export type MapGisSearchResult = {
  cbml: string;
  matricula: string;
  direccion: string;
  area: number;
};

export type MapGisResponseDetalle = {
  encontrado: boolean;
  datos: MapGisLoteDetalle;
  fuente: string;
};

export type MapGisResponseSearch = {
  encontrado: boolean;
  cantidad: number;
  resultados: MapGisSearchResult[];
  fuente: string;
};

export type MapGisSearchType = 'cbml' | 'matricula';

/**
 * Buscar lote en MapGIS por CBML
 */
export async function consultarPorCBML(cbml: string): Promise<MapGisResponse> {
  try {
    console.log(`[MapGIS] Consultando por CBML: ${cbml}`);
    
    const response = await fetch(`${API_URL}/api/lotes/scrap/cbml/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cbml }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[MapGIS] Error response:`, data);
      return {
        success: false,
        encontrado: false,
        message: data.message || 'Error al buscar en MapGIS',
        errors: data.errors
      };
    }
    
    console.log(`[MapGIS] Resultado CBML ${cbml}:`, data);
    return {
      success: data.success || false,
      encontrado: data.encontrado || data.success || false,
      data: data.data || data.datos, // ✅ Soporte para ambos nombres
      message: data.message
    };
    
  } catch (error) {
    console.error('[MapGIS] Error en búsqueda:', error);
    return {
      success: false,
      encontrado: false,
      message: 'Error de conexión con MapGIS'
    };
  }
}

/**
 * Buscar lote en MapGIS por Matrícula - CORREGIDO
 */
export async function consultarPorMatricula(request: Request, matricula: string): Promise<MapGisResponse> {
  try {
    // ✅ VALIDACIÓN: Asegurar que matricula es un string
    if (!matricula || typeof matricula !== 'string') {
      console.error(`[MapGIS] Matrícula inválida: ${typeof matricula}`, matricula);
      return {
        success: false,
        encontrado: false,
        message: 'Matrícula inválida'
      };
    }
    
    console.log(`[MapGIS] Consultando por Matrícula: ${matricula}`);
    
    // ✅ USAR fetchWithAuth para endpoints autenticados
    const { res } = await fetchWithAuth(request, `${API_URL}/api/lotes/scrap/matricula/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matricula }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error(`[MapGIS] Error response:`, data);
      return {
        success: false,
        encontrado: false,
        message: data.message || 'Error al buscar en MapGIS',
        errors: data.errors
      };
    }
    
    console.log(`[MapGIS] Resultado matrícula ${matricula}:`, { 
      encontrado: data.encontrado, 
      cbml_obtenido: data.cbml_obtenido 
    });
    
    return {
      success: data.success || false,
      encontrado: data.encontrado || data.success || false,
      data: data.data || data.datos,
      cbml_obtenido: data.cbml_obtenido,
      busqueda_origen: data.busqueda_origen || 'matricula',
      message: data.message
    };
    
  } catch (error) {
    console.error('[MapGIS] Error en búsqueda:', error);
    return {
      success: false,
      encontrado: false,
      message: 'Error de conexión con MapGIS'
    };
  }
}

/**
 * Buscar en MapGIS según tipo
 */
export async function searchMapGis(
  type: MapGisSearchType,
  value: string,
  request?: Request
): Promise<MapGisResponse> {
  if (type === 'cbml') {
    return consultarPorCBML(value);
  } else {
    if (!request) {
      throw new Error("Request object is required for matricula search");
    }
    return consultarPorMatricula(request, value);
  }
}

// LEGACY EXPORTS
export const searchMapGisByCBML = consultarPorCBML;
export const searchMapGisByMatricula = consultarPorMatricula;

/**
 * Consultar lote por matrícula inmobiliaria (IMPLEMENTADO)
 */
export async function consultarMatriculaScrap(request: Request, matricula: string) {
  try {
    console.log(`[MapGIS] Consultando por matrícula: ${matricula}`);
    
    const endpoint = `${API_URL}/api/lotes/scrap/matricula/`;
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matricula }),
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }
    
    const resultado = await response.json();
    
    console.log(`[MapGIS] Resultado matrícula ${matricula}:`, {
      encontrado: resultado.encontrado,
      cbml_obtenido: resultado.cbml_obtenido
    });
    
    return {
      resultado,
      headers: setCookieHeaders
    };
    
  } catch (error) {
    console.error(`[MapGIS] Error consultando matrícula ${matricula}:`, error);
    throw error;
  }
}

// ELIMINADO: consultarPorDireccion
// export async function consultarPorDireccion(request: Request, direccion: string) {
//   throw new Error("Búsqueda por dirección no disponible. Use CBML o matrícula.");
// }

// Función adicional para consultar restricciones ambientales
export async function consultarRestricciones(request: Request, cbml: string) {
  console.log(`Consultando restricciones ambientales para CBML: ${cbml}`);
  
  try {
    // Usar el endpoint especializado para restricciones ambientales
    const endpoint = `${API_URL}/api/lotes/consultar/restricciones/`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cbml })
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const resultado = await res.json();
    return { resultado, headers: setCookieHeaders };
  } catch (error) {
    console.error(`Error en consultarRestricciones (${cbml}):`, error);
    throw error;
  }
}

// Health check para MapGIS
export async function checkMapGisHealth(request: Request) {
  try {
    const endpoint = `${API_URL}/api/lotes/health/mapgis/`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const resultado = await res.json();
    return { resultado, headers: setCookieHeaders };
  } catch (error) {
    console.error("Error en health check MapGIS:", error);
    throw error;
  }
}