// Tipos para las respuestas de la API del backend
export interface ApiUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'owner' | 'developer';
  date_joined: string;
  is_active: boolean;
}

export interface ApiTokens {
  access: string;
  refresh: string;
}

export interface ApiLoginResponse {
  message: string;
  user: ApiUser;
  tokens: ApiTokens;
}

export interface ApiRegisterResponse {
  message: string;
  user: ApiUser;
  tokens: ApiTokens;
}

export interface ApiRegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
}

export interface ApiLoginData {
  email: string;
  password: string;
}

export interface ApiError {
  error?: string | boolean;
  message: string;
  status_code?: number;
  [key: string]: any;
}

export class AuthService {
  private baseURL: string = 'http://localhost:8000';

  // Obtener token desde localStorage (solo en el cliente)
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  // Guardar tokens en localStorage
  private saveTokens(tokens: ApiTokens): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  // Limpiar tokens del localStorage
  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Headers por defecto para las peticiones
  private getHeaders(includeAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Manejar errores de la API
  private async handleApiError(response: Response): Promise<never> {
    let errorData: ApiError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: `Error ${response.status}: ${response.statusText}`,
        status_code: response.status
      };
    }

    // Manejar diferentes tipos de errores
    switch (response.status) {
      case 429:
        throw new Error(errorData.message || 'Demasiados intentos. Intente más tarde.');
      case 401:
        this.clearTokens();
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      case 403:
        throw new Error(errorData.message || 'Acceso denegado');
      case 400:
        // Para errores de validación, mostrar el primer error encontrado
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError)) {
          throw new Error(firstError[0]);
        }
        throw new Error(errorData.message || 'Datos inválidos');
      default:
        throw new Error(errorData.message || 'Error en el servidor');
    }
  }

  // Registro de usuario
  async register(data: ApiRegisterData): Promise<ApiRegisterResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const result: ApiRegisterResponse = await response.json();
      this.saveTokens(result.tokens);
      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // Inicio de sesión
  async login(data: ApiLoginData): Promise<ApiLoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const result: ApiLoginResponse = await response.json();
      this.saveTokens(result.tokens);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseURL}/api/auth/logout/`, {
          method: 'POST',
          headers: this.getHeaders(true),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Obtener perfil del usuario actual
  async getProfile(): Promise<ApiUser> {
    const response = await fetch(`${this.baseURL}/api/auth/users/me/`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    return response.json();
  }

  // Actualizar perfil
  async updateProfile(userId: number, userData: Partial<ApiUser>): Promise<ApiUser> {
    const response = await fetch(`${this.baseURL}/api/users/${userId}/`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    return response.json();
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Obtener token actual
  getCurrentToken(): string | null {
    return this.getToken();
  }
}

// Instancia singleton para usar en toda la aplicación
export const authService = new AuthService();
export default authService;