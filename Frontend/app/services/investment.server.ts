import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export type PerfilInversion = {
  ciudades_interes: string[];
  usos_preferidos: string[];
  modelos_pago: string[];
  volumen_ventas_min: string | null;
  ticket_inversion_min: string | null;
  perfil_completo: boolean;
  perfil_completo_porcentaje: number;
};

export type Ciudad = {
  id: string;
  nombre: string;
  departamento: string;
};

/**
 * Obtener perfil de inversión del developer autenticado
 */
export async function getPerfilInversion(request: Request) {
  console.log("[Investment] Getting perfil inversion");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/users/perfil-inversion/`
    );

    if (!res.ok) {
      console.error(`[Investment] Error fetching perfil: ${res.status}`);
      throw new Error(`Error fetching perfil: ${res.status}`);
    }

    const data = await res.json();

    // ✅ CRÍTICO: Log del dato RAW recibido del backend
    console.log("[Investment] Raw data from API:", JSON.stringify(data, null, 2));

    // ✅ CORRECCIÓN: El backend puede devolver el perfil directamente O en un objeto
    const perfil = data.perfil || data; // Intentar ambos formatos

    console.log("[Investment] Perfil extracted:", JSON.stringify(perfil, null, 2));
    console.log("[Investment] Perfil loaded successfully");

    return {
      perfil, // ✅ CRÍTICO: Retornar el perfil extraído
      headers: setCookieHeaders,
    };
  } catch (error) {
    console.error("[Investment] Error in getPerfilInversion:", error);
    throw error;
  }
}

/**
 * Actualizar perfil de inversión
 */
export async function updatePerfilInversion(
  request: Request,
  data: {
    ciudades_interes: string[];
    usos_preferidos: string[];
    modelos_pago: string[];
    volumen_ventas_min: string;
    ticket_inversion_min?: string;
  }
) {
  console.log("[Investment] Updating perfil inversion", data);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/users/perfil-inversion/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`[Investment] Error updating perfil: ${res.status}`, errorData);
      throw new Error(errorData.message || `Error updating perfil: ${res.status}`);
    }

    const result = await res.json();
    console.log(`[Investment] Perfil updated successfully`);

    return {
      success: true,
      message: result.message || "Perfil actualizado correctamente",
      perfil: result.perfil,
      headers: setCookieHeaders,
    };
  } catch (error) {
    console.error("[Investment] Error in updatePerfilInversion:", error);
    throw error;
  }
}
