import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser, fetchWithAuth } from "~/utils/auth.server";
import { useState, useEffect } from "react";
import { API_URL } from "~/utils/env.server";

// ============================================================================
// TIPOS
// ============================================================================

type LoaderData = {
    user: any;
    criteria: any[];
    lotes: any[];
    summary: {
        total: number;
        active: number;
        inactive: number;
    };
    error?: string;
};

type ActionData = {
    success: boolean;
    errors?: Record<string, string>;
    values?: any;
    message?: string;
};

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) return redirect("/login");
    if (user.role !== "developer") return redirect(`/${user.role}`);

    try {
        // Obtener criterios del backend
        const { res: criteriaResponse, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/investment-criteria/my_criteria/`
        );

        let criteria = [];
        if (criteriaResponse.ok) {
            const data = await criteriaResponse.json();
            // ✅ CORREGIDO: Extraer array de results si viene paginado
            criteria = Array.isArray(data) ? data : (data.results || []);

            console.log(`[Developer Investment] Loaded ${criteria.length} criteria`);
        }

        // Obtener resumen
        const { res: summaryResponse } = await fetchWithAuth(
            request,
            `${API_URL}/api/investment-criteria/summary/`
        );

        let summary = { total: 0, active: 0, inactive: 0 };
        if (summaryResponse.ok) {
            summary = await summaryResponse.json();
        }

        // Obtener lotes disponibles para el formulario
        const { res: lotesResponse } = await fetchWithAuth(
            request,
            `${API_URL}/api/lotes/`
        );

        let lotes = [];
        if (lotesResponse.ok) {
            const lotesData = await lotesResponse.json();
            lotes = lotesData.results || lotesData || [];
        }

        return json<LoaderData>({
            user,
            criteria,  // ✅ Ahora es un array limpio
            lotes,
            summary,
            error: undefined
        }, {
            headers: setCookieHeaders
        });

    } catch (error) {
        console.error("Error loading criteria:", error);
        return json<LoaderData>({
            user,
            criteria: [],
            lotes: [],
            summary: { total: 0, active: 0, inactive: 0 },
            error: "Error al cargar criterios"
        });
    }
}

// ============================================================================
// ACTION
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "developer") {
        return redirect("/login");
    }

    try {
        const formData = await request.formData();
        const intent = formData.get("intent");

        if (intent === "create") {
            const criteriaData = {
                name: formData.get("name")?.toString(),
                description: formData.get("description")?.toString() || "",
                area_min: parseFloat(formData.get("area_min")?.toString() || "0"),
                area_max: parseFloat(formData.get("area_max")?.toString() || "0"),
                budget_min: parseFloat(formData.get("budget_min")?.toString() || "0"),
                budget_max: parseFloat(formData.get("budget_max")?.toString() || "0"),
                zones: formData.get("zones")?.toString().split(',').filter(z => z.trim()) || [],
                treatments: formData.get("treatments")?.toString().split(',').filter(t => t.trim()) || [],
                estratos: formData.get("estratos")?.toString().split(',').map(e => parseInt(e.trim())).filter(e => !isNaN(e)) || [],
                uso_suelo_preferido: formData.get("uso_suelo")?.toString().split(',').filter(u => u.trim()) || [],
                enable_notifications: formData.get("enable_notifications") === "true"
            };

            // Validaciones
            const errors: Record<string, string> = {};
            if (!criteriaData.name || criteriaData.name.length < 3) {
                errors.name = "El nombre debe tener al menos 3 caracteres";
            }
            if (criteriaData.area_max < criteriaData.area_min) {
                errors.area_max = "El área máxima debe ser mayor al área mínima";
            }
            if (criteriaData.budget_max < criteriaData.budget_min) {
                errors.budget_max = "El presupuesto máximo debe ser mayor al presupuesto mínimo";
            }

            if (Object.keys(errors).length > 0) {
                return json<ActionData>({ success: false, errors, values: criteriaData }, { status: 400 });
            }

            const { res: response, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/investment-criteria/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(criteriaData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                return json<ActionData>({
                    success: false,
                    errors: { general: errorData.message || "Error al crear" },
                    values: criteriaData
                }, { status: response.status });
            }

            return json<ActionData>({
                success: true,
                message: "Criterio creado exitosamente"
            }, { headers: setCookieHeaders });
        }

        if (intent === "toggle_status") {
            const criteriaId = formData.get("criteriaId")?.toString();

            const { res: response, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/investment-criteria/${criteriaId}/toggle_status/`,
                { method: "POST" }
            );

            if (!response.ok) {
                return json<ActionData>({ success: false, errors: { general: "Error al cambiar estado" } }, { status: response.status });
            }

            return json<ActionData>({ success: true }, { headers: setCookieHeaders });
        }

        return json<ActionData>({ success: false, errors: { general: "Acción no válida" } });

    } catch (error) {
        console.error("Error in action:", error);
        return json<ActionData>({ success: false, errors: { general: "Error al procesar" } }, { status: 500 });
    }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DeveloperInvestment() {
    const { user, criteria, lotes, summary, error } = useLoaderData<LoaderData>();
    const actionData = useActionData<ActionData>();
    const [searchParams, setSearchParams] = useSearchParams();

    // Estado para controlar la vista actual
    const [currentView, setCurrentView] = useState<'list' | 'create'>('list');

    // Detectar éxito en la creación para volver a lista
    useEffect(() => {
        if (actionData?.success && actionData.message) {
            setCurrentView('list');
        }
    }, [actionData]);

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Criterios de Inversión</h1>
                <p className="text-gray-600 mt-1">
                    Configura tus preferencias y encuentra lotes que se ajusten a tus necesidades
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${currentView === 'list'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Mis Criterios ({summary.total})
                    </button>
                    <button
                        onClick={() => setCurrentView('create')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${currentView === 'create'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Nuevo Criterio
                    </button>
                </nav>
            </div>

            {/* Mensaje de éxito */}
            {actionData?.success && actionData.message && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                    <p className="text-sm text-green-700">✅ {actionData.message}</p>
                </div>
            )}

            {/* Error general */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Contenido según tab activo */}
            {currentView === 'list' ? (
                <ListTab criteria={criteria} summary={summary} onCreateNew={() => setCurrentView('create')} />
            ) : (
                <CreateTab lotes={lotes} actionData={actionData} onCancel={() => setCurrentView('list')} />
            )}
        </div>
    );
}

// ============================================================================
// TAB: LISTA DE CRITERIOS
// ============================================================================

function ListTab({ criteria, summary, onCreateNew }: { criteria: any[], summary: any, onCreateNew: () => void }) {
    // ✅ NUEVO: Log para debugging
    console.log("[ListTab] Rendering with criteria count:", criteria.length);
    console.log("[ListTab] Criteria array:", criteria);

    // ✅ CORREGIDO: Asegurar que criteria sea un array
    const safeCriteria = Array.isArray(criteria) ? criteria : [];

    return (
        <div>
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Activos</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{summary.active}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Inactivos</h3>
                    <p className="text-3xl font-bold text-gray-400 mt-2">{summary.inactive}</p>
                </div>
            </div>

            {/* Lista de criterios */}
            {safeCriteria.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {safeCriteria.map((c: any) => (
                        <div key={c.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">{c.name}</h3>
                                    {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                                    <div className="mt-3 space-y-1 text-sm text-gray-500">
                                        <p>📏 Área: {c.area_min} - {c.area_max} m²</p>
                                        <p>💰 Presupuesto: ${(c.budget_min / 1000000).toFixed(1)}M - ${(c.budget_max / 1000000).toFixed(1)}M</p>
                                        {c.zones && c.zones.length > 0 && (
                                            <p>📍 Zonas: {c.zones.join(', ')}</p>
                                        )}
                                        {c.estratos && c.estratos.length > 0 && (
                                            <p>🏘️ Estratos: {c.estratos.join(', ')}</p>
                                        )}
                                        {c.matching_lotes_count !== undefined && (
                                            <p className="text-blue-600 font-medium">
                                                🎯 {c.matching_lotes_count} lotes coinciden
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {c.status === 'active' ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No tienes criterios aún</h3>
                    <p className="text-sm text-gray-500 mt-2">Crea tu primer criterio de inversión</p>
                    <button
                        onClick={onCreateNew}
                        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Crear Primer Criterio
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// TAB: CREAR NUEVO CRITERIO
// ============================================================================

function CreateTab({ lotes, actionData, onCancel }: { lotes: any[], actionData?: ActionData, onCancel: () => void }) {
    const [formData, setFormData] = useState({
        name: actionData?.values?.name || "",
        description: actionData?.values?.description || "",
        area_min: actionData?.values?.area_min || "",
        area_max: actionData?.values?.area_max || "",
        budget_min: actionData?.values?.budget_min || "",
        budget_max: actionData?.values?.budget_max || "",
        zones: actionData?.values?.zones?.join(', ') || "",
        treatments: actionData?.values?.treatments?.join(', ') || "",
        estratos: actionData?.values?.estratos?.join(', ') || "",
        uso_suelo: actionData?.values?.uso_suelo_preferido?.join(', ') || "",
        enable_notifications: true
    });

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
                {/* Error general */}
                {actionData?.errors?.general && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <p className="text-sm text-red-700">{actionData.errors.general}</p>
                    </div>
                )}

                <Form method="post" className="space-y-6">
                    <input type="hidden" name="intent" value="create" />

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Criterio *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Ej: Lotes para proyecto residencial VIS"
                            required
                        />
                        {actionData?.errors?.name && (
                            <p className="mt-1 text-sm text-red-600">{actionData.errors.name}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Describe tu criterio de búsqueda..."
                        />
                    </div>

                    {/* Área */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Área Mínima (m²) *
                            </label>
                            <input
                                type="number"
                                name="area_min"
                                value={formData.area_min}
                                onChange={(e) => setFormData(prev => ({ ...prev, area_min: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="100"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Área Máxima (m²) *
                            </label>
                            <input
                                type="number"
                                name="area_max"
                                value={formData.area_max}
                                onChange={(e) => setFormData(prev => ({ ...prev, area_max: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="500"
                                required
                            />
                            {actionData?.errors?.area_max && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.area_max}</p>
                            )}
                        </div>
                    </div>

                    {/* Presupuesto */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Presupuesto Mínimo (COP) *
                            </label>
                            <input
                                type="number"
                                name="budget_min"
                                value={formData.budget_min}
                                onChange={(e) => setFormData(prev => ({ ...prev, budget_min: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="100000000"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Presupuesto Máximo (COP) *
                            </label>
                            <input
                                type="number"
                                name="budget_max"
                                value={formData.budget_max}
                                onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="500000000"
                                required
                            />
                            {actionData?.errors?.budget_max && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.budget_max}</p>
                            )}
                        </div>
                    </div>

                    {/* Zonas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zonas de Interés
                        </label>
                        <input
                            type="text"
                            name="zones"
                            value={formData.zones}
                            onChange={(e) => setFormData(prev => ({ ...prev, zones: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Poblado, Laureles, Envigado (separados por coma)"
                        />
                    </div>

                    {/* Estratos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estratos de Interés
                        </label>
                        <input
                            type="text"
                            name="estratos"
                            value={formData.estratos}
                            onChange={(e) => setFormData(prev => ({ ...prev, estratos: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="3, 4, 5 (separados por coma)"
                        />
                    </div>

                    {/* Usos de suelo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Usos de Suelo Preferidos
                        </label>
                        <input
                            type="text"
                            name="uso_suelo"
                            value={formData.uso_suelo}
                            onChange={(e) => setFormData(prev => ({ ...prev, uso_suelo: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Residencial, Comercial (separados por coma)"
                        />
                    </div>

                    {/* Notificaciones */}
                    <div className="flex items-center">
                        <input
                            id="enable_notifications"
                            name="enable_notifications"
                            type="checkbox"
                            checked={formData.enable_notifications}
                            onChange={(e) => setFormData(prev => ({ ...prev, enable_notifications: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            value="true"
                        />
                        <label htmlFor="enable_notifications" className="ml-2 text-sm text-gray-700">
                            Recibir notificaciones cuando haya lotes que coincidan
                        </label>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Crear Criterio
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
