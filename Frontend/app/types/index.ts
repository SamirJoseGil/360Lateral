// Tipos base del usuario según documentación
export type UserRole = 'admin' | 'owner' | 'developer';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
  role: UserRole;
  date_joined: string;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

// Tipos para autenticación
export interface LoginData {
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

export interface Tokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: Tokens;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: Tokens;
}

export interface LogoutResponse {
  message: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// Tipos para gestión de usuarios
export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  role?: UserRole;
  is_active?: boolean;
  is_staff?: boolean;
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

// Tipos para manejo de errores
export interface ApiError {
  error: string;
  message: string;
  status_code: number;
  field_errors?: Record<string, string[]>;
}

export interface RateLimitError extends ApiError {
  error: 'Rate limit exceeded' | 'Account temporarily locked';
}

export interface ValidationError extends ApiError {
  error: 'Validation failed';
  field_errors: Record<string, string[]>;
}

// Tipos para permisos
export type Permission = 
  | 'AllowAny' 
  | 'IsAuthenticated' 
  | 'CanManageUsers' 
  | 'IsAdminOnly';

export interface PermissionCheck {
  hasPermission: boolean;
  requiredRole?: UserRole;
  message?: string;
}
export interface AuditEvent {
  timestamp: string;
  action: string;
  user_id: string;
  user_email: string;
  resource: string | null;
  details?: Record<string, any>;
  ip_address: string;
}