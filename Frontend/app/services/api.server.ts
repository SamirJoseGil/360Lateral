// MapGIS endpoint types and functions
type MapGisSearchType = 'cbml' | 'matricula' | 'direccion';

// Updated endpoints to use public routes
export const mapGisEndpoints = {
  cbml: `${process.env.API_URL}/api/lotes/public/cbml/`,
  matricula: `${process.env.API_URL}/api/lotes/public/matricula/`,
  direccion: `${process.env.API_URL}/api/lotes/public/direccion/`,
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