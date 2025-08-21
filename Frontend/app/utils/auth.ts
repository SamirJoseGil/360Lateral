import type { TokenPair, UserRole, RolePermissions } from '../types';
import { ROLE_PERMISSIONS } from '../types';

// Claves para localStorage
const TOKEN_KEYS = {
  ACCESS: 'lateral360_access_token',
  REFRESH: 'lateral360_refresh_token',
  USER: 'lateral360_user_data',
} as const;

/**
 * Gestión segura de tokens en localStorage
 */
export class TokenStorage {
  static setTokens(tokens: TokenPair): void {
    try {
      localStorage.setItem(TOKEN_KEYS.ACCESS, tokens.access);
      localStorage.setItem(TOKEN_KEYS.REFRESH, tokens.refresh);
    } catch (error) {
      console.warn('Failed to store tokens:', error);
    }
  }

  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEYS.ACCESS);
    } catch (error) {
      console.warn('Failed to get access token:', error);
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEYS.REFRESH);
    } catch (error) {
      console.warn('Failed to get refresh token:', error);
      return null;
    }
  }

  static clearTokens(): void {
    try {
      localStorage.removeItem(TOKEN_KEYS.ACCESS);
      localStorage.removeItem(TOKEN_KEYS.REFRESH);
      localStorage.removeItem(TOKEN_KEYS.USER);
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // Si no se puede parsear, asumir que está expirado
    }
  }
}

/**
 * Validación de permisos basada en roles
 */
export class PermissionValidator {
  static getRolePermissions(role: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[role];
  }

  static canViewAllUsers(role: UserRole): boolean {
    return this.getRolePermissions(role).canViewAllUsers;
  }

  static canEditAllUsers(role: UserRole): boolean {
    return this.getRolePermissions(role).canEditAllUsers;
  }

  static canDeleteUsers(role: UserRole): boolean {
    return this.getRolePermissions(role).canDeleteUsers;
  }

  static canChangeRoles(role: UserRole): boolean {
    return this.getRolePermissions(role).canChangeRoles;
  }

  static canManageSystem(role: UserRole): boolean {
    return this.getRolePermissions(role).canManageSystem;
  }

  static canEditUser(currentUserRole: UserRole, targetUserId: number, currentUserId: number): boolean {
    // Admin puede editar cualquier usuario
    if (this.canEditAllUsers(currentUserRole)) {
      return true;
    }
    
    // Usuarios normales solo pueden editarse a sí mismos
    return targetUserId === currentUserId;
  }
}

/**
 * Utilidades de validación
 */
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isStrongPassword(password: string): boolean {
    // Mínimo 8 caracteres, al menos una mayúscula, minúscula, número y carácter especial
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  static sanitizeInput(input: string): string {
    // Remover caracteres peligrosos básicos
    return input.replace(/[<>\"'&]/g, '');
  }

  static isValidPhone(phone: string): boolean {
    // Formato básico para números de teléfono (puede ser ajustado según necesidades)
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
  }
}

/**
 * Rate limiting del lado del cliente
 */
export class RateLimit {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  static isBlocked(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      // Resetear contador si ha pasado la ventana de tiempo
      this.attempts.set(key, { count: 0, resetTime: now + windowMs });
      return false;
    }

    return attempt.count >= maxAttempts;
  }

  static recordAttempt(key: string, windowMs: number): void {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      attempt.count++;
    }
  }

  static getRemainingTime(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    
    return Math.max(0, attempt.resetTime - Date.now());
  }
}