/**
 * Utilidades para llamadas a la API desde el cliente
 */

const API_BASE_URL = 'http://localhost:8000';

// Función para hacer llamadas a la API con token automático
export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Conseguir token del localStorage (en el cliente)
  let token = null;
  if (typeof window !== 'undefined') {
    // Intentar obtener token de localStorage
    const rawToken = localStorage.getItem('l360_access');
    if (rawToken) {
      try {
        // El token podría estar envuelto en comillas
        token = JSON.parse(rawToken.replace(/^"(.*)"$/, '$1'));
      } catch (e) {
        // Si falla el parse, usar directamente
        token = rawToken;
      }
    }
  }

  // Construir URL completa
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Agregar headers
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Realizar la petición
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Manejo básico de errores
  if (!response.ok) {
    // Si es 401/403, podríamos redirigir al login o intentar refresh token
    if (response.status === 401 || response.status === 403) {
      // Aquí podríamos implementar lógica para refresh token
      console.warn('Unauthorized or forbidden');
      
      // Si estamos en el cliente, podríamos redirigir
      if (typeof window !== 'undefined') {
        // Solo log por ahora
        console.log('Authentication error - would redirect to login');
      }
    }
  }

  return response;
}

// Helper para GET
export async function apiGet<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await apiClient(endpoint, { ...options, method: 'GET' });
  return response.json();
}

// Helper para POST
export async function apiPost<T = any>(
  endpoint: string, 
  data: any,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiClient(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

// Helper para PUT
export async function apiPut<T = any>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiClient(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

// Helper para DELETE
export async function apiDelete(endpoint: string, options: RequestInit = {}): Promise<void> {
  await apiClient(endpoint, { ...options, method: 'DELETE' });
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