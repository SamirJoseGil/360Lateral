import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import {
    getAdminDashboardStats,
    recordEvent,
    getUsersStats,
    getLotesStats,
    getDocumentosStats,
    getRecentActivity,
    getDashboardSummary,
    getDashboardEventsTable,
    getDashboardEventsDistribution
} from "~/services/stats.server";
import { useState } from "react";
import { usePageView } from "~/hooks/useStats"; export async function loader({ request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);

    try {
        // Registrar el evento de vista del dashboard
        try {
            await recordEvent(request, {
                type: 'view',
                name: 'admin_dashboard_view',
                value: { user_id: user.id }
            });
        } catch (error) {
            console.error("Error al registrar evento de estadísticas:", error);
        }

        // Obtener el resumen del dashboard y datos específicos de eventos desde los nuevos endpoints
        const [
            dashboardSummaryResponse,
            eventsTableResponse,
            eventsDistributionResponse
        ] = await Promise.all([
            getDashboardSummary(request),
            getDashboardEventsTable(request, 10), // Limitado a 10 eventos recientes
            getDashboardEventsDistribution(request)
        ]);

        const { summary } = dashboardSummaryResponse;
        const { eventsTableData } = eventsTableResponse;
        const { eventsDistribution } = eventsDistributionResponse;

        // Obtener datos detallados para otras secciones del dashboard
        const [
            dashboardResponse,
            usersResponse,
            lotesResponse,
            documentosResponse,
            recentActivityResponse
        ] = await Promise.all([
            getAdminDashboardStats(request),
            getUsersStats(request),
            getLotesStats(request),
            getDocumentosStats(request),
            getRecentActivity(request, 7) // últimos 7 días para retrocompatibilidad
        ]); const { dashboardStats } = dashboardResponse;
        const { usersStats } = usersResponse;
        const { lotesStats } = lotesResponse;
        const { documentosStats } = documentosResponse;
        const { recentActivity } = recentActivityResponse;

        // Combinar todos los headers para mantener cookies
        const headers = new Headers();
        [
            dashboardSummaryResponse.headers,
            eventsTableResponse.headers,
            eventsDistributionResponse.headers,
            dashboardResponse.headers,
            usersResponse.headers,
            lotesResponse.headers,
            documentosResponse.headers,
            recentActivityResponse.headers
        ].forEach(h => {
            if (h) {
                for (const [key, value] of h.entries()) {
                    headers.append(key, value);
                }
            }
        });

        return json({
            user,
            stats: {
                users: summary.total_usuarios?.count || 0,
                activeProjects: summary.proyectos_activos?.count || 0,
                pendingValidations: summary.pendientes_validacion?.count || 0,
                recentActivity: summary.eventos_recientes?.count || 0
            },
            rawStats: dashboardStats,
            detailedStats: {
                users: usersStats,
                lotes: lotesStats,
                documentos: documentosStats,
                recentActivity: recentActivity
            },
            eventsData: {
                table: eventsTableData?.events || [],
                distribution: eventsDistribution?.distribution || {}
            },
            error: null
        }, { headers });
    } catch (error) {
        console.error("Error cargando estadísticas:", error);

        // Datos vacíos en caso de error
        return json({
            user,
            stats: {
                users: 0,
                activeProjects: 0,
                pendingValidations: 0,
                recentActivity: 0
            },
            rawStats: {},
            detailedStats: {
                users: {},
                lotes: {},
                documentos: {},
                recentActivity: {}
            },
            eventsData: {
                table: [],
                distribution: {}
            },
            error: "No se pudieron cargar los datos en tiempo real. Por favor, intente nuevamente más tarde."
        });
    }
}

export default function AdminDashboard() {
    const { user, stats, error, detailedStats, eventsData } = useLoaderData<typeof loader>();

    // Estado para mostrar/ocultar secciones del dashboard
    const [activeTab, setActiveTab] = useState<'resumen' | 'actividad'>('resumen');

    // Registrar vista de página en el cliente
    usePageView('admin_dashboard_client_view', {
        user_id: user.id
    }, [user.id]); return (
        <div>
            <h1 className="text-3xl font-bold mb-4">Panel de Administración</h1>
            <p className="text-gray-600 mb-8">Bienvenido al panel de control de 360Lateral.</p>

            {typeof error === "string" && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs para navegar entre secciones */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setActiveTab('resumen')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'resumen'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Resumen General
                    </button>
                    <button
                        onClick={() => setActiveTab('actividad')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'actividad'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Actividad Reciente
                    </button>
                </nav>
            </div>

            {/* Grid de tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tarjeta de estadísticas: Usuarios */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4">
                        <a href="/admin/usuarios" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Ver todos los usuarios
                        </a>
                    </div>
                </div>

                {/* Tarjeta de estadísticas: Lotes Activos */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Lotes Activos</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4">
                        <a href="/admin/proyectos" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Ver todos los proyectos
                        </a>
                    </div>
                </div>

                {/* Tarjeta de estadísticas: Pendientes de Validación */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pendientes de Validación</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.pendingValidations}</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4">
                        <a href="/admin/validacion" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Ver pendientes
                        </a>
                    </div>
                </div>

                {/* Tarjeta de estadísticas: Actividad Reciente */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Eventos Recientes</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.recentActivity}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={() => setActiveTab('actividad')}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                            Ver actividad reciente
                        </button>
                    </div>
                </div>
            </div>

            {/* Sección de contenido según la pestaña activa */}
            {activeTab === 'resumen' && (
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">¡Bienvenido, {user.name}!</h2>
                    <p className="text-gray-600">
                        Este es tu panel de administración centralizado. Desde aquí puedes gestionar usuarios,
                        revisar validaciones pendientes, y ver análisis detallados de la plataforma.
                    </p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4 hover:bg-gray-50">
                            <h3 className="font-medium">Gestión de Usuarios</h3>
                            <p className="text-sm text-gray-500 mt-1">Administra los usuarios de la plataforma</p>
                            <a href="/admin/usuarios" className="mt-2 text-sm text-blue-600 flex items-center">
                                Ir a Usuarios
                                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                        <div className="border rounded-lg p-4 hover:bg-gray-50">
                            <h3 className="font-medium">Validación de Documentos</h3>
                            <p className="text-sm text-gray-500 mt-1">Revisa y aprueba documentos pendientes</p>
                            <a href="/admin/validacion" className="mt-2 text-sm text-blue-600 flex items-center">
                                Ir a Validación
                                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                        <div className="border rounded-lg p-4 hover:bg-gray-50">
                            <h3 className="font-medium">Análisis y Reportes</h3>
                            <p className="text-sm text-gray-500 mt-1">Visualiza métricas y genera reportes</p>
                            <a href="/admin/analisis" className="mt-2 text-sm text-blue-600 flex items-center">
                                Ir a Análisis
                                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'actividad' && (
                <div className="mt-8 space-y-6">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">Actividad Reciente</h2>
                            <p className="text-gray-500 text-sm mt-1">Últimos eventos registrados en el sistema</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* Eventos desde el nuevo endpoint de tabla de eventos */}
                                    {(eventsData?.table || []).map((event: { id: number; name: string; type: string; timestamp: string; user_id: number; user_name: string }, index: number) => (
                                        <tr key={event.id || index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${event.type === 'view' ? 'bg-blue-100 text-blue-800' :
                                                        event.type === 'search' ? 'bg-green-100 text-green-800' :
                                                            event.type === 'action' ? 'bg-purple-100 text-purple-800' :
                                                                event.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {event.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {event.user_name || `Usuario ${event.user_id}`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t">
                            <a href="/admin/estadisticas" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                Ver todas las estadísticas
                            </a>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Distribución por Tipo de Evento</h2>
                        <div className="space-y-4">
                            {Object.entries(eventsData?.distribution || {}).map(([type, count], index) => {
                                const countNumber = Number(count);
                                const total = Object.values(eventsData?.distribution || {}).reduce((a: number, b: any) => a + Number(b), 0);
                                const percentage = (countNumber / total) * 100;

                                return (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">{type}</span>
                                            <span className="text-sm text-gray-500">
                                                {countNumber} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}