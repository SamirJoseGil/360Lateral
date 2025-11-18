/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

// ✅ NUEVO: Definir tipo para window.ENV
declare global {
  interface Window {
    ENV: {
      API_URL: string;
    };
  }
}

export {};
