import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, useNavigation, useSubmit, useNavigate } from "@remix-run/react";
import { requireUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";
import GoBackButton from "~/components/GoBackButton";

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
    const user = await requireUser(request);

    if (user.role !== "owner") {
        throw redirect("/login");
    }

    try {
        // ✅ Usar endpoint de solicitudes
        const { res: requestsRes, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/solicitudes/mis_solicitudes/`,
            { method: "GET" }
        );

        let requests = [];
        if (requestsRes.ok) {
            const data = await requestsRes.json();
            requests = Array.isArray(data) ? data : (data.results || data.solicitudes || []);
            
            console.log(`[owner.solicitudes] Loaded ${requests.length} requests for ${user.email}`);
            
            // ✅ NUEVO: Log para debug - ver qué contiene la primera solicitud
            if (requests.length > 0) {
                console.log("[owner.solicitudes] First request sample:", {
                    id: requests[0].id,
                    titulo: requests[0].titulo,
                    notas_revision: requests[0].notas_revision,
                    estado: requests[0].estado,
                    revisor: requests[0].revisor
                });
            }
        } else {
            console.error(`[owner.solicitudes] Error loading requests: ${requestsRes.status}`);
            const errorText = await requestsRes.text();
            console.error(`[owner.solicitudes] Error details: ${errorText}`);
        }

        return json(
            {
                user,
                requests,
            },
            {
                headers: setCookieHeaders || new Headers()
            }
        );
    } catch (error) {
        console.error("[owner.solicitudes] Error:", error);
        return json({
            user,
            requests: [],
        });
    }
}

// ============================================================================
// ACTION
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "owner") {
        throw redirect("/login");
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create") {
        try {
            // ✅ CORREGIDO: Crear en /api/solicitudes/ para que el admin las vea
            const { res: createRes, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/solicitudes/`,  // ✅ Endpoint correcto
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tipo: formData.get("request_type") || "consulta_general",
                        titulo: formData.get("title"),
                        descripcion: formData.get("description"),
                        prioridad: formData.get("priority") || "normal",
                        lote: formData.get("lote") || null,
                    }),
                }
            );

            if (!createRes.ok) {
                const errorData = await createRes.json();
                console.error("[owner.solicitudes] Create error:", errorData);
                return json({
                    success: false,
                    error: errorData.error || "Error al crear la solicitud",
                }, { 
                    status: createRes.status,
                    headers: setCookieHeaders || new Headers()
                });
            }

            const data = await createRes.json();
            console.log("[owner.solicitudes] Request created:", data.id || data);

            return json({
                success: true,
                message: "Solicitud creada exitosamente",
            }, {
                headers: setCookieHeaders || new Headers()
            });
        } catch (error) {
            console.error("[owner.solicitudes] Action error:", error);
            return json({
                success: false,
                error: "Error al crear la solicitud",
            }, { status: 500 });
        }
    }

    return json({ success: false, error: "Intent desconocido" }, { status: 400 });
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function OwnerSolicitudes() {
    const { user, requests } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const navigate = useNavigate(); // ✅ NUEVO: Hook para navegación

    const isLoading = navigation.state === "loading";

    // ✅ NUEVO: Función para volver atrás
    const handleGoBack = () => {
        navigate(-1); // Vuelve a la página anterior
        // O si prefieres ir a una ruta específica:
        // navigate("/owner");
    };

    return (
        <div className="p-6">
            {/* ✅ NUEVO: Header con botón de volver */}
            <div className="mb-6">
                {/* Título y acciones */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes</h1>
                        <p className="text-gray-600 mt-1">
                            Gestiona y da seguimiento a tus solicitudes
                        </p>
                    </div>
                    <Link
                        to="/owner/solicitudes/nueva"
                        className="px-4 py-2 bg-lateral-600 text-white rounded-lg hover:bg-lateral-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Solicitud
                    </Link>
                </div>
            </div>

            {/* Lista de solicitudes */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lateral-600"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes solicitudes</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Comienza creando una nueva solicitud.
                    </p>
                    <div className="mt-6">
                        <Link
                            to="/owner/solicitudes/nueva"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-lateral-600 hover:bg-lateral-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Solicitud
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req: any) => (
                        <div key={req.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                            {/* ✅ ELIMINADO: flex justify-between - Ya no hay botón de acciones */}
                            <div className="w-full">
                                {/* Header de la solicitud */}
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {req.titulo || req.title}
                                    </h3>
                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                        {req.tipo_display || req.request_type_display || req.tipo || req.request_type}
                                    </span>
                                </div>

                                {/* Descripción */}
                                <p className="text-sm text-gray-600 mb-4">
                                    {req.descripcion || req.description}
                                </p>

                                {/* Estado y Metadata */}
                                <div className="flex items-center gap-3 flex-wrap mb-4">
                                    {/* Estado */}
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                        (req.estado || req.status) === 'pendiente' || (req.estado || req.status) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        (req.estado || req.status) === 'en_revision' || (req.estado || req.status) === 'in_review' ? 'bg-blue-100 text-blue-800' :
                                        (req.estado || req.status) === 'completado' || (req.estado || req.status) === 'completed' ? 'bg-green-100 text-green-800' :
                                        (req.estado || req.status) === 'rechazado' || (req.estado || req.status) === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {req.estado_display || req.status_display || req.estado || req.status}
                                    </span>

                                    {/* Prioridad */}
                                    {(req.prioridad || req.priority) && (
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                            (req.prioridad || req.priority) === 'urgente' || (req.prioridad || req.priority) === 'urgent' ? 'bg-red-100 text-red-800' :
                                            (req.prioridad || req.priority) === 'alta' || (req.prioridad || req.priority) === 'high' ? 'bg-orange-100 text-orange-800' :
                                            (req.prioridad || req.priority) === 'normal' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {req.prioridad_display || req.priority_display || req.prioridad || req.priority}
                                        </span>
                                    )}

                                    {/* Fecha de creación */}
                                    <span className="text-xs text-gray-500">
                                        {new Date(req.created_at).toLocaleDateString('es-CO', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>

                                    {/* Fecha de resolución */}
                                    {(req.resuelta_at || req.resolved_at) && (
                                        <span className="text-xs text-gray-500">
                                            Resuelta: {new Date(req.resuelta_at || req.resolved_at).toLocaleDateString('es-CO')}
                                        </span>
                                    )}
                                </div>

                                {/* ✅ CRÍTICO: Respuesta del Admin - Verificar notas_revision */}
                                {req.notas_revision && req.notas_revision.trim() ? (
                                    <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm font-semibold text-blue-900">
                                                        Respuesta del Administrador
                                                    </div>
                                                    {(req.updated_at || req.resuelta_at || req.resolved_at) && (
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(req.updated_at || req.resuelta_at || req.resolved_at).toLocaleString('es-CO')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="bg-white p-3 rounded-md border border-blue-200">
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                        {req.notas_revision}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300 rounded-md">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Aún no ha sido respondida por un administrador.</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ✅ ELIMINADO: Botón "Ver detalles" */}
                        </div>
                    ))}
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
                <Form method="post" className="space-y-8" noValidate>
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

                        {/* Prioridad con SVG en lugar de emoji */}
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
                                <option value="baja">Baja</option>
                                <option value="normal">Normal</option>
                                <option value="alta">Alta</option>
                                <option value="urgente">Urgente</option>
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
