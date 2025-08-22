/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ['**/.*'],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",
  serverModuleFormat: "esm",
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  serverDependenciesToBundle: ["marked", "react-markdown", "react-syntax-highlighter"],
  // Configurar proxy para desarrollo
  devServerPort: 8002,
  devServerBroadcastDelay: 1000,
  // Proxy API requests to the backend during development
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
      // No es necesario reescribir la ruta si el backend ya espera /api
      // pathRewrite: { "^/api": "" }
    }
  }
};