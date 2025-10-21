import { createCookie, redirect } from "@remix-run/node";
import { getSession, destroySession, commitSession } from "./session.server";
import { API_URL, isDev } from "./env.server";

export type Role = "admin" | "owner" | "developer";

export type ApiUser = {
  id: string;
  email: string;
  role: Role;
  first_name?: string;
  last_name?: string;
  name?: string;
};

// =============================================================================
// COOKIES - Configuración centralizada
// =============================================================================

const isProd = process.env.NODE_ENV === 'production';

const cookieConfig = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

const accessTokenCookie = createCookie("l360_access", {
  ...cookieConfig,
  maxAge: 60 * 60, // 1 hora
});

const refreshTokenCookie = createCookie("l360_refresh", {
  ...cookieConfig,
  maxAge: 60 * 60 * 24 * 7, // 7 días
});

// =============================================================================
// HELPERS DE COOKIES
// =============================================================================

export async function getAccessTokenFromCookies(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  
  const token = await accessTokenCookie.parse(cookieHeader);
  
  return token;
}

export async function getRefreshTokenFromCookies(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  return await refreshTokenCookie.parse(cookieHeader);
}

export async function commitAuthCookies({
  access,
  refresh,
}: {
  access: string;
  refresh: string;
}) {
  // ✅ REDUCIR logs - solo en desarrollo y solo si hay error
  if (isDev) {
    console.log(`[Auth] Creating cookies (access: ${access.substring(0, 20)}...)`);
  }
  
  const headers = new Headers();
  
  try {
    const accessCookie = await accessTokenCookie.serialize(access);
    const refreshCookie = await refreshTokenCookie.serialize(refresh);
    
    headers.append("Set-Cookie", accessCookie);
    headers.append("Set-Cookie", refreshCookie);
    
    return headers;
  } catch (error) {
    console.error(`[Auth] ❌ ERROR creating cookies:`, error);
    throw error;
  }
}

export async function clearAuthCookies() {
  const headers = new Headers();
  headers.append("Set-Cookie", await accessTokenCookie.serialize("", { maxAge: 0 }));
  headers.append("Set-Cookie", await refreshTokenCookie.serialize("", { maxAge: 0 }));
  return headers;
}

// =============================================================================
// CACHÉ DE USUARIO
// =============================================================================

type CachedUser = {
  user: ApiUser | null;
  timestamp: number;
};

const userCache = new Map<string, CachedUser>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function clearUserCache(token?: string) {
  if (token) {
    userCache.delete(token);
  } else {
    userCache.clear();
  }
  console.log("[Auth] User cache cleared");
}

function getCachedUser(token: string): ApiUser | null | undefined {
  const cached = userCache.get(token);
  if (!cached) return undefined;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    userCache.delete(token);
    return undefined;
  }
  
  return cached.user;
}

function setCachedUser(token: string, user: ApiUser | null) {
  userCache.set(token, {
    user,
    timestamp: Date.now(),
  });
}

// =============================================================================
// AUTENTICACIÓN PRINCIPAL - CRÍTICO: Usar API_URL
// =============================================================================

export async function getUser(request: Request): Promise<ApiUser | null> {
  const url = new URL(request.url);
  
  // No autenticar en rutas públicas
  if (url.pathname === "/logout" || url.searchParams.has('logout')) {
    return null;
  }

  try {
    const token = await getAccessTokenFromCookies(request);
    if (!token) {
      // ✅ ELIMINAR log repetitivo
      // console.log("[getUser] No access token found in cookies");
      return null;
    }

    // Verificar caché
    const cached = getCachedUser(token);
    if (cached !== undefined) {
      return cached;
    }

    // Validar con API usando API_URL
    const apiUrl = `${API_URL}/api/auth/me/`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });
    
    if (response.ok) {
      const responseData = await response.json();
      const userData = responseData.data || responseData;
      
      // ✅ Solo loguear en desarrollo
      if (isDev) {
        console.log(`[Auth] ✅ Token verified for: ${userData.email}`);
      }
      
      // Guardar en caché
      setCachedUser(token, userData);
      return userData;
    } else {
      // ✅ Solo loguear errores
      if (response.status !== 401) {
        console.log(`[Auth] ❌ Token verification failed: ${response.status}`);
      }
    }
    
    // Token inválido, limpiar caché
    clearUserCache(token);
    return null;
  } catch (error) {
    console.error("[Auth] Error in getUser:", error);
    return null;
  }
}

// =============================================================================
// FETCH AUTENTICADO - Con refresh automático
// =============================================================================

export async function fetchWithAuth(
  request: Request,
  url: string,
  options: RequestInit = {}
): Promise<{ res: Response; setCookieHeaders: Headers }> {
  // ✅ CORRECCIÓN: Obtener token de cookies, no de sesión
  let accessToken = await getAccessTokenFromCookies(request);
  const refreshToken = await getRefreshTokenFromCookies(request);

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(url, { ...options, headers });

  // Si el token expiró, intentar renovarlo
  if (response.status === 401 && refreshToken) {
    console.log("[Auth] Access token expired, attempting refresh");

    try {
      const refreshResponse = await fetch(`${API_URL}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access;

        // ✅ CORRECCIÓN: Actualizar cookies con el nuevo token
        if (!accessToken) {
          throw new Error("Failed to refresh access token");
        }
        const setCookieHeaders = await commitAuthCookies({
          access: accessToken,
          refresh: refreshToken as string
        });

        // Reintentar la petición original con el nuevo token
        headers.set("Authorization", `Bearer ${accessToken}`);
        response = await fetch(url, { ...options, headers });

        return { res: response, setCookieHeaders };
      } else {
        // Si falló el refresh, limpiar cookies
        console.log("[Auth] Refresh token failed, clearing cookies");
        const clearHeaders = await clearAuthCookies();
        return { res: response, setCookieHeaders: clearHeaders };
      }
    } catch (error) {
      console.error("[Auth] Error refreshing token:", error);
    }
  }

  return { res: response, setCookieHeaders: new Headers() };
}

// =============================================================================
// ACCIONES DE AUTENTICACIÓN
// =============================================================================

export async function loginAction(request: Request) {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  
  console.log(`[loginAction] Attempting login at: ${API_URL}/api/auth/login/`);
  
  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Auth] Login failed:', error);
    throw new Error("Credenciales inválidas");
  }

  const responseData = await response.json();
  const token = responseData.data?.access || responseData.access;
  const refreshToken = responseData.data?.refresh || responseData.refresh;
  const user = responseData.data?.user || responseData.user;

  if (!token || !user) {
    throw new Error("Respuesta inválida del servidor");
  }

  const headers = await commitAuthCookies({
    access: token,
    refresh: refreshToken || token,
  });

  // Guardar en caché
  setCachedUser(token, user);

  const redirectPath = user.role === "admin" 
    ? "/admin" 
    : user.role === "owner" 
    ? "/owner" 
    : "/developer";

  return redirect(redirectPath, { headers });
}

export async function logoutAction(request: Request) {
  try {
    const session = await getSession(request);
    const refreshToken = session.get("refresh_token");
    
    // Limpiar caché
    const token = await getAccessTokenFromCookies(request);
    if (token) clearUserCache(token);
    
    // Intentar logout en backend
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        });
      } catch (error) {
        console.warn("[Auth] Backend logout failed, continuing with local logout");
      }
    }
    
    const headers = await clearAuthCookies();
    return redirect("/?logout=true", { headers });
  } catch (error) {
    console.error("[Auth] Error in logoutAction:", error);
    return redirect("/", { headers: await clearAuthCookies() });
  }
}

// =============================================================================
// PROTECCIÓN DE RUTAS
// =============================================================================

export async function requireAuth(request: Request): Promise<ApiUser> {
  const user = await getUser(request);
  
  if (!user) {
    throw redirect('/login?message=Debes iniciar sesión para acceder');
  }
  
  return user;
}

export async function authenticateAdmin(request: Request): Promise<ApiUser> {
  const user = await requireAuth(request);
  
  if (user.role !== 'admin') {
    throw redirect('/login?message=No tienes permisos para acceder a esta sección');
  }
  
  return user;
}

// =============================================================================
// HELPERS DE HEADERS
// =============================================================================

export const mergeSetCookieHeaders = ({ loaderHeaders, parentHeaders }: any) => {
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