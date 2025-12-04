import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getAdminStatistics } from "~/services/admin.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (!user || user.role !== "admin") {
    return redirect("/");
  }

  try {
    const { statistics, headers } = await getAdminStatistics(request);

    return json(
      {
        user,
        stats: statistics,
      },
      { headers }
    );
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    return json({
      user,
      stats: null,
      error: "Error cargando estadísticas",
    });
  }
}

export default function AdminDashboard() {
  const { user, stats } = useLoaderData<typeof loader>();

  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-800">Error cargando estadísticas del sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido, {user.first_name || user.name}. Gestiona todo el sistema desde aquí.
        </p>
      </div>

      {/* Actividad de Hoy */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
        <h2 className="text-xl font-semibold mb-4">Actividad de Hoy</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-indigo-100 text-sm">Usuarios Nuevos</p>
            <p className="text-3xl font-bold">{stats.actividad_reciente.usuarios_registrados_hoy}</p>
          </div>
          <div>
            <p className="text-indigo-100 text-sm">Lotes Registrados</p>
            <p className="text-3xl font-bold">{stats.actividad_reciente.lotes_registrados_hoy}</p>
          </div>
          <div>
            <p className="text-indigo-100 text-sm">Documentos Subidos</p>
            <p className="text-3xl font-bold">{stats.actividad_reciente.documentos_subidos_hoy}</p>
          </div>
          <div>
            <p className="text-indigo-100 text-sm">Solicitudes Nuevas</p>
            <p className="text-3xl font-bold">{stats.actividad_reciente.solicitudes_creadas_hoy}</p>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Usuarios */}
        <Link to="/admin/users" className="block">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Usuarios</h3>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.usuarios.total}</p>
            <p className="text-sm text-gray-500 mt-2">{stats.usuarios.activos} activos</p>
          </div>
        </Link>

        {/* Lotes */}
        <Link to="/admin/lotes" className="block">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Lotes</h3>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.lotes.total}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.lotes.por_estado.pending} pendientes
            </p>
          </div>
        </Link>

        {/* Documentos */}
        <Link to="/admin/documents" className="block">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.documentos.total}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.documentos.pendientes} pendientes
            </p>
          </div>
        </Link>

        {/* Solicitudes */}
        <Link to="/admin/solicitudes" className="block">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Solicitudes</h3>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.solicitudes.total}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.solicitudes.por_estado.pendiente} pendientes
            </p>
          </div>
        </Link>
      </div>

      {/* Gráficos de Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Usuarios por Rol */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Usuarios por Rol</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Propietarios</span>
                <span className="text-sm font-medium">{stats.usuarios.por_rol.owner}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.usuarios.por_rol.owner / stats.usuarios.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Desarrolladores</span>
                <span className="text-sm font-medium">{stats.usuarios.por_rol.developer}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.usuarios.por_rol.developer / stats.usuarios.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Administradores</span>
                <span className="text-sm font-medium">{stats.usuarios.por_rol.admin}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.usuarios.por_rol.admin / stats.usuarios.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lotes por Estado */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Lotes por Estado</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Activos</span>
                <span className="text-sm font-medium">{stats.lotes.por_estado.active}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.lotes.por_estado.active / stats.lotes.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Pendientes</span>
                <span className="text-sm font-medium">{stats.lotes.por_estado.pending}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.lotes.por_estado.pending / stats.lotes.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Rechazados</span>
                <span className="text-sm font-medium">{stats.lotes.por_estado.rejected}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.lotes.por_estado.rejected / stats.lotes.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Usuarios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Propietarios (por Lotes)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lotes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.top_usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {usuario.first_name} {usuario.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{usuario.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {usuario.lotes_count} lotes
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/admin/users/${usuario.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Ver perfil
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}