import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser, isRedirectLoop, getAccessTokenFromCookies } from "~/utils/auth.server";
import { getUserActivity, recordEvent } from "~/services/stats.server";

// Tipos para los datos
type SearchCriteria = {
    name: string;
    location: string;
    minArea: number;
    maxArea: number;
    budget: number;
    treatment: string;
};

type FavoriteLot = {
    id: string;
    address: string;
    area: number;
    price: number;
    potentialValue: number;
};

export async function loader({ request }: LoaderFunctionArgs) {
    // Si detectamos un bucle de redirección, enviamos al usuario al inicio
    if (isRedirectLoop(request)) {
        console.warn("Detected redirect loop in developer dashboard. Breaking loop.");
        return redirect("/");
    }

    // Verificar que el usuario esté autenticado y sea desarrollador
    const user = await getUser(request);
    if (!user) {
        console.log("Developer dashboard: No user found, redirecting to homepage");
        return redirect("/");
    }

    // Solo redirigimos si el usuario no es desarrollador
    if (user.role !== "developer") {
        console.log(`Non-developer user trying to access developer dashboard: ${user.role}`);
        // Usar redirección simple
        const url = new URL(request.url);
        url.searchParams.set("_rc", "1"); // Añadir contador de redirecciones manualmente
        return redirect(`/${user.role}`);
    }

    // Registrar evento de visita al dashboard
    await recordEvent(request, {
        type: "view",
        name: "developer_dashboard",
        value: {
            user_id: user.id
        }
    });

    try {
        // Obtener la actividad del usuario
        const { activity, headers } = await getUserActivity(request, 30);

        // Si el usuario es desarrollador, devolvemos sus datos junto con datos de ejemplo
        const token = await getAccessTokenFromCookies(request);

        // Datos de ejemplo para el dashboard, enriquecidos con estadísticas reales
        const searchCriteria = [
            { id: 1, name: "Criterio residencial", area: "300-500", zone: "Norte", budget: "200M-400M", treatment: "Residencial" },
            { id: 2, name: "Criterio comercial", area: "400-800", zone: "Centro", budget: "500M-800M", treatment: "Comercial" }
        ];

        const favoriteLots = [
            { id: 1, name: "Lote Residencial Norte", area: 350, price: 320000000, address: "Calle 123 #45-67", owner: "Juan Pérez", potentialValue: 400000000 },
            { id: 2, name: "Lote Comercial Centro", area: 520, price: 650000000, address: "Carrera 7 #25-30", owner: "Inversiones XYZ", potentialValue: 800000000 },
            { id: 3, name: "Lote Mixto Oeste", area: 420, price: 480000000, address: "Avenida 80 #65-43", owner: "María Rodríguez", potentialValue: 600000000 }
        ];

        // Utilizar datos reales de la API para estadísticas
        const stats = {
            searches: activity?.events_by_type?.search || 0,
            favorites: favoriteLots.length,
            offers: activity?.events_by_type?.action || 0,
            matches: 12,
            analyses: activity?.events_by_type?.view || 0,
            savedSearches: searchCriteria.length,
            contacts: activity?.events_by_type?.other || 0,
            totalEvents: activity?.total_events || 0
        };

        return json({
            user,
            token,
            searchCriteria,
            favoriteLots,
            stats,
            activity
        }, { headers });
    } catch (error) {
        console.error("Error cargando actividad del usuario:", error);

        // Datos de respaldo en caso de error
        const stats = {
            searches: 0,
            favorites: 0,
            offers: 0,
            matches: 0,
            analyses: 0,
            savedSearches: 0,
            contacts: 0
        };

        return json({
            user,
            token: await getAccessTokenFromCookies(request),
            searchCriteria: [],
            favoriteLots: [],
            stats
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
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">Panel de Desarrollador</h1>
                <p className="text-gray-600">
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
                    to="/lots/search"
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
                    to="/analisis-lote"
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
                    to="/favorites"
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

                <Link
                    to="/search-criteria"
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
                    <h3 className="font-semibold mb-1">Criterios de Búsqueda</h3>
                    <p className="text-gray-500 text-sm">Configura tu tesis de inversión</p>
                </Link>
            </div>

            {/* Mi Tesis de Inversión */}
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
                            {searchCriteria.map((criteria, index) => (
                                <tr key={index}>
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
                                            {formatCurrency(Number(criteria?.budget))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {criteria?.treatment}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link
                                            to={`/lots/search?criteria=${index}`}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Buscar
                                        </Link>
                                        <Link
                                            to={`/search-criteria/${index}/edit`}
                                            className="text-yellow-600 hover:text-yellow-900"
                                        >
                                            Editar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Lotes Favoritos */}
            <h2 className="text-xl font-bold mb-4">Lotes Favoritos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {favoriteLots.map((lot) => (
                    <div key={lot?.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-6">
                            <h3 className="font-bold text-lg mb-2">{lot?.address}</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <span className="text-gray-500 block text-sm">Área</span>
                                    <span className="font-medium">{lot?.area} m²</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-sm">Precio</span>
                                    <span className="font-medium">{formatCurrency(lot?.price ?? 0)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-sm">Valor Potencial</span>
                                    <span className="font-medium text-green-600">
                                        {formatCurrency(lot?.potentialValue ?? 0)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-sm">ROI Estimado</span>
                                    <span className="font-medium text-green-600">
                                        {Math.round(
                                            (((lot?.potentialValue ?? 0) - (lot?.price ?? 1)) / (lot?.price ?? 1)) * 100
                                        )}
                                        %
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <Link
                                    to={`/lots/${lot?.id}`}
                                    className="text-indigo-600 hover:text-indigo-900"
                                >
                                    Ver Detalles
                                </Link>
                                <Link
                                    to={`/analisis-lote/${lot?.id}`}
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    Análisis
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center">
                <Link
                    to="/favorites"
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
                >
                    Ver Todos mis Favoritos
                </Link>
            </div>
        </div>
    );
}
