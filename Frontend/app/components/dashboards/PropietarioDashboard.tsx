import { Link } from "@remix-run/react";

export function PropietarioDashboard() {
  const misLotes = [
    {
      id: "1",
      direccion: "Calle 10 # 20-30, El Poblado",
      area: "200 m²",
      estado: "Activo",
      ofertas: 3,
      precio: "$250,000,000",
    },
    {
      id: "2",
      direccion: "Carrera 50 # 15-25, Laureles",
      area: "150 m²",
      estado: "En Revisión",
      ofertas: 1,
      precio: "$180,000,000",
    },
  ];

  const quickActions = [
    {
      title: "Registrar Nuevo Lote",
      description: "Agregar un nuevo lote a la plataforma",
      href: "/lotes/nuevo",
      icon: "➕",
      color: "bg-green-500",
    },
    {
      title: "Ver Ofertas Recibidas",
      description: "Revisar ofertas y cartas de intención",
      href: "/ofertas",
      icon: "💰",
      color: "bg-yellow-500",
    },
    {
      title: "Subir Documentos",
      description: "Agregar documentos a mis lotes",
      href: "/documentos",
      icon: "📄",
      color: "bg-blue-500",
    },
    {
      title: "Mi Perfil",
      description: "Actualizar información personal",
      href: "/perfil",
      icon: "👤",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
        <p className="text-gray-600">Gestiona tus lotes y ofertas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mis Lotes</p>
              <p className="text-2xl font-bold text-gray-900">
                {misLotes.length}
              </p>
            </div>
            <div className="text-3xl">🏠</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ofertas Recibidas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {misLotes.reduce((total, lote) => total + lote.ofertas, 0)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lotes Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {misLotes.filter((lote) => lote.estado === "Activo").length}
              </p>
            </div>
            <div className="text-3xl">✅</div>
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

      {/* Mis Lotes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Mis Lotes</h2>
            <Link
              to="/mis-lotes"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ofertas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {misLotes.map((lote) => (
                  <tr key={lote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/lotes/${lote.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {lote.direccion}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lote.area}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          lote.estado === "Activo"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {lote.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lote.ofertas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lote.precio}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
