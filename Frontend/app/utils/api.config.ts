// Este archivo contiene configuraciones de API que son seguras para usar
// tanto en el lado del cliente como en el servidor

// Extender la interfaz Window para incluir ENV
declare global {
  interface Window {
    ENV?: {
      API_URL?: string;
    };
  }
}

// Obtiene la URL de la API desde variables de entorno disponibles en el cliente
// o usa un valor predeterminado para desarrollo local
export const API_BASE_URL = typeof window !== 'undefined' 
  ? window.ENV?.API_URL || 'http://localhost:8000'
  : process.env.API_URL || 'http://localhost:8000';