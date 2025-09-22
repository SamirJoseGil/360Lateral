/**
 * Configuración de API para manejar URLs entre contenedores Docker y desarrollo local
 */

// Determinar la URL base del API basada en el entorno
const getApiBaseUrl = (): string => {
  // En el servidor (SSR), usar la URL interna del contenedor
  if (typeof window === 'undefined') {
    // Estamos en el servidor (SSR) - usar URL interna de Docker
    console.log('[API] SSR - Using internal Docker URL');
    return process.env.VITE_API_URL || 'http://backend:8000/api';
  }
  
  // En el cliente, usar la URL externa
  console.log('[API] Client - Using external URL');
  return process.env.VITE_API_URL_EXTERNAL || 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Configuración de fetch con headers por defecto y mejor manejo de errores
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  console.log(`[API] Fetching: ${url}`);
  console.log(`[API] Environment: ${typeof window === 'undefined' ? 'SSR' : 'Client'}`);
  
  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      console.error(`[API] HTTP Error: ${response.status} - ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log(`[API] Success: ${response.status} - ${url}`);
    return response;
  } catch (error) {
    console.error(`[API] Error fetching ${url}:`, error);
    
    // Si es SSR y falla con URL interna, intentar con URL externa como fallback
    if (typeof window === 'undefined' && url.includes('backend:8000')) {
      console.log('[API] SSR Fallback - Trying external URL');
      const fallbackUrl = `http://localhost:8000/api${endpoint}`;
      try {
        const fallbackResponse = await fetch(fallbackUrl, defaultOptions);
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback HTTP error! status: ${fallbackResponse.status}`);
        }
        return fallbackResponse;
      } catch (fallbackError) {
        console.error(`[API] Fallback also failed:`, fallbackError);
      }
    }
    
    throw error;
  }
};

// Helper para requests GET
export const apiGet = async (endpoint: string) => {
  const response = await apiFetch(endpoint, { method: 'GET' });
  return response.json();
};

// Helper para requests POST
export const apiPost = async (endpoint: string, data: any) => {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

// Helper para obtener información de debug
export const getApiDebugInfo = () => {
  return {
    API_BASE_URL,
    environment: typeof window === 'undefined' ? 'SSR' : 'Client',
    envVars: {
      VITE_API_URL: process.env.VITE_API_URL,
      VITE_API_URL_EXTERNAL: process.env.VITE_API_URL_EXTERNAL,
      VITE_BACKEND_HOST: process.env.VITE_BACKEND_HOST,
      VITE_BACKEND_PORT: process.env.VITE_BACKEND_PORT,
    }
  };
};
