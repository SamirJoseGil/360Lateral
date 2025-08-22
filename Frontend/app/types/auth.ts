import { UserRole } from "./userRole";

export interface User {
  id: string;  // Cambiado a string para UUID
  email: string;
  first_name: string; // Cambiado de first_name/last_name a name
  last_name: string; // Cambiado de first_name/last_name a name
  role: 'admin' | 'owner' | 'developer';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

// Adaptado para manejar el formato de respuesta del backend
export interface LoginResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface ApiError {
  error: boolean | string;
  message: string;
  status_code?: number;
}

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    initialCheckDone: boolean;
    user: User | null;
    authError: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasRole: (role: string | string[]) => boolean;
    getDashboardPath: (role: string) => string;
    normalizeRole: (role: string) => UserRole;
}