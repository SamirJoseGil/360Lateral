import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno desde .env
  const env = loadEnv(mode, process.cwd(), "");
  
  console.log("🔧 [Vite Config] Environment variables:", {
    NODE_ENV: env.NODE_ENV,
    BACKEND_URL: env.BACKEND_URL,
    BACKEND_HOST: env.BACKEND_HOST,
    DOCKER_ENV: env.DOCKER_ENV,
  });
  
  return {
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
    server: {
      host: env.HOST || "0.0.0.0",
      port: parseInt(env.PORT || "3000"),
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
    // ✅ CRÍTICO: Exponer variables de entorno al servidor
    define: {
      "process.env.BACKEND_URL": JSON.stringify(env.BACKEND_URL || "http://backend:8000"),
      "process.env.API_URL": JSON.stringify(env.API_URL || env.BACKEND_URL || "http://backend:8000"),
      "process.env.BACKEND_HOST": JSON.stringify(env.BACKEND_HOST || "backend"),
      "process.env.BACKEND_PORT": JSON.stringify(env.BACKEND_PORT || "8000"),
      "process.env.DOCKER_ENV": JSON.stringify(env.DOCKER_ENV || "false"),
      "process.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL || "http://localhost:8000"),
    },
  };
});