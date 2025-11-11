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
        <div className="p-4">
            {error && (
                <div className="mb-6 bg-red-100 border-l-4 border-red-400 p-8">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a href="/admin/usuarios" className="block">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Usuarios</h3>
                        <p className="text-3xl font-bold">{usersStats?.total || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de usuarios registrados</p>
                    </div>
                </a>
                <a href="/admin/lotes" className="block">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Lotes</h3>
                        <p className="text-3xl font-bold">{lotesStats?.total || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de lotes registrados</p>
                    </div>
                </a>
                <a href="/admin/validacion" className="block">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4">Documentos</h3>
                        <p className="text-3xl font-bold">{documentosStats?.total || 0}</p>
                        <p className="text-sm text-gray-500 mt-2">Total de documentos subidos</p>
                    </div>
                </a>
            </div>
        </div>
    );
}