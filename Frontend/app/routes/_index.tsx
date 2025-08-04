import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Lateral 360° - Gestión de Lotes Inmobiliarios" },
    { name: "description", content: "Plataforma integral para la gestión de lotes inmobiliarios" },
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto p-8">
        <header className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold text-gray-800">
            Lateral 360°
          </h1>
          <p className="text-lg text-gray-600 text-center">
            Plataforma de Gestión de Lotes Inmobiliarios
          </p>
        </header>

        <nav className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Enlaces Útiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/healthCheck"
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <span className="text-green-600">❤️</span>
              <div>
                <p className="font-medium text-green-800">Health Check</p>
                <p className="text-sm text-green-600">Estado del sistema</p>
              </div>
            </a>
            
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
        </nav>

        <div className="text-center text-gray-500 text-sm">
          <p>🚀 Sistema funcionando correctamente</p>
          <p>Para más detalles del estado, visita <a href="/health-check" className="text-blue-500 hover:underline">Health Check</a></p>
        </div>
      </div>
    </div>
  );
}