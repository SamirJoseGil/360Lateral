import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Link, Form, useNavigation } from "@remix-run/react";
import { useState, useMemo } from "react";
import { getUser } from "~/utils/auth.server";
import { getFavoriteLotes, removeLoteFromFavorites } from "~/services/lotes.server";

// Tipos
type FavoriteData = {
    id: number;
    lote_info: {
        id: number;
        nombre: string;
        direccion: string;
        area?: number;
        cbml?: string;
        barrio?: string;
        estrato?: number;
        tratamiento_pot?: string;
        uso_suelo?: string;
        precio_estimado?: number;
        valor_potencial?: number;
    };
    notas?: string;
    created_at: string;
};

type LoaderData = {
    user: any;
    favorites: FavoriteData[];
    count: number;
    error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    if (user.role !== "developer") {
        return redirect(`/${user.role}`);
    }

    try {
        const { favorites, count, headers } = await getFavoriteLotes(request);

        return json<LoaderData>({
            user,
            favorites: favorites || [],
            count: count || 0
        }, { headers });
    } catch (error) {
        console.error("Error loading favorites:", error);
        return json<LoaderData>({
            user,
            favorites: [],
            count: 0,
            error: "Error al cargar favoritos"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "developer") {
        return redirect("/");
    }

    const formData = await request.formData();
    const loteId = parseInt(formData.get("loteId") as string);

    try {
        const result = await removeLoteFromFavorites(request, loteId);
        return json({
            success: true,
            message: result.data.message || "Favorito removido exitosamente"
        }, {
            headers: result.headers
        });
    } catch (error) {
        console.error("Error removing favorite:", error);
        return json({
            success: false,
            message: "Error al remover favorito"
        });
    }
}

export default function DeveloperFavorites() {
    const data = useLoaderData<LoaderData>();
    const { user, favorites, count, error } = data;
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();

    const [filterTag, setFilterTag] = useState<string | null>(null);

    // Obtener tags únicos de los favoritos
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        favorites.forEach(fav => {
            if (fav.lote_info.tratamiento_pot) {
                tags.add(fav.lote_info.tratamiento_pot);
            }
            if (fav.lote_info.uso_suelo) {
                tags.add(fav.lote_info.uso_suelo);
            }
        });
        return Array.from(tags);
    }, [favorites]);

    // Filtrar favoritos según el tag seleccionado
    const filteredFavorites = useMemo(() => {
        if (!filterTag) return favorites;

        return favorites.filter(fav =>
            fav.lote_info.tratamiento_pot === filterTag ||
            fav.lote_info.uso_suelo === filterTag ||
            fav.notas?.includes(filterTag)
        );
    }, [favorites, filterTag]);

    // Función para formatear moneda
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Mis Lotes Favoritos</h1>
                <p className="text-gray-600 mt-2">
                    {count} lote{count !== 1 ? 's' : ''} guardado{count !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
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

            {actionData?.message && (
                <div className={`mb-6 p-4 rounded-md ${actionData.success
                        ? "bg-green-50 border-l-4 border-green-400"
                        : "bg-red-50 border-l-4 border-red-400"
                    }`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className={`h-5 w-5 ${actionData.success ? 'text-green-400' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className={`text-sm ${actionData.success ? 'text-green-700' : 'text-red-700'}`}>
                                {actionData.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros por etiquetas */}
            {availableTags.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-sm font-medium text-gray-700 mb-3">Filtrar por tratamiento/uso</h2>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterTag(null)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterTag === null
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos ({favorites.length})
                        </button>

                        {availableTags.map((tag) => {
                            const tagCount = favorites.filter(fav =>
                                fav.lote_info.tratamiento_pot === tag ||
                                fav.lote_info.uso_suelo === tag ||
                                fav.notas?.includes(tag)
                            ).length;

                            if (tagCount === 0) return null;

                            return (
                                <button
                                    key={tag}
                                    onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tag === filterTag
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
            )}

            {/* Lista de favoritos */}
            {filteredFavorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFavorites.map((favorite) => (
                        <div key={favorite.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-lg text-gray-900 flex-1">
                                        {favorite.lote_info.nombre}
                                    </h3>
                                    <Form method="post" className="ml-2">
                                        <input type="hidden" name="loteId" value={favorite.lote_info.id} />
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                                            title="Remover de favoritos"
                                        >
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Form>
                                </div>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{favorite.lote_info.direccion}</p>

                                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                    <div>
                                        <span className="block text-xs text-gray-500">Área</span>
                                        <span className="font-medium">
                                            {favorite.lote_info.area ? `${favorite.lote_info.area.toLocaleString()} m²` : 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500">Estrato</span>
                                        <span className="font-medium">{favorite.lote_info.estrato || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-xs text-gray-500">CBML</span>
                                        <span className="font-medium text-xs">{favorite.lote_info.cbml || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-xs text-gray-500">Barrio</span>
                                        <span className="font-medium">{favorite.lote_info.barrio || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Información de precios */}
                                {(favorite.lote_info.precio_estimado || favorite.lote_info.valor_potencial) && (
                                    <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t text-sm">
                                        {favorite.lote_info.precio_estimado && (
                                            <div>
                                                <span className="block text-xs text-gray-500">Precio Est.</span>
                                                <span className="font-medium text-xs">
                                                    {formatCurrency(favorite.lote_info.precio_estimado)}
                                                </span>
                                            </div>
                                        )}
                                        {favorite.lote_info.valor_potencial && (
                                            <div>
                                                <span className="block text-xs text-gray-500">Valor Potencial</span>
                                                <span className="font-medium text-green-600 text-xs">
                                                    {formatCurrency(favorite.lote_info.valor_potencial)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {favorite.lote_info.tratamiento_pot && (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {favorite.lote_info.tratamiento_pot}
                                        </span>
                                    )}
                                    {favorite.lote_info.uso_suelo && (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {favorite.lote_info.uso_suelo}
                                        </span>
                                    )}
                                </div>

                                {/* Notas */}
                                {favorite.notas && (
                                    <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded-md mb-4 border-l-2 border-yellow-400">
                                        <strong className="block mb-1">Notas:</strong>
                                        <p className="line-clamp-2">{favorite.notas}</p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="pt-3 border-t flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                        {new Date(favorite.created_at).toLocaleDateString('es-CO')}
                                    </div>
                                    <Link
                                        to={`/developer/lots/${favorite.lote_info.id}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                    >
                                        Ver detalles →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-lg shadow text-center">
                    <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {filterTag ? `No hay favoritos con el filtro "${filterTag}"` : 'No tienes lotes favoritos'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {filterTag
                            ? 'Intenta con otro filtro o limpia la selección'
                            : 'Comienza a explorar lotes y marca tus favoritos'}
                    </p>
                    <div className="flex justify-center gap-4">
                        {filterTag && (
                            <button
                                onClick={() => setFilterTag(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Limpiar filtro
                            </button>
                        )}
                        <Link
                            to="/developer/search"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Buscar lotes
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
