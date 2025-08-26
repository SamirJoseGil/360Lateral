// app/utils/auth.server.ts
import { createCookie, json, redirect } from "@remix-run/node";
import type { HeadersFunction } from "@remix-run/node";
import { ENV, isProd } from "~/env.server";
import { isExpired } from "~/utils/jwt.server";

export type Role = "admin" | "owner" | "developer";

export type ApiUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
};

type LoginResult = {
  success: boolean;
  data?: {
    token: string;         // access
    refreshToken: string;  // refresh
    user: ApiUser;
  };
  message?: string;
};

type RefreshResult = {
  success: boolean;
  data?: { token: string };
  message?: string;
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
  // Eliminar cookie de acceso
  headers.append("Set-Cookie", await accessTokenCookie.serialize("", { 
    maxAge: 0,
    expires: new Date(0),
    path: "/"
  }));
  
  // Eliminar cookie de refresh
  headers.append("Set-Cookie", await refreshTokenCookie.serialize("", { 
    maxAge: 0,
    expires: new Date(0),
    path: "/"
  }));
  
  // También eliminar la cookie de sesión si existe
  try {
    const sessionCookie = createCookie("l360_session", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });
    
    headers.append("Set-Cookie", await sessionCookie.serialize("", {
      maxAge: 0,
      expires: new Date(0),
      path: "/"
    }));
  } catch (error) {
    console.error("Error al limpiar cookie de sesión:", error);
  }
  
  console.log("Cookies cleared with headers:", headers);
  return headers;
}

// ────────────────────────────────────────────────────────────────────────────────
// Llamadas API crudas
// ────────────────────────────────────────────────────────────────────────────────

async function apiLogin(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`http://localhost:8000/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as LoginResult;
  if (!res.ok || !data.success) {
    throw new Response(data.message ?? "Credenciales inválidas", { status: 401 });
  }
  return data;
}

async function apiRefresh(refreshToken: string): Promise<RefreshResult> {
  const res = await fetch(`http://localhost:8000/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: refreshToken }),
  });
  const data = (await res.json()) as RefreshResult;
  if (!res.ok || !data.success) {
    throw new Response(data.message ?? "No se pudo refrescar sesión", { status: 401 });
  }
  return data;
}

async function apiMe(accessToken: string): Promise<ApiUser> {
  // URL corregida según la lista de URLs disponibles (api/users/ está disponible)
  const url = `http://localhost:8000/api/users/me/`;
  console.log('apiMe - calling URL:', url); // Debug
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('apiMe - response status:', res.status); // Debug
  console.log('apiMe - response content-type:', res.headers.get('content-type')); // Debug
  
  if (!res.ok) {
    const errorText = await res.text();
    console.log('apiMe - error response:', errorText); // Debug
    throw new Response(errorText ?? "No autorizado", { status: res.status });
  }
  
  const json = await res.json();
  console.log('apiMe - JSON response:', json); // Debug
  
  // tu backend devuelve normalmente { success, data: user } o el user directo
  const user: ApiUser = json?.data ?? json;
  return user;
}

// ────────────────────────────────────────────────────────────────────────────────
// Sesión: login/logout/ensure/getUser
// ────────────────────────────────────────────────────────────────────────────────

export type LoginActionResult =
  | { ok: true; user: ApiUser; headers: Headers }
  | { ok: false; error: string };

// export async function loginAction(request: Request): Promise<LoginActionResult> {
//   try {
//     const formData = await request.formData();
//     const email = String(formData.get("email") ?? "");
//     const password = String(formData.get("password") ?? "");

//     if (!email || !password) {
//       return { ok: false, error: "Email y contraseña son requeridos" };
//     }

//     const response = await fetch("http://localhost:8000/api/auth/login/", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password }),
//     });

//     const ctype = response.headers.get("content-type") || "";
//     let data: any = null;
//     try {
//       data = ctype.includes("application/json") ? await response.json() : null;
//     } catch (e) {
//       console.error("❌ No se pudo parsear JSON del backend:", e);
//     }

//     console.info("🧪 loginAction -> status:", response.status, "ctype:", ctype);
//     console.info("🧪 loginAction -> body:", data);

//     if (!response.ok) {
//       // Backend dijo que no (401/400/403/etc)
//       const msg = data?.message || "Credenciales inválidas";
//       return { ok: false, error: msg };
//     }

//     // Acepta varias formas: {access, refresh, user} o {data:{token, refreshToken, user}} etc.
//     const user: ApiUser | undefined = data?.data?.user;
//     const access: string | undefined = data?.data?.access;
//     const refresh: string | undefined = data?.data?.refresh;


//     if (!user || !access || !refresh) {
//       console.error("❌ Faltan campos en la respuesta:", {
//         hasUser: Boolean(user),
//         hasAccess: Boolean(access),
//         hasRefresh: Boolean(refresh),
//         raw: data,
//       });
//       return { ok: false, error: "Respuesta inesperada del servidor" };
//     }

//     // Set-Cookie x2 (cada cookie en su propio header)
//     const headers = new Headers();
//     headers.append("Set-Cookie", await accessTokenCookie.serialize(access));
//     headers.append("Set-Cookie", await refreshTokenCookie.serialize(refresh));

//     return { ok: true, user, headers };
//   } catch (err) {
//     console.error("💥 Error en loginAction:", err);
//     return { ok: false, error: "Error interno en loginAction" };
//   }
// }

export async function logoutAction(request: Request) {
  // intenta cerrar en backend, pero igual limpia local
  try {
    const cookieHeader = request.headers.get("Cookie");
    const access = await accessTokenCookie.parse(cookieHeader);
    if (access) {
      await fetch(`http://localhost:8000/api/auth/logout/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
      }).catch((error) => {
        console.log("Error al cerrar sesión en el backend:", error);
      });
    }
  } catch (error) {
    console.log("Error al procesar el cierre de sesión:", error);
  }
  
  // Limpiar las cookies en todos los casos
  const headers = await clearAuthCookies();
  
  // Verificar si es una solicitud de API o una navegación normal
  const acceptHeader = request.headers.get("Accept") || "";
  const isApiRequest = acceptHeader.includes("application/json");
  
  if (isApiRequest) {
    // Para solicitudes API, devolver JSON
    return json({ success: true, redirectTo: "/" }, { headers });
  }
  
  // Para solicitudes normales, redirigir a la página principal
  return redirect("/", { headers });
}

/**
 * Devuelve un access token listo para usar.
 * Si expiró, intenta refrescar con el refresh cookie.
 * Si no puede, limpia cookies y lanza 401.
 */
export async function ensureAccessToken(request: Request): Promise<{
  token: string;
  headers?: Headers; // si refrescó, devolvemos nuevos Set-Cookie
}> {
  const cookieHeader = request.headers.get("Cookie");
  const access = await accessTokenCookie.parse(cookieHeader);
  const refresh = await refreshTokenCookie.parse(cookieHeader);

  // Si no hay refresh, no hay sesión válida.
  if (!refresh) {
    throw new Response("No autenticado", { status: 401 });
  }

  // Si hay access y no está expirado, úsalo.
  if (access && !isExpired(access)) {
    return { token: access };
  }

  // Intentar refrescar
  const data = await apiRefresh(refresh);
  const newAccess = data.data!.token;
  const headers = new Headers();
  headers.append("Set-Cookie", await accessTokenCookie.serialize(newAccess));
  return { token: newAccess, headers };
}

/** `fetch` autenticado desde loaders/actions (server) */
export async function fetchWithAuth(
  request: Request,
  input: string | URL | Request,
  init: RequestInit = {},
) {
  const { token, headers: maybeSetCookie } = await ensureAccessToken(request);
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  // Si hay nuevos cookies (por refresh), propáguelos al caller
  return { res, setCookieHeaders: maybeSetCookie };
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
// Esto ayuda a prevenir bucles infinitos de redirección
// Esta línea se eliminará

// Implementamos un pequeño caché en memoria para reducir consultas repetidas
const userRequestCache = new Map<string, { user: any | null, timestamp: number }>();

import { getUserFromSession } from "./session.server";

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
        const response = await fetch("http://localhost:8000/api/users/me/", {
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

// Obtener el token de acceso de las cookies - versión simplificada
export async function getAccessTokenFromCookies(request: Request): Promise<string | null> {
  try {
    const cookieHeader = request.headers.get('Cookie');
    console.log("Cookie header in getAccessTokenFromCookies:", cookieHeader ? "present" : "missing");
    if (!cookieHeader) return null;

    // Parsear las cookies manualmente para depurar mejor
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(pair => {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = pair.substring(0, idx).trim();
        let value = pair.substring(idx + 1).trim();
        // Remover comillas si existen
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        cookies[key] = value;
      }
    });

    console.log("Available cookies:", Object.keys(cookies));
    const accessToken = cookies.l360_access;
    
    if (!accessToken) {
      console.log("No l360_access token found in cookies");
      return null;
    }

    console.log("Access token found:", accessToken.substring(0, 20) + "...");
    
    // Usamos directamente el token JWT sin intentar decodificarlo
    return accessToken;
  } catch (error) {
    console.error('Error general al obtener token de acceso:', error);
    return null;
  }
}

// Mejorar loginAction con más debugging
export async function loginAction(request: Request) {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  
  console.log('loginAction - attempting login for:', email); // Debug

  const response = await fetch(`http://localhost:8000/api/auth/login/`, {
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
// Esta es una solución más directa que puede ayudar si la sesión no funciona correctamente
export function getTokenDirectlyFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") || "";
  console.log("Raw cookie header:", cookieHeader);
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
  
  const accessToken = cookies["l360_access"];
  console.log("Access token found:", !!accessToken);
  
  if (!accessToken) return null;
  
  // Simplemente devolver el token sin intentar decodificarlo
  // El token JWT ya está en un formato que se puede usar directamente
  return accessToken;
}
