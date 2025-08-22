import { Link, Navigate, useNavigate } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";
import AppLayout from '~/components/layout/AppLayout';
import { useEffect } from "react";

export default function AdminDashboard() {
  const { user, isLoading, hasRole, initialCheckDone } = useAuth();
  const navigate = useNavigate();

  // Verificar acceso una vez que se haya cargado completamente la autenticación
  useEffect(() => {
    if (!isLoading && initialCheckDone && !hasRole("admin")) {
      navigate("/", { replace: true });
    }
  }, [isLoading, initialCheckDone, hasRole, navigate]);

  // ✅ Loading state primero
  if (isLoading || !initialCheckDone) {
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
  if (!hasRole("admin")) {
    return null; // Nos redirigimos en el useEffect, renderizamos null mientras tanto
  }

  console.log("✅ Admin dashboard: acceso autorizado para:", user?.email);

  const stats = [
    {
      title: "Total Lotes",
      value: "1,234",
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Usuarios Activos",
      value: "456",
      change: "+8%",
      changeType: "positive" as const,
    },
    {
      title: "Transacciones",
      value: "89",
      change: "+15%",
      changeType: "positive" as const,
    },
    {
      title: "Documentos",
      value: "2,567",
      change: "+5%",
      changeType: "positive" as const,
    },
  ];

  const quickActions = [
    {
      title: "Gestionar Usuarios",
      description: "Administrar propietarios y desarrolladores",
      href: "/admin/users",
      color: "bg-blue-500",
    },
    {
      title: "Validar Documentos",
      description: "Revisar y aprobar documentación",
      href: "/admin/validation",
      color: "bg-yellow-500",
    },
    {
      title: "Ver Estadísticas",
      description: "Reportes de actividad y métricas",
      href: "/admin/stats",
      color: "bg-green-500",
    },
    {
      title: "MapGIS Debug",
      description: "Herramientas de desarrollo",
      href: "/scrapinfo",
      color: "bg-purple-500",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
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
              </div>
              <div className="mt-4">
                <span
                  className={`text-sm font-medium ${stat.changeType === "positive"
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
                  A
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
                },
                {
                  action: "Solicitud de revisión",
                  user: "Carlos López",
                  time: "hace 15 min",
                },
                {
                  action: "Documento subido",
                  user: "Ana Rodríguez",
                  time: "hace 1 hora",
                },
                {
                  action: "Nueva oferta presentada",
                  user: "Pedro Martín",
                  time: "hace 2 horas",
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
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
    </AppLayout>
  );
}
