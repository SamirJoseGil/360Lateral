import { Link } from "@remix-run/react";

export function DesarrolladorDashboard() {
  const misOfertas = [
    {
      id: "1",
      direccion: "Calle 10 # 20-30, El Poblado",
      area: "200 m²",
      estado: "En Negociación",
      oferta: "$245,000,000",
      fecha: "2024-01-15",
    },
    {
      id: "2",
      direccion: "Carrera 50 # 15-25, Laureles",
      area: "150 m²",
      estado: "Pendiente",
      oferta: "$175,000,000",
      fecha: "2024-01-10",
    },
  ];

  const quickActions = [
    {
      title: "Buscar Lotes",
      description: "Encontrar lotes que coincidan con tu tesis",
      href: "/buscar-lotes",
      icon: "🔍",
      color: "bg-blue-500",
    },
    {
      title: "Análisis Urbanístico",
      description: "Calcular aprovechamiento y viabilidad",
      href: "/analisis-lote",
      icon: "🏗️",
      color: "bg-green-500",
    },
    {
      title: "Mis Ofertas",
      description: "Revisar estado de mis ofertas",
      href: "/ofertas",
      icon: "💰",
      color: "bg-yellow-500",
    },
    {
      title: "Favoritos",
      description: "Lotes guardados para evaluar",
      href: "/favoritos",
      icon: "⭐",
      color: "bg-purple-500",
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
                Ofertas Activas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {misOfertas.length}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Lotes Favoritos
              </p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
            <div className="text-3xl">⭐</div>
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
            <div className="text-3xl">🏗️</div>
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
            <div className="text-3xl">🔍</div>
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
                {action.icon}
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
                to="/perfil/criterios"
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

        {/* Mis Ofertas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Mis Ofertas
              </h2>
              <Link
                to="/ofertas"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver todas →
              </Link>
            </div>
            <div className="space-y-4">
              {misOfertas.map((oferta) => (
                <div
                  key={oferta.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {oferta.direccion}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        oferta.estado === "En Negociación"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {oferta.estado}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Área: {oferta.area}</div>
                    <div>Oferta: {oferta.oferta}</div>
                    <div>Fecha: {oferta.fecha}</div>
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
