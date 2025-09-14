import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { recordEvent } from "~/services/stats.server";
import { getLoteById, toggleLoteFavorite, checkLoteIsFavorite } from "~/services/lotes.server";
import { getNormativaPorCBML } from "~/services/pot.server";

type LoaderData = {
    lote: any;
    potData?: any;
    isFavorite: boolean;
    favoriteId?: number;
    error?: string;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);
    const lotId = params.lotId;

    if (!lotId) {
        return json<LoaderData>({
            lote: null,
            isFavorite: false,
            error: "ID de lote inválido"
        }, { status: 400 });
    }

    try {
        // Registrar evento de vista del lote
        await recordEvent(request, {
            type: "view",
            name: "developer_lot_detail",
            value: {
                user_id: user?.id || "unknown",
                lot_id: lotId
            }
        });

        // Obtener datos del lote desde la API
        const { lote, headers } = await getLoteById(request, lotId);

        // Verificar si el lote es favorito
        let isFavorite = false;
        let favoriteId = undefined;
        try {
            const favoriteCheck = await checkLoteIsFavorite(request, parseInt(lotId));
            isFavorite = favoriteCheck.isFavorite;
            favoriteId = favoriteCheck.favoriteId;
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
            isFavorite,
            favoriteId
        }, { headers });

    } catch (error) {
        console.error(`Error cargando detalles del lote ${lotId}:`, error);
        return json<LoaderData>({
            lote: null,
            isFavorite: false,
            error: "Error al cargar los detalles del lote"
        }, { status: 500 });
    }
}

export async function action({ params, request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "developer") {
        return redirect("/");
    }

    const lotId = params.lotId;
    if (!lotId) {
        return json({ success: false, message: "ID de lote inválido" }, { status: 400 });
    }

    const formData = await request.formData();
    const action = formData.get("action");

    try {
        switch (action) {
            case "toggle_favorite":
                const result = await toggleLoteFavorite(request, parseInt(lotId));
                return json({
                    success: true,
                    isFavorite: result.isFavorite,
                    message: result.message
                });

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
            message: "Error al procesar la acción"
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

    // Usar estado del fetcher si está disponible, sino usar el del loader
    const currentFavoriteStatus = fetcher.data?.isFavorite !== undefined ? fetcher.data.isFavorite : isFavorite;

    if (error || !lote) {
        return (
            <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                        <div className="mt-4">
                            <Link to="/developer/search" className="text-sm font-medium text-red-600 hover:text-red-500">
                                Volver a la búsqueda
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
            <div className="mb-6 flex justify-between items-center">
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
                    <Link to={`/developer/analysis/${lote.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Análisis Urbanístico
                    </Link>
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
