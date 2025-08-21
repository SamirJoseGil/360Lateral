import type { ApiConfig, ApiHeaders, ApiError, RateLimitError } from '../types';
import { TokenStorage } from '../utils/auth';

/**
 * Cliente API base con manejo de autenticación, rate limiting y errores
 */
export class ApiClient {
  private config: ApiConfig;
  private static instance: ApiClient;

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseURL: (typeof window !== 'undefined' && window.ENV?.API_URL) || 'http://localhost:8000',
      timeout: 10000,
      retries: 3,
      ...config,
    };
  }

  static getInstance(config?: Partial<ApiConfig>): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  /**
   * Headers base para todas las peticiones
   */
  private getBaseHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = TokenStorage.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Manejo de respuestas con errores específicos
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let error: ApiError;

      try {
        if (isJson) {
          error = await response.json();
        } else {
          error = {
            error: true,
            message: response.statusText || 'Error desconocido',
            status_code: response.status,
          };
        }
      } catch {
        error = {
          error: true,
          message: 'Error al procesar la respuesta del servidor',
          status_code: response.status,
        };
      }

      // Agregar status code si no viene en la respuesta
      if (!error.status_code) {
        error.status_code = response.status;
      }

      // Manejar rate limiting específicamente
      if (response.status === 429) {
        const rateLimitError: RateLimitError = {
          ...error,
          retry_after: parseInt(response.headers.get('Retry-After') || '60'),
        };
        throw rateLimitError;
      }

      throw error;
    }

    if (isJson) {
      return response.json();
    }

    // Para respuestas sin contenido (204, etc.)
    return {} as T;
  }

  /**
   * Refresh automático de token si es necesario
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    const accessToken = TokenStorage.getAccessToken();
    const refreshToken = TokenStorage.getRefreshToken();

    if (!accessToken || !refreshToken) {
      return;
    }

    // Verificar si el token está próximo a expirar (5 minutos antes)
    if (TokenStorage.isTokenExpired(accessToken)) {
      try {
        const response = await this.post<{ access: string }>('/api/auth/token/refresh/', {
          refresh: refreshToken,
        }, { skipAuth: true });

        TokenStorage.setTokens({
          access: response.access,
          refresh: refreshToken,
        });
      } catch (error) {
        // Si falla el refresh, limpiar tokens y redirigir al login
        TokenStorage.clearTokens();
        window.location.href = '/login';
        throw error;
      }
    }
  }

  /**
   * Petición GET
   */
  async get<T>(
    endpoint: string, 
    options: { params?: Record<string, string>; skipAuth?: boolean } = {}
  ): Promise<T> {
    if (!options.skipAuth) {
      await this.refreshTokenIfNeeded();
    }

    let url = `${this.config.baseURL}${endpoint}`;
    
    if (options.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getBaseHeaders(),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Petición POST
   */
  async post<T>(
    endpoint: string, 
    data?: any, 
    options: { skipAuth?: boolean } = {}
  ): Promise<T> {
    if (!options.skipAuth) {
      await this.refreshTokenIfNeeded();
    }

    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getBaseHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Petición PUT
   */
  async put<T>(
    endpoint: string, 
    data?: any, 
    options: { skipAuth?: boolean } = {}
  ): Promise<T> {
    if (!options.skipAuth) {
      await this.refreshTokenIfNeeded();
    }

    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getBaseHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Petición DELETE
   */
  async delete<T>(
    endpoint: string, 
    options: { skipAuth?: boolean } = {}
  ): Promise<T> {
    if (!options.skipAuth) {
      await this.refreshTokenIfNeeded();
    }

    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getBaseHeaders(),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    return this.handleResponse<T>(response);
  }
}

// Instancia singleton del cliente API
export const apiClient = ApiClient.getInstance();