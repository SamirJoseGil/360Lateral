// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\routes\admin.estadisticas.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getUser } from "~/utils/auth.server";
import {
    recordEvent,
    getUserActivity,
    getRecentActivity,
    getAllChartData,
    getDocumentsByMonth,
    getEventDistribution,
    getEventsDashboard,
    getEventsCounts,
    getDailyEvents,
    getEventTypes
} from "~/services/stats.server";
import { PageViewTracker, useEventTracker } from "~/components/StatsTracker";

export async function loader({ request }: LoaderFunctionArgs) {
    console.log("Admin estadisticas loader - processing request");

    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user) {
        console.log("Admin estadisticas loader - no user, redirecting to home");
        return redirect("/");
    }

    if (user.role !== "admin") {
        console.log(`Admin estadisticas loader - user is not admin (${user.role}), redirecting`);
        return redirect("/");
    }

    try {
        // Registrar evento de vista de la página de estadísticas
        await recordEvent(request, {
            type: "view",
            name: "admin_statistics_page",
            value: {
                user_id: user.id,
                role: user.role,
                section: "estadisticas"
            }
        });

        // Obtener datos para diferentes periodos
        const now = new Date();

        // Últimos 30 días para tendencias diarias
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // Último año para tendencias mensuales
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        // Obtener todos los datos necesarios en paralelo usando los nuevos endpoints
        const [
            allChartDataResponse,
            documentsByMonthResponse,
            eventDistributionResponse,
            userActivityResponse,
            recentActivityResponse,
            // Nuevos endpoints específicos para eventos
            eventsDashboardResponse,
            eventsCountsResponse,
            dailyEventsResponse,
            eventTypesResponse
        ] = await Promise.all([
            // Datos de gráficos generales
            getAllChartData(request),
            // Documentos por mes (tendencias mensuales)
            getDocumentsByMonth(request),
            // Distribución de eventos por tipo (endpoint anterior)
            getEventDistribution(request),
            // Actividad del usuario actual
            getUserActivity(request),
            // Actividad reciente del sistema
            getRecentActivity(request),
            // Nuevos endpoints específicos para eventos
            getEventsDashboard(request),
            getEventsCounts(request),
            getDailyEvents(request),
            getEventTypes(request)
        ]);

        // Extraer datos relevantes de las respuestas
        const { chartData } = allChartDataResponse;
        const { documentsByMonth } = documentsByMonthResponse;
        const { eventDistribution } = eventDistributionResponse;
        const { activity: userActivity } = userActivityResponse;
        const { recentActivity } = recentActivityResponse;

        // Extraer datos de los nuevos endpoints con la estructura correcta
        const eventsDashboard = eventsDashboardResponse.eventsDashboard || {};
        const eventsCounts = eventsCountsResponse.eventsCounts || {};
        const dailyEvents = dailyEventsResponse.dailyEvents || [];
        const eventTypes = eventTypesResponse.eventTypes || [];

        // Combinar headers de todas las respuestas
        const headers = new Headers();
        [
            allChartDataResponse.headers,
            documentsByMonthResponse.headers,
            eventDistributionResponse.headers,
            userActivityResponse.headers,
            recentActivityResponse.headers,
            eventsDashboardResponse.headers,
            eventsCountsResponse.headers,
            dailyEventsResponse.headers,
            eventTypesResponse.headers
        ].forEach(h => {
            if (h) {
                for (const [key, value] of h.entries()) {
                    headers.append(key, value);
                }
            }
        });

        // Procesamos los datos para adaptarlos al formato que espera el componente
        const dailyStats = chartData?.daily_events?.map((item: any) => ({
            period: item.date,
            count: item.count
        })) || [];

        const monthlyStats = documentsByMonth?.monthly_data?.map((item: any) => ({
            period: item.month,
            count: item.count
        })) || [];

        return json({
            user,
            stats: {
                dailyStats: dailyStats,
                monthlyStats: monthlyStats,
                summary: chartData?.summary || {},
                userActivity: userActivity || {},
                recentActivity: recentActivity || {},
                eventDistribution: eventDistribution?.distribution || {},
                // Nuevos datos específicos de eventos
                eventsDashboard: eventsDashboard || {},
                eventsCounts: eventsCounts || {},
                dailyEvents: dailyEvents || {},
                eventTypes: eventTypes || {}
            },
            error: null
        }, { headers });

    } catch (error) {
        console.error("Error cargando estadísticas:", error);

        return json({
            user,
            stats: {
                dailyStats: [],
                monthlyStats: [],
                summary: {},
                userActivity: {},
                recentActivity: {},
                eventDistribution: {},
                eventsDashboard: {},
                eventsCounts: {},
                dailyEvents: {},
                eventTypes: {}
            },
            error: "Error al cargar los datos de estadísticas. Por favor, inténtelo de nuevo más tarde."
        });
    }
}

export default function AdminEstadisticas() {
    const { user, stats, error } = useLoaderData<typeof loader>();
    const [activeTab, setActiveTab] = useState<'general' | 'usuarios' | 'actividad' | 'eventos'>('general');
    const trackEvent = useEventTracker();

    // Procesar y preparar datos para gráficos
    const processedDailyStats = stats.dailyStats.map((point: any) => ({
        fecha: new Date(point.period).toLocaleDateString(),
        eventos: point.count
    }));

    const processedMonthlyStats = stats.monthlyStats.map((point: any) => ({
        mes: new Date(point.period).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        eventos: point.count
    }));

    // Distribución por tipo de evento - ahora viene directamente de stats.eventDistribution
    const eventTypesDistribution = stats.eventDistribution || stats.summary?.metrics?.events_by_type || {
        view: 0,
        search: 0,
        action: 0,
        api: 0,
        error: 0,
        other: 0
    };

    const eventTypesTranslations: Record<string, string> = {
        view: 'Vistas',
        search: 'Búsquedas',
        action: 'Acciones',
        api: 'API',
        error: 'Errores',
        other: 'Otros'
    };

    // Registrar cambios de pestañas
    const handleTabChange = (tab: 'general' | 'usuarios' | 'actividad' | 'eventos') => {
        setActiveTab(tab);
        trackEvent({
            type: 'action',
            name: 'stats_tab_change',
            value: { tab, user_id: user.id }
        });
    };

    return (
        <div className="p-6">
            {/* Rastreador de vistas de página */}
            <PageViewTracker
                pageName="admin_estadisticas"
                additionalData={{ user_id: user.id, tab: activeTab }}
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

            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Estadísticas del Sistema</h1>
                <p className="text-gray-600 mt-2">Monitoreo y análisis de la actividad en la plataforma</p>
            </div>

            {/* Pestañas */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => handleTabChange('general')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'general'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Visión General
                    </button>
                    <button
                        onClick={() => handleTabChange('usuarios')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'usuarios'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Usuarios
                    </button>
                    <button
                        onClick={() => handleTabChange('actividad')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'actividad'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Actividad
                    </button>
                    <button
                        onClick={() => handleTabChange('eventos')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'eventos'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Eventos
                    </button>
                </nav>
            </div>

            {/* Contenido según pestaña seleccionada */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Tarjetas de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Total Eventos</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.summary?.metrics?.total_events || 0}</p>
                            <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Usuarios Únicos</h3>
                            <p className="text-3xl font-bold text-blue-600">{stats.summary?.metrics?.unique_users || 0}</p>
                            <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Sesiones</h3>
                            <p className="text-3xl font-bold text-green-600">{stats.summary?.metrics?.unique_sessions || 0}</p>
                            <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Errores Registrados</h3>
                            <p className="text-3xl font-bold text-red-600">{stats.summary?.metrics?.events_by_type?.error || 0}</p>
                            <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                        </div>
                    </div>

                    {/* Gráfico de eventos diarios */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Eventos Diarios</h3>
                        <div className="h-64 flex items-end space-x-1">
                            {processedDailyStats.map((day: any, index: number) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div
                                        className="w-full bg-blue-500 rounded-t"
                                        style={{
                                            height: `${(day.eventos / Math.max(...processedDailyStats.map((d: any) => d.eventos || 1))) * 180}px`
                                        }}
                                    ></div>
                                    <div className="text-xs mt-2 transform -rotate-45 origin-top-left">
                                        {index % 3 === 0 ? day.fecha : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Distribución por tipo de evento */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Distribución por Tipo de Evento</h3>
                        <div className="space-y-4">
                            {Object.entries(eventTypesDistribution).map(([type, count], index) => {
                                const total = Object.values(eventTypesDistribution).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0);
                                const percentage = total > 0 ? (count as number / total) * 100 : 0;

                                return (
                                    <div key={index}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">{eventTypesTranslations[type] || type}</span>
                                            <span className="text-sm text-gray-500">
                                                {String(count)} ({percentage.toFixed(1)}%)
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

            {activeTab === 'usuarios' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Actividad de Usuarios</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Usuarios Activos Hoy</h4>
                                <p className="text-2xl font-bold">
                                    {stats.recentActivity?.active_users || 0}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Total Usuarios</h4>
                                <p className="text-2xl font-bold">
                                    {stats.summary?.metrics?.unique_users || 0}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Tasa de Retención</h4>
                                <p className="text-2xl font-bold">
                                    {stats.summary?.metrics?.unique_sessions && stats.summary?.metrics?.unique_users
                                        ? `${((stats.summary.metrics.unique_sessions / stats.summary.metrics.unique_users) * 100).toFixed(1)}%`
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Mi Actividad Reciente</h3>
                        {stats.userActivity?.recent_events?.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stats.userActivity.recent_events.map((event: any, index: number) => (
                                            <tr key={index}>
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
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </td>
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

            {activeTab === 'actividad' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Actividad por Tipo de Evento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(stats.recentActivity?.activity_by_type || {}).map(([type, count], index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-500">
                                        {eventTypesTranslations[type] || type}
                                    </h4>
                                    <p className="text-2xl font-bold">{String(count)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Eventos más Frecuentes</h3>
                        {stats.summary?.metrics?.top_events?.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ocurrencias</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stats.summary.metrics.top_events.map((event: any, index: number) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No hay eventos para mostrar.</p>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Actividad Mensual</h3>
                        <div className="h-64 flex items-end space-x-2">
                            {processedMonthlyStats.map((month: any, index: number) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div
                                        className="w-full bg-green-500 rounded-t"
                                        style={{
                                            height: `${(month.eventos / Math.max(...processedMonthlyStats.map((m: any) => m.eventos || 1))) * 180}px`
                                        }}
                                    ></div>
                                    <div className="text-xs mt-2 transform -rotate-45 origin-top-left">
                                        {month.mes}
                                    </div>
                                    <div className="text-xs font-medium mt-1">
                                        {month.eventos}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'eventos' && (
                <div className="space-y-6">
                    {/* Resumen de eventos usando datos del endpoint específico */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Total Eventos</h3>
                            <p className="text-3xl font-bold text-gray-900">{stats.eventsDashboard?.total_events || stats.eventsCounts?.total_events || 0}</p>
                            <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Usuarios Únicos</h3>
                            <p className="text-3xl font-bold text-blue-600">{stats.eventsDashboard?.unique_users || stats.eventsCounts?.unique_users || 0}</p>
                            <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Sesiones</h3>
                            <p className="text-3xl font-bold text-green-600">{stats.eventsDashboard?.sessions || stats.eventsCounts?.sessions || 0}</p>
                            <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Errores</h3>
                            <p className="text-3xl font-bold text-red-600">{stats.eventsDashboard?.errors || stats.eventsCounts?.errors || 0}</p>
                            <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                        </div>
                    </div>

                    {/* Distribución de tipos de eventos del endpoint específico */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Distribución por Tipo de Evento</h3>
                        <div className="space-y-4">
                            {/* Usar los datos del endpoint específico de tipos de eventos que vienen como array */}
                            {(stats.eventsDashboard?.event_types || stats.eventTypes || []).map((event: any, index: number) => (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">{eventTypesTranslations[event.type] || event.type}</span>
                                        <span className="text-sm text-gray-500">
                                            {event.count} ({event.percentage.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: `${event.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Eventos diarios usando datos del endpoint específico */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Eventos Diarios</h3>
                        <div className="h-64 flex items-end space-x-1">
                            {(stats.eventsDashboard?.daily_events || stats.dailyEvents || []).map((day: any, index: number) => {
                                const dailyEventsData = stats.eventsDashboard?.daily_events || stats.dailyEvents || [];
                                const maxCount = Math.max(...dailyEventsData.map((d: any) => d.count || 0), 1);
                                const heightPercentage = (day.count / maxCount) * 180;

                                return (
                                    <div key={index} className="flex flex-col items-center flex-1">
                                        <div
                                            className="w-full bg-blue-500 rounded-t"
                                            style={{
                                                height: `${heightPercentage}px`
                                            }}
                                        ></div>
                                        <div className="text-xs mt-2 transform -rotate-45 origin-top-left">
                                            {index % 3 === 0 ? new Date(day.date).toLocaleDateString() : ''}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>                    {/* Tabla de eventos recientes del dashboard de eventos */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Eventos Recientes</h3>
                        {(stats.eventsDashboard?.recent_events?.length || stats.recentActivity?.recent_events?.length) ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(stats.eventsDashboard?.recent_events || stats.recentActivity?.recent_events || []).map((event: any, index: number) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.id}</td>
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
                                                    {event.user_name || event.user_id || 'Anónimo'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No hay eventos recientes para mostrar.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}