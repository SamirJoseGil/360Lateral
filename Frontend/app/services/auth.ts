import { 
  LoginCredentials, 
  RegisterData, 
  User, 
  LoginResponse, 
  RegisterResponse,
  ChangePasswordData
} from '~/types/auth';
import { parseCookie, serializeCookie } from '~/utils/cookies';

// Definir la URL base de la API según el entorno
const API_BASE_URL = '/api';

/**
 * Servicio mejorado para manejo de autenticación
 * - Previene múltiples solicitudes simultáneas
 * - Agrega protección contra race conditions
 */
class AuthService {
  private static instance: AuthService;
  private inProgressRequests: Map<string, Promise<any>> = new Map();
  private isLoggingOut = false;
  
  // Singleton pattern
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Verifica si hay un token almacenado
   */
  isAuthenticated(): boolean {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  /**
   * Login del usuario
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Evitar múltiples requests simultáneos
    const key = `login_${credentials.email}`;
    if (this.inProgressRequests.has(key)) {
      return this.inProgressRequests.get(key)!;
    }
    
    const request = this.executeLogin(credentials);
    this.inProgressRequests.set(key, request);
    
    try {
      const result = await request;
      return result;
    } finally {
      this.inProgressRequests.delete(key);
    }
  }

  private async executeLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log("🔑 AuthService: Iniciando login");
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // Manejo especial para respuestas no-JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
          console.error("🔑 AuthService: Respuesta no-JSON recibida", {
            status: response.status,
            contentType,
            url: response.url
          });
          throw new Error(`Error de conexión a la API (${response.status})`);
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error de autenticación');
      }

      const data = await response.json();
      
      // Guardar tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        console.log("🔑 AuthService: Login exitoso, tokens guardados");
      }
      
      return data;
    } catch (error) {
      console.error("🔑 AuthService: Error en login", error);
      throw error;
    }
  }

  /**
   * Obtener el perfil del usuario actual
   */
  async getProfile(): Promise<User> {
    // Evitar múltiples requests simultáneos
    const key = 'getProfile';
    if (this.inProgressRequests.has(key)) {
      return this.inProgressRequests.get(key)!;
    }
    
    const request = this.executeGetProfile();
    this.inProgressRequests.set(key, request);
    
    try {
      const result = await request;
      return result;
    } finally {
      this.inProgressRequests.delete(key);
    }
  }

  private async executeGetProfile(): Promise<User> {
    if (!this.isAuthenticated()) {
      console.warn("🔑 AuthService: Intentando obtener perfil sin autenticación");
      throw new Error('No autenticado');
    }

    try {
      console.log("👤 AuthService: Obteniendo perfil de usuario");
      const response = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      // Manejo especial para respuestas no-JSON
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") === -1) {
          console.error("👤 AuthService: Respuesta no-JSON recibida", {
            status: response.status,
            contentType,
            url: response.url
          });
          throw new Error(`Error de conexión a la API (${response.status})`);
        }
        throw new Error('Error al obtener el perfil');
      }

      const data = await response.json();
      console.log("👤 AuthService: Perfil obtenido correctamente");
      return data;
    } catch (error) {
      console.error("👤 AuthService: Error obteniendo perfil", error);
      throw error;
    }
  }

  /**
   * Cerrar sesión - con protección contra múltiples llamadas
   */
  async logout(): Promise<void> {
    // Evitar logout múltiple
    if (this.isLoggingOut) {
      console.log("🚪 AuthService: Ya hay un logout en curso, ignorando solicitud duplicada");
      return;
    }
    
    this.isLoggingOut = true;
    
    try {
      console.log("🚪 AuthService: Iniciando proceso de logout");
      if (this.isAuthenticated()) {
        try {
          const token = localStorage.getItem('access_token');
          await fetch(`${API_BASE_URL}/auth/logout/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
        } catch (error) {
          console.warn("🚪 AuthService: Error en API de logout", error);
          // Continuamos con el logout local incluso si el API falla
        }
      }
      
      // Limpieza local
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      
      console.log("🚪 AuthService: Logout completado exitosamente");
    } finally {
      this.isLoggingOut = false;
    }
  }
}

// Exportar singleton
const authService = AuthService.getInstance();
export default authService;