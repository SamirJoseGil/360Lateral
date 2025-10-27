import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { recordEvent } from "~/services/stats.server";
import { getLoteById, checkLoteIsFavorite, toggleLoteFavorite } from "~/services/lotes.server";
import { getNormativaPorCBML } from "~/services/pot.server";

type LoaderData = {
    lote: any;
    potData?: any;
    isFavorite: boolean;
    error?: string;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    const lotId = params.lotId;  // ✅ Este es un UUID (string)

    if (!lotId) {
        return json<LoaderData>({
            lote: null,
            isFavorite: false,
            error: "ID de lote inválido"
        }, { status: 400 });
    }

    try {
        // Registrar evento de vista del lote
        try {
            await recordEvent(request, {
                type: "view",
                name: "developer_lot_detail",
                value: {
                    user_id: user?.id || "unknown",
                    lot_id: lotId
                }
            });
        } catch (eventError) {
            console.warn("No se pudo registrar el evento:", eventError);
        }

        // Obtener datos del lote desde la API
        const { lote, headers } = await getLoteById(request, lotId);

        // ✅ Verificar si el lote es favorito - USAR UUID (string)
        let isFavorite = false;
        try {
            const favoriteCheck = await checkLoteIsFavorite(request, lotId);  // ✅ Pasar UUID directamente
            isFavorite = favoriteCheck.is_favorite || false;
        } catch (error) {
            console.log("Error verificando favorito:", error);
        }

        // Obtener información POT si el lote tiene CBML
        let potData = null;
        if (lote.cbml) {
            try {
                const potResponse = await getNormativaPorCBML(request, lote.cbml);
                potData = potResponse.normativa;
            } catch (potError) {
                console.log("Error obteniendo datos POT:", potError);
            }
        }

        return json<LoaderData>({
            lote,
            potData,
            isFavorite
        }, { headers });

    } catch (error) {
        console.error(`Error cargando detalles del lote ${lotId}:`, error);

        const errorMessage = error instanceof Error
            ? error.message
            : "Error al cargar los detalles del lote";

        return json<LoaderData>({
            lote: null,
            isFavorite: false,
            error: errorMessage
        }, { status: 500 });
    }
}

export async function action({ params, request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "developer") {
        return redirect("/");
    }

    const lotId = params.lotId;  // ✅ Este es un UUID (string)
    if (!lotId) {
        return json({ success: false, message: "ID de lote inválido" }, { status: 400 });
    }

    const formData = await request.formData();
    const action = formData.get("action");

    try {
        switch (action) {
            case "toggle_favorite":
                // ✅ Pasar UUID directamente (string)
                const result = await toggleLoteFavorite(request, lotId);
                return json({
                    success: result.success,
                    isFavorite: result.isFavorite,
                    message: result.message
                }, { headers: result.headers });

            default:
                return json({
                    success: false,
                    message: "Acción no válida"
                }, { status: 400 });
        }
    } catch (error) {
        console.error("Error en acción:", error);
        return json({
            success: false,
            message: error instanceof Error ? error.message : "Error al procesar la acción"
        }, { status: 500 });
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

type FetcherData = {
    success?: boolean;
    isFavorite?: boolean;
    message?: string;
};

export default function LotDetail() {
    const { lote, potData, isFavorite, error } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<FetcherData>();
    const [activeImage, setActiveImage] = useState(0);

    // ✅ Estado de favorito actualizado sin favoriteId
    const currentFavoriteStatus = fetcher.data?.isFavorite !== undefined ? fetcher.data.isFavorite : isFavorite;

    if (error || !lote) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            No se puede acceder al lote
                        </h2>

                        <p className="text-center text-gray-600 mb-6">
                            {error || "El lote solicitado no está disponible"}
                        </p>

                        <div className="space-y-3">
                            <Link
                                to="/developer/search"
                                className="block w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Volver a la búsqueda
                            </Link>

                            <Link
                                to="/developer"
                                className="block w-full text-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Ir al panel principal
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const toggleFavorite = () => {
        fetcher.submit(
            { action: "toggle_favorite" },
            { method: "post" }
        );
    };

    return (
        <div>
            <div className="py-16 mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">{lote.nombre}</h1>
                    <p className="text-gray-600">{lote.direccion}</p>
                    {lote.cbml && (
                        <p className="text-sm text-gray-500">CBML: {lote.cbml}</p>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={toggleFavorite}
                        disabled={fetcher.state === "submitting"}
                        className={`p-2 rounded-full ${currentFavoriteStatus
                            ? 'text-red-500 bg-red-50'
                            : 'text-gray-400 bg-gray-50 hover:text-red-500'
                            }`}
                    >
                        <svg className="h-6 w-6" fill={currentFavoriteStatus ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    {/* <Link to={`/developer/analysis/${lote.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Análisis Urbanístico
                    </Link> */}
                </div>
            </div>

            {/* Mostrar mensaje de éxito/error */}
            {fetcher.data?.message && (
                <div className={`mb-6 p-4 rounded-md ${fetcher.data.success
                    ? "bg-green-50 border-l-4 border-green-400 text-green-700"
                    : "bg-red-50 border-l-4 border-red-400 text-red-700"
                    }`}>
                    {fetcher.data.message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* Descripción y detalles */}
                    <div className="bg-white rounded-lg shadow mb-8">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Información del Lote</h2>

                            {lote.descripcion && (
                                <>
                                    <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                                    <p className="text-gray-700 mb-6">{lote.descripcion}</p>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm text-gray-500">Área</h3>
                                    <p className="font-medium">{lote.area ? `${lote.area.toLocaleString()} m²` : 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Barrio</h3>
                                    <p className="font-medium">{lote.barrio || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Estrato</h3>
                                    <p className="font-medium">{lote.estrato || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-500">Matrícula</h3>
                                    <p className="font-medium">{lote.matricula || 'N/A'}</p>
                                </div>
                                {lote.uso_suelo && (
                                    <div>
                                        <h3 className="text-sm text-gray-500">Uso de Suelo</h3>
                                        <p className="font-medium">{lote.uso_suelo}</p>
                                    </div>
                                )}
                                {lote.clasificacion_suelo && (
                                    <div>
                                        <h3 className="text-sm text-gray-500">Clasificación</h3>
                                        <p className="font-medium">{lote.clasificacion_suelo}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información POT */}
                    {potData && (
                        <div className="bg-white rounded-lg shadow mb-8">
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-4">Información POT</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {potData.codigo_tratamiento && (
                                        <div>
                                            <h3 className="text-sm text-gray-500">Tratamiento</h3>
                                            <p className="font-medium">{potData.codigo_tratamiento}</p>
                                        </div>
                                    )}
                                    {potData.nombre_tratamiento && (
                                        <div>
                                            <h3 className="text-sm text-gray-500">Nombre Tratamiento</h3>
                                            <p className="font-medium">{potData.nombre_tratamiento}</p>
                                        </div>
                                    )}
                                    {potData.indice_ocupacion && (
                                        <div>
                                            <h3 className="text-sm text-gray-500">Índice Ocupación</h3>
                                            <p className="font-medium">{potData.indice_ocupacion}</p>
                                        </div>
                                    )}
                                    {potData.indice_construccion && (
                                        <div>
                                            <h3 className="text-sm text-gray-500">Índice Construcción</h3>
                                            <p className="font-medium">{potData.indice_construccion}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Coordenadas si están disponibles */}
                    {(lote.latitud || lote.longitud) && (
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-4">Ubicación</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {lote.latitud && (
                                        <div>
                                            <h3 className="text-sm text-gray-500">Latitud</h3>
                                            <p className="font-medium">{lote.latitud}</p>
                                        </div>
                                    )}
                                    {lote.longitud && (
                                        <div>
                                            <h3 className="text-sm text-gray-500">Longitud</h3>
                                            <p className="font-medium">{lote.longitud}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar con información resumida */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Información principal */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Resumen</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">CBML</span>
                                <span className="font-medium text-xs">{lote.cbml || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Área</span>
                                <span className="font-medium">{lote.area ? `${lote.area.toLocaleString()} m²` : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Estado</span>
                                <span className={`font-medium ${lote.status === 'active' ? 'text-green-600' :
                                    lote.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                                    }`}>
                                    {lote.status === 'active' ? 'Activo' :
                                        lote.status === 'pending' ? 'Pendiente' : 'Archivado'}
                                </span>
                            </div>
                            {lote.tratamiento_pot && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tratamiento POT</span>
                                    <span className="font-medium">{lote.tratamiento_pot}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fechas del sistema */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Información del Sistema</h2>
                        <div className="space-y-2">
                            <div>
                                <span className="text-gray-500 text-sm">ID</span>
                                <div className="font-medium">{lote.id}</div>
                            </div>
                            {lote.created_at && (
                                <div>
                                    <span className="text-gray-500 text-sm">Fecha de Registro</span>
                                    <div className="text-sm">{new Date(lote.created_at).toLocaleDateString('es-CO')}</div>
                                </div>
                            )}
                            {lote.updated_at && (
                                <div>
                                    <span className="text-gray-500 text-sm">Última Actualización</span>
                                    <div className="text-sm">{new Date(lote.updated_at).toLocaleDateString('es-CO')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}