import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getUserActivity, recordEvent } from "~/services/stats.server";
import { fetchWithAuth } from "~/utils/auth.server";
import { getFavoriteLotes } from "~/services/lotes.server";

// Constante para la URL base de la API
const API_URL = process.env.API_URL || "http://localhost:8000";

// Tipos para los datos
type SearchCriteria = {
    id: number;
    name: string;
    area: string;
    zone: string;
    budget: string;
    treatment: string;
};

type FavoriteLot = {
    id: number;
    name: string;
    area: number;
    price: number;
    address: string;
    owner: string;
    potentialValue: number;
};

export async function loader({ request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);

    try {
        // Registrar evento de visita al dashboard
        await recordEvent(request, {
            type: "view",
            name: "developer_dashboard",
            value: {
                user_id: user.id
            }
        });

        // Obtener la actividad del usuario de forma paralela
        const [activityResponse, favoritesResponse] = await Promise.allSettled([
            getUserActivity(request, 30),
            getFavoriteLotes(request, { limit: 3 })
        ]);

        const activity = activityResponse.status === 'fulfilled' ? activityResponse.value.activity : null;
        const favoritesData = favoritesResponse.status === 'fulfilled' ? favoritesResponse.value : { favorites: [] };

        // Intentar obtener criterios de inversión reales desde la API
        let searchCriteria: SearchCriteria[] = [];
        try {
            const { res: criteriaResponse } = await fetchWithAuth(
                request,
                `${API_URL}/api/developer/investment-criteria/`
            );

            if (criteriaResponse.ok) {
                const criteriaData = await criteriaResponse.json();
                searchCriteria = (criteriaData.results || []).map((item: any) => ({
                    id: item.id,
                    name: item.name || `Criterio ${item.id}`,
                    area: item.area_range ? `${item.area_range.min}-${item.area_range.max}` : "N/A",
                    zone: Array.isArray(item.zones) ? item.zones.join(", ") : item.zone || "No especificada",
                    budget: item.budget_range ?
                        `${Math.round(item.budget_range.min / 1000000)}M-${Math.round(item.budget_range.max / 1000000)}M` :
                        "N/A",
                    treatment: Array.isArray(item.treatments) ? item.treatments.join(", ") : item.treatment || "No especificado"
                }));
            }
        } catch (error) {
            console.error("Error obteniendo criterios desde API:", error);
        }

        // Procesar lotes favoritos desde la API
        const favoriteLots: FavoriteLot[] = favoritesData.favorites.map((item: any) => ({
            id: item.id || item.lote?.id,
            name: item.lote?.nombre || item.name || `Lote ${item.lote?.cbml || item.id}`,
            area: item.lote?.area || 0,
            price: item.lote?.precio_estimado || item.price || 0,
            address: item.lote?.direccion || item.address || "Dirección no disponible",
            owner: item.lote?.owner_name || item.owner || "No especificado",
            potentialValue: item.lote?.valor_potencial || item.potentialValue || (item.price * 1.25) || 0
        }));

        // Calcular estadísticas reales basadas en datos de la API
        const stats = {
            searches: activity?.events_by_type?.search || 0,
            favorites: favoriteLots.length,
            offers: activity?.events_by_type?.action || 0,
            matches: activity?.events_by_type?.match || 0,
            analyses: activity?.events_by_type?.analysis || activity?.events_by_type?.view || 0,
            savedSearches: searchCriteria.length,
            contacts: activity?.events_by_type?.contact || 0,
            totalEvents: activity?.total_events || 0
        };

        return json({
            user,
            searchCriteria,
            favoriteLots,
            stats,
            activity
        }, {
            headers: activityResponse.status === 'fulfilled' ? activityResponse.value.headers : new Headers()
        });
    } catch (error) {
        console.error("Error cargando dashboard:", error);

        // Datos de respaldo en caso de error
        const stats = {
            searches: 0,
            favorites: 0,
            offers: 0,
            matches: 0,
            analyses: 0,
            savedSearches: 0,
            contacts: 0,
            totalEvents: 0
        };

        return json({
            user,
            searchCriteria: [],
            favoriteLots: [],
            stats,
            activity: null
        });
    }
}

// Formateador de moneda para COP
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function DeveloperDashboard() {
    const { user, searchCriteria, favoriteLots, stats } =
        useLoaderData<typeof loader>();

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold">Panel de Desarrollador</h1>
                <p className="text-gray-600 mt-2">
                    Bienvenido, {user.name}. Encuentra tu próxima oportunidad de desarrollo.
                </p>
            </header>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 text-red-800 mr-4">
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
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Lotes Favoritos</p>
                            <p className="text-2xl font-semibold">{stats.favorites}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-800 mr-4">
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
                        <div>
                            <p className="text-gray-500 text-sm">Análisis Realizados</p>
                            <p className="text-2xl font-semibold">{stats.analyses}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-indigo-100 text-indigo-800 mr-4">
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
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Búsquedas Guardadas</p>
                            <p className="text-2xl font-semibold">{stats.savedSearches}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-800 mr-4">
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
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Contactos</p>
                            <p className="text-2xl font-semibold">{stats.contacts}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accesos rápidos */}
            <h2 className="text-xl font-bold mb-4">Accesos Rápidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link
                    to="/developer/search"
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center"
                >
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-800 mb-4">
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
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="font-semibold mb-1">Buscar Lotes</h3>
                    <p className="text-gray-500 text-sm">Encuentra propiedades disponibles</p>
                </Link>

                <Link
                    to="/developer/analysis"
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
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                        </svg>
                    </div>
                    <h3 className="font-semibold mb-1">Análisis Urbanístico</h3>
                    <p className="text-gray-500 text-sm">Evaluar potencial de desarrollo</p>
                </Link>

                <Link
                    to="/developer/favorites"
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center"
                >
                    <div className="p-3 rounded-full bg-red-100 text-red-800 mb-4">
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
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="font-semibold mb-1">Favoritos</h3>
                    <p className="text-gray-500 text-sm">Accede a tus lotes guardados</p>
                </Link>

                {/* <Link
                    to="/developer/investment"
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                        </svg>
                    </div>
                    <h3 className="font-semibold mb-1">Criterios de Inversión</h3>
                    <p className="text-gray-500 text-sm">Configura tu tesis de inversión</p>
                </Link> */}
            </div>

            {/* Mi Tesis de Inversión
            <h2 className="text-xl font-bold mb-4">Mi Tesis de Inversión</h2>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="mb-4">
                    <p className="text-gray-600">
                        Criterios guardados para tus búsquedas de propiedades
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
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
                                    Ubicación
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
                                    Presupuesto
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Tratamiento
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {searchCriteria && searchCriteria.length > 0 ? (
                                searchCriteria.map((criteria) => (
                                    <tr key={criteria?.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {criteria?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {criteria?.zone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {criteria?.area}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {criteria?.budget}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {criteria?.treatment}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                to={`/developer/search?criteria=${criteria?.id}`}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Buscar
                                            </Link>
                                            <Link
                                                to={`/developer/investment/${criteria?.id}`}
                                                className="text-yellow-600 hover:text-yellow-900"
                                            >
                                                Editar
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        No hay criterios de inversión guardados.
                                        <Link to="/developer/investment/new" className="ml-2 text-indigo-600 hover:text-indigo-900">
                                            Crear uno nuevo
                                        </Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end">
                    <Link
                        to="/developer/investment/new"
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Crear nuevo criterio
                    </Link>
                </div>
            </div> */}

            {/* Lotes Favoritos */}
            <h2 className="text-xl font-bold mb-4">Lotes Favoritos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {favoriteLots && favoriteLots.length > 0 ? (
                    favoriteLots.map((lot) =>
                        lot ? (
                            <div key={lot.id} className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="p-6">
                                    <h3 className="font-bold text-lg mb-2">{lot.name}</h3>
                                    <p className="text-gray-500 mb-4">{lot.address}</p>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <span className="text-gray-500 block text-sm">Área</span>
                                            <span className="font-medium">{lot.area} m²</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-sm">Precio</span>
                                            <span className="font-medium">{formatCurrency(lot.price)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-sm">Valor Potencial</span>
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(lot.potentialValue)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-sm">ROI Estimado</span>
                                            <span className="font-medium text-green-600">
                                                {Math.round(
                                                    ((lot.potentialValue - lot.price) / lot.price) * 100
                                                )}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <Link
                                            to={`/developer/lots/${lot.id}`}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Ver Detalles
                                        </Link>
                                        <Link
                                            to={`/developer/analysis/${lot.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Análisis
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : null
                    )
                ) : (
                    <div className="col-span-2 bg-white p-6 rounded-lg shadow text-center">
                        <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <p className="text-gray-500 mb-3">No tienes lotes favoritos aún.</p>
                        <Link
                            to="/developer/search"
                            className="text-indigo-600 hover:text-indigo-900"
                        >
                            Buscar lotes disponibles
                        </Link>
                    </div>
                )}
            </div>

            {favoriteLots && favoriteLots.length > 0 && (
                <div className="text-center">
                    <Link
                        to="/developer/favorites"
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
                    >
                        Ver Todos mis Favoritos
                    </Link>
                </div>
            )}
        </div>
    );
}