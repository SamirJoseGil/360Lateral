import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState, useEffect } from "react";
import { recordEvent } from "~/services/stats.server";

// Tipos para los filtros y resultados
type SearchFilter = {
    area: { min?: number; max?: number };
    price: { min?: number; max?: number };
    zone: string[];
    treatment: string[];
};

type SearchLotResult = {
    id: number;
    name: string;
    address: string;
    area: number;
    price: number;
    zone: string;
    treatment: string;
    potentialValue: number;
    isFavorite: boolean;
};

type LoaderData = {
    searchResults: SearchLotResult[];
    savedCriteria: {
        id: number;
        name: string;
        area: string;
        zone: string;
        budget: string;
        treatment: string;
    }[];
    filterOptions: {
        zones: string[];
        treatments: string[];
        minArea: number;
        maxArea: number;
        minPrice: number;
        maxPrice: number;
    };
    selectedCriteria: number | null;
    query: string | null;
    error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);

    const url = new URL(request.url);
    const criteriaId = url.searchParams.get("criteria");
    const query = url.searchParams.get("q") || "";

    try {
        // Registrar evento de búsqueda
        await recordEvent(request, {
            type: "search",
            name: "developer_lot_search",
            value: {
                user_id: user.id,
                criteria_id: criteriaId,
                query
            }
        });

        // Obtener criterios de búsqueda guardados para mostrar en el filtro
        const savedCriteria = [
            { id: 1, name: "Criterio residencial", area: "300-500", zone: "Norte", budget: "200M-400M", treatment: "Residencial" },
            { id: 2, name: "Criterio comercial", area: "400-800", zone: "Centro", budget: "500M-800M", treatment: "Comercial" }
        ];

        // Simular resultados de búsqueda
        const searchResults: SearchLotResult[] = [
            {
                id: 1,
                name: "Lote Residencial Norte",
                address: "Calle 123 #45-67, Comuna 2",
                area: 350,
                price: 320000000,
                zone: "Norte",
                treatment: "Residencial",
                potentialValue: 400000000,
                isFavorite: true
            },
            {
                id: 2,
                name: "Lote Comercial Centro",
                address: "Carrera 7 #25-30, Comuna 10",
                area: 520,
                price: 650000000,
                zone: "Centro",
                treatment: "Comercial",
                potentialValue: 800000000,
                isFavorite: false
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
                isFavorite: true
            },
            {
                id: 4,
                name: "Lote Industrial Sur",
                address: "Calle 10 #23-45, Comuna 15",
                area: 1200,
                price: 950000000,
                zone: "Sur",
                treatment: "Industrial",
                potentialValue: 1200000000,
                isFavorite: false
            }
        ];

        // Filtrar por criterio seleccionado
        let filteredResults = searchResults;
        if (criteriaId) {
            const selectedCriteria = savedCriteria.find(c => c.id.toString() === criteriaId);
            if (selectedCriteria) {
                // Aplicar filtro básico basado en el criterio
                filteredResults = searchResults.filter(lot =>
                    lot.zone === selectedCriteria.zone ||
                    lot.treatment === selectedCriteria.treatment
                );
            }
        }

        // Filtrar por búsqueda de texto
        if (query) {
            filteredResults = filteredResults.filter(lot =>
                lot.name.toLowerCase().includes(query.toLowerCase()) ||
                lot.address.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Datos para los filtros
        const filterOptions = {
            zones: ["Norte", "Sur", "Este", "Oeste", "Centro"],
            treatments: ["Residencial", "Comercial", "Industrial", "Mixto"],
            minArea: 200,
            maxArea: 2000,
            minPrice: 100000000,  // 100 millones
            maxPrice: 2000000000  // 2000 millones
        };

        return json<LoaderData>({
            searchResults: filteredResults,
            savedCriteria,
            filterOptions,
            selectedCriteria: criteriaId ? parseInt(criteriaId) : null,
            query
        });
    } catch (error) {
        console.error("Error en búsqueda de lotes:", error);
        return json<LoaderData>({
            searchResults: [],
            savedCriteria: [],
            filterOptions: {
                zones: [],
                treatments: [],
                minArea: 0,
                maxArea: 0,
                minPrice: 0,
                maxPrice: 0
            },
            selectedCriteria: null,
            query: null,
            error: "Error al cargar resultados de búsqueda"
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

export default function DeveloperSearch() {
    const {
        searchResults,
        savedCriteria,
        filterOptions,
        selectedCriteria,
        query: initialQuery,
        error
    } = useLoaderData<typeof loader>();

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(initialQuery || "");

    // Estados para filtros
    const [activeFilters, setActiveFilters] = useState<SearchFilter>({
        area: {},
        price: {},
        zone: [],
        treatment: []
    });

    const [filtersOpen, setFiltersOpen] = useState(false);

    // Cargar filtro inicial si hay un criterio seleccionado
    useEffect(() => {
        if (selectedCriteria) {
            const criteria = savedCriteria.find(c => c.id === selectedCriteria);
            if (criteria) {
                // Convertir criterios guardados a formato de filtro activo
                setActiveFilters({
                    area: {}, // Parsear del string "300-500" a { min: 300, max: 500 }
                    price: {}, // Parsear del string "200M-400M"
                    zone: [criteria.zone],
                    treatment: [criteria.treatment]
                });
            }
        }
    }, [selectedCriteria, savedCriteria]);

    // Manejar búsqueda
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        // Actualizar URL con parámetros de búsqueda
        const params = new URLSearchParams(searchParams);
        if (searchQuery) {
            params.set("q", searchQuery);
        } else {
            params.delete("q");
        }

        setSearchParams(params);
    };

    // Manejar aplicación de filtros
    const applyFilters = () => {
        // Actualizar URL con filtros
        const params = new URLSearchParams(searchParams);

        // Criterio de búsqueda (si existe)
        const criteriaParam = searchParams.get("criteria");
        if (criteriaParam) {
            params.set("criteria", criteriaParam);
        }

        // Búsqueda de texto
        if (searchQuery) {
            params.set("q", searchQuery);
        }

        // Cerrar panel de filtros
        setFiltersOpen(false);

        // Actualizar URL
        setSearchParams(params);
    };

    // Función para alternar el estado de favorito
    const toggleFavorite = (lotId: number) => {
        // Aquí iría la lógica para marcar/desmarcar favorito
        console.log(`Toggling favorite for lot ${lotId}`);
    };

    return (
        <div>
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Búsqueda de Lotes</h1>
                <p className="text-gray-600 mt-1">
                    Encuentra lotes disponibles según tus criterios de inversión
                </p>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel de filtros (móvil: modal, desktop: sidebar) */}
                <div className={`lg:block ${filtersOpen ? 'fixed inset-0 z-50 bg-black bg-opacity-50 p-4' : 'hidden'}`}>
                    <div className={`bg-white p-4 rounded-lg shadow ${filtersOpen ? 'max-w-md mx-auto mt-20' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Filtros</h2>
                            {filtersOpen && (
                                <button
                                    onClick={() => setFiltersOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Criterios guardados */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Mis Criterios</h3>
                            <div className="space-y-2">
                                {savedCriteria.map((criteria) => (
                                    <Link
                                        key={criteria.id}
                                        to={`?criteria=${criteria.id}`}
                                        className={`block p-2 text-sm rounded-md ${selectedCriteria === criteria.id
                                            ? 'bg-indigo-100 text-indigo-800 font-medium'
                                            : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {criteria.name}
                                    </Link>
                                ))}

                                <Link
                                    to="/developer/investment/new"
                                    className="block p-2 text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    + Crear nuevo criterio
                                </Link>
                            </div>
                        </div>

                        <div className="border-t pt-4 mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Área (m²)</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-500">Mínimo</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        placeholder="Min"
                                        value={activeFilters.area.min || ''}
                                        onChange={(e) => setActiveFilters({
                                            ...activeFilters,
                                            area: { ...activeFilters.area, min: parseInt(e.target.value) || undefined }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Máximo</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        placeholder="Max"
                                        value={activeFilters.area.max || ''}
                                        onChange={(e) => setActiveFilters({
                                            ...activeFilters,
                                            area: { ...activeFilters.area, max: parseInt(e.target.value) || undefined }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Precio</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-500">Mínimo</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        placeholder="Min"
                                        value={activeFilters.price.min || ''}
                                        onChange={(e) => setActiveFilters({
                                            ...activeFilters,
                                            price: { ...activeFilters.price, min: parseInt(e.target.value) || undefined }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500">Máximo</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        placeholder="Max"
                                        value={activeFilters.price.max || ''}
                                        onChange={(e) => setActiveFilters({
                                            ...activeFilters,
                                            price: { ...activeFilters.price, max: parseInt(e.target.value) || undefined }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Zona</h3>
                            <div className="space-y-2">
                                {filterOptions.zones.map((zone) => (
                                    <label key={zone} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            checked={activeFilters.zone.includes(zone)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setActiveFilters({
                                                        ...activeFilters,
                                                        zone: [...activeFilters.zone, zone]
                                                    });
                                                } else {
                                                    setActiveFilters({
                                                        ...activeFilters,
                                                        zone: activeFilters.zone.filter(z => z !== zone)
                                                    });
                                                }
                                            }}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{zone}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Tratamiento</h3>
                            <div className="space-y-2">
                                {filterOptions.treatments.map((treatment) => (
                                    <label key={treatment} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            checked={activeFilters.treatment.includes(treatment)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setActiveFilters({
                                                        ...activeFilters,
                                                        treatment: [...activeFilters.treatment, treatment]
                                                    });
                                                } else {
                                                    setActiveFilters({
                                                        ...activeFilters,
                                                        treatment: activeFilters.treatment.filter(t => t !== treatment)
                                                    });
                                                }
                                            }}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{treatment}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => {
                                    setActiveFilters({
                                        area: {},
                                        price: {},
                                        zone: [],
                                        treatment: []
                                    });
                                }}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Limpiar filtros
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                            >
                                Aplicar filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="lg:col-span-3">
                    {/* Barra de búsqueda y filtros */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <Form method="get" onSubmit={handleSearch} className="flex flex-wrap gap-2">
                            <div className="flex-grow">
                                <input
                                    type="text"
                                    name="q"
                                    placeholder="Buscar por dirección, nombre, etc."
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Buscar
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltersOpen(true)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 lg:hidden"
                            >
                                Filtros
                            </button>
                        </Form>
                    </div>

                    {/* Resultados */}
                    <div>
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Resultados ({searchResults.length})</h2>
                            <div className="text-sm text-gray-500">
                                Ordenar por:
                                <select className="ml-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                                    <option>Relevancia</option>
                                    <option>Precio (menor a mayor)</option>
                                    <option>Precio (mayor a menor)</option>
                                    <option>Área (menor a mayor)</option>
                                    <option>Área (mayor a menor)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {searchResults.length > 0 ? (
                                searchResults.map((lot) => (
                                    <div key={lot.id} className="bg-white rounded-lg shadow overflow-hidden">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-semibold">{lot.name}</h3>
                                                <button
                                                    onClick={() => toggleFavorite(lot.id)}
                                                    className={`p-1 rounded-full ${lot.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                                >
                                                    {lot.isFavorite ? (
                                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>

                                            <p className="text-gray-500 text-sm mb-3">{lot.address}</p>

                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <span className="block text-xs text-gray-500">Área</span>
                                                    <span className="font-medium">{lot.area} m²</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-gray-500">Precio</span>
                                                    <span className="font-medium">{formatCurrency(lot.price)}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-gray-500">Zona</span>
                                                    <span className="font-medium">{lot.zone}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-gray-500">Tratamiento</span>
                                                    <span className="font-medium">{lot.treatment}</span>
                                                </div>
                                            </div>

                                            <div className="border-t pt-3 flex justify-between items-center">
                                                <div>
                                                    <span className="block text-xs text-gray-500">Valor potencial estimado</span>
                                                    <span className="text-green-600 font-medium">{formatCurrency(lot.potentialValue)}</span>
                                                </div>
                                                <Link
                                                    to={`/developer/lots/${lot.id}`}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                                >
                                                    Ver detalles →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 bg-white p-6 rounded-lg shadow text-center">
                                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="text-gray-500 mb-3">No se encontraron resultados para tu búsqueda.</p>
                                    <p className="text-sm text-gray-500">Intenta con diferentes criterios o filtros.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
