// Errores HTTP comunes
export interface ApiError {
  error: string | boolean;
  message: string;
  status_code: number;
  field_errors?: Record<string, string[]>;
}

// Respuesta genérica de éxito
export interface ApiSuccess<T = any> {
  data?: T;
  message?: string;
}

// Configuración de la API
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

// Headers comunes
export interface ApiHeaders {
  'Content-Type': string;
  'Authorization'?: string;
  [key: string]: string | undefined;
}

// Respuesta de rate limiting
export interface RateLimitError extends ApiError {
  retry_after?: number;
}