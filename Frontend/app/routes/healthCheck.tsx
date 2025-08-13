import { useState } from "react";
import type { MetaFunction } from "@remix-run/node";
import { HealthCheckService } from "~/services/healtCheck";
import { HealthCheckResponse } from "~/types/healthCheck";

export const meta: MetaFunction = () => {
  return [
    { title: "Health Check - Lateral 360°" },
    { name: "description", content: "Estado y diagnóstico del sistema Lateral 360°" },
  ];
};

export default function HealthCheck() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await HealthCheckService.getHealthStatus();
      setHealthStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setHealthStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 border-green-300';
      case 'warning': return 'bg-yellow-100 border-yellow-300';
      case 'unhealthy': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Health Check</h1>
            <p className="text-gray-600 mt-2">Estado y diagnóstico del sistema Lateral 360°</p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            ← Volver al inicio
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Estado del Backend
            </h2>

            <button
              onClick={checkHealth}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {isLoading ? '🔄 Verificando...' : '🔍 Verificar Estado'}
            </button>

            {error && (
              <div className="w-full max-w-2xl bg-red-100 border border-red-300 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold">❌ Error</h3>
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {healthStatus && (
              <div className="w-full max-w-2xl space-y-4">
                {/* Estado General */}
                <div className={`border rounded-lg p-4 ${getStatusBg(healthStatus.status)}`}>
                  <h3 className={`font-semibold ${getStatusColor(healthStatus.status)}`}>
                    Estado General: {healthStatus.status.toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Última verificación: {new Date(healthStatus.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tiempo de respuesta: {healthStatus.response_time_ms}ms
                  </p>
                </div>

                {/* Servicios */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">🔧 Servicios</h3>
                  
                  {/* Base de datos */}
                  {healthStatus.services?.database && (
                    <div className={`border rounded-lg p-3 ${getStatusBg(healthStatus.services.database.status)}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">🗄️ Base de Datos</span>
                        <span className={`font-semibold ${getStatusColor(healthStatus.services.database.status)}`}>
                          {healthStatus.services.database.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {healthStatus.services.database.message}
                      </p>
                    </div>
                  )}

                  {/* Redis */}
                  {healthStatus.services?.redis && (
                    <div className={`border rounded-lg p-3 ${getStatusBg(healthStatus.services.redis.status)}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">🚀 Cache (Redis)</span>
                        <span className={`font-semibold ${getStatusColor(healthStatus.services.redis.status)}`}>
                          {healthStatus.services.redis.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {healthStatus.services.redis.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sistema */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">💻 Sistema</h3>
                  
                  {/* Memoria */}
                  {healthStatus.system?.memory && (
                    <div className={`border rounded-lg p-3 ${getStatusBg(healthStatus.system.memory.status)}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">🧠 Memoria</span>
                        <span className={`font-semibold ${getStatusColor(healthStatus.system.memory.status)}`}>
                          {healthStatus.system.memory.percent.toFixed(1)}% usado
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Total: {formatBytes(healthStatus.system.memory.total)}</p>
                        <p>Disponible: {formatBytes(healthStatus.system.memory.available)}</p>
                      </div>
                    </div>
                  )}

                  {/* Disco */}
                  {healthStatus.system?.disk && (
                    <div className={`border rounded-lg p-3 ${getStatusBg(healthStatus.system.disk.status)}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">💾 Disco</span>
                        <span className={`font-semibold ${getStatusColor(healthStatus.system.disk.status)}`}>
                          {healthStatus.system.disk.percent.toFixed(1)}% usado
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Total: {formatBytes(healthStatus.system.disk.total)}</p>
                        <p>Libre: {formatBytes(healthStatus.system.disk.free)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enlaces rápidos de acceso */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="http://127.0.0.1:8000/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <span className="text-blue-600">🔗</span>
              <div>
                <p className="font-medium text-blue-800">API Root</p>
                <p className="text-sm text-blue-600">Información de la API</p>
              </div>
            </a>

            <a
              href="/scrapinfo"
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <span className="text-green-600">🗺️</span>
              <div>
                <p className="font-medium text-green-800">MapGIS Scraping</p>
                <p className="text-sm text-green-600">Prueba de extracción de datos</p>
              </div>
            </a>

            <a
              href="http://127.0.0.1:8000/swagger/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <span className="text-purple-600">📚</span>
              <div>
                <p className="font-medium text-purple-800">Swagger UI</p>
                <p className="text-sm text-purple-600">Documentación interactiva</p>
              </div>
            </a>

            <a
              href="http://127.0.0.1:8000/admin/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <span className="text-orange-600">⚙️</span>
              <div>
                <p className="font-medium text-orange-800">Django Admin</p>
                <p className="text-sm text-orange-600">Panel de administración</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
