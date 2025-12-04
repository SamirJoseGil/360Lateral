import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

// ============================================================================
// TIPOS
// ============================================================================

type LoaderData = {
    user: any;
    view: 'list' | 'detail';
    solicitudes: any[];
    selectedSolicitud?: any;
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
        const url = new URL(request.url);
        const solicitudId = url.searchParams.get("id");

        // ✅ CRÍTICO: Usar fetchWithAuth para enviar cookies
        const { res: response, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/solicitudes/`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Admin Solicitudes] Error:", errorText);
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        // ✅ NUEVO: Logging detallado para debug
        console.log("[Admin Solicitudes] Raw response type:", typeof data);
        console.log("[Admin Solicitudes] Is array?", Array.isArray(data));
        console.log("[Admin Solicitudes] Data keys:", Object.keys(data));
        console.log("[Admin Solicitudes] Data:", JSON.stringify(data, null, 2));

        // ✅ MEJORADO: Extraer el array correctamente
        let solicitudes: any[] = [];
        
        if (Array.isArray(data)) {
            // Si es array directo
            solicitudes = data;
            console.log("[Admin Solicitudes] Array directo:", solicitudes.length);
        } else if (data.results && Array.isArray(data.results)) {
            // Si es paginado (DRF)
            solicitudes = data.results;
            console.log("[Admin Solicitudes] Array en results:", solicitudes.length);
        } else if (data.solicitudes && Array.isArray(data.solicitudes)) {
            // Si está en data.solicitudes
            solicitudes = data.solicitudes;
            console.log("[Admin Solicitudes] Array en solicitudes:", solicitudes.length);
        } else {
            // Ultimo recurso: ver si data tiene elementos
            console.warn("[Admin Solicitudes] Formato desconocido, intentando extraer...");
            console.log("[Admin Solicitudes] Data structure:", data);
        }

        console.log(`[Admin Solicitudes] Final count: ${solicitudes.length} solicitudes`);
        if (solicitudes.length > 0) {
            console.log("[Admin Solicitudes] First solicitud:", solicitudes[0]);
        }

        // Si hay ID, obtener detalle
        let selectedSolicitud = null;
        if (solicitudId) {
            const { res: detailResponse } = await fetchWithAuth(
                request,
                `${API_URL}/api/solicitudes/${solicitudId}/`
            );
            if (detailResponse.ok) {
                selectedSolicitud = await detailResponse.json();
            }
        }

        return json<LoaderData>({
            user,
            view: solicitudId ? 'detail' : 'list',
            solicitudes,
            selectedSolicitud,
            error: undefined
        }, {
            headers: setCookieHeaders
        });

    } catch (error) {
        console.error("[Admin Solicitudes] Catch error:", error);
        return json<LoaderData>({
            user,
            view: 'list',
            solicitudes: [],
            error: "Error al cargar solicitudes"
        });
    }
}

// ============================================================================
// ACTION
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return json<ActionData>({
            success: false,
            error: "No autorizado"
        }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const intent = formData.get("intent");
        const solicitudId = formData.get("solicitudId") as string;
        const action = formData.get("action") as string;
        const comments = formData.get("comments") as string;

        if (intent === "cambiar_estado") {
            // ✅ Usar fetchWithAuth
            const { res: response, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/solicitudes/${solicitudId}/cambiar_estado/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        estado: action,
                        notas: comments
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                return json<ActionData>({
                    success: false,
                    error: errorData.error || "Error al actualizar"
                }, { status: response.status });
            }

            const result = await response.json();

            return json<ActionData>({
                success: true,
                message: result.message || "Estado actualizado correctamente"
            }, {
                headers: setCookieHeaders
            });
        }

        return json<ActionData>({
            success: false,
            error: "Acción no válida"
        });

    } catch (error) {
        console.error("Error in action:", error);
        return json<ActionData>({
            success: false,
            error: "Error al procesar la acción"
        }, { status: 500 });
    }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminSolicitudes() {
    const data = useLoaderData<LoaderData>();
    const actionData = useActionData<ActionData>();
    const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
    const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);

    // Si hay solicitud seleccionada en data, usarla
    useEffect(() => {
        if (data.selectedSolicitud) {
            setSelectedSolicitud(data.selectedSolicitud);
            setCurrentView('detail');
        }
    }, [data.selectedSolicitud]);

    if (currentView === 'detail' && selectedSolicitud) {
        return <DetailView
            solicitud={selectedSolicitud}
            onBack={() => {
                setCurrentView('list');
                setSelectedSolicitud(null);
            }}
            actionData={actionData}
        />;
    }

    return <ListView
        solicitudes={data.solicitudes}
        error={data.error}
        onSelectSolicitud={(sol) => {
            setSelectedSolicitud(sol);
            setCurrentView('detail');
        }}
    />;
}

// ============================================================================
// VISTA: LISTA
// ============================================================================

function ListView({
    solicitudes,
    error,
    onSelectSolicitud
}: {
    solicitudes: any[],
    error?: string,
    onSelectSolicitud: (sol: any) => void
}) {
    // ✅ MEJORADO: Log más detallado
    console.log("[ListView] Rendering");
    console.log("[ListView] Solicitudes count:", solicitudes.length);
    console.log("[ListView] Solicitudes is array?", Array.isArray(solicitudes));
    console.log("[ListView] First 3 solicitudes:", solicitudes.slice(0, 3));

    const getStatusBadge = (estado: string) => {
        const badges: Record<string, string> = {
            pendiente: "bg-yellow-100 text-yellow-800",
            en_revision: "bg-blue-100 text-blue-800",
            aprobado: "bg-green-100 text-green-800",
            rechazado: "bg-red-100 text-red-800",
            completado: "bg-gray-100 text-gray-800"
        };
        return badges[estado] || badges.pendiente;
    };

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-6">Gestión de Solicitudes</h1>

            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* ✅ CORREGIDO: Verificar correctamente */}
            {Array.isArray(solicitudes) && solicitudes.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {solicitudes.map((sol: any) => (
                                <tr key={sol.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sol.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {sol.usuario_email || sol.user_info?.email || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {sol.tipo_display}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{sol.titulo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(sol.estado)}`}>
                                            {sol.estado_display}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(sol.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => onSelectSolicitud(sol)}
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
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No hay solicitudes</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        {error ? error : "No se encontraron solicitudes en el sistema"}
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
    solicitud,
    onBack,
    actionData
}: {
    solicitud: any,
    onBack: () => void,
    actionData?: ActionData
}) {
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState<string>("");
    const [comments, setComments] = useState("");

    const openModal = (action: string) => {
        setModalAction(action);
        setComments("");
        setShowModal(true);
    };

    const getStatusBadge = (estado: string) => {
        const badges: Record<string, { bg: string, text: string }> = {
            pendiente: { bg: "bg-yellow-100", text: "text-yellow-800" },
            en_revision: { bg: "bg-blue-100", text: "text-blue-800" },
            aprobado: { bg: "bg-green-100", text: "text-green-800" },
            rechazado: { bg: "bg-red-100", text: "text-red-800" },
            completado: { bg: "bg-gray-100", text: "text-gray-800" }
        };
        return badges[estado] || badges.pendiente;
    };

    const badge = getStatusBadge(solicitud.estado);

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
                {/* Success/Error Messages */}
                {actionData?.success && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                        <p className="text-sm text-green-700">{actionData.message}</p>
                    </div>
                )}
                {actionData?.error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <p className="text-sm text-red-700">{actionData.error}</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{solicitud.titulo}</h1>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text}`}>
                            {solicitud.estado_display}
                        </span>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <p>ID: {solicitud.id}</p>
                        <p>Creada: {new Date(solicitud.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                </div>

                {/* Información */}
                <div className="space-y-4 mb-6">
                    <div>
                        <span className="font-medium">Tipo:</span> {solicitud.tipo_display}
                    </div>
                    <div>
                        <span className="font-medium">Usuario:</span> {solicitud.usuario_email || solicitud.user_info?.email}
                    </div>
                    {solicitud.lote_info && (
                        <div>
                            <span className="font-medium">Lote:</span> {solicitud.lote_info.nombre}
                        </div>
                    )}
                    <div>
                        <span className="font-medium">Descripción:</span>
                        <p className="mt-2 text-gray-700 whitespace-pre-wrap">{solicitud.descripcion}</p>
                    </div>
                    {/* ✅ NUEVO: Mostrar prioridad */}
                    <div>
                        <span className="font-medium">Prioridad:</span> {solicitud.prioridad_display || solicitud.prioridad}
                    </div>
                </div>

                {/* Acciones */}
                {solicitud.estado === 'pendiente' && (
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={() => openModal('en_revision')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Poner en Revisión
                        </button>
                        <button
                            onClick={() => openModal('completado')}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Completar
                        </button>
                        <button
                            onClick={() => openModal('rechazado')}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Rechazar
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium">
                                {modalAction === 'completado' && 'Completar Solicitud'}
                                {modalAction === 'rechazado' && 'Rechazar Solicitud'}
                                {modalAction === 'en_revision' && 'Poner en Revisión'}
                            </h3>
                        </div>

                        <Form method="post" onSubmit={() => setShowModal(false)}>
                            <input type="hidden" name="intent" value="cambiar_estado" />
                            <input type="hidden" name="solicitudId" value={solicitud.id} />
                            <input type="hidden" name="action" value={modalAction} />

                            <div className="px-6 py-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Comentarios {modalAction === 'rechazado' && '(requeridos)'}
                                </label>
                                <textarea
                                    name="comments"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    placeholder="Agrega comentarios..."
                                    required={modalAction === 'rechazado'}
                                />
                            </div>

                            <div className="px-6 py-4 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (modalAction === 'rechazado' && !comments)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                                >
                                    {isSubmitting ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    );
}
