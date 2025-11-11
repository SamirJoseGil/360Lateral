import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUser } from "~/utils/auth.server";
import { getFavoriteLotes } from "~/services/lotes.server";
import { recordEvent } from "~/services/stats.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);

    if (!user || user.role !== 'developer') {
        throw new Response("No autorizado", { status: 403 });
    }

    try {
        // ✅ Registrar evento - con manejo de error
        try {
            await recordEvent(request, {
                type: "view",
                name: "developer_favorites",
                value: { user_id: user.id }
            });
        } catch (eventError) {
            console.warn("[Favorites] No se pudo registrar el evento:", eventError);
        }

        console.log("[Favorites] Fetching favorite lotes for user:", user.email);

        const { favorites, count, headers } = await getFavoriteLotes(request);

        console.log(`[Favorites] ✅ Loaded ${count} favorites`);

        return json({
            favorites,
            count,
            error: null
        }, { headers });

    } catch (error) {
        console.error("[Favorites] ❌ Error loading favorites:", error);

        // ✅ Retornar datos vacíos en lugar de error
        return json({
            favorites: [],
            count: 0,
            error: error instanceof Error ? error.message : "Error al cargar favoritos"
        });
    }
}

export default function DeveloperFavorites() {
    const { favorites, count, error } = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mis Favoritos</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        {count > 0 ? `Tienes ${count} lote${count !== 1 ? 's' : ''} guardado${count !== 1 ? 's' : ''}` : 'No tienes lotes guardados'}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
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

                {/* Lista de favoritos */}
                {favorites && favorites.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {favorites.map((favorite: any) => {
                            // ✅ Acceder correctamente a los datos del lote
                            const lote = favorite.lote_details || favorite.lote || {};
                            const loteId = lote.id || favorite.lote;

                            return (
                                <div key={favorite.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {lote.nombre || 'Lote sin nombre'}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                </svg>
                                                Favorito
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                                            <p className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {lote.direccion || 'Dirección no disponible'}
                                            </p>

                                            {lote.area && (
                                                <p className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                                                    </svg>
                                                    {lote.area.toLocaleString()} m²
                                                </p>
                                            )}

                                            {lote.barrio && (
                                                <p className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    {lote.barrio}
                                                </p>
                                            )}
                                        </div>

                                        {favorite.notas && (
                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 mb-1">Notas:</p>
                                                <p className="text-sm text-gray-700">{favorite.notas}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Link
                                                to={`/developer/lots/${loteId}`}
                                                className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                Ver Detalles
                                            </Link>
                                            {/* <Link
                                                to={`/developer/analysis/${loteId}`}
                                                className="flex-1 text-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Análisis
                                            </Link> */}
                                        </div>
                                    </div>

                                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">
                                            Agregado el {new Date(favorite.created_at).toLocaleDateString('es-CO')}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes favoritos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Comienza agregando lotes a tu lista de favoritos
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/developer/search"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Buscar Lotes
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
