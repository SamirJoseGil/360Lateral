import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export type AdminStatistics = {
  usuarios: {
    total: number;
    activos: number;
    inactivos: number;
    por_rol: {
      admin: number;
      owner: number;
      developer: number;
    };
    verificados: number;
    nuevos_mes: number;
  };
  lotes: {
    total: number;
    por_estado: {
      pending: number;
      active: number;
      rejected: number;
      archived: number;
    };
    verificados: number;
    nuevos_mes: number;
  };
  documentos: {
    total: number;
    validados: number;
    pendientes: number;
    rechazados: number;
    nuevos_semana: number;
  };
  solicitudes: {
    total: number;
    por_estado: {
      pendiente: number;
      en_revision: number;
      aprobado: number;
      rechazado: number;
      completado: number;
    };
    por_tipo: Record<string, number>;
    nuevas_semana: number;
  };
  actividad_reciente: {
    usuarios_registrados_hoy: number;
    lotes_registrados_hoy: number;
    documentos_subidos_hoy: number;
    solicitudes_creadas_hoy: number;
  };
  top_usuarios: Array<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    lotes_count: number;
  }>;
  timestamp: string;
};

/**
 * Obtener estadísticas generales del sistema (solo admin)
 */
export async function getAdminStatistics(request: Request) {
  console.log("[Admin] Getting admin statistics");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/users/admin/statistics/`
    );

    if (!res.ok) {
      console.error(`[Admin] Error fetching statistics: ${res.status}`);
      throw new Error(`Error fetching statistics: ${res.status}`);
    }

    const response = await res.json();

    return {
      statistics: response.data as AdminStatistics,
      headers: setCookieHeaders,
    };
  } catch (error) {
    console.error("[Admin] Error in getAdminStatistics:", error);
    throw error;
  }
}

/**
 * Soft delete de un usuario (solo admin)
 */
export async function deleteUser(
  request: Request,
  userId: string,
  reason?: string
) {
  console.log(`[Admin] Soft deleting user: ${userId}`);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/users/${userId}/delete/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason || "Eliminado por administrador" }),
      }
    );

    if (!res.ok) {
      console.error(`[Admin] Error deleting user: ${res.status}`);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error deleting user: ${res.status}`);
    }

    const response = await res.json();

    return {
      success: response.success,
      message: response.message,
      headers: setCookieHeaders,
    };
  } catch (error) {
    console.error(`[Admin] Error in deleteUser (${userId}):`, error);
    throw error;
  }
}

/**
 * Reactivar un usuario eliminado (solo admin)
 */
export async function reactivateUser(request: Request, userId: string) {
  console.log(`[Admin] Reactivating user: ${userId}`);

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(
      request,
      `${API_URL}/api/users/${userId}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: true,
          deleted_at: null,
          deletion_reason: null,
        }),
      }
    );

    if (!res.ok) {
      console.error(`[Admin] Error reactivating user: ${res.status}`);
      throw new Error(`Error reactivating user: ${res.status}`);
    }

    const response = await res.json();

    return {
      success: true,
      user: response,
      headers: setCookieHeaders,
    };
  } catch (error) {
    console.error(`[Admin] Error in reactivateUser (${userId}):`, error);
    throw error;
  }
}
