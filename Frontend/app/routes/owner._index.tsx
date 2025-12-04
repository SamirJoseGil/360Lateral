// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner._index.tsx
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getMisLotes, getUserLotesStats } from "~/services/lotes.server";
import { API_URL } from "~/utils/api.server";
import { WelcomeModal } from "~/components/WelcomeModal";
import { markFirstLoginCompleted } from "~/services/users.server";
import { markWelcomeModalShown, hasWelcomeModalBeenShown } from "~/utils/session.server";
import { useEffect } from "react";

// Formateador de moneda para COP
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value);
};

// Formateador de área
const formatArea = (value: number | undefined | null): string => {
    if (typeof value !== "number" || isNaN(value)) {
        return "0 m²";
    }
    return `${value.toLocaleString("es-CO")} m²`;
};

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado
    const user = await getUser(request);
    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    // ✅ NUEVO: Verificar si el modal ya fue mostrado en esta sesión
    const welcomeModalShown = await hasWelcomeModalBeenShown(request);

    try {
        // Obtener lotes y estadísticas desde el API
        const [lotesResponse, statsResponse] = await Promise.all([
            getMisLotes(request),
            getUserLotesStats(request),
        ]);

        // Definir el tipo para lote
        type LoteType = {
            id: number;
            nombre: string;
            direccion: string;
            area: number;
            estrato?: number;
            status: string;
            documentos?: unknown[];
        };

        // Limitar a 3 lotes para el dashboard
        const lotes = (lotesResponse.lotes ?? []).slice(0, 3).map((lote: LoteType) => ({
            id: lote.id,
            nombre: lote.nombre,
            direccion: lote.direccion,
            area: lote.area,
            estrato: lote.estrato || 0,
            valorEstimado: 0, // Este dato no viene del API, podríamos calcularlo
            status: lote.status,
            documentosCompletos: (lote.documentos || []).length >= 3 // Simplificación para el ejemplo
        }));

        // ✅ NUEVO: Obtener resumen de solicitudes
        const solicitudesResponse = await fetch(`${API_URL}/api/solicitudes/resumen/`, {
            headers: {
                "Cookie": request.headers.get("Cookie") || ""
            }
        });

        let solicitudesStats = { total: 0, pendientes: 0, completadas: 0 };
        if (solicitudesResponse.ok) {
            solicitudesStats = await solicitudesResponse.json();
        }

        // Combinar headers correctamente
        const combinedHeaders = new Headers();
        if (lotesResponse.headers) {
            for (const [key, value] of lotesResponse.headers.entries()) {
                combinedHeaders.append(key, value);
            }
        }
        if (statsResponse.headers) {
            for (const [key, value] of statsResponse.headers.entries()) {
                combinedHeaders.append(key, value);
            }
        }

        // Calcular valor estimado (podría venir de otra fuente)
        const valorEstimado = lotes.reduce((sum: number, lote: typeof lotes[number]) => sum + (lote.valorEstimado || 0), 0);

        return json({
            user,
            stats: {
                totalLotes: statsResponse.stats.total || 0,
                areaTotal: statsResponse.stats.area_total || 0,
                valorEstimado,
                lotesActivos: statsResponse.stats.activos || 0,
                lotesPendientes: statsResponse.stats.pendientes || 0,
                documentosCompletos: statsResponse.stats.documentacion_completa || 0,
                documentosPendientes: (statsResponse.stats.total || 0) - (statsResponse.stats.documentacion_completa || 0),
            },
            lotes,
            solicitudesStats,
            welcomeModalShown,  // ✅ NUEVO: Pasar flag a componente
            headers: combinedHeaders
        });
    } catch (error) {
        console.error("Error cargando datos del dashboard:", error);

        // Si hay un error, devolvemos datos de respaldo
        const stats = {
            total: 0,
            areaTotal: 0,
            valorEstimado: 0,
            lotesActivos: 0,
            lotesPendientes: 0,
            documentosCompletos: 0,
            documentosPendientes: 0,
            totalEventos: 0
        };

        return json({ 
            user, 
            stats, 
            lotes: [], 
            solicitudesStats: { total: 0, pendientes: 0, completadas: 0 },
            welcomeModalShown  // ✅ NUEVO: Incluir en error también
        });
    }
}

// ✅ MEJORADO: Action con marcado de sesión
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "complete-first-login") {
        try {
            // 1. Marcar en backend
            const { headers: backendHeaders } = await markFirstLoginCompleted(request);
            
            // 2. Marcar en sesión
            const { headers: sessionHeaders } = await markWelcomeModalShown(request);
            
            // ✅ CRÍTICO: Combinar ambos headers
            const combinedHeaders = new Headers(backendHeaders);
            for (const [key, value] of sessionHeaders.entries()) {
                combinedHeaders.append(key, value);
            }
            
            return json({ success: true }, { headers: combinedHeaders });
        } catch (error) {
            console.error("Error marking first login:", error);
            return json({ success: false, error: "Failed to mark first login" }, { status: 500 });
        }
    }

    return json({ success: false, error: "Invalid intent" }, { status: 400 });
}

export default function OwnerDashboard() {
    const { user, stats, lotes, solicitudesStats, welcomeModalShown } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const revalidator = useRevalidator();

    const handleCloseWelcome = () => {
        // Enviar acción para marcar como completada
        fetcher.submit(
            { intent: "complete-first-login" },
            { method: "post" }
        );
    };

    // ✅ NUEVO: Recargar datos cuando la acción se complete
    useEffect(() => {
        if (fetcher.data?.success && fetcher.state === 'idle') {
            // Recargar el loader para obtener datos actualizados
            revalidator.revalidate();
        }
    }, [fetcher.data, fetcher.state, revalidator]);

    // ✅ MEJORADO: Verificación doble (backend + sesión)
    const shouldShowModal = !user.first_login_completed && !welcomeModalShown && fetcher.state === 'idle';

    return (
        <div className="p-4">
            {/* ✅ MEJORADO: Verificación doble */}
            {shouldShowModal && (
                <WelcomeModal
                    role="owner"
                    userName={user.first_name || user.name || ""}
                    isFirstLogin={true}
                    onClose={handleCloseWelcome}
                />
            )}

            <header className="mb-8">
                <h1 className="text-3xl font-bold">Panel de Control</h1>
                <p className="text-gray-600 mt-2">
                    Bienvenido, {user.name}. Administra tus propiedades y solicitudes.
                </p>
            </header>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm">Total Lotes</h2>
                            <p className="text-2xl font-bold">{(stats as any).totalLotes || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm">Docs. Completos</h2>
                            <p className="text-2xl font-bold">{(stats as any).documentosCompletos || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 text-red-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm">Docs. Pendientes</h2>
                            <p className="text-2xl font-bold">{(stats as any).documentosPendientes || 0}</p>
                        </div>
                    </div>
                </div>

                {/* ✅ NUEVO: Card de Solicitudes */}
                <Link to="/owner/solicitudes" className="block">
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Solicitudes</h3>
                            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{solicitudesStats.total}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            {solicitudesStats.pendientes} pendientes
                        </p>
                    </div>
                </Link>
            </div>

            {/* Accesos rápidos */}
            <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link
                    to="/owner/lotes/nuevo"
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center"
                >
                    <div className="p-3 rounded-full bg-green-100 text-green-800 mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                    </div>
                    <h3 className="font-semibold mb-1">Registrar Lote</h3>
                    <p className="text-gray-500 text-sm">Añadir nueva propiedad</p>
                </Link>

                <Link
                    to="/owner/documentos/subir"
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center"
                >
                    <div className="p-3 rounded-full bg-blue-100 text-blue-800 mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <h3 className="font-semibold mb-1">Subir Documento</h3>
                    <p className="text-gray-500 text-sm">Añadir escrituras o planos</p>
                </Link>
            </div>

            {/* Mis Lotes */}
            <h2 className="text-xl font-bold mb-4">Mis Lotes</h2>
            <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dirección
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Área (m²)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estrato
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Documentos
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lotes.filter((lote: typeof lotes[number]) => lote != null).map((lote: typeof lotes[number]) => (
                                <tr key={lote.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{lote.nombre}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{lote.direccion}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{lote.area}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{lote.estrato}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lote.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {lote.status === "active" ? "Activo" : "Pendiente"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lote.documentosCompletos
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {lote.documentosCompletos ? "Completos" : "Pendientes"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link
                                            to={`/owner/lote/${lote.id}`}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Ver
                                        </Link>
                                        <Link
                                            to={`/owner/lote/${lote.id}/editar`}
                                            className="text-yellow-600 hover:text-yellow-900 mr-4"
                                        >
                                            Editar
                                        </Link>
                                        <Link
                                            to={`/owner/lote/${lote.id}/documentos`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Documentos
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-right">
                    <Link
                        to="/owner/lotes"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    >
                        Ver todos los lotes →
                    </Link>
                </div>
            </div>
        </div>
    );
}