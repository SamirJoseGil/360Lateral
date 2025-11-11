import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { recordEvent } from "~/services/stats.server";

type LoaderData = {
    zones: string[];
    treatments: string[];
    error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);

    try {
        // Registrar evento de vista de la página de nuevo criterio
        await recordEvent(request, {
            type: "view",
            name: "developer_new_investment_criteria",
            value: {
                user_id: user?.id || "unknown"
            }
        });

        // En una aplicación real, estos valores vendrían de una API
        const zones = [
            "Norte", "Sur", "Este", "Oeste", "Centro",
            "Noreste", "Noroeste", "Sureste", "Suroeste",
            "Zona Industrial", "Zona Residencial", "Zona Comercial"
        ];

        const treatments = [
            "Residencial", "Comercial", "Industrial", "Mixto",
            "Consolidación", "Renovación", "Desarrollo", "Conservación"
        ];

        return json<LoaderData>({ zones, treatments });

    } catch (error) {
        console.error("Error cargando datos para nuevo criterio:", error);
        return json<LoaderData>({
            zones: [],
            treatments: [],
            error: "Error al cargar datos necesarios para crear criterio"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);

    try {
        const formData = await request.formData();

        // Procesar datos del formulario
        const name = formData.get("name") as string;
        const minArea = parseInt(formData.get("minArea") as string, 10);
        const maxArea = parseInt(formData.get("maxArea") as string, 10);
        const minBudget = parseInt(formData.get("minBudget") as string, 10);
        const maxBudget = parseInt(formData.get("maxBudget") as string, 10);

        // Procesar zonas y tratamientos (que son múltiples)
        const zones = formData.getAll("zones") as string[];
        const treatments = formData.getAll("treatments") as string[];

        // Validar datos
        const errors: Record<string, string> = {};

        if (!name || name.trim().length < 3) {
            errors.name = "El nombre debe tener al menos 3 caracteres";
        }

        if (isNaN(minArea) || minArea <= 0) {
            errors.minArea = "El área mínima debe ser mayor a 0";
        }

        if (isNaN(maxArea) || maxArea <= minArea) {
            errors.maxArea = "El área máxima debe ser mayor al área mínima";
        }

        if (isNaN(minBudget) || minBudget <= 0) {
            errors.minBudget = "El presupuesto mínimo debe ser mayor a 0";
        }

        if (isNaN(maxBudget) || maxBudget <= minBudget) {
            errors.maxBudget = "El presupuesto máximo debe ser mayor al presupuesto mínimo";
        }

        if (zones.length === 0) {
            errors.zones = "Debes seleccionar al menos una zona";
        }

        if (treatments.length === 0) {
            errors.treatments = "Debes seleccionar al menos un tratamiento";
        }

        if (Object.keys(errors).length > 0) {
            return json({ errors, values: Object.fromEntries(formData) });
        }

        // Registro de creación exitosa para estadísticas
        await recordEvent(request, {
            type: "action",
            name: "create_investment_criteria",
            value: {
                user_id: user?.id || "unknown",
                name
            }
        });

        // En una aplicación real, aquí se guardaría en la base de datos
        // Por ahora, simulamos éxito y redirigimos

        return redirect("/developer/investment");

    } catch (error) {
        console.error("Error procesando formulario:", error);
        return json({
            errors: { _form: "Error al procesar el formulario" },
            values: null
        });
    }
}

export default function NewInvestmentCriteria() {
    const { zones, treatments, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();

    const isSubmitting = navigation.state === "submitting";

    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);

    // Manejar selección/deselección de zonas
    const handleZoneToggle = (zone: string) => {
        setSelectedZones(prev =>
            prev.includes(zone)
                ? prev.filter(z => z !== zone)
                : [...prev, zone]
        );
    };

    // Manejar selección/deselección de tratamientos
    const handleTreatmentToggle = (treatment: string) => {
        setSelectedTreatments(prev =>
            prev.includes(treatment)
                ? prev.filter(t => t !== treatment)
                : [...prev, treatment]
        );
    };

    return (
        <div>
            <header className="mb-6 p-4">
                <h1 className="text-2xl font-bold">Nuevo Criterio de Inversión</h1>
                <p className="text-gray-600 mt-1">
                    Define tus criterios para buscar lotes según tus necesidades de inversión
                </p>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {actionData?.errors?._form && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{actionData.errors._form}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Form method="post" className="p-6">
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Criterio
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Ej: Lotes Residenciales Norte"
                            defaultValue={actionData?.values?.name as string}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {actionData?.errors && typeof actionData.errors === "object" && "name" in actionData.errors && actionData.errors.name && (
                            <p className="mt-1 text-sm text-red-600">{actionData.errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Área (m²)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="minArea" className="block text-xs text-gray-500 mb-1">
                                        Mínima
                                    </label>
                                    <input
                                        type="number"
                                        id="minArea"
                                        name="minArea"
                                        placeholder="Ej: 300"
                                        defaultValue={actionData?.values?.minArea as string}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {actionData?.errors && typeof actionData.errors === "object" && "minArea" in actionData.errors && actionData.errors.minArea && (
                                        <p className="mt-1 text-xs text-red-600">{actionData.errors.minArea}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="maxArea" className="block text-xs text-gray-500 mb-1">
                                        Máxima
                                    </label>
                                    <input
                                        type="number"
                                        id="maxArea"
                                        name="maxArea"
                                        placeholder="Ej: 800"
                                        defaultValue={actionData?.values?.maxArea as string}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {actionData?.errors && "maxArea" in actionData.errors && actionData.errors.maxArea && (
                                        <p className="mt-1 text-xs text-red-600">{actionData.errors.maxArea}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Presupuesto (COP)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="minBudget" className="block text-xs text-gray-500 mb-1">
                                        Mínimo
                                    </label>
                                    <input
                                        type="number"
                                        id="minBudget"
                                        name="minBudget"
                                        placeholder="Ej: 200000000"
                                        defaultValue={actionData?.values?.minBudget as string}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {actionData?.errors && typeof actionData.errors === "object" && "minBudget" in actionData.errors && actionData.errors.minBudget && (
                                        <p className="mt-1 text-xs text-red-600">{actionData.errors.minBudget}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="maxBudget" className="block text-xs text-gray-500 mb-1">
                                        Máximo
                                    </label>
                                    <input
                                        type="number"
                                        id="maxBudget"
                                        name="maxBudget"
                                        placeholder="Ej: 600000000"
                                        defaultValue={actionData?.values?.maxBudget as string}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {actionData?.errors && typeof actionData.errors === "object" && "maxBudget" in actionData.errors && actionData.errors.maxBudget && (
                                        <p className="mt-1 text-xs text-red-600">{actionData.errors.maxBudget}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Zonas</h3>
                            {actionData?.errors && typeof actionData.errors === "object" && "zones" in actionData.errors && actionData.errors.zones && (
                                <p className="mb-2 text-sm text-red-600">{actionData.errors.zones}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                {zones.map((zone) => (
                                    <label key={zone} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="zones"
                                            value={zone}
                                            checked={selectedZones.includes(zone)}
                                            onChange={() => handleZoneToggle(zone)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{zone}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Tratamientos</h3>
                            {actionData?.errors && "treatments" in actionData.errors && actionData.errors.treatments && (
                                <p className="mb-2 text-sm text-red-600">{actionData.errors.treatments}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                {treatments.map((treatment) => (
                                    <label key={treatment} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="treatments"
                                            value={treatment}
                                            checked={selectedTreatments.includes(treatment)}
                                            onChange={() => handleTreatmentToggle(treatment)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{treatment}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-400"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Guardando..." : "Guardar Criterio"}
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
