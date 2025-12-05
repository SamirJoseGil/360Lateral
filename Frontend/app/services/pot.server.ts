import { fetchWithAuth } from "~/utils/auth.server";

const API_URL = process.env.API_URL || "http://localhost:8000";

// Tipos para el módulo POT
export type TratamientoPOT = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  indice_ocupacion: string;
  indice_construccion: string;
  altura_maxima: number;
  retiro_frontal?: string;
  retiro_lateral?: string;
  retiro_posterior?: string;
  frentes_minimos?: FrenteMinimo[];
  areas_minimas_lote?: AreaMinimaLote[];
  areas_minimas_vivienda?: AreaMinimaVivienda[];
  metadatos?: Record<string, any>;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  activo: boolean;
};

export type FrenteMinimo = {
  id: number;
  tipo_vivienda: string;
  tipo_vivienda_display: string;
  frente_minimo: string;
};

export type AreaMinimaLote = {
  id: number;
  tipo_vivienda: string;
  tipo_vivienda_display: string;
  area_minima: string;
};

export type AreaMinimaVivienda = {
  id: number;
  tipo_vivienda: string;
  tipo_vivienda_display: string;
  area_minima: string;
};

export type NormativaPorCBML = {
  cbml: string;
  tratamiento_encontrado: string;
  codigo_tratamiento: string;
  normativa: TratamientoPOT;
  datos_mapgis: {
    area_lote_m2: number;
    clasificacion_suelo: string;
    aprovechamiento_urbano: {
      tratamiento: string;
      densidad_habitacional_max: number;
      altura_normativa: number;
    };
  };
};

export type CalculoAprovechamiento = {
  success: boolean;
  tratamiento: {
    codigo: string;
    nombre: string;
    indice_ocupacion: number;
    indice_construccion: number;
    altura_maxima: number;
  };
  calculos: {
    area_lote: number;
    area_ocupada_maxima: number;
    area_construible_maxima: number;
    tipologia: string;
  };
};

export type TiposVivienda = {
  tipos_frente_minimo: Array<{ codigo: string; nombre: string }>;
  tipos_area_lote: Array<{ codigo: string; nombre: string }>;
  tipos_area_vivienda: Array<{ codigo: string; nombre: string }>;
};

/**
 * 📋 Listar todos los tratamientos POT con paginación
 */
export async function getTratamientosPOT(request: Request, filters?: {
  page?: number;
  page_size?: number;
}) {
  try {
    let endpoint = `${API_URL}/api/pot/tratamientos/`;
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    console.log(`[POT] Fetching tratamientos from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error fetching tratamientos:`, res.status, errorText);
      throw new Error(`Error fetching tratamientos: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log(`[POT] Received ${data.results?.length || 0} tratamientos`);
    
    return { 
      tratamientos: data.results || [], 
      count: data.count || 0,
      next: data.next,
      previous: data.previous,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[POT] Error in getTratamientosPOT:", error);
    throw error;
  }
}

/**
 * 📋 Listar solo tratamientos POT activos (simplificado)
 */
export async function getTratamientosActivosPOT(request: Request) {
  try {
    const endpoint = `${API_URL}/api/pot/lista/`;
    
    console.log(`[POT] Fetching active tratamientos from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error fetching active tratamientos:`, res.status, errorText);
      throw new Error(`Error fetching active tratamientos: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log(`[POT] Received ${data.results?.length || 0} active tratamientos`);
    
    return { 
      tratamientos: data.results || [], 
      count: data.count || 0,
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[POT] Error in getTratamientosActivosPOT:", error);
    throw error;
  }
}

/**
 * 🔍 Obtener detalle completo de un tratamiento por ID
 */
export async function getTratamientoPOTById(request: Request, id: string | number) {
  try {
    const endpoint = `${API_URL}/api/pot/tratamientos/${id}/`;
    
    console.log(`[POT] Fetching tratamiento ${id} from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error fetching tratamiento ${id}:`, res.status, errorText);
      throw new Error(`Error fetching tratamiento: ${res.status} ${errorText}`);
    }
    
    const tratamiento = await res.json();
    console.log(`[POT] Received tratamiento details for ID ${id}`);
    
    return { 
      tratamiento, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in getTratamientoPOTById for ID ${id}:`, error);
    throw error;
  }
}

/**
 * 🔍 Obtener detalle de tratamiento por código
 */
export async function getTratamientoPOTByCodigo(request: Request, codigo: string) {
  try {
    const endpoint = `${API_URL}/api/pot/detalle/${codigo}/`;
    
    console.log(`[POT] Fetching tratamiento ${codigo} from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error fetching tratamiento ${codigo}:`, res.status, errorText);
      throw new Error(`Error fetching tratamiento: ${res.status} ${errorText}`);
    }
    
    const tratamiento = await res.json();
    console.log(`[POT] Received tratamiento details for codigo ${codigo}`);
    
    return { 
      tratamiento, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in getTratamientoPOTByCodigo for codigo ${codigo}:`, error);
    throw error;
  }
}

/**
 * 🗺️ Obtener normativa POT por CBML
 */
export async function getNormativaPorCBML(request: Request, cbml: string): Promise<{ normativa: NormativaPorCBML; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/pot/normativa/cbml/?cbml=${encodeURIComponent(cbml)}`;
    
    console.log(`[POT] Fetching normativa for CBML ${cbml} from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error fetching normativa for CBML ${cbml}:`, res.status, errorText);
      
      // Si es 404, devolver información indicando que no se encontró
      if (res.status === 404) {
        return {
          normativa: {
            cbml,
            tratamiento_encontrado: "No encontrado",
            codigo_tratamiento: "",
            normativa: {} as TratamientoPOT,
            datos_mapgis: {
              area_lote_m2: 0,
              clasificacion_suelo: "",
              aprovechamiento_urbano: {
                tratamiento: "",
                densidad_habitacional_max: 0,
                altura_normativa: 0
              }
            }
          },
          headers: setCookieHeaders
        };
      }
      
      throw new Error(`Error fetching normativa: ${res.status} ${errorText}`);
    }
    
    const normativa = await res.json();
    console.log(`[POT] Received normativa for CBML ${cbml}`);
    
    return { 
      normativa, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in getNormativaPorCBML for CBML ${cbml}:`, error);
    throw error;
  }
}

/**
 * 📊 Calcular aprovechamiento urbanístico
 */
export async function calcularAprovechamiento(request: Request, data: {
  codigo_tratamiento: string;
  area_lote: number;
  tipologia: string;
}): Promise<{ calculo: CalculoAprovechamiento; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/pot/aprovechamiento/calcular/`;
    
    console.log(`[POT] Calculating aprovechamiento from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error calculating aprovechamiento:`, res.status, errorText);
      throw new Error(`Error calculating aprovechamiento: ${res.status} ${errorText}`);
    }
    
    const calculo = await res.json();
    console.log(`[POT] Calculated aprovechamiento for tratamiento ${data.codigo_tratamiento}`);
    
    return { 
      calculo, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in calcularAprovechamiento:`, error);
    throw error;
  }
}

/**
 * ➕ Crear nuevo tratamiento POT (Admin only)
 */
export async function createTratamientoPOT(request: Request, tratamientoData: Partial<TratamientoPOT>) {
  try {
    const endpoint = `${API_URL}/api/pot/tratamientos/`;
    
    console.log(`[POT] Creating tratamiento from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tratamientoData)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error creating tratamiento:`, res.status, errorText);
      throw new Error(`Error creating tratamiento: ${res.status} ${errorText}`);
    }
    
    const tratamiento = await res.json();
    console.log(`[POT] Created tratamiento with ID ${tratamiento.id}`);
    
    return { 
      tratamiento, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in createTratamientoPOT:`, error);
    throw error;
  }
}

/**
 * ✏️ Actualizar tratamiento POT existente (Admin only)
 */
export async function updateTratamientoPOT(request: Request, id: string | number, tratamientoData: Partial<TratamientoPOT>) {
  try {
    const endpoint = `${API_URL}/api/pot/tratamientos/${id}/`;
    
    console.log(`[POT] Updating tratamiento ${id} from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tratamientoData)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error updating tratamiento ${id}:`, res.status, errorText);
      throw new Error(`Error updating tratamiento: ${res.status} ${errorText}`);
    }
    
    const tratamiento = await res.json();
    console.log(`[POT] Updated tratamiento ${id}`);
    
    return { 
      tratamiento, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in updateTratamientoPOT for ID ${id}:`, error);
    throw error;
  }
}

/**
 * 🗑️ Eliminar tratamiento POT (Admin only)
 */
export async function deleteTratamientoPOT(request: Request, id: string | number) {
  try {
    const endpoint = `${API_URL}/api/pot/tratamientos/${id}/`;
    
    console.log(`[POT] Deleting tratamiento ${id} from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error deleting tratamiento ${id}:`, res.status, errorText);
      throw new Error(`Error deleting tratamiento: ${res.status} ${errorText}`);
    }
    
    console.log(`[POT] Deleted tratamiento ${id}`);
    
    return { 
      success: true, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in deleteTratamientoPOT for ID ${id}:`, error);
    throw error;
  }
}

/**
 * 📥 Importar tratamientos desde JSON (Admin only)
 */
export async function importarTratamientosPOT(request: Request, tratamientosData: Record<string, any>) {
  try {
    const endpoint = `${API_URL}/api/pot/importar/`;
    
    console.log(`[POT] Importing tratamientos from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tratamientosData)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error importing tratamientos:`, res.status, errorText);
      throw new Error(`Error importing tratamientos: ${res.status} ${errorText}`);
    }
    
    const result = await res.json();
    console.log(`[POT] Imported tratamientos: ${result.creados} created, ${result.actualizados} updated`);
    
    return { 
      result, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in importarTratamientosPOT:`, error);
    throw error;
  }
}

/**
 * ➕ Crear tratamiento completo con normativas (Admin only)
 */
export async function createTratamientoCompletoPOT(request: Request, tratamientoCompleto: any) {
  try {
    const endpoint = `${API_URL}/api/pot/crear/`;
    
    console.log(`[POT] Creating complete tratamiento from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tratamientoCompleto)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error creating complete tratamiento:`, res.status, errorText);
      throw new Error(`Error creating complete tratamiento: ${res.status} ${errorText}`);
    }
    
    const tratamiento = await res.json();
    console.log(`[POT] Created complete tratamiento with ID ${tratamiento.id}`);
    
    return { 
      tratamiento, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in createTratamientoCompletoPOT:`, error);
    throw error;
  }
}

/**
 * 🏠 Obtener tipos de vivienda disponibles
 */
export async function getTiposVivienda(request: Request): Promise<{ tipos: TiposVivienda; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/pot/tipos-vivienda/`;
    
    console.log(`[POT] Fetching tipos vivienda from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error fetching tipos vivienda:`, res.status, errorText);
      throw new Error(`Error fetching tipos vivienda: ${res.status} ${errorText}`);
    }
    
    const tipos = await res.json();
    console.log(`[POT] Received tipos vivienda`);
    
    return { 
      tipos, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in getTiposVivienda:`, error);
    throw error;
  }
}

/**
 * 🩺 Health check del módulo POT
 */
export async function getHealthPOT(request: Request) {
  try {
    const endpoint = `${API_URL}/api/pot/health/`;
    
    console.log(`[POT] Health check from: ${endpoint}`);
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[POT] Error in health check:`, res.status, errorText);
      throw new Error(`Error in health check: ${res.status} ${errorText}`);
    }
    
    const health = await res.json();
    console.log(`[POT] Health check completed:`, health.status);
    
    return { 
      health, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error(`[POT] Error in getHealthPOT:`, error);
    throw error;
  }
}