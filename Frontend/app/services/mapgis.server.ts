// Este archivo ahora usa los endpoints correctos según la documentación de lotes
import { fetchWithAuth } from "~/utils/auth.server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export { 
  fetchMapGisData,
  mapGisEndpoints,
  type MapGisSearchType 
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

export type MapGisLoteDetalle = {
  cbml: string;
  area_lote: string;
  area_lote_m2: number;
  clasificacion_suelo: string;
  uso_suelo: UsoSuelo;
  aprovechamiento_urbano: AprovechamientoUrbano;
  restricciones_ambientales: RestriccionesAmbientales;
  
  // Campos opcionales
  matricula?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  estrato?: number;
  barrio?: string;
  comuna?: string;
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

// Funciones específicas usando los endpoints correctos según la documentación de lotes
export async function consultarPorCBML(request: Request, cbml: string) {
  console.log(`Consultando por CBML: ${cbml}`);
  
  try {
    // Usar el endpoint del módulo de lotes según la documentación
    const endpoint = `${API_URL}/api/lotes/scrap/cbml/`;
    
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
    console.error(`Error en consultarPorCBML (${cbml}):`, error);
    throw error;
  }
}

export async function consultarPorMatricula(request: Request, matricula: string) {
  console.log(`Consultando por matrícula: ${matricula}`);
  
  try {
    // Usar el endpoint del módulo de lotes según la documentación
    const endpoint = `${API_URL}/api/lotes/scrap/matricula/`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matricula })
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const resultado = await res.json();
    return { resultado, headers: setCookieHeaders };
  } catch (error) {
    console.error(`Error en consultarPorMatricula (${matricula}):`, error);
    throw error;
  }
}

export async function consultarPorDireccion(request: Request, direccion: string) {
  console.log(`Consultando por dirección: ${direccion}`);
  
  try {
    // Usar el endpoint del módulo de lotes según la documentación
    const endpoint = `${API_URL}/api/lotes/scrap/direccion/`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direccion })
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const resultado = await res.json();
    return { resultado, headers: setCookieHeaders };
  } catch (error) {
    console.error(`Error en consultarPorDireccion (${direccion}):`, error);
    throw error;
  }
}

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