/**
 * Módulo para manejar interacciones con la API
 */

import { getSession } from "./session.server";

// URL base de la API
export const API_URL = process.env.API_URL || "https://api.360lateral.com";

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Realiza una solicitud a la API con autenticación incluida
 * @param request Objeto Request de la solicitud entrante
 * @param endpoint URL del endpoint a llamar
 * @param options Opciones adicionales para fetch
 * @returns Respuesta y headers para mantener la sesión
 */
export async function fetchWithAuth(
  request: Request,
  endpoint: string,
  options: FetchOptions = {}
) {
  // Obtener la sesión y el token
  const session = await getSession(request);
  const token = session.get("token");

  // Preparar headers combinando los proporcionados con el token de autorización
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  
  // No incluimos el token como cookie para evitar CSRF
  headers.append("Content-Type", "application/json");

  // Realizar la solicitud a la API
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Preparar headers para incluir en la respuesta y mantener la sesión
  const setCookieHeaders = new Headers();

  return { res: response, setCookieHeaders };
}