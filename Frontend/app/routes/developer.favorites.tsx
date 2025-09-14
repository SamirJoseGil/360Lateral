import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { recordEvent } from "~/services/stats.server";
import { getFavoriteLotes, removeLoteFromFavorites, addLoteToFavorites } from "~/services/lotes.server";

// Type for favorite lots from API
type FavoriteLot = {
    id: number;
    lote: {
        id: number;
        nombre: string;
        direccion: string;
        area: number;
        cbml: string;
        barrio?: string;
        estrato?: number;
        precio_estimado?: number;
        valor_potencial?: number;
        tratamiento_pot?: string;
        zona?: string;
    };
    created_at: string;
    notes?: string;
};

type LoaderData = {
    favorites: FavoriteLot[];
    count: number;
    availableTags: string[];
    error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);

    try {
        // Registrar evento de visita a favoritos
        await recordEvent(request, {
            type: "view",
            name: "developer_favorites",
            value: {
                user_id: user.id
            }
        });

        // Obtener favoritos reales desde la API
        const { favorites, count, headers } = await getFavoriteLotes(request, {
            ordering: '-created_at',
            limit: 50
        });

        // Datos para etiquetas/tags disponibles (basados en tratamientos POT reales)
        const availableTags = [
            "Residencial", "Comercial", "Industrial", "Mixto",
            "Buena ubicación", "Alto potencial", "Gran frente",
            "Esquinero", "Cerca a vías principales", "Zona en desarrollo",
            "CN1", "CN2", "CN3", "CN4", "R", "D", "C"
        ];

        return json<LoaderData>({
            favorites,
            count,
            availableTags
        }, { headers });

    } catch (error) {
        console.error("Error cargando favoritos:", error);
        return json<LoaderData>({
            favorites: [],
            count: 0,
            availableTags: [],
            error: "Error al cargar tus lotes favoritos"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "developer") {
        return redirect("/");
    }

    const formData = await request.formData();
    const action = formData.get("action");
    const favoriteId = formData.get("favoriteId") as string;
    const loteId = formData.get("loteId") as string;

    try {
        switch (action) {
            case "remove_favorite":
                await removeLoteFromFavorites(request, parseInt(favoriteId));
                return json({
                    success: true,
                    message: "Lote removido de favoritos",
                    action: "removed",
                    favoriteId
                });

            case "add_favorite":
                const notes = formData.get("notes") as string;
                await addLoteToFavorites(request, parseInt(loteId), notes);
                return json({
                    success: true,
                    message: "Lote agregado a favoritos",
                    action: "added",
                    loteId
                });

            default:
                return json({
                    success: false,
                    message: "Acción no válida"
                }, { status: 400 });
        }
    } catch (error) {
        console.error("Error en acción de favoritos:", error);
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

export default function DeveloperFavorites() {
    const { favorites, count, availableTags, error } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();

    // Estado para filtrado
    const [filterTag, setFilterTag] = useState<string | null>(null);

    // Filtrar favoritos por etiqueta seleccionada
    const filteredFavorites = filterTag
        ? favorites.filter(fav =>
            fav.lote.tratamiento_pot === filterTag ||
            fav.lote.zona === filterTag ||
            fav.notes?.includes(filterTag)
        )
        : favorites;

    // Función para quitar un lote de favoritos
    const removeFavorite = (favoriteId: number) => {
        fetcher.submit(
            { action: "remove_favorite", favoriteId: favoriteId.toString() },
            { method: "post" }
        );
    };

    return (
        <div>
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Mis Lotes Favoritos</h1>
                <p className="text-gray-600 mt-1">
                    Gestiona y organiza tus {count} lotes guardados
                </p>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Mostrar mensaje de éxito/error de acciones */}
            {fetcher.data && typeof fetcher.data === "object" && "message" in fetcher.data && (
                (() => {
                    const data = fetcher.data as { success: boolean; message: string };
                    return (
                        <div className={`mb-6 p-4 rounded-md ${data.success
                            ? "bg-green-50 border-l-4 border-green-400 text-green-700"
                            : "bg-red-50 border-l-4 border-red-400 text-red-700"
                            }`}>
                            {data.message}
                        </div>
                    );
                })()
            )}

            {/* Filtros por etiquetas */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Filtrar por tratamiento/zona</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterTag(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${filterTag === null
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Todos ({favorites.length})
                    </button>

                    {availableTags.map((tag) => {
                        const tagCount = favorites.filter(fav =>
                            fav.lote.tratamiento_pot === tag ||
                            fav.lote.zona === tag ||
                            fav.notes?.includes(tag)
                        ).length;

                        if (tagCount === 0) return null;

                        return (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${tag === filterTag
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {tag} ({tagCount})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Lista de favoritos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {filteredFavorites.length > 0 ? (
                    filteredFavorites.map((favorite) => (
                        <div key={favorite.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold mb-1">{favorite.lote.nombre}</h3>
                                    <button
                                        onClick={() => removeFavorite(favorite.id)}
                                        className="text-gray-400 hover:text-red-500"
                                        disabled={fetcher.state === "submitting"}
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <p className="text-gray-500 mb-4">{favorite.lote.direccion}</p>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <span className="block text-xs text-gray-500">Área</span>
                                        <span className="font-medium">{favorite.lote.area ? `${favorite.lote.area.toLocaleString()} m²` : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500">CBML</span>
                                        <span className="font-medium text-xs">{favorite.lote.cbml || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500">Barrio</span>
                                        <span className="font-medium">{favorite.lote.barrio || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500">Estrato</span>
                                        <span className="font-medium">{favorite.lote.estrato || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Información de precios si está disponible */}
                                {(favorite.lote.precio_estimado || favorite.lote.valor_potencial) && (
                                    <div className="grid grid-cols-2 gap-4 mb-4 pt-2 border-t">
                                        {favorite.lote.precio_estimado && (
                                            <div>
                                                <span className="block text-xs text-gray-500">Precio Est.</span>
                                                <span className="font-medium">{formatCurrency(favorite.lote.precio_estimado)}</span>
                                            </div>
                                        )}
                                        {favorite.lote.valor_potencial && (
                                            <div>
                                                <span className="block text-xs text-gray-500">Valor Potencial</span>
                                                <span className="font-medium text-green-600">
                                                    {formatCurrency(favorite.lote.valor_potencial)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {favorite.lote.tratamiento_pot && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {favorite.lote.tratamiento_pot}
                                            </span>
                                        )}
                                        {favorite.lote.zona && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {favorite.lote.zona}
                                            </span>
                                        )}
                                    </div>

                                    {favorite.notes && (
                                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            <strong>Notas:</strong> {favorite.notes}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t">
                                    <div className="text-xs text-gray-500">
                                        Guardado el {new Date(favorite.created_at).toLocaleDateString('es-CO')}
                                    </div>
                                    <div className="space-x-3">
                                        <Link
                                            to={`/developer/lots/${favorite.lote.id}`}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                        >
                                            Ver Detalles
                                        </Link>
                                        <Link
                                            to={`/developer/analysis/${favorite.lote.id}`}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Análisis
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg shadow text-center">
                        <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <p className="text-gray-500 mb-4">
                            No tienes lotes favoritos{filterTag ? ` con el filtro "${filterTag}"` : ''}.
                        </p>
                        <Link
                            to="/developer/search"
                            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Buscar Lotes
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
