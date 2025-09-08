import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser } from "~/utils/auth.server";
import { getDashboardSummary, getEventsDashboard, recordEvent } from "~/services/stats.server";
import { PageViewTracker, useEventTracker } from "~/components/StatsTracker";

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

        // Obtener datos para el dashboard
        const dashboardSummaryResponse = await getDashboardSummary(request);
        const eventsDashboardResponse = await getEventsDashboard(request);

        // Combinar headers
        const combinedHeaders = new Headers();
        if (dashboardSummaryResponse.headers) {
            for (const [key, value] of dashboardSummaryResponse.headers.entries()) {
                combinedHeaders.append(key, value);
            }
        }
        if (eventsDashboardResponse.headers) {
            for (const [key, value] of eventsDashboardResponse.headers.entries()) {
                combinedHeaders.append(key, value);
            }
        }

        return json({
            user,
            dashboardSummary: dashboardSummaryResponse.dashboardSummary || {},
            eventsDashboard: eventsDashboardResponse.eventsDashboard || {},
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
            error: "Error al cargar los datos del dashboard. Por favor, inténtelo de nuevo más tarde."
        });
    }
}

export default function AdminDashboard() {
    const { user, dashboardSummary, eventsDashboard, error } = useLoaderData<typeof loader>();
    const [activeSection, setActiveSection] = useState<'dashboard' | 'stats' | 'activity'>('dashboard');
    const trackEvent = useEventTracker();

    // Registrar cambio de sección
    const handleSectionChange = (section: 'dashboard' | 'stats' | 'activity') => {
        setActiveSection(section);
        trackEvent({
            type: 'action',
            name: 'admin_dashboard_section_change',
            value: { section, user_id: user.id }
        });
    };

    // Registrar vista de la página
    useEffect(() => {
        trackEvent({
            type: 'view',
            name: 'admin_dashboard_client_view',
            value: {
                user_id: user.id,
                section: activeSection
            }
        });
    }, [trackEvent, user.id, activeSection]);

    return (
        <div className="p-6">
            {/* Rastreador de vistas de página */}
            <PageViewTracker
                pageName="admin_panel_view"
                additionalData={{ user_id: user.id, role: user.role }}
            />

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

            {/* Resto del contenido del dashboard */}
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
                        <p className="text-3xl font-bold">{dashboardSummary.users_count || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de usuarios registrados</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Documentos</h3>
                        <p className="text-3xl font-bold">{dashboardSummary.documents_count || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de documentos subidos</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Lotes</h3>
                        <p className="text-3xl font-bold">{dashboardSummary.lotes_count || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de lotes registrados</p>
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
                                <p className="text-2xl font-bold">{eventsDashboard.total_events || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Usuarios Únicos</h4>
                                <p className="text-2xl font-bold">{eventsDashboard.unique_users || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Sesiones</h4>
                                <p className="text-2xl font-bold">{eventsDashboard.sessions || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Errores</h4>
                                <p className="text-2xl font-bold">{eventsDashboard.errors || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'activity' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Actividad Reciente</h3>
                        {(dashboardSummary.recent_activity?.length ?? 0) > 0 ? (
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