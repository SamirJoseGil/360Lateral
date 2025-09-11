import { createCookie, json, redirect } from "@remix-run/node";
import type { HeadersFunction } from "@remix-run/node";
import { isExpired } from "./jwt.server";
import { getSession, commitSession, getUserFromSession } from "./session.server";
import { API_URL } from "./api.server";

export type Role = "admin" | "owner" | "developer";

export type ApiUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Cookies (httpOnly + secure en prod)
// ────────────────────────────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === "production";

const accessTokenCookie = createCookie("l360_access", {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60, // 1h
});

const refreshTokenCookie = createCookie("l360_refresh", {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 días
});

// Helpers para setear/limpiar en headers
export async function commitAuthCookies({
  access,
  refresh,
}: {
  access: string;
  refresh: string;
}) {
  const headers = new Headers();
  headers.append("Set-Cookie", await accessTokenCookie.serialize(access));
  headers.append("Set-Cookie", await refreshTokenCookie.serialize(refresh));
  return headers;
}

export async function clearAuthCookies() {
  const headers = new Headers();
  
  // Usar el formato específico para garantizar que las cookies se eliminan
  // Nota: especificar path="/" es crucial para eliminar las cookies correctamente
  
  // Limpiar l360_access
  headers.append("Set-Cookie", 
    "l360_access=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  
  // Limpiar l360_refresh
  headers.append("Set-Cookie", 
    "l360_refresh=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  
  // Limpiar l360_session
  headers.append("Set-Cookie", 
    "l360_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  
  // Limpiar __360lateral (cookie de sesión)
  headers.append("Set-Cookie", 
    "__360lateral=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  
  console.log("All auth cookies cleared with explicit headers");
  return headers;
}

export async function logoutAction(request: Request) {
  try {
    // Limpiar cookies manualmente
    const headers = await clearAuthCookies();
    
    // Verificar si es una solicitud de API o una navegación normal
    const acceptHeader = request.headers.get("Accept") || "";
    const isApiRequest = acceptHeader.includes("application/json");
    
    if (isApiRequest) {
      // Para solicitudes API, devolver JSON con instrucción de redirección
      return json({ 
        success: true, 
        message: "Sesión cerrada correctamente",
        redirectTo: "/",
        forceRefresh: true
      }, { headers });
    }
    
    // Para solicitudes normales, hacer redirección directa
    return redirect("/", { headers });
  } catch (error) {
    console.error("Error en logoutAction:", error);
    return redirect("/", {
      headers: await clearAuthCookies()
    });
  }
}

// Enhanced fetchWithAuth function with better error handling
export async function fetchWithAuth(
  request: Request,
  endpoint: string,
  options: Record<string, any> = {}
) {
  try {
    // Get access token from cookies
    const accessToken = await getAccessTokenFromCookies(request);
    
    if (!accessToken) {
      console.log('[Auth] No access token found');
      throw new Response("Authentication required", { status: 401 });
    }
    
    // Ensure endpoint has the correct base URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // Set default headers with auth token
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    
    // Make the request with auth header
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle token expiration
    if (response.status === 401) {
      console.log('[Auth] Token expired, authentication required');
      throw new Response("Authentication required", { status: 401 });
    }
    
    return {
      res: response,
      setCookieHeaders: new Headers(),
    };
  } catch (error) {
    console.log(`[Auth] Error in fetchWithAuth for endpoint ${endpoint}:`, error);
    throw error;
  }
}

// Implementamos un pequeño caché en memoria para reducir consultas repetidas
const userRequestCache = new Map<string, { user: any | null, timestamp: number }>();

// Función para obtener el usuario actual
export async function getUser(request: Request): Promise<any | null> {
  const url = request.url;
  const now = Date.now();

  // Si tenemos una versión cacheada reciente (menos de 2 segundos), la usamos
  if (userRequestCache.has(url)) {
    const cached = userRequestCache.get(url)!;
    if (now - cached.timestamp < 2000) {
      console.log(`[Cache] Using cached user for ${url}`);
      return cached.user;
    }
  }

  try {
    // Primero intenta obtener el usuario desde la sesión
    const user = await getUserFromSession(request);
    
    if (user) {
      console.log("User found in session:", user.email);
      userRequestCache.set(url, { user, timestamp: now });
      return user;
    }

    // Si no hay usuario en sesión, intentamos obtenerlo del API con el token
    const token = await getAccessTokenFromCookies(request);
    console.log("Access token from cookies:", token ? "found" : "not found");

    if (token) {
      try {
        // Consulta al API para verificar el token y obtener el usuario
        const response = await fetch(`${API_URL}/api/users/me/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("User data from API:", userData?.email);
          userRequestCache.set(url, { user: userData, timestamp: now });
          return userData;
        } else {
          console.log("API response not OK:", response.status);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
    
    userRequestCache.set(url, { user: null, timestamp: now });
    return null;
  } catch (error) {
    console.error("Error in getUser:", error);
    userRequestCache.set(url, { user: null, timestamp: now });
    return null;
  }
}

// Función que analiza directamente las cookies en la solicitud para obtener el token de acceso
export async function getAccessTokenFromCookies(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const accessTokenCookie = cookies.find(c => c.startsWith('l360_access='));
  
  if (!accessTokenCookie) {
    return null;
  }

  // Extraer el token de la cookie
  const accessToken = accessTokenCookie.split('=')[1];
  
  // Intentar quitar comillas si están presentes
  return accessToken.startsWith('"') && accessToken.endsWith('"')
    ? accessToken.slice(1, -1)
    : accessToken;
}

// Mejorar loginAction utilizando el nuevo servicio de auth
export async function loginAction(request: Request) {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  
  console.log('loginAction - attempting login for:', email);

  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  console.log('loginAction - API response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.log('loginAction - API error:', error);
    throw new Error("Credenciales inválidas");
  }

  const responseData = await response.json();
  console.log('loginAction - received data:', responseData);

  // Ajustar según la estructura de la documentación del API
  const token = responseData.data?.access || responseData.access;
  const refreshToken = responseData.data?.refresh || responseData.refresh;
  const user = responseData.data?.user || responseData.user;

  if (!token || !user) {
    console.log('loginAction - missing token or user:', { hasToken: !!token, hasUser: !!user });
    throw new Error("Respuesta inválida del servidor");
  }

  // Usar las cookies configuradas
  const headers = await commitAuthCookies({
    access: token,
    refresh: refreshToken || token,
  });

  console.log('loginAction - cookies set, headers:', [...headers.entries()]);

  // Redirect según rol
  const redirectPath = user.role === "admin" 
    ? "/admin" 
    : user.role === "owner" 
    ? "/owner" 
    : "/developer";

  console.log('loginAction - redirecting to:', redirectPath);
  return redirect(redirectPath, { headers });
}

// Headers helper para Remix loaders/actions
export const mergeSetCookieHeaders: HeadersFunction = ({ loaderHeaders, parentHeaders }) => {
  // Prioriza Set-Cookie del loader y del padre (por si refrescó)
  const headers = new Headers();
  const cookies = [
    ...new Set<string>([
      ...parseSetCookies(parentHeaders),
      ...parseSetCookies(loaderHeaders),
    ]),
  ];
  cookies.forEach((c) => headers.append("Set-Cookie", c));
  return headers;
};

function parseSetCookies(h: Headers): string[] {
  const list: string[] = [];
  h.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") list.push(value);
  });
  return list;
}

/**
 * Verifica que el usuario está autenticado como administrador
 * Si no lo está, redirige al login
 */
export async function authenticateAdmin(request: Request): Promise<any> {
  const user = await getUser(request);
  
  if (!user) {
    throw redirect('/login?message=Debes iniciar sesión para acceder');
  }
  
  // Verificar que el usuario es administrador
  if (user.role !== 'admin') {
    throw redirect('/login?message=No tienes permisos para acceder a esta sección');
  }
  
  return user;
}

