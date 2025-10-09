// app/routes/api.auth.logout.ts
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { clearAuthCookies, clearUserCache } from "~/utils/auth.server";

/**
 * Endpoint optimizado para cerrar sesión SIN loops
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return redirect("/");
  }

  try {
    console.log("=== API LOGOUT START ===");

    // Limpiar caché de usuario
    clearUserCache();

    // Limpiar cookies
    const headers = await clearAuthCookies();
    
    // CRÍTICO: NO agregar X-Remix-Revalidate ni Cache-Control
    // Esto causa loops infinitos de revalidación

    console.log("=== API LOGOUT END ===");

    // Redirigir a home
    return redirect("/?logout=true", { headers });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return redirect("/", {
      headers: await clearAuthCookies()
    });
  }
}

// Loader que redirige GET requests
export async function loader() {
  return redirect("/");
}