// app/utils/session.server.ts
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import cookie from "cookie";

// Definir el tipo de sesión
interface SessionData {
  user: string;
}

interface SessionFlashData {
  error: string;
}

// Crear el almacenamiento de sesión con un secreto más seguro
export const sessionStorage = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: "l360_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: "/",
    sameSite: "lax",
    secrets: ["s3cr3t0_sup3r_s3gur0_l4t3r4l360"], // Debería estar en variables de entorno
    secure: process.env.NODE_ENV === "production",
  },
});

// Función para obtener la sesión desde la solicitud
export async function getSession(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  console.log("getSession - cookie header:", cookieHeader ? "present" : "missing");
  
  if (cookieHeader) {
    console.log("Raw cookies:", cookieHeader);
    const cookies = cookie.parse(cookieHeader);
    console.log("Parsed cookies:", Object.keys(cookies));
  }
  
  return sessionStorage.getSession(cookieHeader);
}

// Función para obtener el usuario de la sesión
export async function getUserFromSession(request: Request) {
  const session = await getSession(request);
  const userJson = session.get("user");
  console.log("getUserFromSession - user in session:", userJson ? "found" : "not found");
  
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error("Error parsing user from session:", error);
    return null;
  }
}

// Función para crear una sesión con el usuario
export async function createUserSession(
  user: any,
  redirectTo: string,
  accessToken: string,
  refreshToken: string
) {
  const session = await sessionStorage.getSession();
  session.set("user", JSON.stringify(user));
  
  // Crear las cookies para los tokens
  const headers = new Headers();
  
  // Configurar la cookie de sesión
  headers.append(
    "Set-Cookie",
    await sessionStorage.commitSession(session)
  );
  
  // Configurar cookies para tokens JWT
  const accessCookie = cookie.serialize("l360_access", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 1 hora
    path: "/",
  });
  
  const refreshCookie = cookie.serialize("l360_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 días
    path: "/",
  });
  
  headers.append("Set-Cookie", accessCookie);
  headers.append("Set-Cookie", refreshCookie);
  
  return redirect(redirectTo, { headers });
}

// Función para cerrar la sesión
export async function logout(request: Request) {
  const session = await getSession(request);
  
  const headers = new Headers();
  
  // Eliminar cookies de tokens
  headers.append(
    "Set-Cookie",
    cookie.serialize("l360_access", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
  );
  
  headers.append(
    "Set-Cookie",
    cookie.serialize("l360_refresh", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
  );
  
  // Eliminar cookie de sesión
  headers.append(
    "Set-Cookie",
    await sessionStorage.destroySession(session)
  );
  
  return redirect("/login", { headers });
}
