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
                user_id: user?.id
            }
        });

        // Obtener la actividad del usuario de forma paralela
        const [activityResponse, favoritesResponse] = await Promise.allSettled([
            getUserActivity(request, 30),
            getFavoriteLotes(request)
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
        <div className="py-16">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">Panel de Desarrollador</h1>
                <p className="text-gray-600 mt-2">
                    Bienvenido, {user?.name ?? "Usuario"}. Encuentra tu próxima oportunidad de desarrollo.
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
            </div>
        </div>
    );
}