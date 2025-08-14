import type { User, LoginCredentials, RegisterData, AuthResponse } from '~/types/auth';

export class AuthService {
  private static apiUrl = typeof window !== 'undefined' 
    ? window.location.origin.replace(':3000', ':8000').replace(':8002', ':8000')
    : 'http://localhost:8000';
  private static useMockAuth = false; // ✅ Cambiar a autenticación real

  // ✅ Método para obtener el token CSRF
  private static async getCSRFToken(): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/csrf/`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken || '';
      }
      
      // Fallback: intentar obtener del cookie
      const csrfCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));
      return csrfCookie ? csrfCookie.split('=')[1] : '';
    } catch (error) {
      console.warn('Error obteniendo CSRF token:', error);
      return '';
    }
  }

  // Normalizar el rol a los valores usados en el front
  private static normalizeRole(role?: string | null): string {
    const r = (role || '').toLowerCase();
    if (['admin', 'administrator', 'administrador'].includes(r)) return 'admin';
    if (['owner', 'propietario', 'dueno', 'dueño'].includes(r)) return 'propietario';
    if (['developer', 'desarrollador'].includes(r)) return 'desarrollador';
    return r || '';
  }

  // helper cookies rol
  private static setRoleCookie(role: string) {
    if (typeof document === 'undefined') return;
    const normalized = this.normalizeRole(role);
    document.cookie = `l360_role=${encodeURIComponent(normalized)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }
  private static clearRoleCookie() {
    if (typeof document === 'undefined') return;
    document.cookie = `l360_role=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // ✅ Obtener token CSRF primero
      const csrfToken = await this.getCSRFToken();
      
      const response = await fetch(`${this.apiUrl}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include', // ✅ Incluir cookies httpOnly
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Credenciales inválidas');
      }

      const data = await response.json();
      
      // ✅ Guardar token en localStorage como backup
      if (data.access && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
      }
      // ✅ normalizar y persistir rol
      if (data.user) {
        data.user.role = this.normalizeRole(data.user.role);
        this.setRoleCookie(data.user.role);
      }

      return {
        user: data.user,
        token: data.access,
        refreshToken: data.refresh
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw error instanceof Error ? error : new Error('Error al iniciar sesión');
    }
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // ✅ Obtener token CSRF primero
      const csrfToken = await this.getCSRFToken();
      
      const response = await fetch(`${this.apiUrl}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          password2: data.password, // Confirmación de contraseña
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Error en el registro');
      }

      const responseData = await response.json();
      
      // ✅ Guardar tokens
      if (responseData.access && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', responseData.access);
        if (responseData.refresh) {
          localStorage.setItem('refresh_token', responseData.refresh);
        }
      }
      // ✅ normalizar y persistir rol
      if (responseData.user) {
        responseData.user.role = this.normalizeRole(responseData.user.role);
        this.setRoleCookie(responseData.user.role);
      }

      return {
        user: responseData.user,
        token: responseData.access,
        refreshToken: responseData.refresh
      };
    } catch (error) {
      console.error('Error en registro:', error);
      throw error instanceof Error ? error : new Error('Error al registrarse');
    }
  }

  static async getCurrentUser(): Promise<User> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      const response = await fetch(`${this.apiUrl}/api/auth/users/me/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
          // ✅ Token inválido, intentar refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Reintentar con nuevo token
            return await this.getCurrentUser();
          }
          // Si refresh falla, limpiar storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
        throw new Error('Token inválido o expirado');
      }

      const user = await response.json();
      // ✅ normalizar y refrescar cookie de rol
      user.role = this.normalizeRole(user.role);
      this.setRoleCookie(user.role);
      return user;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error instanceof Error ? error : new Error('Error al obtener usuario actual');
    }
  }

  static async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('refresh_token') 
        : null;

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.apiUrl}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Refresh token inválido');
      }

      const data = await response.json();
      
      if (data.access && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access);
        return data.access;
      }

      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // ✅ Limpiar tokens si el refresh falla
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      // ✅ Llamar endpoint de logout del backend
      await fetch(`${this.apiUrl}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // ✅ Siempre limpiar storage local
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
      this.clearRoleCookie(); // ✅ limpiar cookie rol
    }
  }
}
