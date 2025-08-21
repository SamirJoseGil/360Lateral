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
    try {
      const response = await apiClient.get<User>('/api/auth/users/me/');
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
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
    const token = TokenStorage.getAccessToken();
    if (!token) return false;
    
    return !TokenStorage.isTokenExpired(token);
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
