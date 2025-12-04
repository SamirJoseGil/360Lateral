import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, Form, useActionData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { requireUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";
import ReactMarkdown from 'react-markdown';

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "admin") {
        return redirect(`/${user.role}`);
    }

    try {
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/analisis/${params.id}/`
        );

        if (!res.ok) {
            throw new Error("Análisis no encontrado");
        }

        const analisis = await res.json();

        return json({ user, analisis }, { headers: setCookieHeaders });
    } catch (error) {
        console.error("Error loading analisis:", error);
        return redirect("/admin/analisis");
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "admin") {
        return redirect(`/${user.role}`);
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    console.log("=== ADMIN ANALISIS DETAIL ACTION START ===");
    console.log("Intent:", intent);
    console.log("Params ID:", params.id);
    console.log("FormData keys:", Array.from(formData.keys()));
    console.log("FormData values:", Object.fromEntries(formData.entries()));

    // ✅ CRÍTICO: Validar intent
    if (!intent) {
        console.error("[Action] Intent missing");
        return json({ 
            success: false, 
            error: "Intent no proporcionado" 
        }, { status: 400 });
    }

    if (intent === "iniciar") {
        try {
            console.log(`[Action] Iniciando análisis: ${params.id}`);
            
            const { res } = await fetchWithAuth(
                request,
                `${API_URL}/api/analisis/${params.id}/iniciar_proceso/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                }
            );

            console.log("[Action] Iniciar - Status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                console.error("[Action] Iniciar error:", errorData);
                return json({ success: false, error: errorData.error });
            }

            const data = await res.json();
            console.log("[Action] Iniciar exitoso:", data);

            return json({ success: true, intent: 'iniciar' });

        } catch (error) {
            console.error("[Action] Iniciar catch error:", error);
            return json({ success: false, error: "Error al iniciar análisis" });
        }
    }

    // ✅ NUEVO: Generar con IA (MOVIDO AQUÍ)
    if (intent === "generar_ia") {
        try {
            console.log(`[Action] 🤖 Generando IA para análisis: ${params.id}`);
            
            const { res } = await fetchWithAuth(
                request,
                `${API_URL}/api/analisis/${params.id}/generar_ia/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                }
            );

            console.log("[Action] Generar IA - Status:", res.status);
            console.log("[Action] Generar IA - Headers:", Object.fromEntries(res.headers.entries()));

            if (!res.ok) {
                const errorText = await res.text();
                console.error("[Action] Generar IA error - Raw:", errorText);
                
                try {
                    const errorData = JSON.parse(errorText);
                    console.error("[Action] Generar IA error - Parsed:", errorData);
                    return json({ 
                        success: false, 
                        error: errorData.error || "Error al generar análisis" 
                    });
                } catch {
                    return json({ 
                        success: false, 
                        error: `Error ${res.status}: ${errorText}` 
                    });
                }
            }

            const data = await res.json();
            console.log("[Action] ✅ Respuesta IA generada exitosamente");
            console.log("[Action] Data keys:", Object.keys(data));
            console.log("[Action] Data.data keys:", data.data ? Object.keys(data.data) : 'no data.data');
            console.log("[Action] Respuesta preview:", data.data?.respuesta?.substring(0, 100));
            
            return json({ 
                success: true, 
                intent: 'generar_ia',
                data: data.data 
            });

        } catch (error) {
            console.error("[Action] Generar IA catch error:", error);
            return json({ 
                success: false, 
                error: "Error al generar análisis con IA" 
            });
        }
    }

    if (intent === "rechazar") {
        try {
            const motivo = formData.get("motivo");
            console.log(`[Action] Rechazando análisis: ${params.id}, motivo:`, motivo);

            const { res } = await fetchWithAuth(
                request,
                `${API_URL}/api/analisis/${params.id}/rechazar/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ motivo })
                }
            );

            console.log("[Action] Rechazar - Status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                console.error("[Action] Rechazar error:", errorData);
                return json({ success: false, error: errorData.error });
            }

            console.log("[Action] Rechazar exitoso");
            return redirect("/admin/analisis");

        } catch (error) {
            console.error("[Action] Rechazar catch error:", error);
            return json({ success: false, error: "Error al rechazar análisis" });
        }
    }

    // ✅ CORREGIDO: Aprobar IA (leer FormData, no JSON)
    if (intent === "aprobar_ia") {
        try {
            // ✅ CRÍTICO: Extraer datos de FormData
            const respuestaIA = formData.get("respuesta_ia");
            const notasRevision = formData.get("notas_revision");
            const metadata = formData.get("metadata");
            
            console.log(`[Action] Aprobando IA para: ${params.id}`);
            console.log(`[Action] respuesta_ia length: ${typeof respuestaIA === 'string' ? respuestaIA.length : 0}`);
            console.log(`[Action] notas_revision: ${notasRevision}`);
            console.log(`[Action] metadata: ${metadata}`);
            
            // ✅ Validar que respuesta_ia exista y no esté vacía
            if (!respuestaIA || typeof respuestaIA !== 'string' || respuestaIA.trim().length === 0) {
                console.error("[Action] respuesta_ia vacía o inválida");
                return json({ 
                    success: false, 
                    error: "La respuesta de IA no puede estar vacía" 
                }, { status: 400 });
            }
            
            // ✅ Parsear metadata si es string
            let metadataObj = {};
            if (metadata && typeof metadata === 'string') {
                try {
                    metadataObj = JSON.parse(metadata);
                } catch (e) {
                    console.error("[Action] Error parsing metadata:", e);
                }
            }
            
            const { res } = await fetchWithAuth(
                request,
                `${API_URL}/api/analisis/${params.id}/aprobar_ia/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        respuesta_ia: respuestaIA,
                        notas_revision: notasRevision || "",
                        metadata: metadataObj
                    })
                }
            );

            console.log("[Action] Aprobar IA - Status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                console.error("[Action] Aprobar IA error:", errorData);
                return json({ 
                    success: false, 
                    error: errorData.error || "Error al aprobar" 
                });
            }

            const data = await res.json();
            console.log("[Action] Aprobar IA exitoso:", data);

            return json({ 
                success: true, 
                intent: 'aprobar_ia',
                message: "Análisis aprobado y enviado al propietario" 
            });

        } catch (error) {
            console.error("[Action] Aprobar IA catch error:", error);
            return json({ 
                success: false, 
                error: "Error al aprobar análisis" 
            });
        }
    }

    console.error("[Action] Intent desconocido:", intent);
    return json({ success: false, error: "Intent inválido" });
}

export default function AdminAnalisisDetalle() {
    const { user, analisis } = useLoaderData<typeof loader>();
    const actionData = useActionData<any>();
    const navigate = useNavigate();
    const fetcher = useFetcher();  // ✅ NUEVO: Usar fetcher de Remix

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState("");
    const [showIAModal, setShowIAModal] = useState(false);
    const [notasRevision, setNotasRevision] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    
    // ✅ Estados para respuesta IA editable
    const [respuestaIA, setRespuestaIA] = useState("");
    const [respuestaIAOriginal, setRespuestaIAOriginal] = useState("");
    const [metadataIA, setMetadataIA] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    // ✅ NUEVO: Debug en console
    useEffect(() => {
        console.log("=== ADMIN ANALISIS DETAIL COMPONENT ===");
        console.log("Analisis ID:", analisis?.id);
        console.log("Analisis Estado:", analisis?.estado);
        console.log("Esta en proceso:", analisis?.esta_en_proceso);
        console.log("Tiene resultados IA:", !!analisis?.resultados?.respuesta_ia);
        console.log("ActionData:", actionData);
    }, [analisis, actionData]);

    // ✅ NUEVO: Mostrar modal cuando llega la respuesta IA
    useEffect(() => {
        if (actionData?.success && actionData?.intent === 'generar_ia' && actionData?.data) {
            console.log("[Component] Mostrando modal IA con datos:", actionData.data);
            setShowIAModal(true);
            setIsGenerating(false);
        }
    }, [actionData]);

    // ✅ NUEVO: Reset generating cuando hay error
    useEffect(() => {
        if (actionData?.error) {
            console.error("[Component] Error en actionData:", actionData.error);
            setIsGenerating(false);
        }
    }, [actionData?.error]);

    const getStatusBadge = (estado: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
            'en_proceso': { bg: 'bg-blue-100', text: 'text-blue-800' },
            'completado': { bg: 'bg-green-100', text: 'text-green-800' },
            'rechazado': { bg: 'bg-red-100', text: 'text-red-800' }
        };
        return badges[estado] || badges.pendiente;
    };

    // ✅ CORREGIDO: Usar fetcher.submit en lugar de fetch
    const handleGenerarIA = () => {
        console.log("[Component] 🤖 Generando IA con fetcher...");
        setIsGenerating(true);
        setRespuestaIA("");
        setMetadataIA(null);

        // ✅ CRÍTICO: Usar fetcher.submit con Form
        fetcher.submit(
            { intent: "generar_ia" },
            { method: "post" }
        );
    };

    // ✅ NUEVO: Detectar cuando fetcher completa
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            if (fetcher.data.success && fetcher.data.intent === 'generar_ia' && fetcher.data.data) {
                console.log("[Component] ✅ Respuesta IA recibida via fetcher");
                
                // Guardar respuesta editable
                setRespuestaIA(fetcher.data.data.respuesta);
                setRespuestaIAOriginal(fetcher.data.data.respuesta);
                setMetadataIA({
                    modelo: fetcher.data.data.modelo,
                    tokens_usados: fetcher.data.data.tokens_usados,
                    tiempo_respuesta: fetcher.data.data.tiempo_respuesta
                });

                // Mostrar modal
                setShowIAModal(true);
                setIsGenerating(false);
            } else if (fetcher.data.error) {
                console.error("[Component] Error en fetcher:", fetcher.data.error);
                setIsGenerating(false);
            }
        }
    }, [fetcher.state, fetcher.data]);

    // ✅ CORREGIDO: Guardar respuesta editada con fetcher
    const handleGuardarRespuestaIA = () => {
        console.log("[Component] 💾 Guardando respuesta IA editada...");
        console.log("[Component] Respuesta IA longitud:", respuestaIA.length);
        console.log("[Component] Notas revisión:", notasRevision);
        console.log("[Component] Metadata:", metadataIA);

        // ✅ CRÍTICO: Validar que respuestaIA no esté vacía
        if (!respuestaIA || respuestaIA.trim().length === 0) {
            alert("La respuesta de IA no puede estar vacía");
            return;
        }

        // ✅ CRÍTICO: Enviar como FormData tradicional
        fetcher.submit(
            {
                intent: "aprobar_ia",
                respuesta_ia: respuestaIA,
                notas_revision: notasRevision || "",
                metadata: JSON.stringify(metadataIA || {})
            },
            { 
                method: "post"
                // ✅ NO especificar encType, dejar que Remix use el default (FormData)
            }
        );
    };

    // ✅ NUEVO: Cerrar modal y recargar cuando se apruebe exitosamente
    useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.intent === 'aprobar_ia') {
            console.log("[Component] ✅ Análisis aprobado exitosamente");
            setShowIAModal(false);
            // Recargar página para ver cambios
            window.location.reload();
        }
    }, [fetcher.data]);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-lateral-600 transition-colors group"
                >
                    <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Volver</span>
                </button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Análisis #{analisis.id.slice(0, 8)}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {analisis.tipo_analisis_display} - {analisis.lote_info?.nombre}
                        </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(analisis.estado).bg} ${getStatusBadge(analisis.estado).text}`}>
                        {analisis.estado_display}
                    </span>
                </div>
            </div>

            {/* Alertas */}
            {actionData?.success && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <p className="text-green-800">Operación exitosa</p>
                </div>
            )}

            {actionData?.error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="text-red-700">{actionData.error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Datos del Lote */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Lote</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Nombre</p>
                                <p className="font-medium">{analisis.lote_info?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Dirección</p>
                                <p className="font-medium">{analisis.lote_info?.direccion}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">CBML</p>
                                <p className="font-medium">{analisis.lote_info?.cbml || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Área</p>
                                <p className="font-medium">{analisis.lote_info?.area ? `${analisis.lote_info.area} m²` : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Comentarios del Solicitante */}
                    {analisis.comentarios_solicitante && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Comentarios del Solicitante</h2>
                            <p className="text-gray-700 whitespace-pre-wrap">{analisis.comentarios_solicitante}</p>
                        </div>
                    )}

                    {/* ✅ NUEVO: Mostrar respuesta IA si existe */}
                    {analisis.esta_completado && analisis.resultados?.respuesta_ia && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-2xl">🤖</span>
                                Análisis Generado por IA
                            </h2>
                            
                            <div className="mb-4 flex items-center gap-2">
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                    {analisis.resultados.modelo_ia || 'Gemini AI'}
                                </span>
                                {analisis.resultados.tokens && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        {analisis.resultados.tokens} tokens
                                    </span>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
                                {/* Previsualizador Markdown */}
                                <div className="prose prose-sm max-w-none text-gray-800">
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-blue-900 mb-4 mt-6" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-blue-800 mb-3 mt-5" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-blue-700 mb-2 mt-4" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-3 leading-relaxed" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                                            li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-bold text-blue-900" {...props} />,
                                            em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
                                            code: ({ node, inline, ...props }: any) => 
                                                inline 
                                                    ? <code className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono" {...props} />
                                                    : <code className="block p-3 bg-gray-800 text-green-400 rounded font-mono text-xs overflow-x-auto" {...props} />,
                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-3" {...props} />,
                                        }}
                                    >
                                        {analisis.resultados.respuesta_ia}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {analisis.resultados.aprobado_por && (
                                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                                    <p className="text-sm text-blue-800">
                                        ✅ Revisado y aprobado por: <strong>{analisis.resultados.aprobado_por}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ✅ MEJORADO: Mostrar respuesta IA en proceso */}
                    {analisis.esta_en_proceso && analisis.resultados?.respuesta_ia && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-2xl">🤖</span>
                                Análisis IA (Pendiente de Aprobación)
                            </h2>
                            
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-yellow-800 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Este análisis ha sido generado por IA pero aún no ha sido revisado y aprobado
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
                                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                                    {analisis.resultados.respuesta_ia}
                                </pre>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => {
                                        setRespuestaIA(analisis.resultados.respuesta_ia);
                                        setRespuestaIAOriginal(analisis.resultados.respuesta_ia);
                                        setMetadataIA({
                                            modelo: analisis.resultados.modelo_ia,
                                            tokens_usados: analisis.resultados.tokens,
                                            tiempo_respuesta: analisis.resultados.tiempo_respuesta
                                        });
                                        setShowIAModal(true);
                                    }}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Editar y Aprobar
                                </button>
                                
                                <button
                                    onClick={handleGenerarIA}
                                    disabled={isGenerating}
                                    className="flex-1 px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {isGenerating ? "Regenerando..." : "Regenerar con IA"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Detalles */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Detalles</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Tipo de Análisis</p>
                                <p className="font-medium">{analisis.tipo_analisis_display}</p>
                            </div>

                            {analisis.incluir_vis && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="font-medium">Incluye VIS</span>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-500">Solicitado</p>
                                <p className="font-medium">
                                    {new Date(analisis.created_at).toLocaleString('es-CO')}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Solicitante</p>
                                <p className="font-medium">{analisis.solicitante_info?.full_name}</p>
                                <p className="text-sm text-gray-500">{analisis.solicitante_info?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Acciones */}
                    {analisis.esta_pendiente && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Acciones</h3>
                            <div className="space-y-2">
                                <Form method="post">
                                    <input type="hidden" name="intent" value="iniciar" />
                                    <button
                                        type="submit"
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Iniciar Análisis
                                    </button>
                                </Form>

                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="w-full px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ✅ NUEVO: Botón "Generar con IA" para análisis en proceso SIN respuesta */}
                    {analisis.esta_en_proceso && !analisis.resultados?.respuesta_ia && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Generar Análisis</h3>
                            <button
                                onClick={handleGenerarIA}
                                disabled={isGenerating}
                                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Generando con IA...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        🤖 Generar con IA
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Genera un análisis automatizado con Gemini AI
                            </p>
                        </div>
                    )}

                    {/* ✅ CORREGIDO: Analista (solo si está en proceso) */}
                    {analisis.esta_en_proceso && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Analista</h3>
                            {analisis.analista_info && (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-lateral-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium">{analisis.analista_info.full_name}</p>
                                        <p className="text-sm text-gray-500">{analisis.analista_info.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Rechazo */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Rechazar Análisis</h3>
                        
                        <Form method="post">
                            <input type="hidden" name="intent" value="rechazar" />
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Motivo del Rechazo
                                </label>
                                <textarea
                                    name="motivo"
                                    value={motivoRechazo}
                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                                    placeholder="Explica el motivo del rechazo..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!motivoRechazo.trim()}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Rechazar
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}

            {/* ✅ CORREGIDO: Modal editable con Markdown Preview */}
            {showIAModal && respuestaIA && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b flex-shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <span className="text-3xl">🤖</span>
                                        Respuesta de Gemini AI
                                    </h2>
                                    {metadataIA && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Modelo: {metadataIA.modelo || 'gemini-pro'} • 
                                            {metadataIA.tokens_usados} tokens • 
                                            {metadataIA.tiempo_respuesta?.toFixed(2)}s
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowIAModal(false);
                                        setRespuestaIA("");
                                        setMetadataIA(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content con Tabs */}
                        <div className="flex-1 overflow-auto p-6">
                            {/* Tabs */}
                            <div className="flex items-center gap-2 mb-4 border-b">
                                <button
                                    onClick={() => setActiveTab('edit')}
                                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                                        activeTab === 'edit'
                                            ? 'text-purple-600 border-purple-600'
                                            : 'text-gray-500 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Editar
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                                        activeTab === 'preview'
                                            ? 'text-purple-600 border-purple-600'
                                            : 'text-gray-500 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Vista Previa
                                    </div>
                                </button>
                                <button
                                    onClick={() => setRespuestaIA(respuestaIAOriginal)}
                                    className="ml-auto text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Restaurar Original
                                </button>
                            </div>

                            {/* Tab Content: Editar */}
                            {activeTab === 'edit' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Respuesta IA (Editable)
                                    </label>
                                    <textarea
                                        value={respuestaIA}
                                        onChange={(e) => setRespuestaIA(e.target.value)}
                                        rows={20}
                                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none font-mono text-sm resize-none"
                                        placeholder="Edita la respuesta de la IA aquí..."
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        📝 Puedes editar el markdown antes de aprobar
                                    </p>
                                </div>
                            )}

                            {/* Tab Content: Preview con ReactMarkdown */}
                            {activeTab === 'preview' && (
                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 min-h-[400px]">
                                    {/* ✅ CORREGIDO: Wrapper div con clases en lugar de className en ReactMarkdown */}
                                    <div className="prose prose-sm max-w-none text-gray-800">
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-purple-900 mb-4 mt-6" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-purple-800 mb-3 mt-5" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-purple-700 mb-2 mt-4" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-3 leading-relaxed" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                                                li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-purple-900" {...props} />,
                                                em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
                                                code: ({ node, inline, ...props }: any) => 
                                                    inline 
                                                        ? <code className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-mono" {...props} />
                                                        : <code className="block p-3 bg-gray-800 text-green-400 rounded font-mono text-xs overflow-x-auto" {...props} />,
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-700 my-3" {...props} />,
                                            }}
                                        >
                                            {respuestaIA}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer con Notas y Botones */}
                        <div className="p-6 border-t flex-shrink-0 bg-gray-50">
                            {/* Notas de revisión */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notas de Revisión (opcional)
                                </label>
                                <textarea
                                    value={notasRevision}
                                    onChange={(e) => setNotasRevision(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-lateral-500 focus:outline-none"
                                    placeholder="Agrega comentarios adicionales para el propietario..."
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowIAModal(false);
                                        setRespuestaIA("");
                                        setMetadataIA(null);
                                    }}
                                    className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    disabled={fetcher.state === 'submitting'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleGuardarRespuestaIA}
                                    disabled={!respuestaIA.trim() || fetcher.state === 'submitting'}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {fetcher.state === 'submitting' ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Aprobar Análisis
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}