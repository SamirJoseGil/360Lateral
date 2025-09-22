import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

// To allow this host, add "71da7ad69d48.ngrok-free.app" to `server.allowedHosts` in vite.config.js.
export default defineConfig({
  server: {
    allowedHosts: ["71da7ad69d48.ngrok-free.app"],
    host: "0.0.0.0",
    port: 3000,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    // Remover proxy - no funciona con SSR de Remix
  },
  define: {
    // Hacer que las variables de entorno estén disponibles en tiempo de build
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://backend:8000/api'),
    'process.env.VITE_API_URL_EXTERNAL': JSON.stringify(process.env.VITE_API_URL_EXTERNAL || 'http://localhost:8000/api'),
    'process.env.VITE_BACKEND_HOST': JSON.stringify(process.env.VITE_BACKEND_HOST || 'backend'),
    'process.env.VITE_BACKEND_PORT': JSON.stringify(process.env.VITE_BACKEND_PORT || '8000'),
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
});