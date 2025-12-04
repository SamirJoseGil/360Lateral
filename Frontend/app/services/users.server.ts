import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL, logApiUrl } from "~/utils/env.server";

// Constante para la URL base de la API
// const API_URL = process.env.API_URL || "http://localhost:8000";

// Tipos actualizados según la documentación del API
export type User = {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string; // Alias calculado
  phone?: string;
  company?: string;
  role: "admin" | "owner" | "developer";
  status?: "active" | "inactive" | "pending";
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  role_fields?: UserProfile;
};

export type UserProfile = {
  role_fields?: {
    // Campos específicos para propietarios
    document_type?: string;
    document_number?: string;
    address?: string;
    id_verification_file?: string;
    lots_count?: number;
    // Campos específicos para desarrolladores
    company_name?: string;
    company_nit?: string;
    position?: string;
    experience_years?: number;
    portfolio_url?: string;
    focus_area?: string;
    // Campos específicos para administradores
    department?: string;
    permissions_scope?: string;
  };
};

export type UsersResponse = {
  users: User[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

/**
 * Obtener lista de usuarios con paginación y filtros
 */
export async function getUsers(request: Request, options: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
} = {}): Promise<{ users: UsersResponse; headers: Headers }> {
  try {
    const url = new URL(`${API_URL}/api/users/`);
    
    // Agregar parámetros de consulta
    if (options.page) url.searchParams.set('page', options.page.toString());
    if (options.limit) url.searchParams.set('limit', options.limit.toString());
    if (options.search) url.searchParams.set('search', options.search);
    if (options.role) url.searchParams.set('role', options.role);
    if (options.status) url.searchParams.set('status', options.status);
    
    logApiUrl("getUsers");
    
    // ✅ LOGGING: Ver qué token se está enviando
    const token = await import("~/utils/auth.server").then(m => m.getAccessTokenFromCookies(request));
    console.log(`[Users] Token present: ${!!token}, length: ${token?.length || 0}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Users] Error fetching users:`, response.status, response.statusText);
      
      // ✅ LOGGING ADICIONAL: Ver el cuerpo de la respuesta de error
      const errorBody = await response.text();
      console.error(`[Users] Error body:`, errorBody);
      
      throw new Error(`Error fetching users: ${response.status} ${response.statusText}`);
    }
    
    const users = await response.json();
    console.log(`[Users] Found ${users.total} users`);
    
    return { 
      users, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Users] Error in getUsers:", error);
    throw error;
  }
}

/* Removed duplicate getUserById function to resolve redeclaration error */



/**
 * Actualizar el estado de un usuario
 */
export async function updateUserStatus(
  request: Request, 
  userId: string, 
  status: "active" | "inactive" | "pending"
): Promise<{ user: User; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/users/${userId}/status/`;
    
    console.log(`[Users] Updating user status: ${userId} to ${status}`);
    
    const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      console.error(`[Users] Error updating user status:`, response.status, response.statusText);
      throw new Error(`Error updating user status: ${response.status} ${response.statusText}`);
    }
    
    const user = await response.json();
    console.log(`[Users] User status updated successfully:`, user.id);
    
    return { 
      user, 
      headers: setCookieHeaders 
    };
  } catch (error) {
    console.error("[Users] Error in updateUserStatus:", error);
    throw error;
  }
}


export type UserRequest = {
  id: number;
  user: string;
  user_name: string;
  request_type: "access" | "feature" | "support" | "developer" | "project" | "other";
  request_type_display: string;
  title: string;
  description: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "completed";
  status_display: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  reviewer?: string;
  reviewer_name?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
};

export type RequestSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  by_type: Record<string, number>;
};

// Obtener información del usuario autenticado
export async function getCurrentUser(request: Request) {
  console.log("[Users] Getting current user profile");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/me/`);

    if (!res.ok) {
      console.error(`[Users] Error fetching current user: ${res.status}`);
      throw new Error(`Error fetching current user: ${res.status}`);
    }

    const user = await res.json();

    return {
      user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in getCurrentUser:", error);
    throw error;
  }
}

// Actualizar perfil del usuario autenticado
export async function updateCurrentUserProfile(request: Request, userData: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  // Campos específicos por rol
  document_type?: string;
  document_number?: string;
  address?: string;
  id_verification_file?: string;
  company_name?: string;
  company_nit?: string;
  position?: string;
  experience_years?: number;
  portfolio_url?: string;
  focus_area?: string;
  department?: string;
  permissions_scope?: string;
}) {
  console.log("[Users] Updating current user profile");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/me/update/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      console.error(`[Users] Error updating profile: ${res.status}`);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error updating profile: ${res.status}`);
    }

    const response = await res.json();

    return {
      success: response.success,
      message: response.message,
      user: response.user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in updateCurrentUserProfile:", error);
    throw error;
  }
}
// Obtener todos los usuarios (para administradores)
export async function getAllUsers(request: Request, searchQuery?: string) {
  console.log(`[Users] Getting all users, search query: ${searchQuery || "none"}`);

  try {
    let endpoint = `${API_URL}/api/users/`;
    
    // Agregar parámetro de búsqueda si se proporciona
    if (searchQuery) {
      endpoint += `?search=${encodeURIComponent(searchQuery)}`;
    }

    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      console.error(`[Users] Error fetching users: ${res.status}`);
      throw new Error(`Error fetching users: ${res.status}`);
    }

    const data = await res.json();
    const users = Array.isArray(data.results) ? data.results : [];

    return {
      users,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in getAllUsers:", error);
    throw error;
  }
}

// Obtener un usuario por ID
export async function getUserById(request: Request, userId: string) {
  console.log(`[Users] Getting user by ID: ${userId}`);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/${userId}/`);

    if (!res.ok) {
      console.error(`[Users] Error fetching user ${userId}: ${res.status}`);
      throw new Error(`Error fetching user: ${res.status}`);
    }

    const user = await res.json();

    return {
      user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[Users] Error in getUserById (${userId}):`, error);
    throw error;
  }
}

// Crear un nuevo usuario (corregido según documentación)
export async function createUser(request: Request, userData: {
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
  role: "admin" | "owner" | "developer";
  password: string;
  // ✅ ELIMINADO: Campos específicos por rol (se manejan después en el perfil)
}) {
  console.log(`[Users] Creating user: ${userData.email}`);

  try {
    // ✅ Preparar datos simplificados
    const requestData: any = {
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role,
      password: userData.password,
    };

    // Campos opcionales comunes
    if (userData.username) requestData.username = userData.username;
    if (userData.phone) requestData.phone = userData.phone;
    if (userData.company) requestData.company = userData.company;

    // ✅ Valores por defecto según rol (para evitar errores de validación)
    if (userData.role === 'admin') {
      requestData.department = 'general';  // Valor por defecto
    } else if (userData.role === 'developer') {
      requestData.company_name = userData.company || 'Sin especificar';  // Valor temporal
    }

    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!res.ok) {
      console.error(`[Users] Error creating user: ${res.status}`);
      const errorData = await res.json().catch(() => ({}));
      
      const errorMessage = 
        errorData.error || 
        errorData.detail ||
        (errorData.errors && JSON.stringify(errorData.errors)) ||
        (errorData.email ? `Email: ${errorData.email[0]}` : null) ||
        `Error creating user: ${res.status}`;
      
      throw new Error(errorMessage);
    }

    const response = await res.json();

    return {
      user: response.user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in createUser:", error);
    throw error;
  }
}

// Actualizar un usuario existente
export async function updateUser(request: Request, userId: string, userData: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  role?: "admin" | "owner" | "developer";
  email?: string;
  username?: string;
  is_active?: boolean; // Agregar is_active
}) {
  console.log(`[Users] Updating user: ${userId}`);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/${userId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      console.error(`[Users] Error updating user ${userId}: ${res.status}`);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail || 
        (errorData.email ? `Email: ${errorData.email[0]}` : null) ||
        `Error updating user: ${res.status}`
      );
    }

    const user = await res.json();

    return {
      user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[Users] Error in updateUser (${userId}):`, error);
    throw error;
  }
}

// Eliminar un usuario
export async function deleteUser(request: Request, userId: string) {
  console.log(`[Users] Deleting user: ${userId}`);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/${userId}/`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      console.error(`[Users] Error deleting user ${userId}: ${res.status}`);
      throw new Error(`Error deleting user: ${res.status}`);
    }

    return {
      success: true,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[Users] Error in deleteUser (${userId}):`, error);
    throw error;
  }
}

// === FUNCIONES PARA GESTIÓN DE SOLICITUDES (USER REQUESTS) ===

// Obtener solicitudes del usuario
export async function getUserRequests(request: Request, filters?: {
  type?: string;
  status?: string;
  search?: string;
}) {
  console.log("[Users] Getting user requests");

  try {
    let endpoint = `${API_URL}/api/users/requests/my_requests/`;
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }

    const { res, setCookieHeaders } = await fetchWithAuth(request, endpoint);

    if (!res.ok) {
      console.error(`[Users] Error fetching user requests: ${res.status}`);
      throw new Error(`Error fetching user requests: ${res.status}`);
    }

    const requests = await res.json();

    return {
      requests,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in getUserRequests:", error);
    throw error;
  }
}

// Crear nueva solicitud
export async function createUserRequest(request: Request, requestData: {
  request_type: "access" | "feature" | "support" | "developer" | "project" | "other";
  title: string;
  description: string;
  reference_id?: string;
  metadata?: Record<string, any>;
}) {
  console.log("[Users] Creating user request");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/requests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!res.ok) {
      console.error(`[Users] Error creating request: ${res.status}`);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error creating request: ${res.status}`);
    }

    const newRequest = await res.json();

    return {
      request: newRequest,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in createUserRequest:", error);
    throw error;
  }
}

// Obtener resumen de solicitudes
export async function getUserRequestsSummary(request: Request) {
  console.log("[Users] Getting user requests summary");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/requests/summary/`);

    if (!res.ok) {
      console.error(`[Users] Error fetching requests summary: ${res.status}`);
      throw new Error(`Error fetching requests summary: ${res.status}`);
    }

    const summary = await res.json();

    return {
      summary,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in getUserRequestsSummary:", error);
    throw error;
  }
}

// Obtener actualizaciones recientes de solicitudes
export async function getRecentRequestUpdates(request: Request, days: number = 30, limit: number = 10) {
  console.log("[Users] Getting recent request updates");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/users/requests/recent_updates/?days=${days}&limit=${limit}`
    );

    if (!res.ok) {
      console.error(`[Users] Error fetching recent updates: ${res.status}`);
      throw new Error(`Error fetching recent updates: ${res.status}`);
    }

    const updates = await res.json();

    return {
      updates,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in getRecentRequestUpdates:", error);
    throw error;
  }
}

// Helper para manejo de errores de API
export function handleApiError(error: unknown, defaultMessage: string = "Error desconocido") {
  console.error("[API Error]", error);
  
  if (error instanceof Response) {
    return { 
      error: `Error ${error.status}: ${error.statusText}`, 
      status: error.status 
    };
  }
  
  if (error instanceof Error) {
    return { 
      error: error.message || defaultMessage, 
      status: 500 
    };
  }
  
  return { 
    error: defaultMessage, 
    status: 500 
  };
}

// ✅ MEJORADO: Marcar primera sesión como completada
export async function markFirstLoginCompleted(request: Request) {
  console.log("[Users] Marking first login as completed");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(
      request, 
      `${API_URL}/api/users/first-login-completed/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!res.ok) {
      console.error(`[Users] Error marking first login: ${res.status}`);
      throw new Error(`Error marking first login: ${res.status}`);
    }

    const response = await res.json();

    return {
      success: response.success,
      message: response.message,
      user: response.user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in markFirstLoginCompleted:", error);
    throw error;
  }
}