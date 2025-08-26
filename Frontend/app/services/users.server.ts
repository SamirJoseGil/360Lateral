import { fetchWithAuth, getAccessTokenFromCookies } from "~/utils/auth.server";

// Tipos
export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "owner" | "developer";
  status: "active" | "inactive" | "pending";
  createdAt: string;
};

// Tipo para la respuesta directa de la API
export type ApiUser = {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  company?: string;
  role: "admin" | "owner" | "developer";
  is_verified?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
};

// URL base para las operaciones de usuarios
const BASE_URL = "http://localhost:8000/api/users/";

// Obtener todos los usuarios (para administradores)
export async function getAllUsers(request: Request, searchQuery?: string) {
  console.log(`Getting all users with search: ${searchQuery || "none"}`);
  
  try {
    // Construir URL con parámetros de búsqueda si existen
    let url = BASE_URL;
    if (searchQuery) {
      url += `?search=${encodeURIComponent(searchQuery)}`;
    }
    
    console.log(`Using full URL: ${url}`);
    
    // Usar nuestro método personalizado que evita problemas con el token
    const { res: response, setCookieHeaders } = await fetchWithTokenFallback(request, url);
    
    if (!response.ok) {
      console.error(`Error fetching users: ${response.status}`);
      const errorText = await response.text();
      throw new Error(`Error fetching users: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Depurar estructura de respuesta
    console.log("Response structure:", Object.keys(data));
    
    // Verificar si la respuesta contiene un array de usuarios o está en otra estructura
    let apiUsers = Array.isArray(data) ? data : 
                data.results ? data.results : 
                data.users ? data.users : 
                data.data ? data.data : [];
                
    console.log(`Retrieved ${apiUsers.length || 0} users`);
    if (apiUsers.length > 0) {
        console.log("User data sample:", apiUsers[0]);
    }
    
    // Transformar los usuarios de la API al formato interno
    const users = apiUsers.map((apiUser: any) => mapApiUserToUser(apiUser as ApiUser));
    console.log("Transformed users:", users.length);
    
    return {
      users: users,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
}

// Obtener un usuario por ID
export async function getUserById(request: Request, userId: string) {
  console.log(`Getting user with ID: ${userId}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithTokenFallback(request, `${BASE_URL}${userId}`);
    
    if (!res.ok) {
      console.error(`Error fetching user ${userId}: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error fetching user: ${errorText}`);
    }
    
    const apiUser = await res.json();
    console.log(`Retrieved user: ${apiUser.email}`);
    
    // Transformar el usuario al formato interno
    const user = mapApiUserToUser(apiUser as ApiUser);
    
    return {
      user: user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error in getUserById (${userId}):`, error);
    throw error;
  }
}

// Crear un nuevo usuario
export async function createUser(request: Request, userData: Omit<User, 'id' | 'createdAt'> & { password: string }) {
  console.log(`Creating new user: ${userData.email}`);
  
  try {
    // Convertir los datos a formato API
    const nameParts = userData.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const apiUserData = {
      email: userData.email,
      password: userData.password,
      username: userData.email.split('@')[0], // Crear username a partir del email
      full_name: userData.name,
      first_name: firstName,
      last_name: lastName,
      role: userData.role,
      is_active: userData.status === 'active'
    };
    
    console.log("Sending user data to API:", { ...apiUserData, password: '***hidden***' });
    
    // Usar nuestra función personalizada para evitar problemas con token.split
    const { res, setCookieHeaders } = await fetchWithTokenFallback(request, BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiUserData)
    });
    
    if (!res.ok) {
      console.error(`Error creating user: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error creating user: ${errorText}`);
    }
    
    const apiUser = await res.json();
    console.log(`Created user: ${apiUser.email}`);
    
    // Transformar el usuario al formato interno
    const user = mapApiUserToUser(apiUser as ApiUser);
    
    return {
      user: user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
}

// Actualizar un usuario existente
export async function updateUser(request: Request, userId: string, userData: Partial<User> & { password?: string }) {
  console.log(`Updating user with ID: ${userId}`);
  
  try {
    // Convertir los datos a formato API
    const apiUserData: any = {};
    if (userData.name) {
      const nameParts = userData.name.split(' ');
      apiUserData.full_name = userData.name;
      apiUserData.first_name = nameParts[0] || '';
      apiUserData.last_name = nameParts.slice(1).join(' ') || '';
    }
    if (userData.email) apiUserData.email = userData.email;
    if (userData.role) apiUserData.role = userData.role;
    if (userData.status) apiUserData.is_active = userData.status === 'active';
    if (userData.password) apiUserData.password = userData.password;
    
    console.log("Sending update data to API:", { ...apiUserData, password: apiUserData.password ? '***hidden***' : undefined });
    
    const { res, setCookieHeaders } = await fetchWithTokenFallback(request, `${BASE_URL}${userId}`, {
      method: "PATCH", // O PUT dependiendo de la API
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiUserData)
    });
    
    if (!res.ok) {
      console.error(`Error updating user ${userId}: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error updating user: ${errorText}`);
    }
    
    const apiUser = await res.json();
    console.log(`Updated user: ${apiUser.email}`);
    
    // Transformar el usuario al formato interno
    const user = mapApiUserToUser(apiUser as ApiUser);
    
    return {
      user: user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error in updateUser (${userId}):`, error);
    throw error;
  }
}

// Eliminar un usuario
export async function deleteUser(request: Request, userId: string) {
  console.log(`Deleting user with ID: ${userId}`);
  
  try {
    const { res, setCookieHeaders } = await fetchWithTokenFallback(request, `${BASE_URL}${userId}`, {
      method: "DELETE"
    });
    
    if (!res.ok) {
      console.error(`Error deleting user ${userId}: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error deleting user: ${errorText}`);
    }
    
    console.log(`User ${userId} deleted successfully`);
    
    return {
      success: true,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error(`Error in deleteUser (${userId}):`, error);
    throw error;
  }
}

// Actualizar el estado de un usuario (activar/desactivar)
export async function updateUserStatus(request: Request, userId: string, status: "active" | "inactive" | "pending") {
  console.log(`Updating status for user ${userId} to: ${status}`);
  
  return updateUser(request, userId, { status });
}

// Obtener el perfil del usuario autenticado
export async function getCurrentUser(request: Request) {
  console.log("Getting current user profile");
  
  try {
    const { res, setCookieHeaders } = await fetchWithTokenFallback(request, `${BASE_URL}me/`);
    
    if (!res.ok) {
      console.error(`Error fetching current user: ${res.status}`);
      const errorText = await res.text();
      throw new Error(`Error fetching current user: ${errorText}`);
    }
    
    const apiUser = await res.json();
    console.log(`Retrieved current user: ${apiUser.email}`);
    
    // Transformar el usuario al formato interno
    const user = mapApiUserToUser(apiUser as ApiUser);
    
    return {
      user: user,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    throw error;
  }
}

// Ayudante para intentar obtener token de las cookies de sesión o refresh
export async function tryGetTokenFromSessionOrRefresh(request: Request): Promise<string | null> {
  console.log("Intentando obtener token desde cookie de sesión o refresh");
  
  // Obtener todas las cookies disponibles
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    console.log("No hay cookies disponibles");
    return null;
  }
  
  // Verificar si tenemos una cookie de sesión que contenga información del usuario
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  console.log("Cookies disponibles:", cookies.map(c => c.split('=')[0]));
  
  // Primero buscar l360_session que debería contener el token del usuario
  const sessionCookie = cookies.find(cookie => cookie.startsWith('l360_session='));
  if (sessionCookie) {
    try {
      // Decodificar la cookie de sesión
      const sessionValue = decodeURIComponent(sessionCookie.split('=')[1]);
      const sessionData = JSON.parse(sessionValue);
      
      if (sessionData.user) {
        // Intentar parsear el usuario desde la sesión
        const userData = typeof sessionData.user === 'string' 
          ? JSON.parse(sessionData.user)
          : sessionData.user;
          
        console.log("Información de usuario encontrada en sesión:", userData.email);
        // Usar el ID del usuario como token básico para autenticación
        return `SESSION_${userData.id}`;
      }
    } catch (error) {
      console.error("Error al decodificar cookie de sesión:", error);
    }
  }
  
  // Si no hay información de sesión útil, intentar con el token de refresh
  const refreshCookie = cookies.find(cookie => cookie.startsWith('l360_refresh='));
  if (refreshCookie) {
    const refreshToken = refreshCookie.split('=')[1];
    console.log("Token de refresh encontrado, intentando usar como alternativa");
    // Devolver el token de refresh como último recurso
    return refreshToken;
  }
  
  return null;
}

// Función auxiliar para manejar errores de API de manera consistente
export function handleApiError(error: unknown, defaultMessage = "Error en la operación") {
  console.error("API Error:", error);
  
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

// Función auxiliar para depurar la obtención del token
export async function debugToken(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    console.log("DEBUG: No hay cookies disponibles");
    return null;
  }
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  console.log("DEBUG: Cookies disponibles:", cookies);
  
  const accessCookie = cookies.find(cookie => cookie.startsWith('l360_access='));
  if (accessCookie) {
    console.log("DEBUG: Access cookie encontrada");
    const accessToken = accessCookie.split('=')[1];
    return accessToken;
  } else {
    console.log("DEBUG: No se encontró cookie de acceso");
    return null;
  }
}

// Función para realizar peticiones autenticadas sin depender de fetchWithAuth
async function fetchWithTokenFallback(request: Request, url: string, options?: RequestInit) {
  console.log(`fetchWithTokenFallback - Fetching ${url}`);
  
  // Intentar obtener el token de acceso
  const accessToken = await getAccessTokenFromCookies(request);
  console.log("Access token available:", !!accessToken);
  
  if (!accessToken) {
    throw new Error("No se pudo obtener token de autenticación");
  }
  
  // Configurar headers con el token de autenticación
  const headers = new Headers(options?.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  
  // Realizar la petición
  const finalOptions = {
    ...options,
    headers
  };
  
  const response = await fetch(url, finalOptions);
  
  // Retornar en formato compatible con fetchWithAuth
  return {
    res: response,
    setCookieHeaders: response.headers
  };
}

// Función para transformar usuarios de la API al formato interno
function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.full_name || apiUser.first_name || apiUser.username || apiUser.email,
    role: apiUser.role,
    status: apiUser.is_active ? "active" : apiUser.is_verified ? "pending" : "inactive",
    createdAt: apiUser.created_at
  };
}