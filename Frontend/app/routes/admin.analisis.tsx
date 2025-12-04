import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, Form, useActionData } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { requireUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "admin") {
        return redirect(`/${user.role}`);
    }

    try {
        // Obtener análisis y estadísticas
        const [analisisRes, statsRes] = await Promise.all([
            fetchWithAuth(request, `${API_URL}/api/analisis/`),
            fetchWithAuth(request, `${API_URL}/api/analisis/estadisticas/`)
        ]);

        let analisis = [];
        let estadisticas = {};

        if (analisisRes.res.ok) {
            const data = await analisisRes.res.json();
            analisis = Array.isArray(data) ? data : (data.results || []);
        }

        if (statsRes.res.ok) {
            estadisticas = await statsRes.res.json();
        }

        return json({ user, analisis, estadisticas });
    } catch (error) {
        console.error("Error loading analisis:", error);
        return json({ 
            user, 
            analisis: [], 
            estadisticas: {},
            error: "Error al cargar análisis" 
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "admin") {
        return redirect(`/${user.role}`);
    }

    const formData = await request.formData();
    const intent = formData.get("intent");
    const analisisId = formData.get("analisis_id");

    console.log("[Admin Analisis Action] Intent:", intent);
    console.log("[Admin Analisis Action] Analisis ID:", analisisId);

    if (!analisisId) {
        return json({ 
            success: false, 
            error: "ID de análisis no proporcionado" 
        }, { status: 400 });
    }

    // ✅ ELIMINADO: Intent generar_ia (ya no está aquí)
    // Solo aprobar_ia se maneja aquí

    if (intent === "aprobar_ia") {
        try {
            const { res } = await fetchWithAuth(
                request,
                `${API_URL}/api/analisis/${analisisId}/aprobar_ia/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        notas_revision: formData.get("notas_revision")
                    })
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                return json({ 
                    success: false, 
                    error: errorData.error || "Error al aprobar" 
                });
            }

            return json({ 
                success: true, 
                intent: 'aprobar_ia', 
                message: "Análisis aprobado y enviado" 
            });

        } catch (error) {
            console.error("Error:", error);
            return json({ 
                success: false, 
                error: "Error al aprobar análisis" 
            });
        }
    }

    return json({ success: false, error: "Intent inválido" });
}

export default function AdminAnalisis() {
    const { user, analisis, estadisticas, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<any>();
    const navigate = useNavigate();

    const [selectedAnalisis, setSelectedAnalisis] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [notasRevision, setNotasRevision] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // ✅ NUEVO: Effect para mostrar modal cuando llega la respuesta
    useEffect(() => {
        if (actionData?.success && actionData?.intent === 'generar_ia' && actionData?.data) {
            console.log("[AdminAnalisis] Mostrando modal con respuesta IA");
            setShowModal(true);
        }
    }, [actionData]);

    const getStatusBadge = (estado: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
            'en_proceso': { bg: 'bg-blue-100', text: 'text-blue-800' },
            'completado': { bg: 'bg-green-100', text: 'text-green-800' },
            'rechazado': { bg: 'bg-red-100', text: 'text-red-800' }
        };
        return badges[estado] || badges.pendiente;
    };

    // ✅ CORREGIDO: Manejar generación con formulario directo
    const handleGenerarIA = (analisisItem: any) => {
        console.log("[AdminAnalisis] Iniciando generación IA para:", analisisItem.id);
        setSelectedAnalisis(analisisItem);
        setIsGenerating(true);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Análisis Urbanísticos con IA</h1>
                <p className="text-gray-600 mt-1">Gestiona solicitudes de análisis con Gemini AI</p>
            </div>

            {/* Estadísticas */}
            {estadisticas && Object.keys(estadisticas).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{estadisticas.total || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                📊
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pendientes</p>
                                <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                ⏳
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">En Proceso</p>
                                <p className="text-2xl font-bold text-blue-600">{estadisticas.en_proceso || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                🔄
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Completados</p>
                                <p className="text-2xl font-bold text-green-600">{estadisticas.completados || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                ✅
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alertas */}
            {actionData?.success && actionData?.message && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <p className="text-green-800">{actionData.message}</p>
                </div>
            )}

            {(error || actionData?.error) && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="text-red-700">{error || actionData?.error}</p>
                </div>
            )}

            {/* Lista de Análisis */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {analisis.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    #{item.id.slice(0, 8)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {item.tipo_analisis_display}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {item.lote_info?.nombre || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {item.solicitante_info?.full_name || item.solicitante_info?.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(item.estado).bg} ${getStatusBadge(item.estado).text}`}>
                                        {item.estado_display}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(item.created_at).toLocaleDateString('es-CO')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {/* ✅ ELIMINADO: Botón de generar IA aquí */}
                                    <button
                                        onClick={() => navigate(`/admin/analisisa/${item.id}`)}
                                        className="text-lateral-600 hover:text-lateral-800"
                                    >
                                        Ver Detalle
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {analisis.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No hay análisis para mostrar</p>
                    </div>
                )}
            </div>

            {/* ✅ CORREGIDO: Modal de respuesta IA */}
            {showModal && actionData?.data && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <span className="text-3xl">🤖</span>
                                        Respuesta de Gemini AI
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Modelo: {actionData.data.modelo || 'gemini-pro'} • 
                                        {actionData.data.tokens_usados} tokens • 
                                        {actionData.data.tiempo_respuesta?.toFixed(2)}s
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setIsGenerating(false);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Respuesta IA */}
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 mb-6 border-2 border-purple-200">
                                <div className="prose max-w-none">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                                        {actionData.data.respuesta}
                                    </pre>
                                </div>
                            </div>

                            {/* Notas de revisión y aprobar */}
                            <Form method="post">
                                <input type="hidden" name="intent" value="aprobar_ia" />
                                <input type="hidden" name="analisis_id" value={selectedAnalisis?.id} />
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notas de Revisión (opcional)
                                    </label>
                                    <textarea
                                        name="notas_revision"
                                        value={notasRevision}
                                        onChange={(e) => setNotasRevision(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-lateral-500 focus:outline-none"
                                        placeholder="Agrega comentarios adicionales para el propietario..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setIsGenerating(false);
                                        }}
                                        className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Aprobar y Enviar al Propietario
                                    </button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
