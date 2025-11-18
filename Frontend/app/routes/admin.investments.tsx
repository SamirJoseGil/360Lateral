import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

// ============================================================================
// TIPOS
// ============================================================================

type LoaderData = {
    user: any;
    criteria: any[];
    summary: {
        total: number;
        active: number;
        inactive: number;
    };
    developers: any[];
    error?: string;
};

type ActionData = {
    success: boolean;
    message?: string;
    error?: string;
};

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) return redirect("/login");
    if (user.role !== "admin") return redirect(`/${user.role}`);

    try {
        // ✅ CRÍTICO: Hacer el fetch al backend
        console.log("[Admin Investments] 🚀 Fetching criteria from:", `${API_URL}/api/investment-criteria/`);

        const { res: criteriaResponse, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/investment-criteria/`
        );

        console.log("[Admin Investments] 📡 Response status:", criteriaResponse.status);

        let criteria = [];
        if (criteriaResponse.ok) {
            const data = await criteriaResponse.json();
            console.log("[Admin Investments] 📦 Raw data:", JSON.stringify(data).substring(0, 200));

            // ✅ CORREGIDO: Extraer array de results si viene paginado
            criteria = Array.isArray(data) ? data : (data.results || []);

            console.log(`[Admin Investments] ✅ Loaded ${criteria.length} criteria`);

            // ✅ Log del primer criterio para debugging
            if (criteria.length > 0) {
                console.log("[Admin Investments] 📋 First criteria:", JSON.stringify(criteria[0]));
            }
        } else {
            const errorText = await criteriaResponse.text();
            console.error("[Admin Investments] ❌ Error:", criteriaResponse.status, errorText);
        }

        // Obtener resumen
        console.log("[Admin Investments] 🔢 Fetching summary from:", `${API_URL}/api/investment-criteria/summary/`);

        const { res: summaryResponse } = await fetchWithAuth(
            request,
            `${API_URL}/api/investment-criteria/summary/`
        );

        let summary = { total: 0, active: 0, inactive: 0 };
        if (summaryResponse.ok) {
            summary = await summaryResponse.json();
            console.log("[Admin Investments] 📊 Summary:", summary);
        }

        // Obtener lista de desarrolladores
        console.log("[Admin Investments] 👥 Fetching developers from:", `${API_URL}/api/users/?role=developer`);

        const { res: developersResponse } = await fetchWithAuth(
            request,
            `${API_URL}/api/users/?role=developer`
        );

        let developers = [];
        if (developersResponse.ok) {
            const devData = await developersResponse.json();
            developers = devData.results || devData || [];
            console.log(`[Admin Investments] ✅ Loaded ${developers.length} developers`);
        }

        console.log("[Admin Investments] 🎉 Loader complete, returning data");

        return json<LoaderData>({
            user,
            criteria,
            summary,
            developers,
            error: undefined
        }, {
            headers: setCookieHeaders
        });

    } catch (error) {
        console.error("[Admin Investments] ❌ Critical error:", error);
        return json<LoaderData>({
            user,
            criteria: [],
            summary: { total: 0, active: 0, inactive: 0 },
            developers: [],
            error: "Error al cargar criterios"
        });
    }
}

// ============================================================================
// ACTION
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/login");
    }

    try {
        const formData = await request.formData();
        const intent = formData.get("intent");
        const criteriaId = formData.get("criteriaId")?.toString();

        if (intent === "toggle_status" && criteriaId) {
            const { res: response, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/investment-criteria/${criteriaId}/toggle_status/`,
                { method: "POST" }
            );

            if (!response.ok) {
                return json<ActionData>({
                    success: false,
                    error: "Error al cambiar estado"
                }, { status: response.status });
            }

            return json<ActionData>({
                success: true,
                message: "Estado actualizado correctamente"
            }, { headers: setCookieHeaders });
        }

        if (intent === "delete" && criteriaId) {
            const { res: response, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/investment-criteria/${criteriaId}/`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                return json<ActionData>({
                    success: false,
                    error: "Error al eliminar"
                }, { status: response.status });
            }

            return json<ActionData>({
                success: true,
                message: "Criterio eliminado correctamente"
            }, { headers: setCookieHeaders });
        }

        return json<ActionData>({ success: false, error: "Acción no válida" });

    } catch (error) {
        console.error("Error in action:", error);
        return json<ActionData>({
            success: false,
            error: "Error al procesar"
        }, { status: 500 });
    }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminInvestmentCriteria() {
    const { criteria, summary, developers, error } = useLoaderData<LoaderData>();
    const actionData = useActionData<ActionData>();

    // ✅ NUEVO: Log en el componente
    console.log("[Admin Investments Component] 📊 Rendering with:", {
        criteriaCount: criteria.length,
        summary,
        developersCount: developers.length,
        error
    });

    const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
    const [selectedCriteria, setSelectedCriteria] = useState<any>(null);
    const [filterDeveloper, setFilterDeveloper] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // ✅ CORREGIDO: Asegurar que criteria sea un array antes de filtrar
    const filteredCriteria = Array.isArray(criteria) ? criteria.filter(c => {
        if (filterDeveloper !== "all" && c.developer !== filterDeveloper) return false;
        if (filterStatus !== "all" && c.status !== filterStatus) return false;
        return true;
    }) : [];

    console.log("[Admin Investments Component] 🔍 Filtered criteria:", filteredCriteria.length);

    if (currentView === 'detail' && selectedCriteria) {
        return <DetailView
            criteria={selectedCriteria}
            onBack={() => {
                setCurrentView('list');
                setSelectedCriteria(null);
            }}
            actionData={actionData}
        />;
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Criterios de Inversión</h1>
                <p className="text-gray-600 mt-1">
                    Gestiona los criterios de búsqueda de los desarrolladores
                </p>
            </div>

            {/* Mensajes */}
            {actionData?.success && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                    <p className="text-sm text-green-700">✅ {actionData.message}</p>
                </div>
            )}
            {actionData?.error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">❌ {actionData.error}</p>
                </div>
            )}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total de Criterios</h3>
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

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filtrar por desarrollador
                        </label>
                        <select
                            value={filterDeveloper}
                            onChange={(e) => setFilterDeveloper(e.target.value)}
                            className="w-full rounded-md border-gray-300"
                        >
                            <option value="all">Todos los desarrolladores</option>
                            {developers.map((dev: any) => (
                                <option key={dev.id} value={dev.id}>
                                    {dev.first_name} {dev.last_name} ({dev.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filtrar por estado
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full rounded-md border-gray-300"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de criterios */}
            {filteredCriteria.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desarrollador</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presupuesto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coincidencias</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCriteria.map((c: any) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {c.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {c.developer_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {c.area_min} - {c.area_max} m²
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        ${(c.budget_min / 1000000).toFixed(1)}M - ${(c.budget_max / 1000000).toFixed(1)}M
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${c.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {c.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {c.matching_lotes_count || 0} lotes
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(c.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <button
                                            onClick={() => {
                                                setSelectedCriteria(c);
                                                setCurrentView('detail');
                                            }}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900">No hay criterios</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        {filterDeveloper !== "all" || filterStatus !== "all"
                            ? "No hay criterios con estos filtros"
                            : "No hay criterios de inversión en el sistema"
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// VISTA: DETALLE
// ============================================================================

function DetailView({
    criteria,
    onBack,
    actionData
}: {
    criteria: any,
    onBack: () => void,
    actionData?: ActionData
}) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    return (
        <div className="p-4">
            <button
                onClick={onBack}
                className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
            </button>

            <div className="bg-white rounded-lg shadow p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{criteria.name}</h1>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${criteria.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {criteria.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <p>Creado: {new Date(criteria.created_at).toLocaleDateString('es-ES')}</p>
                        <p>Actualizado: {new Date(criteria.updated_at).toLocaleDateString('es-ES')}</p>
                    </div>
                </div>

                {/* Información */}
                <div className="space-y-6">
                    {/* Desarrollador */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Desarrollador</h3>
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="font-medium">{criteria.developer_name}</p>
                            <p className="text-sm text-gray-600">{criteria.developer_email}</p>
                        </div>
                    </div>

                    {/* Descripción */}
                    {criteria.description && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                            <p className="text-gray-700">{criteria.description}</p>
                        </div>
                    )}

                    {/* Criterios de búsqueda */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Criterios de Búsqueda</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-sm text-gray-600">Área</p>
                                <p className="font-medium">{criteria.area_min} - {criteria.area_max} m²</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-sm text-gray-600">Presupuesto</p>
                                <p className="font-medium">
                                    ${(criteria.budget_min / 1000000).toFixed(1)}M - ${(criteria.budget_max / 1000000).toFixed(1)}M COP
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Zonas */}
                    {criteria.zones && criteria.zones.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Zonas de Interés</h3>
                            <div className="flex flex-wrap gap-2">
                                {criteria.zones.map((zone: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {zone}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Estratos */}
                    {criteria.estratos && criteria.estratos.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Estratos de Interés</h3>
                            <div className="flex flex-wrap gap-2">
                                {criteria.estratos.map((estrato: number, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                        Estrato {estrato}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Usos de suelo */}
                    {criteria.uso_suelo_preferido && criteria.uso_suelo_preferido.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Usos de Suelo Preferidos</h3>
                            <div className="flex flex-wrap gap-2">
                                {criteria.uso_suelo_preferido.map((uso: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                        {uso}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Coincidencias */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Lotes Coincidentes</h3>
                        <div className="bg-blue-50 p-4 rounded">
                            <p className="text-2xl font-bold text-blue-600">
                                {criteria.matching_lotes_count || 0}
                            </p>
                            <p className="text-sm text-gray-600">lotes que coinciden con este criterio</p>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-6 border-t mt-6">
                    <Form method="post">
                        <input type="hidden" name="intent" value="toggle_status" />
                        <input type="hidden" name="criteriaId" value={criteria.id} />
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-md ${criteria.status === 'active'
                                ? 'bg-gray-600 hover:bg-gray-700'
                                : 'bg-green-600 hover:bg-green-700'
                                } text-white`}
                        >
                            {criteria.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                    </Form>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-medium mb-4">¿Eliminar criterio?</h3>
                        <p className="text-gray-600 mb-6">
                            Esta acción no se puede deshacer. El criterio "{criteria.name}" será eliminado permanentemente.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <Form method="post" onSubmit={() => setShowDeleteModal(false)}>
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="criteriaId" value={criteria.id} />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Eliminar
                                </button>
                            </Form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
