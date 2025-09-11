import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser } from "~/utils/auth.server";
import { getDashboardSummary, getEventsDashboard, recordEvent, getUsersStats, getLotesStats, getDocumentosStats } from "~/services/stats.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user) {
        return redirect("/");
    }

    if (user.role !== "admin") {
        return redirect("/");
    }

    try {
        // Registrar evento de vista del dashboard
        try {
            await recordEvent(request, {
                type: "view",
                name: "admin_dashboard_view",
                value: {
                    user_id: user.id
                }
            });
        } catch (error) {
            console.error("Error registrando evento de vista:", error);
        }

        // Obtener datos para el dashboard usando los nuevos endpoints
        const [
            dashboardSummaryResponse,
            eventsDashboardResponse,
            usersStatsResponse,
            lotesStatsResponse,
            documentosStatsResponse
        ] = await Promise.all([
            getDashboardSummary(request).catch(err => ({ dashboardSummary: {}, headers: new Headers() })),
            getEventsDashboard(request).catch(err => ({ eventsDashboard: {}, headers: new Headers() })),
            getUsersStats(request).catch(err => ({ usersStats: {}, headers: new Headers() })),
            getLotesStats(request).catch(err => ({ lotesStats: {}, headers: new Headers() })),
            getDocumentosStats(request).catch(err => ({ documentosStats: {}, headers: new Headers() }))
        ]);

        // Combinar headers
        const combinedHeaders = new Headers();
        [dashboardSummaryResponse, eventsDashboardResponse, usersStatsResponse, lotesStatsResponse, documentosStatsResponse]
            .forEach(response => {
                if (response.headers) {
                    for (const [key, value] of response.headers.entries()) {
                        combinedHeaders.append(key, value);
                    }
                }
            });

        return json({
            user,
            dashboardSummary: dashboardSummaryResponse.dashboardSummary || {},
            eventsDashboard: eventsDashboardResponse.eventsDashboard || {},
            usersStats: usersStatsResponse.usersStats || {},
            lotesStats: lotesStatsResponse.lotesStats || {},
            documentosStats: documentosStatsResponse.documentosStats || {},
            error: null
        }, {
            headers: combinedHeaders
        });
    } catch (error) {
        console.error("Error cargando estadísticas:", error);

        return json({
            user,
            dashboardSummary: {},
            eventsDashboard: {},
            usersStats: {},
            lotesStats: {},
            documentosStats: {},
            error: "Error al cargar los datos del dashboard. Por favor, inténtelo de nuevo más tarde."
        });
    }
}

export default function AdminDashboard() {
    const { user, dashboardSummary, eventsDashboard, usersStats, lotesStats, documentosStats, error } = useLoaderData<typeof loader>();
    const [activeSection, setActiveSection] = useState<'dashboard' | 'stats' | 'activity'>('dashboard');

    // Registrar cambio de sección
    const handleSectionChange = (section: 'dashboard' | 'stats' | 'activity') => {
        setActiveSection(section);
        // TODO: Implementar tracking del lado cliente si es necesario
    };

    return (
        <div className="p-6">
            {error && (
                <div className="mb-6 bg-red-100 border-l-4 border-red-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Panel de Administración</h1>
                <p className="text-gray-600 mt-2">Bienvenido/a {user.name}, gestione su aplicación desde aquí.</p>
            </div>

            {/* Secciones del dashboard */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => handleSectionChange('dashboard')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'dashboard'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => handleSectionChange('stats')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'stats'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Estadísticas
                    </button>
                    <button
                        onClick={() => handleSectionChange('activity')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'activity'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Actividad Reciente
                    </button>
                </nav>
            </div>

            {/* Contenido según la sección seleccionada */}
            {activeSection === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Usuarios</h3>
                        <p className="text-3xl font-bold">{usersStats?.total || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de usuarios registrados</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Lotes</h3>
                        <p className="text-3xl font-bold">{lotesStats?.total || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de lotes registrados</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Documentos</h3>
                        <p className="text-3xl font-bold">{documentosStats?.total || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de documentos subidos</p>
                    </div>
                </div>
            )}

            {activeSection === 'stats' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Estadísticas de Eventos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Total Eventos</h4>
                                <p className="text-2xl font-bold">{eventsDashboard?.total_events || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Eventos Hoy</h4>
                                <p className="text-2xl font-bold">{eventsDashboard?.daily_events?.[0]?.count || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Tipos de Eventos</h4>
                                <p className="text-2xl font-bold">{eventsDashboard?.event_types?.length || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Período</h4>
                                <p className="text-2xl font-bold">{eventsDashboard?.period_days || 30} días</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'activity' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Actividad Reciente</h3>
                        {dashboardSummary?.recent_activity?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardSummary.recent_activity.map((activity: any, index: number) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.user_name || activity.user_id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.action}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(activity.timestamp).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No hay actividad reciente para mostrar.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}