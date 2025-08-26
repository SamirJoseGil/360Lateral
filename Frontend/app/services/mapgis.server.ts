// filepath: d:\Accesos Directos\Escritorio\frontendx\app\services\mapgis.server.ts
import { fetchWithAuth } from "~/utils/auth.server";

// URL base para las operaciones de MapGIS
const BASE_URL = "http://localhost:8000/api/lotes/scrap/";

// Tipos para las restricciones
export type Restriccion = {
  tipo: string;
  descripcion: string;
  normativa?: string;
  severidad?: "Alta" | "Media" | "Baja";
};

// Tipo para los resultados de búsqueda por CBML o matrícula
export type MapGisLoteDetalle = {
  cbml: string;
  matricula: string;
  direccion: string;
  area: number;
  latitud?: number;
  longitud?: number;
  estrato?: number;
  barrio?: string;
  comuna?: string;
  uso_suelo?: string;
  tratamiento_pot?: string;
  restricciones?: Restriccion[];
};

// Tipo para los resultados de búsqueda por dirección
export type MapGisSearchResult = {
  cbml: string;
  matricula: string;
  direccion: string;
  area: number;
};

export type MapGisResponseDetalle = {
  success: boolean;
  data: MapGisLoteDetalle;
  source: string;
};

export type MapGisResponseSearch = {
  success: boolean;
  count: number;
  results: MapGisSearchResult[];
  source: string;
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