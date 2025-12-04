import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

/**
 * Tipos de datos de MapGIS
 */
export interface MapGISData {
  cbml: string;
  area_lote?: string;
  area_lote_m2?: number;
  clasificacion_suelo?: string;
  es_urbano?: boolean;
  uso_suelo?: {
    categoria_uso?: string;
    subcategoria_uso?: string;
    codigo_subcategoria?: string;
    porcentaje?: number;
  };
  aprovechamiento_urbano?: {
    tratamiento?: string;
    codigo_tratamiento?: string;
    densidad_habitacional_max?: number;
    indice_construccion_max?: string;
    altura_normativa?: string;
    identificador?: string;
  };
  restricciones_ambientales?: {
    amenaza_riesgo?: string;
    retiros_rios?: string;
  };
  casos_pot?: any;
  casos_pot_text?: string;
  geometria?: any;
  fuente: string;
  fecha_consulta: string;
}

export interface MapGISHealthCheck {
  status: 'ok' | 'degraded' | 'error';
  session_initialized: boolean;
  base_url: string;
  online: boolean;
  timestamp: string;
}

/**
 * Consultar información completa de un lote por CBML
 */
export async function consultarMapGIS(
  request: Request,
  cbml: string
): Promise<{ success: boolean; data?: MapGISData; error?: string }> {
  try {
    // ✅ CORREGIDO: Validar 11 dígitos
    if (!cbml || cbml.length !== 11 || !/^\d{11}$/.test(cbml)) {
      return {
        success: false,
        error: "CBML inválido. Debe tener exactamente 11 dígitos numéricos para MapGIS Medellín"
      };
    }

    console.log(`[MapGIS] Consultando CBML (11 dígitos): ${cbml}`);

    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/mapgis/consulta/cbml/${cbml}/`,
      { method: "GET" }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`[MapGIS] Error: ${res.status}`, errorData);
      return {
        success: false,
        error: errorData.mensaje || `Error ${res.status}`,
      };
    }

    const responseData = await res.json();

    return {
      success: true,
      data: responseData.data || responseData.datos,
    };
  } catch (error) {
    console.error("[MapGIS] Error en consulta:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al consultar MapGIS"
    };
  }
}

/**
 * Consultar solo restricciones ambientales
 */
export async function consultarRestricciones(
  request: Request,
  cbml: string
): Promise<{
  success: boolean;
  data?: {
    cbml: string;
    amenaza_riesgo?: string;
    retiros_rios?: string;
    fecha_consulta: string;
  };
  error?: string;
}> {
  try {
    console.log(`[MapGIS] Consultando restricciones: ${cbml}`);

    const { res } = await fetchWithAuth(
      request,
      `${API_URL}/api/mapgis/consulta/restricciones/${cbml}/`,
      { method: "GET" }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.mensaje || "Error en consulta",
      };
    }

    const responseData = await res.json();

    return {
      success: true,
      data: responseData.data || responseData.datos,
    };
  } catch (error) {
    console.error("[MapGIS] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Health check del servicio MapGIS
 */
export async function mapgisHealthCheck(
  request: Request
): Promise<MapGISHealthCheck> {
  try {
    const response = await fetch(`${API_URL}/api/mapgis/health/`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[MapGIS] Health check error:", error);
    return {
      status: "error",
      session_initialized: false,
      base_url: "",
      online: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Limpiar cache de MapGIS (solo admin)
 */
export async function limpiarCacheMapGIS(
  request: Request,
  cbml?: string
): Promise<{ success: boolean; mensaje?: string; error?: string }> {
  try {
    const { res } = await fetchWithAuth(
      request,
      `${API_URL}/api/mapgis/cache/clear/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cbml }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Error limpiando cache",
      };
    }

    const data = await res.json();
    return {
      success: true,
      mensaje: data.mensaje,
    };
  } catch (error) {
    console.error("[MapGIS] Error limpiando cache:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}