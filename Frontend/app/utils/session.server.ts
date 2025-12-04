// app/utils/session.server.ts
import { createCookieSessionStorage } from "@remix-run/node";

// Almacenamiento de sesión simplificado - solo para datos de usuario
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "l360_session",
    secrets: [process.env.SESSION_SECRET || "s3cret1"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
});

// Función para obtener la sesión desde la solicitud
export async function getSession(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  return sessionStorage.getSession(cookieHeader);
}

// Función para confirmar la sesión
export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

// Función para destruir la sesión
export async function destroySession(session: any) {
  return sessionStorage.destroySession(session);
}

// Función para obtener el usuario de la sesión
export async function getUserFromSession(request: Request) {
  const session = await getSession(request);
  const userJson = session.get("user");
  
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error("Error parsing user from session:", error);
    return null;
  }
}

// ✅ NUEVO: Marcar modal de bienvenida como mostrado en sesión
export async function markWelcomeModalShown(request: Request) {
  const session = await getSession(request);
  session.set("welcome_modal_shown", true);
  
  return {
    headers: new Headers({
      "Set-Cookie": await commitSession(session)
    })
  };
}

// ✅ NUEVO: Verificar si el modal ya fue mostrado en esta sesión
export async function hasWelcomeModalBeenShown(request: Request): Promise<boolean> {
  const session = await getSession(request);
  return session.get("welcome_modal_shown") === true;
}