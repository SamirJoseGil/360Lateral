import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";
import { getSession, destroySession } from "~/utils/session.server";

console.log(`[Auth Service] Using API_URL: ${API_URL}`);

// Tipos para autenticación
export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company?: string;
  role: "owner" | "developer" | "admin";
};

export type ChangePasswordData = {
  current_password: string;
  new_password: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  data?: {
    refresh: string;
    access: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
};

// Función para cambiar contraseña
export async function changePassword(request: Request, passwordData: ChangePasswordData) {
  console.log("[Auth] Changing password for user");

  try {
    const { res, setCookieHeaders } = await fetchWithAuth(request, `${API_URL}/api/auth/change-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordData)
    });

    if (!res.ok) {
      console.error(`[Auth] Error changing password: ${res.status}`);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Error changing password: ${res.status}`);
    }

    const response = await res.json();

    return {
      success: response.success,
      message: response.message,
      headers: setCookieHeaders
    };
  } catch (error) {
    console.error("[Auth] Error in changePassword:", error);
    throw error;
  }
}

// Función para solicitar reset de contraseña
export async function requestPasswordReset(email: string) {
  console.log("[Auth] Requesting password reset for:", email);

  try {
    const response = await fetch(`${API_URL}/api/auth/password-reset/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      console.error(`[Auth] Error requesting password reset: ${response.status}`);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Error requesting password reset: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error("[Auth] Error in requestPasswordReset:", error);
    throw error;
  }
}

// Función para confirmar reset de contraseña
export async function confirmPasswordReset(token: string, password: string, passwordConfirm: string) {
  console.log("[Auth] Confirming password reset with token");

  try {
    const response = await fetch(`${API_URL}/api/auth/password-reset/confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        password,
        password_confirm: passwordConfirm
      })
    });

    if (!response.ok) {
      console.error(`[Auth] Error confirming password reset: ${response.status}`);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Error confirming password reset: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error("[Auth] Error in confirmPasswordReset:", error);
    throw error;
  }
}

// Función para logout CORREGIDA
export async function logoutUser(request: Request) {
  console.log("[Auth] Logging out user");

  const session = await getSession(request);
  const refreshToken = session.get("refresh_token");

  try {
    const { res } = await fetchWithAuth(request, `${API_URL}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    // Nota: logout puede retornar 401 si el token ya expiró, eso está bien
    if (!res.ok && res.status !== 401) {
      console.warn(`[Auth] Logout returned ${res.status}, but continuing with local logout`);
    }
  } catch (error) {
    console.error("[Auth] Error in logoutUser:", error);
    // Continuamos con el logout local aunque falle el del backend
  }

  // Destruir sesión local
  return {
    success: true,
    message: "Logout exitoso",
    headers: new Headers({
      "Set-Cookie": await destroySession(session)
    })
  };
}

// Helper para validar contraseñas
export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una letra mayúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una letra minúscula");
  }

  if (!/\d/.test(password)) {
    errors.push("La contraseña debe incluir al menos un número");
  }

  return errors;
}

// Helper para manejo de errores de autenticación
export function handleAuthError(error: unknown, defaultMessage: string = "Error de autenticación") {
  console.error("[Auth Error]", error);
  
  if (error instanceof Error) {
    return { 
      error: error.message || defaultMessage, 
      status: 400
    };
  }
  
  return { 
    error: defaultMessage, 
    status: 500 
  };
}