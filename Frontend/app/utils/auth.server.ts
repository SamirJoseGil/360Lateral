import { createCookie, json, redirect } from "@remix-run/node";
import type { HeadersFunction } from "@remix-run/node";
import { API_URL } from "./api.server";

export type Role = "admin" | "owner" | "developer";

export type ApiUser = {
  id: string;
  email: string;
  role: Role;
  first_name?: string;
  last_name?: string;
  name?: string;
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
  
  // Limpiar todas las cookies de autenticación
  const cookieOptions = "Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";
  
  headers.append("Set-Cookie", `l360_access=; ${cookieOptions}`);
  headers.append("Set-Cookie", `l360_refresh=; ${cookieOptions}`);
  headers.append("Set-Cookie", `l360_user=; ${cookieOptions}`);
  headers.append("Set-Cookie", `l360_session=; ${cookieOptions}`);
  
  console.log("All auth cookies cleared");
  
  // CRÍTICO: Limpiar caché de usuario
  userRequestCache.clear();
  
  return headers;
}

export async function logoutAction(request: Request) {
  try {
    console.log("=== LOGOUT ACTION START ===");
    
    // Limpiar cookies y caché
    const headers = await clearAuthCookies();
    
    // CRÍTICO: NO agregar X-Remix-Revalidate
    // Esto causa loops infinitos
    
    console.log("=== LOGOUT ACTION END ===");
    
    // Redirigir a home con headers que limpian cookies
    return redirect("/?logout=true", { headers });
  } catch (error) {
    console.error("Error en logoutAction:", error);
    return redirect("/", {
      headers: await clearAuthCookies()
    });
  }
}

/**
 * Función mejorada para hacer peticiones autenticadas con mejor manejo de errores
 */
export async function fetchWithAuth(
  request: Request,
  url: string,
  options: RequestInit = {}
): Promise<{ res: Response; setCookieHeaders: Headers }> {
  const accessToken = await getAccessTokenFromCookies(request);
  const refreshToken = await getRefreshTokenFromCookies(request);

  console.log(`[Auth] Making authenticated request to: ${url}`);
  console.log(`[Auth] Has access token: ${!!accessToken}`);
  console.log(`[Auth] Has refresh token: ${!!refreshToken}`);

  if (!accessToken) {
    console.log("[Auth] No access token available, authentication required");
    throw new Response("Authentication required", { status: 401 });
  }

  // Preparar headers con token
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');

  console.log(`[Auth] Making request with token: ${accessToken.substring(0, 20)}...`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[Auth] Response status: ${response.status} for ${url}`);

    // Si el token ha expirado (401), intentar renovarlo
    if (response.status === 401) {
      console.log("[Auth] Token expired, attempting refresh");
      
      if (!refreshToken) {
        console.log("[Auth] No refresh token available, authentication required");
        throw new Response("Authentication required", { status: 401 });
      }

      try {
        console.log("[Auth] Attempting token refresh");
        const refreshResponse = await fetch(`${API_URL}/api/auth/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        console.log(`[Auth] Refresh response status: ${refreshResponse.status}`);

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.access;
          
          console.log("[Auth] Token refreshed successfully");

          // Reintentar la petición original con el nuevo token
          const retryHeaders = new Headers(options.headers);
          retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
          retryHeaders.set('Content-Type', 'application/json');

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });

          console.log(`[Auth] Retry response status: ${retryResponse.status}`);

          // Crear headers para actualizar las cookies
          const setCookieHeaders = new Headers();
          const isProduction = process.env.NODE_ENV === 'production';
          
          setCookieHeaders.append("Set-Cookie", `l360_access=${encodeURIComponent(newAccessToken)}; Path=/; HttpOnly; SameSite=Strict${isProduction ? '; Secure' : ''}`);
          
          // Si el refresh también devuelve un nuevo refresh token, actualizarlo
          if (refreshData.refresh) {
            setCookieHeaders.append("Set-Cookie", `l360_refresh=${encodeURIComponent(refreshData.refresh)}; Path=/; HttpOnly; SameSite=Strict${isProduction ? '; Secure' : ''}`);
          }

          return { res: retryResponse, setCookieHeaders };
        } else {
          console.log("[Auth] Token refresh failed, authentication required");
          const errorText = await refreshResponse.text();
          console.log(`[Auth] Refresh error: ${errorText}`);
          throw new Response("Authentication required", { status: 401 });
        }
      } catch (refreshError) {
        console.error("[Auth] Error during token refresh:", refreshError);
        throw new Response("Authentication required", { status: 401 });
      }
    }

    // Si la respuesta es exitosa, devolver tal como está
    return { res: response, setCookieHeaders: new Headers() };
    
  } catch (error) {
    console.error(`[Auth] Error in fetchWithAuth for endpoint ${url}:`, error);
    
    // Si es un error de red, relanzar para que el código llamador lo maneje
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to ${url}`);
    }
    
    // Si es nuestro error de autenticación, relanzarlo
    if (error instanceof Response) {
      throw error;
    }
    
    // Para otros errores, crear una respuesta de error genérica
    throw new Response("Internal server error", { status: 500 });
  }
}

// Implementamos un pequeño caché en memoria - MEJORADO
const userRequestCache = new Map<string, { user: any | null, timestamp: number }>();

// CRÍTICO: Función para limpiar caché manualmente
export function clearUserCache() {
  userRequestCache.clear();
  console.log("User cache cleared");
}

// Función para obtener el usuario actual - OPTIMIZADA
export async function getUser(request: Request): Promise<any | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // CRÍTICO: No usar caché en rutas de logout
  if (pathname === "/api/auth/logout" || pathname === "/logout" || url.searchParams.has('logout')) {
    console.log("Logout detected, skipping cache and returning null");
    return null;
  }
  
  // Cache key único por ruta
  const cacheKey = `user_${pathname}`;
  const now = Date.now();

  // Verificar cache (2 segundos para evitar demasiadas llamadas)
  if (userRequestCache.has(cacheKey)) {
    const cached = userRequestCache.get(cacheKey)!;
    if (now - cached.timestamp < 2000) {
      return cached.user;
    }
    userRequestCache.delete(cacheKey);
  }

  try {
    // 1. Intentar obtener token de acceso
    const token = await getAccessTokenFromCookies(request);
    
    if (!token) {
      userRequestCache.set(cacheKey, { user: null, timestamp: now });
      return null;
    }

    // 2. Validar token con el API
    try {
      const response = await fetch(`${API_URL}/api/users/me/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        userRequestCache.set(cacheKey, { user: userData, timestamp: now });
        return userData;
      }
    } catch (error) {
      console.error("Error fetching user from API:", error);
    }
    
    // No hay usuario autenticado
    userRequestCache.set(cacheKey, { user: null, timestamp: now });
    return null;
  } catch (error) {
    console.error("Error in getUser:", error);
    userRequestCache.set(cacheKey, { user: null, timestamp: now });
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

// Función que analiza directamente las cookies en la solicitud para obtener el refresh token
export async function getRefreshTokenFromCookies(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const refreshTokenCookie = cookies.find(c => c.startsWith('l360_refresh='));

  if (!refreshTokenCookie) {
    return null;
  }

  // Extraer el token de la cookie
  const refreshToken = refreshTokenCookie.split('=')[1];

  // Intentar quitar comillas si están presentes
  return refreshToken.startsWith('"') && refreshToken.endsWith('"')
    ? refreshToken.slice(1, -1)
    : refreshToken;
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