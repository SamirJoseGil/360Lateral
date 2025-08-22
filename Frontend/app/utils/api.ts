/**
 * Utilidades para trabajar con la API
 */

// URL base de la API - utiliza el proxy configurado en remix.config.js
export const API_BASE_URL = '/api';

// Helper para manejar errores de la API
export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    
    // Si la respuesta no es JSON, manejamos diferente
    if (contentType && !contentType.includes('application/json')) {
      console.error('Respuesta no-JSON recibida de la API', {
        status: response.status,
        contentType,
        url: response.url
      });
      throw new Error(`Error de conexión a la API (${response.status})`);
    }
    
    try {
      const errorData = await response.json();
      const errorMessage = errorData.message || errorData.detail || `Error ${response.status}`;
      throw new Error(errorMessage);
    } catch (e) {
      // Si no podemos parsear el JSON, lanzamos un error genérico
      throw new Error(`Error de la API: ${response.status} ${response.statusText}`);
    }
  }
  
  return response.json();
}

// Cliente API con manejo de errores incorporado
export const apiClient = {
  get: async (endpoint: string, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return handleApiResponse(response);
  },
  
  post: async (endpoint: string, data: any, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    });
    return handleApiResponse(response);
  },
  
  put: async (endpoint: string, data: any, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    });
    return handleApiResponse(response);
  },
  
  delete: async (endpoint: string, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return handleApiResponse(response);
  }
};

// Añadir token de autenticación a las peticiones
export function withAuth(options = {}) {
  const token = localStorage.getItem('access_token');
  if (!token) return options;
  
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  };
}
