// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner._index.tsx
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getMisLotes, getUserLotesStats } from "~/services/lotes.server";

// Formateador de moneda para COP
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value);
};

// Formateador de área
const formatArea = (value: number): string => {
    return `${value.toLocaleString("es-CO")} m²`;
};

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado
    const user = await getUser(request);
    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    try {
        // Obtener lotes y estadísticas desde el API
        const [lotesResponse, statsResponse] = await Promise.all([
            getMisLotes(request),
            getUserLotesStats(request)
        ]);

        // Limitar a 3 lotes para el dashboard
        const lotes = lotesResponse.lotes.slice(0, 3).map(lote => ({
            id: lote.id,
            nombre: lote.nombre,
            direccion: lote.direccion,
            area: lote.area,
            estrato: lote.estrato || 0,
            valorEstimado: 0, // Este dato no viene del API, podríamos calcularlo
            status: lote.status,
            documentosCompletos: (lote.documentos || []).length >= 3 // Simplificación para el ejemplo
        }));

        // Solicitudes recibidas de análisis o interés - Esto podría venir de otro endpoint
        // Por ahora usamos datos de ejemplo
        const solicitudes = [
            {
                id: 1,
                tipo: "analisis",
                loteId: lotes[0]?.id || 1,
                loteNombre: lotes[0]?.nombre || "Lote Centro",
                solicitante: "Constructora XYZ",
                fecha: "2025-08-20",
                estado: "pendiente"
            },
            {
                id: 2,
                tipo: "interes",
                loteId: lotes[1]?.id || 2,
                loteNombre: lotes[1]?.nombre || "Lote Sur",
                solicitante: "Desarrollos ABC",
                fecha: "2025-08-18",
                estado: "revisado"
            }
        ];

        return json({
            user,
            stats: statsResponse.stats,
            lotes,
            solicitudes,
            headers: { ...lotesResponse.headers, ...statsResponse.headers }
        });
    } catch (error) {
        console.error("Error cargando datos del dashboard:", error);

        // Si hay un error, devolvemos datos de respaldo
        const stats = {
            totalLotes: 0,
            areaTotal: 0,
            valorEstimado: 0,
            lotesActivos: 0,
            lotesPendientes: 0,
            documentosCompletos: 0,
            documentosPendientes: 0
        };

        return json({ user, stats, lotes: [], solicitudes: [] });
    }
}

export default function OwnerDashboard() {
    const { user, stats, lotes, solicitudes } = useLoaderData<typeof loader>();

    return (
        <div className="p-6">
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
                            <p className="text-2xl font-bold">{stats.totalLotes}</p>
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
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm">Área Total</h2>
                            <p className="text-2xl font-bold">{formatArea(stats.areaTotal)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-800">
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
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm">Valor Estimado</h2>
                            <p className="text-2xl font-bold">{formatCurrency(stats.valorEstimado)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
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
                            <p className="text-2xl font-bold">{stats.documentosCompletos}</p>
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
                            <p className="text-2xl font-bold">{stats.documentosPendientes}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accesos rápidos */}
            <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link
                    to="/owner/lote/nuevo"
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

                <Link
                    to="/owner/solicitudes"
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center"
                >
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-800 mb-4">
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
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                    </div>
                    <h3 className="font-semibold mb-1">Ver Solicitudes</h3>
                    <p className="text-gray-500 text-sm">Revisa solicitudes recibidas</p>
                </Link>

                <Link
                    to="/owner/analisis/solicitar"
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center"
                >
                    <div className="p-3 rounded-full bg-purple-100 text-purple-800 mb-4">
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
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </div>
                    <h3 className="font-semibold mb-1">Solicitar Análisis</h3>
                    <p className="text-gray-500 text-sm">Valoración urbanística</p>
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
                            {lotes.filter((lote) => lote != null).map((lote) => (
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
                        to="/owner/mis-lotes"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    >
                        Ver todos los lotes →
                    </Link>
                </div>
            </div>

            {/* Solicitudes Recientes */}
            <h2 className="text-xl font-bold mb-4">Solicitudes Recientes</h2>
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lote
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Solicitante
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acción
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {solicitudes.filter((solicitud) => solicitud != null).map((solicitud) => (
                                <tr key={solicitud.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${solicitud.tipo === "analisis"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-green-100 text-green-800"
                                                }`}
                                        >
                                            {solicitud.tipo === "analisis" ? "Análisis" : "Interés"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{solicitud.loteNombre}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{solicitud.solicitante}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{solicitud.fecha}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${solicitud.estado === "pendiente"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {solicitud.estado === "pendiente" ? "Pendiente" : "Revisado"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link
                                            to={`/owner/solicitudes/${solicitud.id}`}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Ver Detalles
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-right">
                    <Link
                        to="/owner/solicitudes"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    >
                        Ver todas las solicitudes →
                    </Link>
                </div>
            </div>
        </div>
    );
}