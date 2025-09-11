/**
 * Módulo para manejar interacciones con la API
 */

// URL base de la API
export const API_URL = process.env.API_URL || "http://localhost:8000";

// MapGIS endpoint types and functions (consolidado desde api.client.ts)
export type MapGisSearchType = 'cbml' | 'matricula' | 'direccion';

// Updated endpoints to use public routes
export const mapGisEndpoints = {
  cbml: `${API_URL}/api/lotes/public/cbml/`,
  matricula: `${API_URL}/api/lotes/public/matricula/`,
  direccion: `${API_URL}/api/lotes/public/direccion/`,
};

export async function fetchMapGisData(type: MapGisSearchType, value: string) {
  const endpoint = mapGisEndpoints[type];
  if (!endpoint) {
    throw new Error(`Invalid search type: ${type}`);
  }
  
  const payload: Record<string, string> = {};
  payload[type] = value;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch MapGIS data: ${response.statusText}`);
  }
  
  return await response.json();
}

// Utilidad para control de acceso basado en roles
export function checkPermission(userRole: string, requiredRole: string): boolean {
  const roles = {
    'user': 0,
    'developer': 1,
    'owner': 2,
    'admin': 3
  };
  
  return (roles[userRole as keyof typeof roles] || 0) >= (roles[requiredRole as keyof typeof roles] || 0);
}