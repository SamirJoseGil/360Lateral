// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\utils\auth.server.ts
import { createCookie, json, redirect, createCookieSessionStorage } from "@remix-run/node";
import type { HeadersFunction } from "@remix-run/node";
import { ENV, isProd } from "~/env.server";
import { isExpired } from "./jwt.server";
import { getSession, commitSession, getUserFromSession } from "./session.server";

export type Role = "admin" | "owner" | "developer";

// Variable de entorno definida aca
export const API_URL = 'http://localhost:8000';

export type ApiUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Cookies (httpOnly + secure en prod)
// ────────────────────────────────────────────────────────────────────────────────

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

// Session storage
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "l360_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "dev-secret-key"],
    secure: process.env.NODE_ENV === "production",
  },
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

/**
 * Devuelve un access token listo para usar.
 * Si expiró, intenta refrescar con el refresh cookie.
 * Si no puede, limpia cookies y lanza 401.
 */
export async function ensureAccessToken(request: Request) {
  try {
    // Get the session
    const session = await getSession(request);
    let accessToken = session.get("accessToken");
    const refreshToken = session.get("refreshToken");
    
    // Log token status for debugging
    console.log("[Auth] Token check:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    // If we have a valid access token, return it
    if (accessToken && !isExpired(accessToken)) {
      console.log("[Auth] Valid access token found");
      return { token: accessToken, headers: null };
    }

    console.log("[Auth] Access token missing or expired, trying to refresh");
    
    // If no refresh token, we can't refresh
    if (!refreshToken) {
      console.error("[Auth] No refresh token available");
      throw new Response("Authentication failed - No refresh token", { status: 401 });
    }

    // Try to refresh the token
    try {
      console.log("[Auth] Refreshing token...");
      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        console.error("[Auth] Failed to refresh token:", refreshResponse.status, refreshResponse.statusText);
        throw new Response("Authentication failed - Refresh failed", { status: 401 });
      }

      const data = await refreshResponse.json();
      const newAccessToken = data.accessToken;
      
      console.log("[Auth] Refresh response:", {
        hasNewToken: !!newAccessToken
      });

      if (!newAccessToken) {
        console.error("[Auth] No new access token received");
        throw new Response("Authentication failed - Invalid refresh response", { status: 401 });
      }

      // Update session with new token
      session.set("accessToken", newAccessToken);
      const headers = await commitSession(session);
      
      console.log("[Auth] Token refreshed successfully");
      return { token: newAccessToken, headers };
    } catch (error) {
      console.error("[Auth] Token refresh error:", error);
      throw new Response("Authentication failed", { status: 401 });
    }
  } catch (error) {
    console.error("[Auth] ensureAccessToken error:", error);
    throw error;
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
    
    // Check if we have a token
    console.log('[Auth] Token check:', { hasAccessToken: !!accessToken });
    
    // If no token, try to refresh it
    if (!accessToken) {
      console.log('[Auth] Access token missing or expired, trying to refresh');
      const newToken = await ensureAccessToken(request);
      
      // If still no token, we can't proceed
      if (!newToken) {
        console.log('[Auth] No refresh token available');
        throw new Response("Authentication required", { status: 401 });
      }
    }
    
    // Ensure endpoint has the correct base URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // Set default headers with auth token
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    
    // Make the request with auth header
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle token expiration
    if (response.status === 401) {
      console.log('[Auth] Token expired, trying to refresh');
      // Try to refresh the token
      const newToken = await ensureAccessToken(request);
      
      if (newToken) {
        // Retry the request with the new token
        headers.set("Authorization", `Bearer ${newToken}`);
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });
        
        return {
          res: retryResponse,
          setCookieHeaders: new Headers(),
        };
      } else {
        // If we couldn't refresh, throw 401
        throw new Response("Authentication required", { status: 401 });
      }
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

// Agregando debugging mejorado para cookies
export async function getUserId(request: Request): Promise<string | null> {
  console.log('getUserId - checking cookies'); // Debug
  const cookieHeader = request.headers.get("Cookie");
  const accessToken = await accessTokenCookie.parse(cookieHeader);
  console.log('getUserId - found access token:', !!accessToken); // Debug
  return accessToken || null;
}

// Implementamos un pequeño caché en memoria para reducir consultas repetidas
const userRequestCache = new Map<string, { user: any | null, timestamp: number }>();

// Versión mejorada de getUser que usa el nuevo sistema de sesiones
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
    // Intenta obtener el usuario desde la sesión usando la nueva función
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

// Mejorar loginAction con más debugging
export async function loginAction(request: Request) {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  
  console.log('loginAction - attempting login for:', email); // Debug

  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  console.log('loginAction - API response status:', response.status); // Debug

  if (!response.ok) {
    const error = await response.text();
    console.log('loginAction - API error:', error); // Debug
    throw new Error("Credenciales inválidas");
  }

  const responseData = await response.json();
  console.log('loginAction - received data:', responseData); // Debug

  // Ajustar según la estructura de tu API
  const token = responseData.data?.access || responseData.access || responseData.token;
  const refreshToken = responseData.data?.refresh || responseData.refresh || responseData.refreshToken;
  const user = responseData.data?.user || responseData.user;

  if (!token || !user) {
    console.log('loginAction - missing token or user:', { hasToken: !!token, hasUser: !!user }); // Debug
    throw new Error("Respuesta inválida del servidor");
  }

  // Usar las cookies configuradas (l360_access/l360_refresh)
  const headers = await commitAuthCookies({
    access: token,
    refresh: refreshToken || token, // usa token como fallback si no hay refresh
  });

  console.log('loginAction - cookies set, headers:', [...headers.entries()]); // Debug

  // Redirect según rol
  const redirectPath = user.role === "admin" 
    ? "/admin" 
    : user.role === "owner" 
    ? "/owner" 
    : "/developer";

  console.log('loginAction - redirecting to:', redirectPath); // Debug
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

// Función para verificar si una solicitud proviene de una redirección
// Esto ayudará a romper bucles potenciales de redirección
export function isRedirectLoop(request: Request): boolean {
  try {
    const url = new URL(request.url);
    const redirectCount = parseInt(url.searchParams.get("_rc") || "0", 10);
    console.log(`isRedirectLoop - URL: ${url.pathname}, redirectCount: ${redirectCount}`);
    return redirectCount >= 2; // Consideramos un bucle después de 2 redirecciones
  } catch (error) {
    console.error("Error en isRedirectLoop:", error);
    return false; // Si hay error, asumimos que no es un bucle
  }
}

// Función para agregar o incrementar el contador de redirecciones en una URL
export function addRedirectCount(url: string): string {
  try {
    // Primero verificar si la URL ya es absoluta
    if (url.startsWith('http')) {
      const parsedUrl = new URL(url);
      const currentCount = parseInt(parsedUrl.searchParams.get("_rc") || "0", 10);
      parsedUrl.searchParams.set("_rc", (currentCount + 1).toString());
      return parsedUrl.toString();
    } else {
      // Si es una ruta relativa, solo añadimos el parámetro manualmente
      const hasParams = url.includes('?');
      const separator = hasParams ? '&' : '?';
      const currentCount = 0; // No podemos saber el count actual, asumimos 0
      return `${url}${separator}_rc=${currentCount + 1}`;
    }
  } catch (error) {
    console.error("Error en addRedirectCount:", error);
    // En caso de error, devolvemos la URL original
    return url;
  }
}

// Función que analiza directamente las cookies en la solicitud para obtener el token de acceso
export function getTokenDirectlyFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") || "";
  console.log("Raw cookie header:", cookieHeader);
  
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(pair => {
    const [key, value] = pair.trim().split('=');
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
    return cookies;
  });
  
  const accessToken = cookies["l360_access"];
  console.log("Access token found:", !!accessToken);
  
  if (!accessToken) return null;
  
  // Simplemente devolver el token sin intentar decodificarlo
  // El token JWT ya está en un formato que se puede usar directamente
  return accessToken;
}

/**
 * Verifica que el usuario está autenticado como administrador
 * Si no lo está, redirige al login
 */
export async function authenticateAdmin(request: Request): Promise<any> {
  // Obtenemos el token de acceso
  const token = await getAccessTokenFromCookies(request);
  
  if (!token) {
    throw redirect('/login?message=Debes iniciar sesión para acceder');
  }
  
  // Obtener datos del usuario desde la API
  try {
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/auth/me/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw redirect('/login?message=Sesión expirada. Por favor inicia sesión nuevamente.');
    }
    
    const user = await response.json();
    
    // Verificar que el usuario es administrador
    if (!user || user.role !== 'admin') {
      throw redirect('/login?message=No tienes permisos para acceder a esta sección');
    }
    
    return user;
  } catch (error) {
    console.error("Error autenticando administrador:", error);
    throw redirect('/login?message=Error de autenticación');
  }
}