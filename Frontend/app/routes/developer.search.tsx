import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { searchLotes, addLoteToFavorites, removeLoteFromFavorites, getAllLotes, getMisLotes, getAvailableLotes } from "~/services/lotes.server";
import { getNormativaPorCBML } from "~/services/pot.server";
import POTInfo from "~/components/POTInfo";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "developer") {
        return redirect(user ? `/${user.role}` : "/login");
    }

    const url = new URL(request.url);
    const searchParams = {
        search: url.searchParams.get("q") || "",
        area_min: url.searchParams.get("area_min") ? parseFloat(url.searchParams.get("area_min")!) : undefined,
        area_max: url.searchParams.get("area_max") ? parseFloat(url.searchParams.get("area_max")!) : undefined,
        estrato: url.searchParams.get("estrato") ? parseInt(url.searchParams.get("estrato")!) : undefined,
        barrio: url.searchParams.get("zona") || "",
        ordering: url.searchParams.get("ordering") || "-fecha_creacion",
        limit: parseInt(url.searchParams.get("page_size") || "12"),
        offset: (parseInt(url.searchParams.get("page") || "1") - 1) * parseInt(url.searchParams.get("page_size") || "12")
    };

    const hasFilters = searchParams.search ||
        searchParams.area_min !== undefined ||
        searchParams.area_max !== undefined ||
        searchParams.estrato !== undefined ||
        searchParams.barrio;

    try {
        console.log("[Developer Search] Obteniendo lotes disponibles", { hasFilters });

        // USAR ENDPOINT ESPECÍFICO PARA DEVELOPERS
        const searchResponse = await getAvailableLotes(request, searchParams);

        // Obtener información POT para cada lote
        const lotesConPOT = await Promise.all(
            (searchResponse.lotes || []).map(async (lote: any) => {
                let potData = null;

                if (lote.cbml) {
                    try {
                        const potResponse = await getNormativaPorCBML(request, lote.cbml);
                        potData = potResponse.normativa;
                    } catch (potError) {
                        console.error(`Error obteniendo POT para lote ${lote.id}:`, potError);
                    }
                }

                return {
                    ...lote,
                    potData
                };
            })
        );

        const currentPage = parseInt(url.searchParams.get("page") || "1");
        const pageSize = parseInt(url.searchParams.get("page_size") || "12");
        const totalCount = searchResponse.count || lotesConPOT.length;
        const totalPages = Math.ceil(totalCount / pageSize);

        return json({
            user,
            lotes: lotesConPOT,
            totalCount: totalCount,
            hasFilters,
            isInitialLoad: !hasFilters && currentPage === 1,
            pagination: {
                page: currentPage,
                totalPages,
                next: searchResponse.next ?? null,
                previous: searchResponse.previous ?? null
            },
            filters: {
                q: url.searchParams.get("q") || "",
                area_min: url.searchParams.get("area_min") || "",
                area_max: url.searchParams.get("area_max") || "",
                estrato: url.searchParams.get("estrato") || "",
                zona: url.searchParams.get("zona") || "",
                tratamiento_pot: url.searchParams.get("tratamiento_pot") || ""
            }
        }, {
            headers: searchResponse.headers
        });
    } catch (error) {
        console.error("Error en búsqueda de lotes:", error);
        return json({
            user,
            lotes: [],
            totalCount: 0,
            hasFilters,
            isInitialLoad: false,
            pagination: { page: 1, totalPages: 0, next: null, previous: null },
            filters: {
                q: "",
                area_min: "",
                area_max: "",
                estrato: "",
                zona: "",
                tratamiento_pot: ""
            },
            error: "Error al cargar los lotes disponibles. Por favor, intenta nuevamente."
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
                const result = await addLoteToFavorites(request, parseInt(loteId));
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
                const result = await removeLoteFromFavorites(request, parseInt(loteId));
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
    const loaderData = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const [selectedLote, setSelectedLote] = useState<any>(null);
    const [showPOTModal, setShowPOTModal] = useState(false);

    const isSearching = navigation.state === "loading";

    // Extraer datos del loader con manejo de errores
    const user = 'user' in loaderData ? loaderData.user : null;
    const lotes = 'lotes' in loaderData ? loaderData.lotes : [];
    const totalCount = 'totalCount' in loaderData ? loaderData.totalCount : 0;
    const hasFilters = 'hasFilters' in loaderData ? loaderData.hasFilters : false;
    const isInitialLoad = 'isInitialLoad' in loaderData ? loaderData.isInitialLoad : false;
    const pagination = 'pagination' in loaderData ? loaderData.pagination : { page: 1, totalPages: 0 };
    const filters = 'filters' in loaderData ? loaderData.filters : { q: "", area_min: "", area_max: "", estrato: "", zona: "", tratamiento_pot: "" };
    const error = 'error' in loaderData ? loaderData.error : null;

    // Función para abrir modal de información POT
    const openPOTModal = (lote: any) => {
        setSelectedLote(lote);
        setShowPOTModal(true);
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

    return (
        <div className="p-16">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Búsqueda de Lotes</h1>
                <p className="text-gray-600 mt-2">
                    {hasFilters
                        ? "Encuentra lotes disponibles según tus criterios de desarrollo"
                        : "Explora todos los lotes disponibles en el sistema"
                    }
                </p>
            </div>

            {/* Error message */}
            {error && typeof error === "string" && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Action result message */}
            {actionData?.message && (
                <div className={`mb-6 p-4 rounded-md ${actionData.success
                    ? "bg-green-50 border-l-4 border-green-400 text-green-700"
                    : "bg-red-50 border-l-4 border-red-400 text-red-700"
                    }`}>
                    {actionData.message}
                </div>
            )}

            {/* Basic Search Form */}
            <div className="mb-8 bg-white rounded-lg shadow p-6">
                <Form method="get" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Búsqueda general
                        </label>
                        <input
                            type="text"
                            name="q"
                            defaultValue={filters.q}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                            placeholder="Dirección, barrio, CBML..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Área mínima (m²)
                        </label>
                        <input
                            type="number"
                            name="area_min"
                            defaultValue={filters.area_min}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                            placeholder="100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Área máxima (m²)
                        </label>
                        <input
                            type="number"
                            name="area_max"
                            defaultValue={filters.area_max}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                            placeholder="1000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estrato
                        </label>
                        <select
                            name="estrato"
                            defaultValue={filters.estrato}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                        >
                            <option value="">Todos</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zona/Barrio
                        </label>
                        <input
                            type="text"
                            name="zona"
                            defaultValue={filters.zona}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                            placeholder="Poblado, Laureles..."
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            {hasFilters ? "Buscar" : "Filtrar"}
                        </button>
                    </div>
                </Form>

                {/* Mostrar filtros activos */}
                {hasFilters && getActiveFilters().length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-gray-600 mr-2">Filtros activos:</span>
                                {getActiveFilters().map((filter, index) => (
                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {filter}
                                    </span>
                                ))}
                            </div>
                            <a
                                href="/developer/search"
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Limpiar filtros
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* Results summary */}
            <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    {isSearching ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {hasFilters ? "Buscando..." : "Cargando lotes..."}
                        </span>
                    ) : (
                        <span>
                            {hasFilters
                                ? `Se encontraron ${totalCount.toLocaleString()} lotes que coinciden con tu búsqueda`
                                : isInitialLoad
                                    ? `Mostrando ${totalCount.toLocaleString()} lotes disponibles`
                                    : `${totalCount.toLocaleString()} lotes en total`
                            }
                        </span>
                    )}
                </div>

                <div className="text-sm text-gray-500">
                    {pagination.totalPages > 0 && `Página ${pagination.page} de ${pagination.totalPages}`}
                </div>
            </div>

            {/* Results grid */}
            {lotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {lotes.map((lote: any) => (
                        <div key={lote.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Basic lote info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">{lote.nombre}</h3>
                                <p className="text-gray-600 text-sm mb-2">{lote.direccion}</p>

                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                                    <div>Área: {lote.area ? `${lote.area.toLocaleString()} m²` : 'N/A'}</div>
                                    <div>Estrato: {lote.estrato || 'N/A'}</div>
                                    <div>CBML: {lote.cbml ? lote.cbml.substring(0, 10) + '...' : 'N/A'}</div>
                                    <div>Barrio: {lote.barrio || 'N/A'}</div>
                                </div>
                            </div>

                            {/* POT Info preview */}
                            {lote.potData && lote.potData.codigo_tratamiento && (
                                <div className="p-4 border-t bg-gray-50">
                                    <POTInfo
                                        potData={lote.potData}
                                        compact={true}
                                        showMapGisData={false}
                                    />
                                    <button
                                        onClick={() => openPOTModal(lote)}
                                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Ver normativa completa →
                                    </button>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="p-4 border-t flex justify-between items-center">
                                <Form method="post" className="inline">
                                    <input type="hidden" name="loteId" value={lote.id} />
                                    <input type="hidden" name="action" value="add_favorite" />
                                    <button
                                        type="submit"
                                        className="text-sm text-gray-600 hover:text-red-600"
                                    >
                                        ♥ Favorito
                                    </button>
                                </Form>

                                <a
                                    href={`/developer/lots/${lote.id}`}
                                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                    Ver detalles
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !isSearching && (
                    <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                            {hasFilters ? (
                                // Mensaje cuando hay filtros pero no resultados
                                <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron lotes</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        No hay lotes que coincidan con los filtros aplicados.
                                    </p>
                                    <div className="mt-6">
                                        <a
                                            href="/developer/search"
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Ver todos los lotes
                                        </a>
                                    </div>
                                </>
                            ) : (
                                // Mensaje cuando no hay filtros y no hay lotes en el sistema
                                <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay lotes disponibles</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Actualmente no hay lotes registrados en el sistema.
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Los propietarios pueden registrar nuevos lotes que aparecerán aquí.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        {pagination.page > 1 && (
                            <a
                                href={`?q=${filters.q}&area_min=${filters.area_min}&area_max=${filters.area_max}&estrato=${filters.estrato}&zona=${filters.zona}&page=${pagination.page - 1}`}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                Anterior
                            </a>
                        )}

                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            {pagination.page} de {pagination.totalPages}
                        </span>

                        {pagination.page < pagination.totalPages && (
                            <a
                                href={`?q=${filters.q}&area_min=${filters.area_min}&area_max=${filters.area_max}&estrato=${filters.estrato}&zona=${filters.zona}&page=${pagination.page + 1}`}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                Siguiente
                            </a>
                        )}
                    </nav>
                </div>
            )}

            {/* POT Detail Modal */}
            {showPOTModal && selectedLote && selectedLote.potData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
    );
}