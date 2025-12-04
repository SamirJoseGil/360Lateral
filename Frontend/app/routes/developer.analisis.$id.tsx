import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { requireUser } from "~/utils/auth.server";
import { getFavoriteLotes } from "~/services/lotes.server"; // ✅ CORRECTO: Importar getFavoriteLotes

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== 'developer') {
        throw new Response("No autorizado", { status: 403 });
    }

    const favoriteId = params.id;
    if (!favoriteId) {
        throw new Response("ID de favorito no proporcionado", { status: 400 });
    }

    try {
        // ✅ CORRECCIÓN: Obtener TODOS los favoritos y filtrar por ID
        const { favorites, headers } = await getFavoriteLotes(request);
        
        // Buscar el favorito específico por ID
        const favorite = favorites.find((fav: any) => fav.id.toString() === favoriteId);
        
        if (!favorite) {
            console.error(`[developer.analisis.$id] Favorite ${favoriteId} not found`);
            throw new Response("Lote favorito no encontrado", { status: 404 });
        }

        const lote = favorite.lote_details || favorite.lote || {};
        
        console.log(`[developer.analisis.$id] Loaded favorite ${favoriteId}, CBML: ${lote.cbml}`);

        // Retornar datos del lote (sin consultar MapGIS automáticamente)
        return json({
            user,
            favorite,
            lote,
            mapgisData: null,
            error: null
        }, { headers });

    } catch (error) {
        console.error("[developer.analisis.$id] Error:", error);
        return json({
            user,
            favorite: null,
            lote: null,
            mapgisData: null,
            error: error instanceof Error ? error.message : "Error cargando análisis"
        });
    }
}

export default function AnalyzeFavoriteLot() {
    const { user, favorite, lote, error } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    
    const [mapgisData, setMapgisData] = useState<any>(null);
    const [isLoadingMapGIS, setIsLoadingMapGIS] = useState(false);
    const [mapgisError, setMapgisError] = useState<string | null>(null);

    const isLoading = navigation.state === "loading";

    const handleConsultarMapGIS = async () => {
        if (!lote?.cbml) {
            setMapgisError("Este lote no tiene un CBML asignado.");
            return;
        }

        setIsLoadingMapGIS(true);
        setMapgisError(null);

        try {
            const response = await fetch(`/api/mapgis/${lote.cbml}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ 
                    error: 'Error desconocido' 
                }));
                
                if (response.status === 404) {
                    throw new Error(
                        errorData.mensaje || 
                        'No se encontró información para este CBML en MapGIS.'
                    );
                }
                
                if (response.status === 500) {
                    throw new Error(
                        'Error al consultar MapGIS. El servicio puede estar temporalmente no disponible.'
                    );
                }
                
                throw new Error(errorData.mensaje || errorData.error || `Error ${response.status} al consultar MapGIS`);
            }

            const data = await response.json();
            
            // Verificar que hay datos reales
            const hasDatos = (
                data.clasificacion_suelo || 
                data.uso_suelo || 
                data.aprovechamiento_urbano ||
                data.restricciones_ambientales
            );
            
            if (!data || !hasDatos) {
                throw new Error('No se obtuvieron datos válidos de MapGIS.');
            }
            
            console.log('[MapGIS] Datos recibidos:', data);
            setMapgisData(data);
        } catch (err) {
            console.error('[MapGIS] Error:', err);
            setMapgisError(err instanceof Error ? err.message : "Error al consultar MapGIS");
        } finally {
            setIsLoadingMapGIS(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del lote...</p>
                </div>
            </div>
        );
    }

    if (error || !lote) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Link
                    to="/developer/analisis"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a Análisis
                </Link>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Breadcrumbs */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                        <Link to="/developer" className="text-gray-700 hover:text-indigo-600">
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <Link to="/developer/analisis" className="ml-1 text-gray-700 hover:text-indigo-600">
                                Análisis
                            </Link>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-1 text-gray-500">Detalle</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Análisis MapGIS
                </h1>
                <p className="text-gray-600">
                    Información urbanística de {lote.nombre || 'Lote'}
                </p>
            </div>

            {/* Información del Lote */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Información Básica
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Nombre</p>
                        <p className="font-semibold">{lote.nombre || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Dirección</p>
                        <p className="font-semibold">{lote.direccion || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">CBML</p>
                        <p className="font-mono font-semibold text-indigo-600">{lote.cbml || 'No disponible'}</p>
                    </div>
                </div>

                {/* ✅ CORREGIDO: Botón si tiene CBML (sin validaciones) */}
                {lote.cbml && !mapgisData && (
                    <div className="mt-6">
                        <button
                            onClick={handleConsultarMapGIS}
                            disabled={isLoadingMapGIS}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoadingMapGIS ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Consultando MapGIS...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    Consultar MapGIS por CBML
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* ✅ CORREGIDO: Alerta solo si NO tiene CBML */}
                {!lote.cbml && (
                    <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                        <div className="flex">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">CBML No Disponible</h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Este lote no tiene un CBML asignado. Contacta al propietario para agregarlo.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error de MapGIS */}
                {mapgisError && (
                    <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex">
                            <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error al consultar MapGIS</h3>
                                <p className="text-sm text-red-700 mt-1">{mapgisError}</p>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={handleConsultarMapGIS}
                                        className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                                    >
                                        Reintentar
                                    </button>
                                    <Link
                                        to="/developer/analisis"
                                        className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                                    >
                                        Volver a la lista
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ✅ MEJORADO: Mostrar TODOS los datos de MapGIS */}
            {mapgisData && (
                <div className="space-y-6">
                    {/* 📊 Clasificación del Suelo */}
                    {mapgisData.clasificacion_suelo && (
                        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-900">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Clasificación del Suelo
                            </h2>
                            <div className={`p-6 rounded-lg text-center ${
                                mapgisData.es_urbano 
                                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300' 
                                    : 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300'
                            }`}>
                                <p className="text-3xl font-bold mb-2" style={{ color: mapgisData.es_urbano ? '#059669' : '#d97706' }}>
                                    {mapgisData.clasificacion_suelo}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {mapgisData.es_urbano 
                                        ? '✅ Suelo urbanizable - Apto para desarrollo' 
                                        : '⚠️ Suelo rural - Restricciones aplican'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 🏗️ Uso del Suelo */}
                    {mapgisData.uso_suelo && (
                        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-900">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Uso del Suelo
                            </h2>
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Categoría */}
                                    {mapgisData.uso_suelo.categoria_uso && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-sm text-gray-600 mb-2">Categoría de Uso</p>
                                            <p className="text-lg font-bold text-purple-900">
                                                {mapgisData.uso_suelo.categoria_uso}
                                            </p>
                                        </div>
                                    )}

                                    {/* Subcategoría */}
                                    {mapgisData.uso_suelo.subcategoria_uso && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-sm text-gray-600 mb-2">Subcategoría</p>
                                            <p className="text-lg font-bold text-purple-900">
                                                {mapgisData.uso_suelo.subcategoria_uso}
                                            </p>
                                        </div>
                                    )}

                                    {/* Código */}
                                    {mapgisData.uso_suelo.codigo_subcategoria && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-sm text-gray-600 mb-2">Código</p>
                                            <p className="text-lg font-mono font-bold text-purple-900">
                                                {mapgisData.uso_suelo.codigo_subcategoria}
                                            </p>
                                        </div>
                                    )}

                                    {/* Porcentaje */}
                                    {mapgisData.uso_suelo.porcentaje && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm">
                                            <p className="text-sm text-gray-600 mb-2">Porcentaje del Lote</p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(parseFloat(mapgisData.uso_suelo.porcentaje) || 0, 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-lg font-bold text-purple-900">
                                                    {parseFloat(mapgisData.uso_suelo.porcentaje).toFixed(2)}%
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🏢 Aprovechamiento Urbano */}
                    {mapgisData.aprovechamiento_urbano && (
                        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-orange-900">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Aprovechamiento Urbano
                            </h2>
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6">
                                {/* Tratamiento Principal */}
                                {mapgisData.aprovechamiento_urbano.tratamiento && (
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg p-4 mb-6 shadow-lg">
                                        <p className="text-sm opacity-90 mb-1">Tratamiento Urbanístico</p>
                                        <p className="text-2xl font-bold">
                                            {mapgisData.aprovechamiento_urbano.tratamiento}
                                        </p>
                                        {mapgisData.aprovechamiento_urbano.codigo_tratamiento && (
                                            <p className="text-sm opacity-90 mt-1 font-mono">
                                                Código: {mapgisData.aprovechamiento_urbano.codigo_tratamiento}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Grid de Métricas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Densidad Habitacional */}
                                    {mapgisData.aprovechamiento_urbano.densidad_habitacional_max && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-orange-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <p className="text-xs text-gray-600 font-medium">Densidad Máx.</p>
                                            </div>
                                            <p className="text-2xl font-bold text-orange-900">
                                                {mapgisData.aprovechamiento_urbano.densidad_habitacional_max}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Viviendas/hectárea</p>
                                        </div>
                                    )}

                                    {/* Índice de Construcción */}
                                    {mapgisData.aprovechamiento_urbano.indice_construccion_max && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-orange-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                                </svg>
                                                <p className="text-xs text-gray-600 font-medium">Índice Construcción</p>
                                            </div>
                                            <p className="text-2xl font-bold text-orange-900">
                                                {mapgisData.aprovechamiento_urbano.indice_construccion_max}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">IC Máximo</p>
                                        </div>
                                    )}

                                    {/* Altura Normativa */}
                                    {mapgisData.aprovechamiento_urbano.altura_normativa && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-orange-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                </svg>
                                                <p className="text-xs text-gray-600 font-medium">Altura Normativa</p>
                                            </div>
                                            <p className="text-2xl font-bold text-orange-900">
                                                {mapgisData.aprovechamiento_urbano.altura_normativa}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Altura permitida</p>
                                        </div>
                                    )}

                                    {/* Identificador */}
                                    {mapgisData.aprovechamiento_urbano.identificador && (
                                        <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-orange-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                <p className="text-xs text-gray-600 font-medium">ID Tratamiento</p>
                                            </div>
                                            <p className="text-2xl font-bold text-orange-900 font-mono">
                                                {mapgisData.aprovechamiento_urbano.identificador}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Identificador único</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ⚠️ Restricciones Ambientales */}
                    {mapgisData.restricciones_ambientales && (
                        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-900">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Restricciones Ambientales
                            </h2>

                            <div className="space-y-4">
                                {/* Amenaza/Riesgo */}
                                {mapgisData.restricciones_ambientales.amenaza_riesgo && (
                                    <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-2 border-red-200 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-600 mb-1">Amenaza y Riesgo</p>
                                                <p className="text-lg font-bold text-red-900">
                                                    {mapgisData.restricciones_ambientales.amenaza_riesgo}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Retiros a Ríos */}
                                {mapgisData.restricciones_ambientales.retiros_rios && (
                                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-600 mb-1">Retiros a Ríos/Quebradas</p>
                                                <p className={`text-lg font-bold ${
                                                    mapgisData.restricciones_ambientales.retiros_rios === "Sin restricciones"
                                                        ? 'text-green-700'
                                                        : 'text-blue-900'
                                                }`}>
                                                    {mapgisData.restricciones_ambientales.retiros_rios}
                                                </p>
                                                {mapgisData.restricciones_ambientales.retiros_rios === "Sin restricciones" && (
                                                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        No requiere retiros especiales
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Info adicional */}
                                {!mapgisData.restricciones_ambientales.amenaza_riesgo && 
                                 !mapgisData.restricciones_ambientales.retiros_rios && (
                                    <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200 text-center">
                                        <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-semibold text-green-900">
                                            ✅ Sin restricciones ambientales reportadas
                                        </p>
                                        <p className="text-sm text-green-700 mt-1">
                                            El lote no presenta restricciones ambientales significativas
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 📌 Información de Fuente y Fecha */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border-2 border-gray-300 shadow-sm">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Fuente de Datos</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {mapgisData.fuente || 'MapGIS Medellín'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm text-gray-600">Fecha de Consulta</p>
                                    <p className="font-medium text-gray-900">
                                        {mapgisData.fecha_consulta 
                                            ? new Date(mapgisData.fecha_consulta).toLocaleString('es-CO', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : new Date().toLocaleString('es-CO', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* CBML Badge */}
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">CBML Consultado:</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-mono font-semibold text-sm">
                                    {lote.cbml}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón de Volver */}
            <div className="mt-8 flex justify-center gap-3">
                <Link
                    to="/developer/analisis"
                    className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-lg"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a Lista
                </Link>
                <Link
                    to="/developer/favorites"
                    className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Ver Favoritos
                </Link>
            </div>
        </div>
    );
}
