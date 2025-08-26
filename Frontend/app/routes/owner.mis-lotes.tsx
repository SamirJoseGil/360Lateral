// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.mis-lotes.tsx
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { getMisLotes, getUserLotesStats, type Lote } from "~/services/lotes.server";

// Formateador de moneda para COP
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value);
};

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado
    const user = await getUser(request);
    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    try {
        // Obtener los datos desde el API
        const [lotesResponse, statsResponse] = await Promise.all([
            getMisLotes(request),
            getUserLotesStats(request)
        ]);

        // Procesar los datos recibidos
        const lotes = lotesResponse.lotes.map(lote => ({
            ...lote,
            valorEstimado: lote.area * 1500000, // Estimación simple basada en área (COP/m²)
            documentosCompletos: (lote.documentos || []).length >= 3 // Simplificación para el ejemplo
        }));

        return json({
            user,
            lotes,
            stats: statsResponse.stats,
            headers: { ...lotesResponse.headers, ...statsResponse.headers }
        });
    } catch (error) {
        console.error("Error cargando lotes:", error);

        // En caso de error, devolver datos vacíos
        return json({
            user,
            lotes: [],
            stats: {
                totalLotes: 0,
                areaTotal: 0,
                valorTotal: 0,
                lotesActivos: 0,
                lotesPendientes: 0,
                documentosCompletos: 0,
                documentosPendientes: 0
            },
            error: "Error al cargar los datos de lotes. Por favor, intente nuevamente."
        });
    }
}

export default function MisLotes() {
    const { user, lotes, stats } = useLoaderData<typeof loader>();
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [filtroDocs, setFiltroDocs] = useState("todos");

    // Filtrar lotes según los criterios seleccionados
    const lotesFiltrados = lotes.filter(lote => {
        if (!lote) return false;
        // Filtro por estado
        if (filtroEstado === "activos" && lote.status !== "active") return false;
        if (filtroEstado === "pendientes" && lote.status !== "pending") return false;

        // Filtro por documentos
        if (filtroDocs === "completos" && !lote.documentosCompletos) return false;
        if (filtroDocs === "pendientes" && lote.documentosCompletos) return false;

        return true;
    });

    return (
        <div className="p-6">
            <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Mis Lotes</h1>
                    <p className="text-gray-600 mt-1">
                        Administra y visualiza todas tus propiedades registradas
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link
                        to="/owner/lote/nuevo"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
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
                        Registrar Nuevo Lote
                    </Link>
                </div>
            </header>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
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
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-500">Total Lotes</p>
                            <p className="text-lg font-semibold">{stats.totalLotes}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 rounded-full bg-green-100 text-green-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
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
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-500">Área Total</p>
                            <p className="text-lg font-semibold">{stats.areaTotal.toLocaleString('es-CO')} m²</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 rounded-full bg-purple-100 text-purple-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
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
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-500">Valor Estimado</p>
                            <p className="text-lg font-semibold">{formatCurrency((stats as any).valorTotal ?? 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 rounded-full bg-yellow-100 text-yellow-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
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
                        <div className="ml-3">
                            <p className="text-xs font-medium text-gray-500">Documentos Completos</p>
                            <p className="text-lg font-semibold">{stats.documentosCompletos} de {stats.totalLotes}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label htmlFor="filtroEstado" className="block text-sm font-medium text-gray-700 mb-1">
                            Filtrar por Estado
                        </label>
                        <select
                            id="filtroEstado"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activos">Activos</option>
                            <option value="pendientes">Pendientes</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filtroDocs" className="block text-sm font-medium text-gray-700 mb-1">
                            Filtrar por Documentos
                        </label>
                        <select
                            id="filtroDocs"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filtroDocs}
                            onChange={(e) => setFiltroDocs(e.target.value)}
                        >
                            <option value="todos">Todos los documentos</option>
                            <option value="completos">Completos</option>
                            <option value="pendientes">Pendientes</option>
                        </select>
                    </div>
                    <div className="flex-1 flex justify-end">
                        <span className="text-sm text-gray-500">
                            Mostrando <span className="font-semibold">{lotesFiltrados.length}</span> de <span className="font-semibold">{lotes.length}</span> lotes
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabla de Lotes */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Nombre
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Dirección
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Área (m²)
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Matrícula
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Estado
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Documentos
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lotesFiltrados.map((lote) => (
                                lote ? (
                                    <tr key={lote.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{lote.nombre}</div>
                                                    <div className="text-xs text-gray-500">Est. {lote.estrato}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{lote.direccion}</div>
                                            <div className="text-xs text-gray-500">CBML: {lote.cbml}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{lote.area.toLocaleString('es-CO')}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{lote.matricula}</div>
                                            <div className="text-xs text-gray-500">Catastral: {lote.codigo_catastral?.substring(0, 8)}...</div>
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
                                            <div className="flex space-x-3">
                                                <Link
                                                    to={`/owner/lote/${lote.id}`}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Ver
                                                </Link>
                                                <Link
                                                    to={`/owner/lote/${lote.id}/editar`}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                >
                                                    Editar
                                                </Link>
                                                <Link
                                                    to={`/owner/lote/${lote.id}/documentos`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Documentos
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : null
                            ))}
                        </tbody>
                    </table>
                </div>
                {lotesFiltrados.length === 0 && (
                    <div className="px-6 py-10 text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron lotes</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            No hay lotes que coincidan con los filtros seleccionados.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={() => {
                                    setFiltroEstado("todos");
                                    setFiltroDocs("todos");
                                }}
                            >
                                Restablecer filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}