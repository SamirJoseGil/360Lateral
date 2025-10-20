/**
 * Configuración centralizada de variables de entorno
 * Este archivo debe ser la ÚNICA fuente de verdad para URLs de API
 */

// Detectar si estamos en servidor (SSR) o cliente
const isServer = typeof window === 'undefined';

// Detectar si estamos en Docker
const isDocker = process.env.DOCKER_ENV === 'true' || process.env.BACKEND_HOST === 'backend';

/**
 * ✅ CRÍTICO: URL de la API según el contexto de ejecución
 * - SSR en Docker: Usa URL interna (backend:8000)
 * - SSR local: Usa localhost:8000
 * - Cliente: Usa URL externa (localhost:8000)
 */
export const API_URL = isServer
  ? (isDocker 
      ? `http://${process.env.BACKEND_HOST || 'backend'}:${process.env.BACKEND_PORT || '8000'}`
      : (process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:8000')
    )
  : (process.env.VITE_API_URL_EXTERNAL || 'http://localhost:8000');

// Variables de entorno base
export const ENV = {
  API_BASE_URL: API_URL,
  API_BASE_URL_INTERNAL: isDocker 
    ? `http://${process.env.BACKEND_HOST || 'backend'}:${process.env.BACKEND_PORT || '8000'}`
    : 'http://localhost:8000',
  API_BASE_URL_EXTERNAL: process.env.VITE_API_URL_EXTERNAL || "http://localhost:8000",
  NODE_ENV: process.env.NODE_ENV || "development",
  BACKEND_HOST: process.env.BACKEND_HOST || process.env.VITE_BACKEND_HOST || "backend",
  BACKEND_PORT: process.env.BACKEND_PORT || process.env.VITE_BACKEND_PORT || "8000",
  SESSION_SECRET: process.env.SESSION_SECRET || "s3cret1",
};

export const isProd = ENV.NODE_ENV === "production";
export const isDev = ENV.NODE_ENV === "development";

// Helper para logging de debug
export const logApiUrl = (context: string) => {
  if (isDev && isServer) {
    console.log(`[${context}] API_URL: ${API_URL} (isServer: ${isServer}, isDocker: ${isDocker})`);
  }
};

// Información de debug consolidada
export const getEnvDebugInfo = () => {
  return {
    ...ENV,
    currentApiUrl: API_URL,
    isServer,
    isDocker,
    isProduction: isProd,
  };
};

// Log inicial en desarrollo
if (isDev && isServer) {
  console.log('🔧 [ENV CONFIG - env.server.ts]', {
    isDocker,
    isServer,
    API_URL,
    BACKEND_HOST: process.env.BACKEND_HOST,
    BACKEND_PORT: process.env.BACKEND_PORT,
  });
}
