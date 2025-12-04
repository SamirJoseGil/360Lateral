import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";
import { mapgisHealthCheck } from "~/services/mapgis.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  if (user.role !== "admin") {
    throw new Response("No autorizado", { status: 403 });
  }

  // Health check del servicio
  const health = await mapgisHealthCheck(request);

  return json({ user, health });
}

export default function AdminMapGIS() {
  const { health } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          🗺️ Administración MapGIS
        </h1>
        <p className="text-gray-600 mt-2">
          Gestión del scraping de MapGIS Medellín y cache de consultas
        </p>
      </div>

      {/* Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estado del Servicio</p>
              <p className="text-2xl font-bold">
                {health.status === "ok" ? (
                  <span className="text-green-600">✅ Operativo</span>
                ) : health.status === "degraded" ? (
                  <span className="text-yellow-600">⚠️ Degradado</span>
                ) : (
                  <span className="text-red-600">❌ Error</span>
                )}
              </p>
            </div>
            <svg
              className="w-12 h-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Conexión MapGIS</p>
              <p className="text-2xl font-bold">
                {health.online ? (
                  <span className="text-green-600">🟢 Online</span>
                ) : (
                  <span className="text-red-600">🔴 Offline</span>
                )}
              </p>
            </div>
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sesión Iniciada</p>
              <p className="text-2xl font-bold">
                {health.session_initialized ? (
                  <span className="text-purple-600">✅ Sí</span>
                ) : (
                  <span className="text-gray-600">⏳ No</span>
                )}
              </p>
            </div>
            <svg
              className="w-12 h-12 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Información del Servicio */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Información del Servicio
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Base URL</span>
              <span className="font-mono text-sm">{health.base_url || "N/A"}</span>
            </div>

            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Última verificación</span>
              <span className="text-sm">
                {new Date(health.timestamp).toLocaleString("es-CO")}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-600">Cache</span>
              <span className="text-green-600 font-semibold">
                Redis + PostgreSQL
              </span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Acciones Rápidas
          </h2>

          <div className="space-y-3">
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Admin Panel Django</p>
                <p className="text-xs text-gray-600">
                  Ver cache y configuración
                </p>
              </div>
            </a>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Refrescar Estado</p>
                <p className="text-xs text-gray-600">
                  Actualizar health check
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Documentación */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📚 Documentación</h2>

        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Endpoints Disponibles
          </h3>

          <div className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm text-blue-600">
                GET /api/mapgis/consulta/cbml/&lt;cbml&gt;/
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Consulta completa de un lote por CBML (14 dígitos)
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm text-blue-600">
                GET /api/mapgis/consulta/restricciones/&lt;cbml&gt;/
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Solo restricciones ambientales
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm text-blue-600">
                GET /api/mapgis/health/
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Health check del servicio (público)
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm text-red-600">
                POST /api/mapgis/cache/clear/
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Limpiar cache (solo admin)
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Información Importante
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• El cache tiene una duración de 24 horas</li>
                  <li>• Rate limiting: 5 consultas por minuto por usuario</li>
                  <li>• Los CBMLs deben tener exactamente 14 dígitos</li>
                  <li>• El scraper se conecta a MapGIS Medellín oficial</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
