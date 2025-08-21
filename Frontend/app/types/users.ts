// Tipos de roles de usuario según la API (compatible con backend)
export type UserRole = "admin" | "owner" | "developer";

// Interface principal del usuario (compatible con API response)
export interface User {
  id: number; // API usa number, no string
  email: string;
  username: string; // Campo requerido por API
  first_name: string; // API usa snake_case
  last_name: string; // API usa snake_case
  phone?: string;
  company?: string;
  role: UserRole;
  date_joined: string; // Campo de API
  is_active: boolean; // API usa snake_case
  is_staff?: boolean;
  is_superuser?: boolean;
  
  // Computed properties para compatibilidad con componentes existentes
  firstName?: string; // Alias para first_name
  lastName?: string; // Alias para last_name
  fullName?: string; // Computed
  isVerified?: boolean;
  isActive?: boolean; // Alias para is_active
  createdAt?: string; // Alias para date_joined
  lastLogin?: string;
}

// Datos para actualizar usuario (compatible con API)
export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  // Campos solo para admin
  role?: UserRole;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  
  // Aliases para compatibilidad con componentes existentes
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

// Datos para registro (compatible con API)
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

// Utility function para convertir respuesta de API a formato de componentes
export function normalizeUser(apiUser: any): User {
  return {
    ...apiUser,
    // Mantener campos originales de API
    id: apiUser.id,
    email: apiUser.email,
    username: apiUser.username,
    first_name: apiUser.first_name,
    last_name: apiUser.last_name,
    is_active: apiUser.is_active,
    date_joined: apiUser.date_joined,
    
    // Añadir aliases para compatibilidad
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    fullName: `${apiUser.first_name} ${apiUser.last_name}`,
    isActive: apiUser.is_active,
    createdAt: apiUser.date_joined,
    isVerified: apiUser.is_active, // Asumir que is_active = verificado
  };
}
