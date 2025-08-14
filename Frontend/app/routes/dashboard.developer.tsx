import { Link, Navigate } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";

export default function DeveloperDashboard() {
  const { user, loading, hasRole } = useAuth();

  // ✅ Loading state primero
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // ✅ Auth check después del loading
  if (!hasRole("desarrollador")) {
    return <Navigate to="/" replace />;
  }

  console.log("✅ Developer dashboard: acceso autorizado para:", user?.email);

  const quickActions = [
    {
      title: "Buscar Lotes",
      description: "Encontrar lotes que coincidan con tu tesis",
      href: "/lots/search",
      color: "bg-blue-500",
    },
    {
      title: "Análisis Urbanístico",
      description: "Calcular aprovechamiento y viabilidad",
      href: "/analisis-lote",
      color: "bg-green-500",
    },
    {
      title: "Mis Favoritos",
      description: "Lotes guardados para evaluar",
      href: "/favorites",
      color: "bg-purple-500",
    },
    {
      title: "Configurar Filtros",
      description: "Definir criterios de búsqueda",
      href: "/search-criteria",
      color: "bg-yellow-500",
    },
  ];

  const criteriosBusqueda = {
    ubicacion: "El Poblado, Laureles",
    areaMin: "150 m²",
    areaMax: "500 m²",
    presupuesto: "$100M - $300M",
    tratamiento: "Consolidación",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard de Desarrollador
        </h1>
        <p className="text-gray-600">
          Encuentra y evalúa oportunidades de inversión
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Lotes Favoritos
              </p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Análisis Realizados
              </p>
              <p className="text-2xl font-bold text-gray-900">15</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Búsquedas Guardadas
              </p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Contactos Realizados
              </p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white text-xl mb-4`}
              >
                D
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criterios de Búsqueda */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Mi Tesis de Inversión
              </h2>
              <Link
                to="/search-criteria"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Editar →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Ubicación:
                </span>
                <span className="text-sm text-gray-900">
                  {criteriosBusqueda.ubicacion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Área mínima:
                </span>
                <span className="text-sm text-gray-900">
                  {criteriosBusqueda.areaMin}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Área máxima:
                </span>
                <span className="text-sm text-gray-900">
                  {criteriosBusqueda.areaMax}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Presupuesto:
                </span>
                <span className="text-sm text-gray-900">
                  {criteriosBusqueda.presupuesto}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Tratamiento:
                </span>
                <span className="text-sm text-gray-900">
                  {criteriosBusqueda.tratamiento}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lotes Recientes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Lotes Recientes
              </h2>
              <Link
                to="/lots/search"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver todos →
              </Link>
            </div>
            <div className="space-y-4">
              {[
                {
                  id: "1",
                  direccion: "Calle 10 # 20-30, El Poblado",
                  area: "200 m²",
                  precio: "$250,000,000",
                },
                {
                  id: "2",
                  direccion: "Carrera 50 # 15-25, Laureles",
                  area: "150 m²",
                  precio: "$180,000,000",
                },
              ].map((lote) => (
                <div
                  key={lote.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {lote.direccion}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Área: {lote.area}</div>
                    <div>Precio: {lote.precio}</div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Link
                      to={`/lot/${lote.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Ver detalles
                    </Link>
                    <Link
                      to={`/lot/${lote.id}/contact`}
                      className="text-xs text-green-600 hover:text-green-700"
                    >
                      Contactar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
