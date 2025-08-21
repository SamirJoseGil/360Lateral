// Tipos de roles de usuario según la API
export type UserRole = 'admin' | 'owner' | 'developer';

// Interface principal del usuario
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

// Datos para registro de usuario
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

// Datos para actualizar perfil (campos restringidos por rol)
export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  // Campos solo para admin
  role?: UserRole;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
}

// Datos para cambio de contraseña
export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

// Respuesta de lista de usuarios (con paginación)
export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

// Permisos por rol
export interface RolePermissions {
  canViewAllUsers: boolean;
  canEditAllUsers: boolean;
  canDeleteUsers: boolean;
  canChangeRoles: boolean;
  canManageSystem: boolean;
}

// Mapa de permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewAllUsers: true,
    canEditAllUsers: true,
    canDeleteUsers: true,
    canChangeRoles: true,
    canManageSystem: true,
  },
  owner: {
    canViewAllUsers: false,
    canEditAllUsers: false,
    canDeleteUsers: false,
    canChangeRoles: false,
    canManageSystem: false,
  },
  developer: {
    canViewAllUsers: false,
    canEditAllUsers: false,
    canDeleteUsers: false,
    canChangeRoles: false,
    canManageSystem: false,
  },
};