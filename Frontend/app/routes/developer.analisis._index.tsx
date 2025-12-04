import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";
import { getFavoriteLotes } from "~/services/lotes.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== 'developer') {
        throw new Response("No autorizado", { status: 403 });
    }

    try {
        const { favorites, count, headers } = await getFavoriteLotes(request);
        
        console.log(`[developer.analisis] Loaded ${count} favorites from API`);
        
        // ✅ CORREGIDO: Filtrar solo los que tienen CBML (sin validar formato)
        const analyzableLots = favorites.filter((fav: any) => {
            const lote = fav.lote_details || fav.lote || {};
            return !!lote.cbml;  // Solo verificar que existe
        });

        console.log(`[developer.analisis] Found ${analyzableLots.length} with CBML`);

        return json({
            user,
            analyzableLots,
            totalFavorites: count
        }, { headers });

    } catch (error) {
        console.error("[developer.analisis] Error:", error);
        return json({
            user,
            analyzableLots: [],
            totalFavorites: 0,
            error: error instanceof Error ? error.message : "Error cargando análisis"
        });
    }
}

export default function DeveloperAnalisisList() {
    const { user, analyzableLots, totalFavorites, error } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Filtros
    const searchQuery = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort') || 'recent';

    // Aplicar filtros
    const filteredLots = analyzableLots.filter((fav: any) => {
        const lote = fav.lote_details || fav.lote || {};
        const searchLower = searchQuery.toLowerCase();
        
        return (
            lote.nombre?.toLowerCase().includes(searchLower) ||
            lote.direccion?.toLowerCase().includes(searchLower) ||
            lote.cbml?.includes(searchQuery) ||
            lote.barrio?.toLowerCase().includes(searchLower)
        );
    });

    // Aplicar ordenamiento
    const sortedLots = [...filteredLots].sort((a, b) => {
        const loteA = a.lote_details || a.lote || {};
        const loteB = b.lote_details || b.lote || {};
        
        switch (sortBy) {
            case 'recent':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'name':
                return (loteA.nombre || '').localeCompare(loteB.nombre || '');
            case 'area':
                return (loteB.area || 0) - (loteA.area || 0);
            default:
                return 0;
        }
    });

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Análisis MapGIS</h1>
                        <p className="text-gray-600 mt-1">
                            Gestiona y consulta los análisis urbanísticos de tus lotes favoritos
                        </p>
                    </div>
                    <Link
                        to="/developer/favorites"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Ver Favoritos
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Favoritos</p>
                                <p className="text-3xl font-bold">{totalFavorites}</p>
                            </div>
                            <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Con CBML Válido (11 dígitos)</p>
                                <p className="text-3xl font-bold">{analyzableLots.length}</p>
                            </div>
                            <svg className="w-12 h-12 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Resultados</p>
                                <p className="text-3xl font-bold">{filteredLots.length}</p>
                            </div>
                            <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Búsqueda */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar Lote
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    const params = new URLSearchParams(searchParams);
                                    if (e.target.value) {
                                        params.set('search', e.target.value);
                                    } else {
                                        params.delete('search');
                                    }
                                    setSearchParams(params);
                                }}
                                className="pl-10 w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all"
                                placeholder="Buscar por nombre, dirección, barrio o CBML..."
                            />
                        </div>
                    </div>

                    {/* Ordenamiento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ordenar por
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                const params = new URLSearchParams(searchParams);
                                params.set('sort', e.target.value);
                                setSearchParams(params);
                            }}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all"
                        >
                            <option value="recent">Más Reciente</option>
                            <option value="name">Nombre (A-Z)</option>
                            <option value="area">Área (Mayor a Menor)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Lotes */}
            {sortedLots.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                        {searchQuery ? 'No se encontraron resultados' : 'No tienes lotes para analizar'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {searchQuery 
                            ? 'Intenta con otros términos de búsqueda' 
                            : 'Agrega lotes a favoritos con CBML válido (11 dígitos) para poder analizarlos'
                        }
                    </p>
                    <div className="mt-6">
                        <Link
                            to="/developer/favorites"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Ver Favoritos
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedLots.map((fav: any) => {
                        const lote = fav.lote_details || fav.lote || {};
                        
                        return (
                            <div key={fav.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-2 border-transparent hover:border-green-200">
                                <div className="p-6">
                                    {/* Header con badge CBML */}
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                                            {lote.nombre || 'Lote sin nombre'}
                                        </h3>
                                        <span className="px-2 py-1 text-xs font-mono bg-green-100 text-green-800 rounded whitespace-nowrap">
                                            {lote.cbml}
                                        </span>
                                    </div>

                                    {/* Información del lote */}
                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <p className="flex items-start">
                                            <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="flex-1">{lote.direccion || 'Dirección no disponible'}</span>
                                        </p>

                                        {lote.area && (
                                            <p className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                                                </svg>
                                                {lote.area.toLocaleString()} m²
                                            </p>
                                        )}

                                        {lote.barrio && (
                                            <p className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                {lote.barrio}
                                            </p>
                                        )}
                                    </div>

                                    {/* Fecha de agregado */}
                                    <p className="text-xs text-gray-500 mb-4 flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Agregado el {new Date(fav.created_at).toLocaleDateString('es-CO', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>

                                    {/* Botón de análisis */}
                                    <Link
                                        to={`/developer/analisis/${fav.id}`}
                                        className="block w-full text-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        Analizar con MapGIS
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
