import { json } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { recordEvent } from "~/services/stats.server";

// Type for favorite lots
type FavoriteLot = {
    id: number;
    name: string;
    address: string;
    area: number;
    price: number;
    zone: string;
    treatment: string;
    potentialValue: number;
    dateAdded: string;
    tags: string[];
};

type LoaderData = {
    favorites: FavoriteLot[];
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

        // Datos de ejemplo para la página de favoritos
        const favorites: FavoriteLot[] = [
            {
                id: 1,
                name: "Lote Residencial Norte",
                address: "Calle 123 #45-67, Comuna 2",
                area: 350,
                price: 320000000,
                zone: "Norte",
                treatment: "Residencial",
                potentialValue: 400000000,
                dateAdded: "2023-10-15",
                tags: ["Residencial", "Buena ubicación"]
            },
            {
                id: 3,
                name: "Lote Mixto Oeste",
                address: "Avenida 80 #65-43, Comuna 12",
                area: 420,
                price: 480000000,
                zone: "Oeste",
                treatment: "Mixto",
                potentialValue: 600000000,
                dateAdded: "2023-10-20",
                tags: ["Mixto", "Alto potencial"]
            },
            {
                id: 5,
                name: "Lote Comercial Este",
                address: "Carrera 40 #80-90, Comuna 5",
                area: 580,
                price: 720000000,
                zone: "Este",
                treatment: "Comercial",
                potentialValue: 900000000,
                dateAdded: "2023-10-25",
                tags: ["Comercial", "Gran frente"]
            }
        ];

        // Datos para etiquetas/tags disponibles
        const availableTags = [
            "Residencial", "Comercial", "Industrial", "Mixto",
            "Buena ubicación", "Alto potencial", "Gran frente",
            "Esquinero", "Cerca a vías principales", "Zona en desarrollo"
        ];

        return json<LoaderData>({
            favorites,
            availableTags
        });

    } catch (error) {
        console.error("Error cargando favoritos:", error);
        return json<LoaderData>({
            favorites: [],
            availableTags: [],
            error: "Error al cargar tus lotes favoritos"
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

export default function DeveloperFavorites() {
    const { favorites, availableTags, error } = useLoaderData<typeof loader>();

    // Estado para filtrado y etiquetado
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [editingTags, setEditingTags] = useState<number | null>(null);
    const [tagInput, setTagInput] = useState("");

    // Filtrar favoritos por etiqueta seleccionada
    const filteredFavorites = filterTag
        ? favorites.filter(lot => lot.tags.includes(filterTag))
        : favorites;

    // Función para quitar un lote de favoritos
    const removeFavorite = (lotId: number) => {
        // Aquí iría la lógica para eliminar de favoritos
        console.log(`Removing lot ${lotId} from favorites`);
    };

    // Función para agregar etiqueta a un lote
    const addTag = (lotId: number, tag: string) => {
        if (tag.trim()) {
            // Aquí iría la lógica para agregar etiqueta
            console.log(`Adding tag "${tag}" to lot ${lotId}`);
            setTagInput("");
        }
    };

    // Función para eliminar etiqueta de un lote
    const removeTag = (lotId: number, tag: string) => {
        // Aquí iría la lógica para eliminar etiqueta
        console.log(`Removing tag "${tag}" from lot ${lotId}`);
    };

    return (
        <div>
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Mis Lotes Favoritos</h1>
                <p className="text-gray-600 mt-1">
                    Gestiona y organiza tus lotes guardados
                </p>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Filtros por etiquetas */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Filtrar por etiqueta</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterTag(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${filterTag === null
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Todos
                    </button>

                    {availableTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${tag === filterTag
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de favoritos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {filteredFavorites.length > 0 ? (
                    filteredFavorites.map((lot) => (
                        <div key={lot.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold mb-1">{lot.name}</h3>
                                    <button
                                        onClick={() => removeFavorite(lot.id)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <p className="text-gray-500 mb-4">{lot.address}</p>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <span className="block text-xs text-gray-500">Área</span>
                                        <span className="font-medium">{lot.area} m²</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500">Precio</span>
                                        <span className="font-medium">{formatCurrency(lot.price)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500">Valor Potencial</span>
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(lot.potentialValue)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500">ROI Estimado</span>
                                        <span className="font-medium text-green-600">
                                            {Math.round(((lot.potentialValue - lot.price) / lot.price) * 100)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="block text-xs text-gray-500">Etiquetas</span>
                                        <button
                                            onClick={() => setEditingTags(editingTags === lot.id ? null : lot.id)}
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                            {editingTags === lot.id ? 'Listo' : 'Editar'}
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {lot.tags.length > 0 ? (
                                            lot.tags.map((tag) => (
                                                <div
                                                    key={tag}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${editingTags === lot.id ? 'pr-6 relative' : ''
                                                        }`}
                                                >
                                                    {tag}
                                                    {editingTags === lot.id && (
                                                        <button
                                                            onClick={() => removeTag(lot.id, tag)}
                                                            className="absolute right-1 top-1 text-gray-400 hover:text-red-500"
                                                        >
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400">Sin etiquetas</span>
                                        )}
                                    </div>

                                    {editingTags === lot.id && (
                                        <div className="flex mt-2">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                placeholder="Nueva etiqueta..."
                                                className="flex-grow text-sm rounded-l-md border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <button
                                                onClick={() => addTag(lot.id, tagInput)}
                                                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-r-md hover:bg-indigo-700"
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t">
                                    <div className="text-xs text-gray-500">
                                        Guardado el {new Date(lot.dateAdded).toLocaleDateString()}
                                    </div>
                                    <div className="space-x-3">
                                        <Link
                                            to={`/developer/lots/${lot.id}`}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                        >
                                            Ver Detalles
                                        </Link>
                                        <Link
                                            to={`/developer/analysis/${lot.id}`}
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
                        <p className="text-gray-500 mb-4">No tienes lotes favoritos{filterTag ? ` con la etiqueta "${filterTag}"` : ''}.</p>
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
