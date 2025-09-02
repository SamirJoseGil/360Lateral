import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState, useEffect } from "react";
import { recordEvent } from "~/services/stats.server";

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
    criteria: InvestmentCriteria;
    zones: string[];
    treatments: string[];
    error?: string;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);
    const criteriaId = params.investmentId;

    if (!criteriaId) {
        return redirect("/developer/investment");
    }

    try {
        // Registrar evento de vista de detalle de criterio
        await recordEvent(request, {
            type: "view",
            name: "developer_investment_criteria_detail",
            value: {
                user_id: user?.id || "unknown",
                criteria_id: criteriaId
            }
        });

        // En una aplicación real, estos datos vendrían de una API
        // Ejemplo simulado para el criterio específico
        const criteria: InvestmentCriteria = {
            id: parseInt(criteriaId),
            name: `Criterio de Inversión ${criteriaId}`,
            createdAt: "2023-05-15",
            updatedAt: "2023-06-10",
            status: "active",
            details: {
                area: { min: 300, max: 500 },
                budget: { min: 200000000, max: 400000000 },
                zones: ["Norte", "Noroccidente"],
                treatments: ["Residencial", "Mixto"]
            }
        };

        // Listados disponibles para los select
        const zones = [
            "Norte", "Sur", "Este", "Oeste", "Centro",
            "Noreste", "Noroeste", "Sureste", "Suroeste",
            "Zona Industrial", "Zona Residencial", "Zona Comercial"
        ];

        const treatments = [
            "Residencial", "Comercial", "Industrial", "Mixto",
            "Consolidación", "Renovación", "Desarrollo", "Conservación"
        ];

        return json<LoaderData>({
            criteria,
            zones,
            treatments
        });
    } catch (error) {
        console.error(`Error cargando criterio ${criteriaId}:`, error);
        return json<LoaderData>({
            criteria: {} as InvestmentCriteria,
            zones: [],
            treatments: [],
            error: "Error al cargar el criterio de inversión"
        });
    }
}

export async function action({ params, request }: ActionFunctionArgs) {
    const user = await getUser(request);
    const criteriaId = params.investmentId;

    if (!user || !criteriaId) {
        return json({
            success: false,
            message: "No autorizado o criterio no especificado"
        }, { status: 400 });
    }

    try {
        const formData = await request.formData();
        const name = formData.get("name") as string;
        const minArea = parseInt(formData.get("minArea") as string, 10);
        const maxArea = parseInt(formData.get("maxArea") as string, 10);
        const minBudget = parseInt(formData.get("minBudget") as string, 10);
        const maxBudget = parseInt(formData.get("maxBudget") as string, 10);
        const status = formData.get("status") as "active" | "inactive";

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

        // Registro de actualización exitosa para estadísticas
        await recordEvent(request, {
            type: "action",
            name: "update_investment_criteria",
            value: {
                user_id: user.id,
                criteria_id: criteriaId,
                name
            }
        });

        // En una aplicación real, aquí se actualizaría en la base de datos

        return json({
            success: true,
            message: "Criterio actualizado exitosamente"
        });
    } catch (error) {
        console.error("Error procesando formulario:", error);
        return json({
            success: false,
            errors: { _form: "Error al procesar el formulario" },
            message: "Error al actualizar el criterio"
        });
    }
}

export default function EditInvestmentCriteria() {
    const { criteria, zones, treatments, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();

    const isSubmitting = navigation.state === "submitting";

    const [selectedZones, setSelectedZones] = useState<string[]>(criteria.details?.zones || []);
    const [selectedTreatments, setSelectedTreatments] = useState<string[]>(criteria.details?.treatments || []);

    // Actualizar selecciones cuando se carguen datos
    useEffect(() => {
        if (criteria.details) {
            setSelectedZones(criteria.details.zones);
            setSelectedTreatments(criteria.details.treatments);
        }
    }, [criteria]);

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
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Editar Criterio de Inversión</h1>
                <p className="text-gray-600 mt-1">
                    Actualiza los parámetros para buscar lotes que se ajusten a tus necesidades
                </p>
            </header>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {actionData && "message" in actionData && (
                <div className={`p-4 mb-6 rounded-md ${actionData.success
                    ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                    : "bg-red-100 border-l-4 border-red-500 text-red-700"
                    }`}>
                    <p>{actionData.message}</p>
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
                            defaultValue={criteria.name}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {"errors" in (actionData ?? {}) && (actionData as any).errors?.name && (
                            <p className="mt-1 text-sm text-red-600">{(actionData as any).errors.name}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                        </label>
                        <select
                            id="status"
                            name="status"
                            defaultValue={criteria.status}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
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
                                        defaultValue={criteria.details?.area.min}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {"errors" in (actionData ?? {}) && (actionData as any).errors?.minArea && (
                                        <p className="mt-1 text-xs text-red-600">{(actionData as any).errors.minArea}</p>
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
                                        defaultValue={criteria.details?.area.max}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {"errors" in (actionData ?? {}) && (actionData as any).errors?.maxArea && (
                                        <p className="mt-1 text-xs text-red-600">{(actionData as any).errors.maxArea}</p>
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
                                        defaultValue={criteria.details?.budget.min}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {"errors" in (actionData ?? {}) && (actionData as any).errors?.minBudget && (
                                        <p className="mt-1 text-xs text-red-600">{(actionData as any).errors.minBudget}</p>
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
                                        defaultValue={criteria.details?.budget.max}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {"errors" in (actionData ?? {}) && (actionData as any).errors?.maxBudget && (
                                        <p className="mt-1 text-xs text-red-600">{(actionData as any).errors.maxBudget}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Zonas</h3>
                            {"errors" in (actionData ?? {}) && (actionData as any).errors?.zones && (
                                <p className="mb-2 text-sm text-red-600">{(actionData as any).errors.zones}</p>
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
                            {"errors" in (actionData ?? {}) && (actionData as any).errors?.treatments && (
                                <p className="mb-2 text-sm text-red-600">{(actionData as any).errors.treatments}</p>
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
                            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
