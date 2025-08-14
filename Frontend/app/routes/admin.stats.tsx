import { useState, useEffect } from "react";
import { Navigate } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";

interface StatsData {
  totalLotes: number;
  lotesActivos: number;
  lotesVendidos: number;
  totalUsuarios: number;
  usuariosActivos: number;
  transaccionesEsteMes: number;
  ingresosMes: number;
  crecimientoUsuarios: number;
}

export default function AdminStats() {
  const { user, loading, hasRole } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [timeRange, setTimeRange] = useState("30"); // días

  // ✅ Verificar permisos de admin
  if (!loading && (!user || !hasRole("admin"))) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      // ✅ Aquí llamarías a tu API real
      // const response = await StatsService.getStats(timeRange);
      // setStats(response.data);

      // Mock data por ahora
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simular delay
      setStats({
        totalLotes: 234,
        lotesActivos: 187,
        lotesVendidos: 47,
        totalUsuarios: 156,
        usuariosActivos: 98,
        transaccionesEsteMes: 23,
        ingresosMes: 450000000,
        crecimientoUsuarios: 15.2,
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Estadísticas del Sistema
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Métricas y analytics de la plataforma
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
        </div>
      </div>

      {loadingStats ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      ) : stats ? (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">L</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Lotes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalLotes}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Lotes Activos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.lotesActivos}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">U</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Usuarios Totales
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalUsuarios}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Transacciones
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.transaccionesEsteMes}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue and Growth */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Ingresos del Mes
                </h3>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.ingresosMes)}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Comisiones y servicios premium
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Crecimiento de Usuarios
                </h3>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-blue-600">
                    +{stats.crecimientoUsuarios}%
                  </div>
                  <div className="ml-2 text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Comparado con el período anterior
                </p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Actividad de la Plataforma
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart placeholder */}
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-500">Gráfico de Usuarios por Día</p>
                <p className="text-sm text-gray-400 mt-2">
                  Aquí iría un gráfico de líneas con Chart.js o similar
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  Distribución de Lotes por Estado
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Aquí iría un gráfico de dona/pie
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Actividad Reciente del Sistema
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {[
                {
                  action: "Nuevo usuario registrado",
                  user: "María González",
                  time: "hace 5 min",
                  type: "user",
                },
                {
                  action: "Lote vendido",
                  user: "Carlos López",
                  time: "hace 15 min",
                  type: "sale",
                },
                {
                  action: "Documento aprobado",
                  user: "Admin Sistema",
                  time: "hace 1 hora",
                  type: "document",
                },
                {
                  action: "Nueva oferta presentada",
                  user: "Pedro Martín",
                  time: "hace 2 horas",
                  type: "offer",
                },
                {
                  action: "Usuario desactivado",
                  user: "Admin Sistema",
                  time: "hace 3 horas",
                  type: "admin",
                },
              ].map((activity, index) => (
                <li key={index} className="px-4 py-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full ${
                        activity.type === "user"
                          ? "bg-green-400"
                          : activity.type === "sale"
                          ? "bg-blue-400"
                          : activity.type === "document"
                          ? "bg-yellow-400"
                          : activity.type === "offer"
                          ? "bg-purple-400"
                          : "bg-red-400"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">
                        por {activity.user}
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">{activity.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-red-600">Error cargando estadísticas</p>
        </div>
      )}
    </div>
  );
}
