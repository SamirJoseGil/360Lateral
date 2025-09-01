import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/auth.server";

export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "owner" | "developer";
  status: "active" | "inactive" | "pending";
  createdAt: string;
};

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

// Crear un nuevo usuario
export async function createUser(request: Request, userData: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "owner" | "developer";
  status?: "active" | "inactive" | "pending";
}) {
  console.log(`[Users] Creating user: ${userData.email}`);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      console.error(`[Users] Error creating user: ${res.status}`);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail || 
        (errorData.email ? `Email: ${errorData.email[0]}` : null) ||
        `Error creating user: ${res.status}`
      );
    }

    const user = await res.json();

    return {
      user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Users] Error in createUser:", error);
    throw error;
  }
}

// Actualizar un usuario existente
export async function updateUser(request: Request, userId: string, userData: {
  name?: string;
  email?: string;
  password?: string;
  role?: "admin" | "owner" | "developer";
  status?: "active" | "inactive" | "pending";
}) {
  console.log(`[Users] Updating user: ${userId}`);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/${userId}/`, {
      method: 'PATCH',
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

// Actualizar el estado de un usuario (activar/desactivar)
export async function updateUserStatus(request: Request, userId: string, status: "active" | "inactive" | "pending") {
  console.log(`[Users] Updating status for user: ${userId} to ${status}`);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/users/${userId}/status/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      console.error(`[Users] Error updating user status ${userId}: ${res.status}`);
      throw new Error(`Error updating user status: ${res.status}`);
    }

    const user = await res.json();

    return {
      user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`[Users] Error in updateUserStatus (${userId}):`, error);
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