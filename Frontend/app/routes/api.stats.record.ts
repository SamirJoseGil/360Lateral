import { ActionFunction, json } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    // Obtener el usuario actual si está autenticado
    const user = await getUser(request);
    
    // Obtener los datos del evento desde el cuerpo de la solicitud
    const eventData = await request.json();
    
    // Validar datos mínimos requeridos
    if (!eventData.type || !eventData.name) {
      return json({ error: "Tipo y nombre del evento son requeridos" }, { status: 400 });
    }
    
    // Registrar el evento en el servidor
    const result = await recordEvent(request, {
      type: eventData.type,
      name: eventData.name,
      value: {
        ...eventData.value,
        url: eventData.url,
        // Agregar información del usuario si está autenticado
        user_info: user ? { 
          id: user.id,
          role: user.role
        } : undefined
      },
      session_id: eventData.session_id
    });
    
    return json({ success: true, id: result.event?.id }, { 
      status: 201,
      headers: result.headers
    });
    
  } catch (error) {
    console.error("Error al registrar evento estadístico:", error);
    return json({ 
      error: "Error al registrar evento estadístico", 
      details: error instanceof Error ? error.message : undefined 
    }, { status: 500 });
  }
};
