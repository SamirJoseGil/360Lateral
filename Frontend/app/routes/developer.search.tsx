import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, Link, useSearchParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getUser } from "~/utils/auth.server";
import { searchLotes, addLoteToFavorites, removeLoteFromFavorites, getAllLotes, getMisLotes, getAvailableLotes } from "~/services/lotes.server";
import { getNormativaPorCBML } from "~/services/pot.server";
import POTInfo from "~/components/POTInfo";
import { API_URL } from "~/utils/env.server";
import { fetchWithAuth } from "~/utils/auth.server";
import { StaticMapPreview } from "~/components/MapView";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "developer") {
        return redirect(user ? `/${user.role}` : "/login");
    }

    // ✅ CORREGIDO: Obtener parámetros de búsqueda
    const url = new URL(request.url);
    const ciudad = url.searchParams.get('ciudad');
    const uso = url.searchParams.get('uso');
    const areaMin = url.searchParams.get('area_min');
    const areaMax = url.searchParams.get('area_max');
    const matchProfile = url.searchParams.get('match_profile') === 'true';
    
    try {
        // ✅ CORREGIDO: Usar endpoint correcto con filtros
        const searchUrl = new URL(`${API_URL}/api/lotes/available/`);
        
        // ✅ CRÍTICO: Agregar parámetros de filtro
        if (ciudad) searchUrl.searchParams.set('ciudad', ciudad);
        if (uso) searchUrl.searchParams.set('uso_suelo', uso);
        if (areaMin) searchUrl.searchParams.set('area_min', areaMin);
        if (areaMax) searchUrl.searchParams.set('area_max', areaMax);
        if (matchProfile) searchUrl.searchParams.set('match_profile', 'true');
        
        // ✅ CRÍTICO: Forzar solo lotes activos y verificados
        searchUrl.searchParams.set('status', 'active');
        searchUrl.searchParams.set('is_verified', 'true');
        
        console.log('[developer.search] Fetching lotes from:', searchUrl.toString());
        
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            searchUrl.toString()
        );
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('[developer.search] Error fetching lotes:', res.status, errorText);
            throw new Error(`Error fetching lotes: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('[developer.search] Response data:', {
            count: data.count,
            lotesLength: data.results?.length || data.lotes?.length || 0
        });
        
        // ✅ CORREGIDO: Manejar diferentes estructuras de respuesta
        const lotes = data.results || data.lotes || [];
        
        // ✅ LOGGING: Ver qué lotes se obtuvieron
        console.log('[developer.search] Lotes obtenidos:', lotes.length);
        if (lotes.length > 0) {
            console.log('[developer.search] Primer lote:', {
                id: lotes[0].id,
                nombre: lotes[0].nombre,
                ciudad: lotes[0].ciudad,
                status: lotes[0].status,
                is_verified: lotes[0].is_verified
            });
        }
        
        // Obtener ciudades disponibles
        const ciudadesRes = await fetch(`${API_URL}/api/users/ciudades/`);
        const ciudadesData = ciudadesRes.ok ? await ciudadesRes.json() : { data: [] };
        
        return json({
            user,
            lotes,
            ciudades: ciudadesData.data || [],
            filters: { ciudad, uso, areaMin, areaMax, matchProfile }
        }, { headers: setCookieHeaders });
        
    } catch (error) {
        console.error("[developer.search] Error loading search:", error);
        return json({
            user,
            lotes: [],
            ciudades: [],
            filters: {},
            error: error instanceof Error ? error.message : "Error cargando búsqueda"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea developer
    const user = await getUser(request);
    if (!user || user.role !== "developer") {
        return redirect("/");
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;
    const loteId = formData.get("loteId") as string;

    try {
        switch (action) {
            case "add_favorite": {
                const result = await addLoteToFavorites(request, loteId);
                return json({
                    success: true,
                    message: "Lote agregado a favoritos",
                    isFavorite: true,
                    loteId
                }, {
                    headers: result.headers
                });
            }

            case "remove_favorite": {
                const result = await removeLoteFromFavorites(request, loteId);
                return json({
                    success: true,
                    message: "Lote removido de favoritos",
                    isFavorite: false,
                    loteId
                }, {
                    headers: result.headers
                });
            }

            default:
                return json({
                    success: false,
                    message: "Acción no válida"
                });
        }
    } catch (error) {
        console.error(`Error en acción ${action}:`, error);
        return json({
            success: false,
            message: `Error al ${action === "add_favorite" ? "agregar" : "remover"} favorito`
        });
    }
}

export default function DeveloperSearch() {
    const { user, lotes, ciudades, filters, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const [selectedLote, setSelectedLote] = useState<any>(null);
    const [showPOTModal, setShowPOTModal] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const isSearching = navigation.state === "loading";

    // Función para abrir modal de información POT
    const openPOTModal = (lote: any) => {
        setSelectedLote(lote);
        setShowPOTModal(true);
    };

    // Funciones para manejar filtros
    const handleSearchParamsChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params;
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Aquí puedes manejar el envío del formulario si es necesario
    };

    // Función para formatear filtros activos
    const getActiveFilters = () => {
        const active = [];
        if (filters.q) active.push(`Búsqueda: "${filters.q}"`);
        if (filters.area_min || filters.area_max) {
            active.push(`Área: ${filters.area_min || "0"} - ${filters.area_max || "∞"} m²`);
        }
        if (filters.estrato) active.push(`Estrato: ${filters.estrato}`);
        if (filters.zona) active.push(`Zona: ${filters.zona}`);
        if (filters.tratamiento_pot) active.push(`Tratamiento: ${filters.tratamiento_pot}`);
        return active;
    };

    // Opciones de usos de suelo
    const usosDisponibles = [
        { value: 'residencial', label: 'Residencial', icon: '🏠' },
        { value: 'comercial', label: 'Comercial', icon: '🏢' },
        { value: 'industrial', label: 'Industrial', icon: '🏭' },
        { value: 'logistico', label: 'Logístico', icon: '📦' },
        { value: 'mixto', label: 'Mixto', icon: '🏘️' },
    ];
    
    // ✅ NUEVO: Log para debugging en consola del navegador
    useEffect(() => {
        console.log('[developer.search] Component data:', {
            lotesCount: lotes?.length || 0,
            ciudadesCount: ciudades?.length || 0,
            filters,
            error
        });
    }, [lotes, ciudades, filters, error]);
    
    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header con botón de perfil */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Buscar Lotes</h1>
                    <p className="text-gray-600 mt-2">
                        Encuentra el lote perfecto para tu próximo desarrollo
                    </p>
                </div>
                <Link
                    to="/developer/profile"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mi Perfil
                </Link>
            </div>
            
            {/* ✅ NUEVO: Mostrar error si existe */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                </div>
            )}
            
            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <Form method="get" className="space-y-6" onSubmit={handleSubmit}>                    
                    {/* Filtros básicos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Ciudad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ciudad
                            </label>
                            <select
                                name="ciudad"
                                defaultValue={filters.ciudad || ''}
                                onChange={handleSearchParamsChange}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">Todas las ciudades</option>
                                {ciudades.map((ciudad: any) => (
                                    <option key={ciudad.id} value={ciudad.nombre}>
                                        {ciudad.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Uso de suelo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Uso de Suelo
                            </label>
                            <select
                                name="uso"
                                defaultValue={filters.uso || ''}
                                onChange={handleSearchParamsChange}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">Todos los usos</option>
                                {usosDisponibles.map((uso) => (
                                    <option key={uso.value} value={uso.value}>
                                        {uso.icon} {uso.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Botón de búsqueda */}
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Buscar
                            </button>
                        </div>
                    </div>
                    
                    {/* Filtros avanzados (colapsables) */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                        >
                            {showAdvanced ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Ocultar filtros avanzados
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Mostrar filtros avanzados
                                </>
                            )}
                        </button>
                        
                        {showAdvanced && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Área mínima */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Área Mínima (m²)
                                    </label>
                                    <input
                                        type="number"
                                        name="area_min"
                                        defaultValue={filters.areaMin || ''}
                                        placeholder="Ej: 500"
                                        onChange={handleSearchParamsChange}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                
                                {/* Área máxima */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Área Máxima (m²)
                                    </label>
                                    <input
                                        type="number"
                                        name="area_max"
                                        defaultValue={filters.areaMax || ''}
                                        placeholder="Ej: 2000"
                                        onChange={handleSearchParamsChange}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Form>
            </div>
            
            {/* Resultados */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Resultados ({lotes?.length || 0} lotes disponibles)
                    </h2>
                    
                    {/* ✅ NUEVO: Botón para limpiar filtros */}
                    {(filters.ciudad || filters.uso || filters.areaMin || filters.areaMax) && (
                        <Link
                            to="/developer/search"
                            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar filtros
                        </Link>
                    )}
                </div>
                
                {/* ✅ MEJORADO: Mensaje cuando no hay lotes */}
                {!lotes || lotes.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            {filters.ciudad || filters.uso || filters.areaMin || filters.areaMax
                                ? 'No se encontraron lotes con estos filtros'
                                : 'No hay lotes disponibles en este momento'
                            }
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filters.ciudad || filters.uso || filters.areaMin || filters.areaMax
                                ? 'Intenta ajustar los filtros de búsqueda'
                                : 'Vuelve pronto para ver nuevas oportunidades'
                            }
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            {(filters.ciudad || filters.uso || filters.areaMin || filters.areaMax) && (
                                <Link
                                    to="/developer/search"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Ver todos los lotes
                                </Link>
                            )}
                            <Link
                                to="/developer/profile"
                                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Actualizar mi perfil
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lotes.map((lote: any) => (
                            <Link
                                key={lote.id}
                                to={`/developer/lots/${lote.id}`}
                                className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-200 overflow-hidden group"
                            >
                                {/* ✅ NUEVO: Preview de mapa */}
                                <div className="relative h-48 bg-gray-100">
                                    <StaticMapPreview
                                        latitud={lote.latitud}
                                        longitud={lote.longitud}
                                        width={400}
                                        height={192}
                                        zoom={14}
                                    />
                                    {/* Overlay con nombre */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                        <h3 className="text-lg font-bold text-white">{lote.nombre}</h3>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Header con match score si aplica */}
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {lote.nombre || `Lote ${lote.cbml}`}
                                        </h3>
                                        {lote.match_score && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span>Uso: {lote.uso_suelo}</span>
                                                <span>{lote.match_score}% match</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Información del lote */}
                                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                        <div className="space-y-2 text-sm text-gray-600">
                                            {/* Ciudad */}
                                            {lote.ciudad && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                                    </svg>
                                                    <span className="font-medium">{lote.ciudad}</span>
                                                </div>
                                            )}
                                            {/* Dirección */}
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>{lote.direccion}</span>
                                            </div>
                                            {/* Valor */}
                                            {lote.valor && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-semibold text-green-600">
                                                        {new Intl.NumberFormat('es-CO', {
                                                            style: 'currency',
                                                            currency: 'COP',
                                                            notation: 'compact',
                                                            minimumFractionDigits: 0,
                                                        }).format(lote.valor)}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Uso de suelo */}
                                            {lote.uso_suelo && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-medium">{lote.uso_suelo}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botón ver normativa POT */}
                                        <button
                                            type="button"
                                            className="ml-4 px-3 py-2 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors text-xs font-semibold"
                                            onClick={e => {
                                                e.preventDefault();
                                                setSelectedLote(lote);
                                                setShowPOTModal(true);
                                            }}
                                        >
                                            Ver Normativa POT
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Modal POT Info */}
                {showPOTModal && selectedLote && selectedLote.potData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-4 border-b flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Normativa POT - {selectedLote.nombre}
                                    </h3>
                                    <p className="text-sm text-gray-500">{selectedLote.direccion}</p>
                                </div>
                                <button
                                    onClick={() => setShowPOTModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <POTInfo
                                    potData={selectedLote.potData}
                                    showMapGisData={true}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}