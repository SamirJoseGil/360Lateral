import type { User } from './users';

// Tokens JWT
export interface TokenPair {
  access: string;
  refresh: string;
}

// Datos para login
export interface LoginData {
  email: string;
  password: string;
}

// Respuesta exitosa de login
export interface LoginResponse {
  message: string;
  user: User;
  tokens: TokenPair;
}

// Respuesta exitosa de registro
export interface RegisterResponse {
  message: string;
  user: User;
  tokens: TokenPair;
}

// Errores específicos de autenticación
export interface AuthError {
  error: string | boolean;
  message: string;
  status_code?: number;
  field_errors?: Record<string, string[]>;
}

// Estados de autenticación
export interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Respuesta de refresh token
export interface RefreshTokenResponse {
  access: string;
}

// Respuesta de logout
export interface LogoutResponse {
  message: string;
}

// Respuesta de cambio de contraseña
export interface ChangePasswordResponse {
  message: string;
}