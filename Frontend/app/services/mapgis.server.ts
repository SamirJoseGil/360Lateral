// Este archivo ahora usa los endpoints correctos según la documentación de lotes
import { API_URL } from "~/utils/env.server";

// ✅ TIPOS CORREGIDOS para las respuestas de MapGIS
export interface MapGisResponseDetalle {
  success: boolean;
  encontrado: boolean;
  data?: {
    cbml?: string;
    matricula?: string;
    direccion?: string;
    barrio?: string;
    area?: number; // ✅ CORREGIDO: 'area' en lugar de 'area_lote'
    area_lote?: number; // Mantener por compatibilidad
    area_terreno?: number;
    area_construida?: number;
    estrato?: number;
    clasificacion_suelo?: string; // ✅ CORREGIDO
    uso_suelo?: string; // ✅ CORREGIDO
    tratamiento_pot?: string;
    restricciones?: any[]; // ✅ CORREGIDO: 'restricciones' en lugar de 'restricciones_ambientales'
    restricciones_ambientales?: any[]; // Mantener por compatibilidad
    [key: string]: any;
  };
  cbml_obtenido?: boolean;
  busqueda_origen?: string;
  message?: string;
  errors?: any;
}

export interface MapGisResponseSearch {
  success: boolean;
  encontrado: boolean;
  resultados?: any[];
  message?: string;
}

/**
 * ✅ BÚSQUEDA POR MATRÍCULA COMPLETAMENTE CORREGIDA
 */
export async function consultarPorMatricula(request: Request, matricula: string): Promise<MapGisResponseDetalle> {
  try {
    // ✅ VALIDACIÓN MEJORADA
    if (!matricula || typeof matricula !== 'string') {
      console.error(`[MapGIS] Matrícula inválida: ${typeof matricula}`, matricula);
      return {
        success: false,
        encontrado: false,
        message: 'Matrícula inválida'
      };
    }
    
    // Limpiar matrícula
    const matriculaLimpia = matricula.toString().trim().replace(/[^0-9]/g, '');
    
    if (!matriculaLimpia) {
      return {
        success: false,
        encontrado: false,
        message: 'Matrícula debe contener números'
      };
    }
    
    console.log(`[MapGIS] Consultando por Matrícula: ${matriculaLimpia}`);
    
    // ✅ USAR ENDPOINT PÚBLICO CORRECTO
    const endpoint = `${API_URL}/api/lotes/public/matricula/`;
    console.log(`[MapGIS] Endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matricula: matriculaLimpia }),
    });
    
    console.log(`[MapGIS] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MapGIS] Error response: ${response.status} - ${errorText}`);
      return {
        success: false,
        encontrado: false,
        message: `Error ${response.status}: ${errorText}`,
      };
    }
    
    const data = await response.json();
    console.log(`[MapGIS] Response data:`, {
      success: data.success,
      encontrado: data.encontrado,
      cbml_obtenido: data.cbml_obtenido,
      has_data: !!data.data
    });
    
    return {
      success: data.success || false,
      encontrado: data.encontrado || false,
      data: data.data,
      cbml_obtenido: data.cbml_obtenido,
      busqueda_origen: 'matricula',
      message: data.message
    };
    
  } catch (error) {
    console.error('[MapGIS] Error en búsqueda por matrícula:', error);
    return {
      success: false,
      encontrado: false,
      message: 'Error de conexión con MapGIS'
    };
  }
}

/**
 * Buscar lote en MapGIS por CBML - USANDO ENDPOINT PÚBLICO
 */
export async function consultarPorCBML(request: Request, cbml: string): Promise<MapGisResponseDetalle> {
  try {
    console.log(`[MapGIS] Consultando por CBML: ${cbml}`);
    
    // ✅ USAR ENDPOINT PÚBLICO (sin auth)
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
      data: data.data || data.datos,
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
 * Buscar lote en MapGIS por Dirección - USANDO ENDPOINT PÚBLICO
 */
export async function consultarPorDireccion(request: Request, direccion: string): Promise<MapGisResponseSearch> {
  try {
    console.log(`[MapGIS] Consultando por Dirección: ${direccion}`);
    
    // ✅ USAR ENDPOINT PÚBLICO (sin auth)
    const response = await fetch(`${API_URL}/api/lotes/public/direccion/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direccion }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[MapGIS] Error response:`, data);
      return {
        success: false,
        encontrado: false,
        message: data.message || 'Error al buscar en MapGIS'
      };
    }
    
    return {
      success: data.success || false,
      encontrado: data.encontrado || false,
      resultados: data.resultados || [],
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