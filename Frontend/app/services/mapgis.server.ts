// filepath: d:\Accesos Directos\Escritorio\frontendx\app\services\mapgis.server.ts
import { fetchWithAuth } from "~/utils/auth.server";

// URL base para las operaciones de MapGIS
const BASE_URL = "http://localhost:8000/api/lotes/public/";

// Tipos para los datos de MapGIS actualizados según la nueva respuesta del backend
export type UsoSuelo = {
  porcentaje: number;
  categoria_uso: string;
  subcategoria_uso: string;
};

export type AprovechamientoUrbano = {
  tratamiento: string;
  densidad_habitacional_max: number;
  altura_normativa: string;
};

export type RestriccionesAmbientales = {
  amenaza_riesgo: string;
  retiros_rios: string;
};

// Tipo para los resultados de búsqueda por CBML o matrícula
export type MapGisLoteDetalle = {
  cbml: string;
  area_lote: string;
  area_lote_m2: number;
  clasificacion_suelo: string;
  uso_suelo: UsoSuelo;
  aprovechamiento_urbano: AprovechamientoUrbano;
  restricciones_ambientales: RestriccionesAmbientales;
  
  // Campos opcionales del modelo anterior que podrían seguir siendo útiles
  matricula?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  estrato?: number;
  barrio?: string;
  comuna?: string;
};

// Tipo para los resultados de búsqueda por dirección
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

// Consultar por CBML
export async function consultarPorCBML(request: Request, cbml: string) {
  console.log(`Consultando por CBML: ${cbml}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}cbml/`, {
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
    
    const resultado = await res.json() as MapGisResponseDetalle;
    
    return {
      resultado,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en consultarPorCBML (${cbml}):`, error);
    throw error;
  }
}

// Consultar por matrícula inmobiliaria
export async function consultarPorMatricula(request: Request, matricula: string) {
  console.log(`Consultando por matrícula: ${matricula}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}matricula/`, {
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
    
    const resultado = await res.json() as MapGisResponseDetalle;
    
    return {
      resultado,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en consultarPorMatricula (${matricula}):`, error);
    throw error;
  }
}

// Consultar por dirección
export async function consultarPorDireccion(request: Request, direccion: string) {
  console.log(`Consultando por dirección: ${direccion}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${BASE_URL}direccion/`, {
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
    
    const resultado = await res.json() as MapGisResponseSearch;
    
    return {
      resultado,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error en consultarPorDireccion (${direccion}):`, error);
    throw error;
  }
}