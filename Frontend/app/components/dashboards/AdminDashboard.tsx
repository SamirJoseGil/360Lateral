import { Link } from "@remix-run/react";

export function AdminDashboard() {
  const stats = [
    {
      title: "Total Lotes",
      value: "1,234",
      change: "+12%",
      changeType: "positive" as const,
      icon: "🗺️",
    },
    {
      title: "Usuarios Activos",
      value: "456",
      change: "+8%",
      changeType: "positive" as const,
      icon: "👥",
    },
    {
      title: "Transacciones",
      value: "89",
      change: "+15%",
      changeType: "positive" as const,
      icon: "💰",
    },
    {
      title: "Documentos",
      value: "2,567",
      change: "+5%",
      changeType: "positive" as const,
      icon: "📄",
    },
  ];

  const quickActions = [
    {
      title: "Gestionar Usuarios",
      description: "Administrar propietarios y desarrolladores",
      href: "/usuarios",
      icon: "👥",
      color: "bg-blue-500",
    },
    {
      title: "Revisar Solicitudes",
      description: "Aprobar cambios de datos críticos",
      href: "/solicitudes",
      icon: "📋",
      color: "bg-yellow-500",
    },
    {
      title: "Generar Reportes",
      description: "Reportes de actividad y estadísticas",
      href: "/reportes",
      icon: "📊",
      color: "bg-green-500",
    },
    {
      title: "Configuración Sistema",
      description: "Configurar parámetros del sistema",
      href: "/configuracion",
      icon: "⚙️",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Gestiona todos los aspectos de la plataforma
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
            <div className="mt-4">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                vs mes anterior
              </span>
            </div>
          </div>
        ))}
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Actividad Reciente
          </h2>
          <div className="space-y-4">
            {[
              {
                action: "Nuevo lote registrado",
                user: "María García",
                time: "hace 5 min",
                icon: "🏠",
              },
              {
                action: "Solicitud de revisión",
                user: "Carlos López",
                time: "hace 15 min",
                icon: "📋",
              },
              {
                action: "Documento subido",
                user: "Ana Rodríguez",
                time: "hace 1 hora",
                icon: "📄",
              },
              {
                action: "Nueva oferta presentada",
                user: "Pedro Martín",
                time: "hace 2 horas",
                icon: "💰",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">por {activity.user}</p>
                </div>
                <div className="text-sm text-gray-400">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
