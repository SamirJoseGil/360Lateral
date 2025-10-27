// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\routes\admin.dashboard.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUser } from "~/utils/auth.server";
import { getDashboardStats } from "~/services/stats.server";
import { getComprehensiveHealth } from "~/services/common.server";
import SystemMonitor from "~/components/SystemMonitor";

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    try {
        // Obtener estadísticas del dashboard y estado del sistema en paralelo
        const [statsResponse, healthResponse] = await Promise.allSettled([
            getDashboardStats(request),
            getComprehensiveHealth(request)
        ]);

        const stats = statsResponse.status === 'fulfilled' ? statsResponse.value.dashboardStats : null;
        const systemHealth = healthResponse.status === 'fulfilled' ? healthResponse.value : null;

        return json({
            user,
            stats,
            systemHealth,
            hasHealthData: healthResponse.status === 'fulfilled'
        });
    } catch (error) {
        console.error("Error cargando dashboard admin:", error);
        return json({
            user,
            stats: null,
            systemHealth: null,
            hasHealthData: false,
            error: "Error al cargar información del dashboard"
        });
    }
}

export default function AdminDashboard() {
    const loaderData = useLoaderData<typeof loader>();

    // Extraer datos del loader con manejo de errores
    const user = loaderData.user;
    const stats = loaderData.stats;
    const systemHealth = loaderData.systemHealth;
    const hasHealthData = loaderData.hasHealthData;
    const error = 'error' in loaderData ? String(loaderData.error) : null;

    return (
        <div className="p-16">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Dashboard de Administración</h1>
                <p className="text-gray-600 mt-2">
                    Panel de control y monitoreo del sistema 360 Lateral
                </p>
            </div>

            {/* Error message */}
            {error && typeof error === 'string' && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Columna izquierda - Enlaces principales */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Enlaces de navegación principales */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Gestión del Sistema</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <Link
                                to="/admin/validacion"
                                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-medium text-gray-900">Validación</h3>
                                    <p className="text-sm text-gray-600">Documentos pendientes</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/pot"
                                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-medium text-gray-900">Gestión POT</h3>
                                    <p className="text-sm text-gray-600">Tratamientos POT</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/system"
                                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-medium text-gray-900">Sistema</h3>
                                    <p className="text-sm text-gray-600">Monitoreo y salud</p>
                                </div>
                            </Link>

                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="font-medium text-gray-900">Usuarios</h3>
                                    <p className="text-sm text-gray-600">Próximamente</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas del sistema */}
                    {stats && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Estadísticas del Sistema</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {stats.total_lotes && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{stats.total_lotes.toLocaleString()}</div>
                                        <div className="text-sm text-gray-600">Lotes</div>
                                    </div>
                                )}
                                {stats.total_documentos && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{stats.total_documentos.toLocaleString()}</div>
                                        <div className="text-sm text-gray-600">Documentos</div>
                                    </div>
                                )}
                                {stats.usuarios_activos && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">{stats.usuarios_activos.toLocaleString()}</div>
                                        <div className="text-sm text-gray-600">Usuarios</div>
                                    </div>
                                )}
                                {stats.eventos_hoy && (
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{stats.eventos_hoy.toLocaleString()}</div>
                                        <div className="text-sm text-gray-600">Eventos Hoy</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Columna derecha - Monitor del sistema */}
                <div className="space-y-6">
                    {/* Monitor en tiempo real */}
                    <SystemMonitor
                        showFullDetails={true}
                        autoRefresh={true}
                        refreshInterval={30}
                        className="w-full"
                    />

                    {/* Estado detallado del sistema */}
                    {hasHealthData && systemHealth && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Estado Detallado</h3>

                            {/* Estado de servicios */}
                            <div className="space-y-3">
                                {systemHealth.databaseHealth && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Base de Datos:</span>
                                        <span className={`text-xs px-2 py-1 rounded ${systemHealth.databaseHealth.database.status === 'healthy'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {systemHealth.databaseHealth.database.status}
                                        </span>
                                    </div>
                                )}

                                {systemHealth.cacheHealth && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Cache:</span>
                                        <span className={`text-xs px-2 py-1 rounded ${systemHealth.cacheHealth.cache.status === 'healthy'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {systemHealth.cacheHealth.cache.status}
                                        </span>
                                    </div>
                                )}

                                {systemHealth.versionInfo && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Versión:</span>
                                        <span className="text-xs text-gray-800">
                                            {systemHealth.versionInfo.version}
                                        </span>
                                    </div>
                                )}

                                {systemHealth.versionInfo && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Entorno:</span>
                                        <span className={`text-xs px-2 py-1 rounded ${systemHealth.versionInfo.environment === 'production'
                                            ? 'bg-red-100 text-red-800'
                                            : systemHealth.versionInfo.environment === 'staging'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {systemHealth.versionInfo.environment}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <Link
                                    to="/admin/system"
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Ver monitoreo completo →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Enlaces rápidos */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
                        <div className="space-y-2">
                            <Link
                                to="/admin/validacion"
                                className="block text-sm text-blue-600 hover:text-blue-800"
                            >
                                → Documentos pendientes
                            </Link>
                            <Link
                                to="/admin/pot"
                                className="block text-sm text-blue-600 hover:text-blue-800"
                            >
                                → Gestionar POT
                            </Link>
                            <Link
                                to="/admin/system"
                                className="block text-sm text-blue-600 hover:text-blue-800"
                            >
                                → Monitoreo del sistema
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}