/**
 * Utilidades para manejo de tokens JWT según documentación de API
 */

interface Tokens {
  access: string;
  refresh: string;
}

export class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'lateral360_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'lateral360_refresh_token';

  /**
   * Guardar tokens en localStorage
   */
  static setTokens(tokens: Tokens): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
  }

  /**
   * Obtener access token
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') {
      console.log("⚠️ getAccessToken: No hay window (SSR)");
      return null;
    }
    
    try {
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      console.log("🔑 getAccessToken:", token ? `Token encontrado (${token.length} chars)` : 'No token');
      return token;
    } catch (error) {
      console.error("❌ Error obteniendo token:", error);
      return null;
    }
  }

  /**
   * Obtener refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      console.log("⚠️ getRefreshToken: No hay window (SSR)");
      return null;
    }
    
    try {
      const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      console.log("🔄 getRefreshToken:", token ? `Token encontrado` : 'No token');
      return token;
    } catch (error) {
      console.error("❌ Error obteniendo refresh token:", error);
      return null;
    }
  }

  /**
   * Limpiar todos los tokens
   */
  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Verificar si un token está expirado
   */
  static isTokenExpired(token: string): boolean {
    if (!token || typeof token !== 'string') {
      console.log("❌ Token inválido o vacío");
      return true;
    }

    try {
      // Verificar que el token tenga el formato correcto (3 partes separadas por .)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log("❌ Token no tiene 3 partes:", parts.length);
        return true;
      }

      // Decodificar payload del JWT
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      console.log("🔍 Verificando expiración del token:");
      console.log("- Tiempo actual:", currentTime);
      console.log("- Expira en:", payload.exp);
      console.log("- ¿Expirado?", payload.exp < currentTime);
      
      return payload.exp < currentTime;
    } catch (error) {
      console.error("❌ Error decodificando token:", error);
      // Si no se puede decodificar, considerar expirado
      return true;
    }
  }
}

/**
 * Utilidades para rate limiting del lado del cliente
 */
export class RateLimit {
  /**
   * Verificar si una clave está bloqueada por rate limiting
   */
  static isBlocked(key: string, maxAttempts: number, windowMs: number): boolean {
    if (typeof window === 'undefined') return false;

    const data = localStorage.getItem(`ratelimit_${key}`);
    if (!data) return false;

    const { attempts, firstAttempt } = JSON.parse(data);
    const now = Date.now();

    // Si la ventana de tiempo ha pasado, no está bloqueado
    if (now - firstAttempt > windowMs) {
      localStorage.removeItem(`ratelimit_${key}`);
      return false;
    }

    return attempts >= maxAttempts;
  }

  /**
   * Registrar un intento
   */
  static recordAttempt(key: string, windowMs: number): void {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const data = localStorage.getItem(`ratelimit_${key}`);

    if (!data) {
      // Primer intento
      localStorage.setItem(`ratelimit_${key}`, JSON.stringify({
        attempts: 1,
        firstAttempt: now
      }));
    } else {
      const { attempts, firstAttempt } = JSON.parse(data);
      
      // Si la ventana de tiempo ha pasado, reiniciar
      if (now - firstAttempt > windowMs) {
        localStorage.setItem(`ratelimit_${key}`, JSON.stringify({
          attempts: 1,
          firstAttempt: now
        }));
      } else {
        // Incrementar intentos
        localStorage.setItem(`ratelimit_${key}`, JSON.stringify({
          attempts: attempts + 1,
          firstAttempt
        }));
      }
    }
  }

  /**
   * Obtener tiempo restante de bloqueo en milisegundos
   */
  static getRemainingTime(key: string): number {
    if (typeof window === 'undefined') return 0;

    const data = localStorage.getItem(`ratelimit_${key}`);
    if (!data) return 0;

    const { firstAttempt } = JSON.parse(data);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos por defecto

    return Math.max(0, windowMs - (now - firstAttempt));
  }
}

/**
 * Utilidades de validación
 */
export class ValidationUtils {
  /**
   * Validar formato de email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase());
  }

  /**
   * Validar contraseña fuerte
   * Mínimo 8 caracteres, mayúsculas, minúsculas, números y caracteres especiales
   */
  static isStrongPassword(password: string): boolean {
    if (password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  /**
   * Validar formato de teléfono (formato colombiano)
   */
  static isValidPhone(phone: string): boolean {
    // Remover espacios y caracteres especiales para validación
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Formato colombiano: +57 seguido de 10 dígitos, o directamente 10 dígitos
    const phoneRegex = /^(?:\+?57)?[3][0-9]{9}$|^[3][0-9]{9}$/;
    
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Sanitizar string para prevenir XSS
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remover < >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }
}

export * from './auth';