import { Link, Navigate, useNavigate } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";
import AppLayout from '~/components/layout/AppLayout';
import { useEffect } from "react";

export default function OwnerDashboard() {
  const { user, isLoading, hasRole, initialCheckDone } = useAuth();
  const navigate = useNavigate();

  // Verificar acceso una vez que se haya cargado completamente la autenticación
  useEffect(() => {
    if (!isLoading && initialCheckDone && !hasRole(["owner", "propietario"])) {
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

  // ✅ Auth check después del loading - aceptando múltiples formas del mismo rol
  if (!hasRole(["owner", "propietario"])) {
    return null; // Nos redirigimos en el useEffect, renderizamos null mientras tanto
  }

  console.log("✅ Owner dashboard: acceso autorizado para:", user?.email);

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
      href: "/lot/new",
      color: "bg-green-500",
    },
    {
      title: "Ver Mis Lotes",
      description: "Gestionar lotes existentes",
      href: "/lots/my",
      color: "bg-blue-500",
    },
    {
      title: "Subir Documentos",
      description: "Agregar documentos a mis lotes",
      href: "/documents",
      color: "bg-purple-500",
    },
    {
      title: "Ver Ofertas",
      description: "Revisar ofertas recibidas",
      href: "/offers",
      color: "bg-yellow-500",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
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
                  L
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Mis Lotes Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Mis Lotes</h2>
              <Link
                to="/lots/my"
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
                          to={`/lot/${lote.id}`}
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
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lote.estado === "Activo"
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
    </AppLayout>
  );
}
