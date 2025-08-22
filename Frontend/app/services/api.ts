import { TokenStorage } from '../utils';

interface HttpClient {
  get<T>(url: string, config?: RequestInit & { skipAuth?: boolean }): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestInit & { skipAuth?: boolean }): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestInit & { skipAuth?: boolean }): Promise<T>;
  patch<T>(url: string, data?: any, config?: RequestInit & { skipAuth?: boolean }): Promise<T>;
  delete<T>(url: string, config?: RequestInit & { skipAuth?: boolean }): Promise<T>;
}

/**
 * Cliente HTTP configurado para conectarse con el backend Django
 * Según documentación en users.md
 */
class ApiClient implements HttpClient {
  private baseURL: string;

  constructor() {
    // Hardcodeamos temporalmente para debugging
    this.baseURL = 'http://localhost:8000';
    console.log('🔧 ApiClient inicializado con baseURL:', this.baseURL);
    
    // Verificar variables de entorno
    console.log('🌍 Variables de entorno:', {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  }

  private async request<T>(
    url: string, 
    options: RequestInit & { skipAuth?: boolean } = {}
  ): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    const fullUrl = `${this.baseURL}${url}`;
    
    console.log(`🌐 INICIANDO REQUEST:`);
    console.log(`   URL: ${fullUrl}`);
    console.log(`   Método: ${options.method || 'GET'}`);
    console.log(`   SkipAuth: ${skipAuth}`);
    
    // Verificar que fetch existe
    if (typeof fetch === 'undefined') {
      console.error('❌ fetch no está disponible');
      throw new Error('fetch no está disponible');
    }

    // Configurar headers básicos
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar token si no se está saltando auth
    if (!skipAuth) {
      const token = TokenStorage.getAccessToken();
      if (token && !TokenStorage.isTokenExpired(token)) {
        headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token agregado');
      } else {
        console.log('⚠️ No se agregó token (no existe o expirado)');
      }
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
    };

    console.log('📋 Config final:', {
      method: config.method,
      headers: config.headers,
      body: config.body ? 'present' : 'none'
    });

    try {
      console.log('� Haciendo fetch...');
      
      // Agregar timeout manual
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
      
      const response = await fetch(fullUrl, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`📨 Respuesta: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}` };
        }
        
        console.error('❌ Error response:', errorData);
        throw {
          error: errorData.error || 'Request failed',
          message: errorData.message || `HTTP error! status: ${response.status}`,
          status_code: response.status,
          field_errors: errorData.field_errors,
        };
      }

      const responseData = await response.json();
      console.log('✅ SUCCESS:', responseData);
      return responseData;
      
    } catch (error: any) {
      console.error('💥 REQUEST ERROR:', error);
      
      // Errores específicos
      if (error.name === 'AbortError') {
        throw {
          error: 'Timeout',
          message: 'La solicitud tardó demasiado tiempo',
          status_code: 408,
        };
      }
      
      if (error.message?.includes('fetch')) {
        console.error('🚨 ERROR DE RED - Backend posiblemente no disponible');
        throw {
          error: 'Network error',
          message: 'No se pudo conectar al servidor. ¿Está el backend corriendo en http://localhost:8000?',
          status_code: 0,
        };
      }
      
      throw error;
    }
  }

  async get<T>(url: string, config?: RequestInit & { skipAuth?: boolean }): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, data?: any, config?: RequestInit & { skipAuth?: boolean }): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any, config?: RequestInit & { skipAuth?: boolean }): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(url: string, data?: any, config?: RequestInit & { skipAuth?: boolean }): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, config?: RequestInit & { skipAuth?: boolean }): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();