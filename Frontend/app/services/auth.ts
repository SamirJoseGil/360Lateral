import type {
  LoginData,
  RegisterData,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  ChangePasswordData,
  ChangePasswordResponse,
  User,
  RateLimitError,
} from '../types';
import { apiClient } from './api';
import { TokenStorage, RateLimit, ValidationUtils } from '../utils';

/**
 * Servicio de autenticación basado en la documentación de la API
 */
export class AuthService {
  private static readonly RATE_LIMITS = {
    LOGIN: { maxAttempts: 5, windowMs: 5 * 60 * 1000 }, // 5 intentos en 5 minutos
    REGISTER: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 intentos en 1 hora
  };

  /**
   * Registro de nuevo usuario
   * POST /api/auth/register/
   */
  static async register(data: RegisterData): Promise<RegisterResponse> {
    // Verificar rate limiting del cliente
    const rateLimitKey = `register_${window.location.hostname}`;
    const { maxAttempts, windowMs } = this.RATE_LIMITS.REGISTER;
    
    if (RateLimit.isBlocked(rateLimitKey, maxAttempts, windowMs)) {
      const remainingTime = RateLimit.getRemainingTime(rateLimitKey);
      throw {
        error: 'Rate limit exceeded',
        message: `Demasiados intentos de registro. Intente en ${Math.ceil(remainingTime / 1000 / 60)} minutos.`,
        status_code: 429,
      } as RateLimitError;
    }

    // Validaciones del lado del cliente
    this.validateRegistrationData(data);

    try {
      RateLimit.recordAttempt(rateLimitKey, windowMs);
      
      const response = await apiClient.post<RegisterResponse>('/api/auth/register/', data, {
        skipAuth: true
      });

      // Guardar tokens automáticamente
      if (response.tokens) {
        TokenStorage.setTokens(response.tokens);
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Inicio de sesión
   * POST /api/auth/login/
   */
  static async login(data: LoginData): Promise<LoginResponse> {
    // Verificar rate limiting por IP
    const ipRateLimitKey = `login_ip_${window.location.hostname}`;
    const emailRateLimitKey = `login_email_${data.email}`;
    
    const { maxAttempts, windowMs } = this.RATE_LIMITS.LOGIN;
    
    if (RateLimit.isBlocked(ipRateLimitKey, maxAttempts, windowMs)) {
      const remainingTime = RateLimit.getRemainingTime(ipRateLimitKey);
      throw {
        error: 'Rate limit exceeded',
        message: `Demasiados intentos desde esta conexión. Intente en ${Math.ceil(remainingTime / 1000 / 60)} minutos.`,
        status_code: 429,
      } as RateLimitError;
    }

    if (RateLimit.isBlocked(emailRateLimitKey, maxAttempts, 15 * 60 * 1000)) { // 15 minutos para email
      const remainingTime = RateLimit.getRemainingTime(emailRateLimitKey);
      throw {
        error: 'Account temporarily locked',
        message: `Cuenta temporalmente bloqueada. Intente en ${Math.ceil(remainingTime / 1000 / 60)} minutos.`,
        status_code: 429,
      } as RateLimitError;
    }

    // Validaciones del lado del cliente
    this.validateLoginData(data);

    try {
      RateLimit.recordAttempt(ipRateLimitKey, windowMs);
      RateLimit.recordAttempt(emailRateLimitKey, 15 * 60 * 1000);
      
      const response = await apiClient.post<LoginResponse>('/api/auth/login/', data, {
        skipAuth: true
      });

      // Guardar tokens automáticamente
      if (response.tokens) {
        TokenStorage.setTokens(response.tokens);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Cierre de sesión
   * POST /api/auth/logout/
   */
  static async logout(): Promise<LogoutResponse> {
    try {
      const response = await apiClient.post<LogoutResponse>('/api/auth/logout/');
      
      // Limpiar tokens locales siempre, incluso si la API falla
      TokenStorage.clearTokens();
      
      return response;
    } catch (error) {
      // Limpiar tokens locales incluso si la API falla
      TokenStorage.clearTokens();
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario actual
   * GET /api/auth/users/me/
   */
  static async getCurrentUser(): Promise<User> {
    console.log("📡 Solicitando datos del usuario actual...");
    
    try {
      const response = await apiClient.get<User>('/api/auth/users/me/');
      console.log("✅ Usuario obtenido exitosamente:", response);
      return response;
    } catch (error) {
      console.error("❌ Error obteniendo usuario actual:", error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   * POST /api/auth/change-password/
   */
  static async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    // Validaciones del lado del cliente
    this.validatePasswordChange(data);

    try {
      const response = await apiClient.post<ChangePasswordResponse>('/api/auth/change-password/', data);
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    console.log("🔍 Verificando si está autenticado...");
    
    const token = TokenStorage.getAccessToken();
    if (!token) {
      console.log("❌ No hay token de acceso");
      return false;
    }
    
    const isExpired = TokenStorage.isTokenExpired(token);
    const isAuthenticated = !isExpired;
    
    console.log("✅ Resultado de autenticación:", isAuthenticated);
    return isAuthenticated;
  }

  /**
   * Obtener token de acceso actual
   */
  static getAccessToken(): string | null {
    return TokenStorage.getAccessToken();
  }

  /**
   * Validaciones para registro
   */
  private static validateRegistrationData(data: RegisterData): void {
    const errors: Record<string, string[]> = {};

    // Validar email
    if (!data.email) {
      errors.email = ['Email es requerido'];
    } else if (!ValidationUtils.isValidEmail(data.email)) {
      errors.email = ['Formato de email inválido'];
    }

    // Validar username
    if (!data.username) {
      errors.username = ['Username es requerido'];
    } else if (data.username.length < 3) {
      errors.username = ['Username debe tener al menos 3 caracteres'];
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.username = ['Username solo puede contener letras, números, guiones y guiones bajos'];
    }

    // Validar contraseña
    if (!data.password) {
      errors.password = ['Contraseña es requerida'];
    } else if (!ValidationUtils.isStrongPassword(data.password)) {
      errors.password = ['La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales'];
    }

    // Validar confirmación de contraseña
    if (data.password !== data.password_confirm) {
      errors.password_confirm = ['Las contraseñas no coinciden'];
    }

    // Validar nombres
    if (!data.first_name?.trim()) {
      errors.first_name = ['Nombre es requerido'];
    }

    if (!data.last_name?.trim()) {
      errors.last_name = ['Apellido es requerido'];
    }

    // Validar teléfono si se proporciona
    if (data.phone && !ValidationUtils.isValidPhone(data.phone)) {
      errors.phone = ['Formato de teléfono inválido'];
    }

    if (Object.keys(errors).length > 0) {
      throw {
        error: 'Validation failed',
        message: 'Datos de registro inválidos',
        status_code: 400,
        field_errors: errors,
      };
    }
  }

  /**
   * Validaciones para login
   */
  private static validateLoginData(data: LoginData): void {
    const errors: Record<string, string[]> = {};

    if (!data.email) {
      errors.email = ['Email es requerido'];
    } else if (!ValidationUtils.isValidEmail(data.email)) {
      errors.email = ['Formato de email inválido'];
    }

    if (!data.password) {
      errors.password = ['Contraseña es requerida'];
    }

    if (Object.keys(errors).length > 0) {
      throw {
        error: 'Validation failed',
        message: 'Credenciales inválidas',
        status_code: 400,
        field_errors: errors,
      };
    }
  }

  /**
   * Validaciones para cambio de contraseña
   */
  private static validatePasswordChange(data: ChangePasswordData): void {
    const errors: Record<string, string[]> = {};

    if (!data.current_password) {
      errors.current_password = ['Contraseña actual es requerida'];
    }

    if (!data.new_password) {
      errors.new_password = ['Nueva contraseña es requerida'];
    } else if (!ValidationUtils.isStrongPassword(data.new_password)) {
      errors.new_password = ['La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales'];
    }

    if (data.new_password !== data.new_password_confirm) {
      errors.new_password_confirm = ['Las contraseñas no coinciden'];
    }

    if (data.current_password === data.new_password) {
      errors.new_password = ['La nueva contraseña debe ser diferente a la actual'];
    }

    if (Object.keys(errors).length > 0) {
      throw {
        error: 'Validation failed',
        message: 'Datos de cambio de contraseña inválidos',
        status_code: 400,
        field_errors: errors,
      };
    }
  }
}

// Tipos para las respuestas de la API
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

class AuthService {
  private baseURL: string;

  constructor() {
    // Usar localhost por defecto mientras configuramos las variables de entorno
    this.baseURL = 'http://localhost:8000';
  }

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

  // Cambiar contraseña
  async changePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/api/auth/change-password/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await this.handleApiError(response);
    }

    return response.json();
  }

  // Refresh del token
  async refreshToken(): Promise<ApiTokens> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      this.clearTokens();
      await this.handleApiError(response);
    }

    const tokens: ApiTokens = await response.json();
    this.saveTokens(tokens);
    return tokens;
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

export const authService = new AuthService();
export default authService;
