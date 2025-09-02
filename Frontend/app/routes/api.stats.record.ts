import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getAccessTokenFromCookies } from "~/utils/auth.server";

/**
 * API simplificada para conectar con los endpoints de estadísticas del backend
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Método no permitido" }, { status: 405 });
  }

  try {
    // Extraer datos del request
    const data = await request.json();
    
    // Validar datos mínimos
    if (!data.type || !data.name) {
      return json({ 
        success: false, 
        error: "Campos requeridos faltantes (type, name)" 
      }, { status: 400 });
    }
    
    // Obtener token de autenticación
    const token = await getAccessTokenFromCookies(request);
    const authHeader = token ? `Bearer ${token}` : null;
    
    // Enviar al backend
    const apiUrl = process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/stats/events/record/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {})
      },
      body: JSON.stringify(data)
    });

    // Log para depuración
    console.log(`[API Stats] Enviando a ${apiUrl}/api/stats/events/record/`);
    console.log(`[API Stats] Datos: ${JSON.stringify(data)}`);
    console.log(`[API Stats] Respuesta: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[API Stats] Error: ${JSON.stringify(errorData)}`);
      return json({ 
        success: false, 
        error: `Error del servidor: ${response.status}`,
        details: errorData
      }, { status: 502 });
    }

    const result = await response.json();
    return json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("[API Stats] Error inesperado:", error);
    return json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// Rechazar cualquier método GET
export async function loader() {
  return json({ error: "Método no permitido" }, { status: 405 });
}
