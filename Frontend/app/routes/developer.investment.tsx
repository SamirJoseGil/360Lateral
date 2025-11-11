import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { recordEvent } from "~/services/stats.server";

// Types
type InvestmentCriteria = {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    status: "active" | "inactive";
    details: {
        area: {
            min: number;
            max: number;
        };
        budget: {
            min: number;
            max: number;
        };
        zones: string[];
        treatments: string[];
    };
};

type LoaderData = {
    criteria: InvestmentCriteria[];
    error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);

    try {
        // Registrar evento de visita a la página de criterios de inversión
        await recordEvent(request, {
            type: "view",
            name: "developer_investment_criteria",
            value: {
                user_id: user?.id || "unknown"
            }
        });

        // Datos de ejemplo para criterios de inversión
        const criteria: InvestmentCriteria[] = [
            {
                id: 1,
                name: "Criterio Residencial Norte",
                createdAt: "2023-05-15",
                updatedAt: "2023-06-10",
                status: "active",
                details: {
                    area: { min: 300, max: 500 },
                    budget: { min: 200000000, max: 400000000 },
                    zones: ["Norte", "Noroccidente"],
                    treatments: ["Residencial", "Mixto"]
                }
            },
            {
                id: 2,
                name: "Criterio Comercial Centro",
                createdAt: "2023-07-20",
                updatedAt: "2023-07-20",
                status: "active",
                details: {
                    area: { min: 400, max: 800 },
                    budget: { min: 500000000, max: 800000000 },
                    zones: ["Centro", "Zona Industrial"],
                    treatments: ["Comercial"]
                }
            },
            {
                id: 3,
                name: "Criterio Industrial Sur",
                createdAt: "2023-08-05",
                updatedAt: "2023-08-15",
                status: "inactive",
                details: {
                    area: { min: 1000, max: 5000 },
                    budget: { min: 800000000, max: 2000000000 },
                    zones: ["Sur", "Zona Industrial"],
                    treatments: ["Industrial"]
                }
            }
        ];

        return json<LoaderData>({
            criteria
        });

    } catch (error) {
        console.error("Error cargando criterios de inversión:", error);
        return json<LoaderData>({
            criteria: [],
            error: "Error al cargar tus criterios de inversión"
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

export default function DeveloperInvestment() {
    const { criteria, error } = useLoaderData<typeof loader>();

    // Estado para filtrar criterios
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

    // Filtrar criterios por estado
    const filteredCriteria = filterStatus === "all"
        ? criteria
        : criteria.filter(item => item.status === filterStatus);

    return (
        <div>
            <header className="mb-6 p-4">
                <h1 className="text-2xl font-bold">Criterios de Inversión</h1>
                <p className="text-gray-600 mt-1">
                    Configura y gestiona tus criterios para búsqueda de lotes
                </p>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-4 py-2 rounded-md text-sm ${filterStatus === "all"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterStatus("active")}
                        className={`px-4 py-2 rounded-md text-sm ${filterStatus === "active"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        Activos
                    </button>
                    <button
                        onClick={() => setFilterStatus("inactive")}
                        className={`px-4 py-2 rounded-md text-sm ${filterStatus === "inactive"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        Inactivos
                    </button>
                </div>

                <Link
                    to="/developer/investment/new"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 inline-flex items-center"
                >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Criterio
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredCriteria.length > 0 ? (
                    filteredCriteria.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold">{item.name}</h2>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Creado: {new Date(item.createdAt).toLocaleDateString()} |
                                            Actualizado: {new Date(item.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                        }`}>
                                        {item.status === "active" ? "Activo" : "Inactivo"}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-600 mb-2">Área</h3>
                                        <p className="text-lg">
                                            {item.details.area.min} - {item.details.area.max} m²
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-600 mb-2">Presupuesto</h3>
                                        <p className="text-lg">
                                            {formatCurrency(item.details.budget.min)} - {formatCurrency(item.details.budget.max)}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-600 mb-2">Zonas</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {item.details.zones.map((zone, index) => (
                                                <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                    {zone}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-600 mb-2">Tratamientos</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {item.details.treatments.map((treatment, index) => (
                                                <span key={index} className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                    {treatment}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <Link
                                        to={`/developer/search?criteria=${item.id}`}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                    >
                                        Buscar Lotes
                                    </Link>
                                    <Link
                                        to={`/developer/investment/${item.id}`}
                                        className="text-blue-600 hover:text-blue-900 font-medium"
                                    >
                                        Editar
                                    </Link>
                                    <button
                                        className="text-gray-600 hover:text-gray-900 font-medium"
                                        onClick={() => {
                                            // Toggle status logic would go here
                                            alert(`Cambiando estado de ${item.name}`);
                                        }}
                                    >
                                        {item.status === "active" ? "Desactivar" : "Activar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                        <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <p className="text-gray-500 mb-4">No tienes criterios de inversión guardados.</p>
                        <Link
                            to="/developer/investment/new"
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Crear mi primer criterio
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
