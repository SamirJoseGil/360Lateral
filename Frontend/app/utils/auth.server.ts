import { createCookie, redirect } from "@remix-run/node";
import { API_URL } from "~/utils/env.server";

console.log(`[Auth Utils] Using API_URL: ${API_URL}`);

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
  console.log(`[getAccessTokenFromCookies] Cookie header: ${cookieHeader ? 'present' : 'missing'}`);
  
  const token = await accessTokenCookie.parse(cookieHeader);
  console.log(`[getAccessTokenFromCookies] Token: ${token ? 'found' : 'not found'}`);
  
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
  console.log(`[commitAuthCookies] ===== CREATING COOKIES =====`);
  console.log(`[commitAuthCookies] Access token length: ${access.length}`);
  console.log(`[commitAuthCookies] Refresh token length: ${refresh.length}`);
  console.log(`[commitAuthCookies] Environment: ${process.env.NODE_ENV}`);
  console.log(`[commitAuthCookies] isProd: ${isProd}`);
  
  const headers = new Headers();
  
  try {
    const accessCookie = await accessTokenCookie.serialize(access);
    const refreshCookie = await refreshTokenCookie.serialize(refresh);
    
    console.log(`[commitAuthCookies] ✅ Access cookie created (${accessCookie.length} chars)`);
    console.log(`[commitAuthCookies] Cookie preview: ${accessCookie.substring(0, 100)}...`);
    console.log(`[commitAuthCookies] ✅ Refresh cookie created (${refreshCookie.length} chars)`);
    
    headers.append("Set-Cookie", accessCookie);
    headers.append("Set-Cookie", refreshCookie);
    
    // Verificar que los headers se agregaron
    const setCookies = headers.getSetCookie();
    console.log(`[commitAuthCookies] ✅ Total Set-Cookie headers: ${setCookies.length}`);
    
    console.log(`[commitAuthCookies] ===== COOKIES CREATED SUCCESSFULLY =====`);
    
    return headers;
  } catch (error) {
    console.error(`[commitAuthCookies] ❌ ERROR creating cookies:`, error);
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
  
  // ✅ CRÍTICO: Logging para debugging
  console.log(`[getUser] Using API_URL: ${API_URL} (isServer: ${typeof window === 'undefined'})`);
  
  // No autenticar en rutas públicas
  if (url.pathname === "/logout" || url.searchParams.has('logout')) {
    return null;
  }

  try {
    const token = await getAccessTokenFromCookies(request);
    if (!token) {
      console.log("[getUser] No access token found in cookies");
      return null;
    }

    console.log(`[getUser] Token found, length: ${token.length}`);

    // Verificar caché
    const cached = getCachedUser(token);
    if (cached !== undefined) {
      console.log("[getUser] Returning cached user");
      return cached;
    }

    // ✅ CRÍTICO: Validar con API usando API_URL
    const apiUrl = `${API_URL}/api/auth/me/`;
    console.log(`[getUser] Verifying token at: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });
    
    if (response.ok) {
      const responseData = await response.json();
      const userData = responseData.data || responseData;
      
      console.log(`[getUser] ✅ Token verified for: ${userData.email}`);
      
      // Guardar en caché
      setCachedUser(token, userData);
      return userData;
    } else {
      console.log(`[getUser] ❌ Token verification failed: ${response.status}`);
      const errorText = await response.text();
      console.log(`[getUser] Error response: ${errorText}`);
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
  const accessToken = await getAccessTokenFromCookies(request);
  const refreshToken = await getRefreshTokenFromCookies(request);

  console.log(`[fetchWithAuth] Fetching: ${url}`);

  if (!accessToken) {
    throw new Response("Authentication required", { status: 401 });
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  
  // Solo establecer Content-Type si no es FormData
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, { ...options, headers });

    // Token expirado, intentar refresh
    if (response.status === 401 && refreshToken) {
      console.log("[Auth] Token expired, refreshing...");
      
      const refreshResponse = await fetch(`${API_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.access;
        
        // Limpiar caché con token antiguo
        clearUserCache(accessToken);

        // Reintentar con nuevo token
        const retryHeaders = new Headers(options.headers);
        retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
        if (!(options.body instanceof FormData)) {
          retryHeaders.set('Content-Type', 'application/json');
        }

        const retryResponse = await fetch(url, { ...options, headers: retryHeaders });

        // Crear headers para actualizar cookies
        const setCookieHeaders = await commitAuthCookies({
          access: newAccessToken,
          refresh: refreshData.refresh || refreshToken,
        });

        return { res: retryResponse, setCookieHeaders };
      } else {
        clearUserCache(accessToken);
        throw new Response("Authentication required", { status: 401 });
      }
    }

    return { res: response, setCookieHeaders: new Headers() };
    
  } catch (error) {
    console.error(`[Auth] Error in fetchWithAuth for ${url}:`, error);
    
    if (error instanceof Response) throw error;
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to ${url}`);
    }
    
    throw new Response("Internal server error", { status: 500 });
  }
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
    const token = await getAccessTokenFromCookies(request);
    const refreshToken = await getRefreshTokenFromCookies(request);
    
    // Limpiar caché
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