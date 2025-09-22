// app/env.server.ts
export const ENV = {
  // Para SSR, usar URL interna del contenedor Docker
  API_BASE_URL: process.env.VITE_API_URL ?? "http://backend:8000/api",
  API_BASE_URL_EXTERNAL: process.env.VITE_API_URL_EXTERNAL ?? "http://localhost:8000/api",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  BACKEND_HOST: process.env.VITE_BACKEND_HOST ?? "backend",
  BACKEND_PORT: process.env.VITE_BACKEND_PORT ?? "8000",
};

export const isProd = ENV.NODE_ENV === "production";

// Helper para obtener la URL correcta según el contexto
export const getApiUrl = (forSSR: boolean = true) => {
  if (forSSR) {
    return ENV.API_BASE_URL; // URL interna para SSR
  }
  return ENV.API_BASE_URL_EXTERNAL; // URL externa para cliente
};

// Debug info
export const getEnvDebugInfo = () => {
  return {
    ...ENV,
    isSSR: typeof window === 'undefined',
    processEnv: {
      VITE_API_URL: process.env.VITE_API_URL,
      VITE_API_URL_EXTERNAL: process.env.VITE_API_URL_EXTERNAL,
      VITE_BACKEND_HOST: process.env.VITE_BACKEND_HOST,
      VITE_BACKEND_PORT: process.env.VITE_BACKEND_PORT,
    }
  };
};
