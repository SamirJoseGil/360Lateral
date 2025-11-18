import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigate, useSearchParams, Form } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

// ============================================================================
// TIPOS
// ============================================================================

type LoaderData = {
    user: any;
    view: 'list' | 'create' | 'detail';
    requests?: any[];
    lotes?: any[];
    selectedRequest?: any;
    success?: boolean;
    error?: string;
};

type ActionData = {
    success: boolean;
    errors?: Record<string, string>;
    values?: any;
};

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) return redirect("/login");
    if (user.role !== "owner") return redirect(`/${user.role}`);

    try {
        const url = new URL(request.url);
        const pathname = url.pathname;
        const success = url.searchParams.get("success");

        // Determinar vista según la URL
        let view: 'list' | 'create' | 'detail' = 'list';
        let selectedRequest = null;

        if (pathname.includes('/nueva')) {
            view = 'create';
        } else if (pathname.match(/\/\d+$/)) {
            view = 'detail';
            const requestId = pathname.split('/').pop();

            // ✅ CORREGIDO: Usar fetchWithAuth
            const { res: detailResponse, setCookieHeaders: detailCookies } = await fetchWithAuth(
                request,
                `${API_URL}/api/solicitudes/${requestId}/`
            );

            if (detailResponse.ok) {
                selectedRequest = await detailResponse.json();
            }
        }

        // ✅ CORREGIDO: Usar fetchWithAuth en lugar de fetch directo
        const { res: requestsResponse, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/solicitudes/mis_solicitudes/`
        );

        let requests = [];
        if (requestsResponse.ok) {
            requests = await requestsResponse.json();
        } else {
            console.error("[Solicitudes] Error:", requestsResponse.status, await requestsResponse.text());
        }

        // Cargar lotes si es vista de creación
        let lotes = [];
        if (view === 'create') {
            const { res: lotesResponse } = await fetchWithAuth(
                request,
                `${API_URL}/api/lotes/`
            );

            if (lotesResponse.ok) {
                const lotesData = await lotesResponse.json();
                lotes = lotesData.results || lotesData || [];
            }
        }

        return json<LoaderData>({
            user,
            view,
            requests,
            lotes,
            selectedRequest,
            success: success === "created",
            error: undefined
        }, {
            headers: setCookieHeaders // ✅ Propagar cookies
        });

    } catch (error) {
        console.error("Error loading:", error);
        return json<LoaderData>({
            user,
            view: 'list',
            requests: [],
            error: "Error al cargar"
        });
    }
}

// ============================================================================
// ACTION
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "owner") {
        return redirect("/login");
    }

    try {
        const formData = await request.formData();
        const intent = formData.get("intent");

        if (intent === "create") {
            const requestData = {
                tipo: formData.get("tipo")?.toString() || "consulta_general",
                titulo: formData.get("titulo")?.toString(),
                descripcion: formData.get("descripcion")?.toString(),
                lote: formData.get("lote")?.toString() || null,
                prioridad: formData.get("prioridad")?.toString() || "normal"
            };

            // Validaciones
            const errors: Record<string, string> = {};
            if (!requestData.titulo || requestData.titulo.length < 5) {
                errors.titulo = "El título debe tener al menos 5 caracteres";
            }
            if (!requestData.descripcion || requestData.descripcion.length < 20) {
                errors.descripcion = "La descripción debe tener al menos 20 caracteres";
            }

            if (Object.keys(errors).length > 0) {
                return json<ActionData>({
                    success: false,
                    errors,
                    values: requestData
                }, { status: 400 });
            }

            // ✅ CORREGIDO: Usar fetchWithAuth
            const { res: response, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/solicitudes/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                return json<ActionData>({
                    success: false,
                    errors: { general: errorData.message || "Error al crear la solicitud" },
                    values: requestData
                }, { status: response.status });
            }

            return redirect("/owner/solicitudes?success=created", {
                headers: setCookieHeaders // ✅ Propagar cookies
            });
        }

        return json<ActionData>({ success: false });

    } catch (error) {
        console.error("Error in action:", error);
        return json<ActionData>({
            success: false,
            errors: { general: "Error al procesar la solicitud" }
        }, { status: 500 });
    }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function Solicitudes() {
    const data = useLoaderData<LoaderData>();
    const actionData = useActionData<ActionData>();
    const [searchParams] = useSearchParams();

    // ✅ NUEVO: Controlar vista con estado interno
    const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    // ✅ Detectar si viene parámetro de éxito
    useEffect(() => {
        if (searchParams.get('success') === 'created') {
            setCurrentView('list');
        }
    }, [searchParams]);

    // ✅ Si el action fue exitoso, volver a lista
    useEffect(() => {
        if (actionData?.success) {
            setCurrentView('list');
        }
    }, [actionData]);

    // Renderizar según vista actual
    if (currentView === 'create') {
        return <CreateView
            lotes={data.lotes || []}
            actionData={actionData}
            onCancel={() => setCurrentView('list')}
        />;
    }

    return <ListView
        requests={data.requests || []}
        success={data.success}
        error={data.error}
        onCreateNew={() => setCurrentView('create')}
    />;
}

// ============================================================================
// VISTA: LISTA
// ============================================================================

function ListView({ requests, success, error, onCreateNew }: { requests: any[], success?: boolean, error?: string, onCreateNew: () => void }) {
    const navigate = useNavigate();
    const [filteredRequests, setFilteredRequests] = useState(requests);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    useEffect(() => {
        let filtered = requests;
        if (statusFilter !== "all") filtered = filtered.filter((r: any) => r.estado === statusFilter);
        if (typeFilter !== "all") filtered = filtered.filter((r: any) => r.tipo === typeFilter);
        setFilteredRequests(filtered);
    }, [statusFilter, typeFilter, requests]);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            pendiente: "bg-yellow-100 text-yellow-800",
            en_revision: "bg-blue-100 text-blue-800",
            aprobado: "bg-green-100 text-green-800",
            rechazado: "bg-red-100 text-red-800",
            completado: "bg-gray-100 text-gray-800"
        };
        return badges[status] || badges.pendiente;
    };

    return (
        <div className="p-6">
            {/* Header con gradiente */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis Solicitudes</h1>
                        <p className="text-gray-600">
                            Gestiona tus solicitudes de soporte y consultas
                        </p>
                    </div>
                    <button
                        onClick={onCreateNew}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Solicitud
                    </button>
                </div>
            </div>

            {/* Mensajes mejorados */}
            {success && (
                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-green-800 font-medium">✅ Solicitud creada correctamente</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Filtros con diseño mejorado */}
            <div className="bg-white p-6 rounded-2xl shadow-md mb-8 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_revision">En Revisión</option>
                            <option value="completado">Completado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="soporte_tecnico">Soporte Técnico</option>
                            <option value="consulta_general">Consulta General</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista mejorada */}
            {filteredRequests.length > 0 ? (
                <div className="space-y-4">
                    {filteredRequests.map((req: any) => (
                        <div key={req.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl p-6 transition-all duration-300 border border-gray-100 hover:border-blue-200">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {req.titulo}
                                        </h3>
                                        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${getStatusBadge(req.estado)}`}>
                                            {req.estado}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        {req.tipo_display}
                                    </p>
                                    {req.lote_info && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Lote: {req.lote_info.nombre}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(req.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl rounded-2xl p-16 text-center border border-gray-200">
                    <svg className="mx-auto h-20 w-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {statusFilter !== "all" || typeFilter !== "all"
                            ? "No hay solicitudes con estos filtros"
                            : "No tienes solicitudes aún"
                        }
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {statusFilter !== "all" || typeFilter !== "all"
                            ? "Prueba ajustando los filtros para ver más resultados"
                            : "Crea tu primera solicitud de soporte o consulta"
                        }
                    </p>
                    {statusFilter === "all" && typeFilter === "all" && (
                        <button
                            onClick={onCreateNew}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Crear Primera Solicitud
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// VISTA: CREAR
// ============================================================================

function CreateView({
    lotes,
    actionData,
    onCancel
}: {
    lotes: any[],
    actionData?: ActionData,
    onCancel: () => void
}) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        tipo: actionData?.values?.tipo || "consulta_general",
        titulo: actionData?.values?.titulo || "",
        descripcion: actionData?.values?.descripcion || "",
        lote: actionData?.values?.lote || "",
        prioridad: actionData?.values?.prioridad || "normal"
    });

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={onCancel}
                    className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>
                <h1 className="text-4xl font-bold text-gray-900">Nueva Solicitud</h1>
            </div>

            {actionData?.errors?.general && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{actionData.errors.general}</p>
                    </div>
                </div>
            )}

            <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                <Form method="post" className="space-y-8">
                    <input type="hidden" name="intent" value="create" />

                    {/* Tipo de Solicitud */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Tipo de Solicitud *
                        </label>
                        <select
                            name="tipo"
                            value={formData.tipo}
                            onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            required
                        >
                            <option value="consulta_general">Consulta General</option>
                            <option value="soporte_tecnico">Soporte Técnico</option>
                            <option value="analisis_urbanistico">Análisis Urbanístico</option>
                            <option value="validacion_documentos">Validación de Documentos</option>
                            <option value="correccion_datos">Corrección de Datos</option>
                            <option value="acceso">Solicitud de Acceso</option>
                            <option value="funcionalidad">Solicitud de Funcionalidad</option>
                            <option value="otro">Otro</option>
                        </select>
                        {actionData?.errors?.tipo && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {actionData.errors.tipo}
                            </p>
                        )}
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Título *
                        </label>
                        <input
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            placeholder="Ej: Problema con la carga de documentos"
                            required
                        />
                        {actionData?.errors?.titulo && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {actionData.errors.titulo}
                            </p>
                        )}
                    </div>

                    {/* Grid para Lote y Prioridad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lote */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                Lote Relacionado (Opcional)
                            </label>
                            <select
                                name="lote"
                                value={formData.lote}
                                onChange={(e) => setFormData(prev => ({ ...prev, lote: e.target.value }))}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            >
                                <option value="">Sin lote específico</option>
                                {lotes.map((lote: any) => (
                                    <option key={lote.id} value={lote.id}>
                                        {lote.nombre} - {lote.direccion}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Prioridad */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                Prioridad
                            </label>
                            <select
                                name="prioridad"
                                value={formData.prioridad}
                                onChange={(e) => setFormData(prev => ({ ...prev, prioridad: e.target.value }))}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            >
                                <option value="baja">🟢 Baja</option>
                                <option value="normal">🔵 Normal</option>
                                <option value="alta">🟠 Alta</option>
                                <option value="urgente">🔴 Urgente</option>
                            </select>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Descripción *
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                            rows={6}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                            placeholder="Describa detalladamente su solicitud..."
                            required
                        />
                        {actionData?.errors?.descripcion && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {actionData.errors.descripcion}
                            </p>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-100">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                            Enviar Solicitud
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

// ============================================================================
// VISTA: DETALLE
// ============================================================================

function DetailView({ request }: { request: any }) {
    const navigate = useNavigate();

    return (
        <div className="p-4">
            <button
                onClick={() => navigate('/owner/solicitudes')}
                className="text-blue-600 hover:text-blue-700 mb-4"
            >
                ← Volver
            </button>

            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-4">{request.titulo}</h1>
                <div className="space-y-4">
                    <div>
                        <span className="font-medium">Tipo:</span> {request.tipo_display}
                    </div>
                    <div>
                        <span className="font-medium">Estado:</span> {request.estado_display}
                    </div>
                    <div>
                        <span className="font-medium">Descripción:</span>
                        <p className="mt-2">{request.descripcion}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
