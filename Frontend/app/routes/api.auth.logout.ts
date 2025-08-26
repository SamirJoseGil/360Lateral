// app/routes/api.auth.logout.ts
import { ActionFunctionArgs, json } from "@remix-run/node";
import { clearAuthCookies } from "~/utils/auth.server";

/**
 * Endpoint para cerrar sesión que elimina las cookies de autenticación
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ success: false, message: "Método no permitido" }, { status: 405 });
  }

  try {
    console.log("API logout action: Clearing cookies and returning success");

    // Limpiar cookies manualmente para asegurar que se borren
    const headers = await clearAuthCookies();

    // Imprimir headers para depuración
    console.log(
      "Set-Cookie headers:",
      [...headers.entries()]
        .filter(([name]) => name.toLowerCase() === "set-cookie")
        .map(([, value]) => value)
    );

    // Siempre devolver JSON con success para que el fetcher pueda procesarlo
    return json(
      {
        success: true,
        message: "Sesión cerrada correctamente",
        shouldRefresh: true,
      },
      { headers }
    );
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return json({ success: false, message: "Error al cerrar sesión" }, { status: 500 });
  }
}
