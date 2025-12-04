import { json, redirect } from "@remix-run/node";
import ReactMarkdown from "react-markdown";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    try {
        const { res: analisisRes, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/analisis/${params.id}/`
        );

        if (!analisisRes.ok) {
            throw new Error("Análisis no encontrado");
        }

        const analisis = await analisisRes.json();

        return json({ user, analisis }, { headers: setCookieHeaders });
    } catch (error) {
        console.error("Error loading analisis:", error);
        return redirect("/owner/analisis");
    }
}

export default function AnalisisDetalle() {
    const { user, analisis } = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    const getStatusBadge = (estado: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
            'en_proceso': { bg: 'bg-blue-100', text: 'text-blue-800' },
            'completado': { bg: 'bg-green-100', text: 'text-green-800' },
            'rechazado': { bg: 'bg-red-100', text: 'text-red-800' }
        };
        return badges[estado] || badges.pendiente;
    };

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
                            {analisis.tipo_analisis_display}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {analisis.lote_info?.nombre} - {analisis.lote_info?.direccion}
                        </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(analisis.estado).bg} ${getStatusBadge(analisis.estado).text}`}>
                        {analisis.estado_display}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Información del Lote */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Lote</h2>
                        <div className="grid grid-cols-2 gap-4">
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

                    {/* Resultados */}
                    {analisis.esta_completado && analisis.resultados && analisis.resultados.respuesta_ia && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                Análisis Generado
                            </h2>

                            {/* ✅ MEJORADO: Visualizador Markdown */}
                            <div className="prose max-w-none">
                                <div className="bg-white rounded-lg p-6">
                                    {/* Usa react-markdown para mostrar la respuesta formateada */}
                                    <ReactMarkdown
                                        children={analisis.resultados.respuesta_ia}
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
                                    />
                                </div>
                            </div>

                            {/* ✅ NUEVO: Info adicional */}
                            {analisis.resultados.aprobado_por && (
                                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                                    <p className="text-sm text-blue-800">
                                        Revisado y aprobado por: <strong>{analisis.resultados.aprobado_por}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Observaciones del Analista */}
                    {analisis.observaciones_analista && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Observaciones del Analista</h2>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <p className="text-gray-800 whitespace-pre-wrap">
                                    {analisis.observaciones_analista}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Comentarios del Solicitante */}
                    {analisis.comentarios_solicitante && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Comentarios Originales</h2>
                            <p className="text-gray-600">{analisis.comentarios_solicitante}</p>
                        </div>
                    )}
                </div>

                {/* Columna Lateral */}
                <div className="space-y-6">
                    {/* Información General */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Detalles</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Solicitado</p>
                                <p className="font-medium">
                                    {new Date(analisis.created_at).toLocaleString('es-CO')}
                                </p>
                            </div>

                            {analisis.fecha_inicio_proceso && (
                                <div>
                                    <p className="text-sm text-gray-500">Inicio Proceso</p>
                                    <p className="font-medium">
                                        {new Date(analisis.fecha_inicio_proceso).toLocaleString('es-CO')}
                                    </p>
                                </div>
                            )}

                            {analisis.fecha_completado && (
                                <div>
                                    <p className="text-sm text-gray-500">Completado</p>
                                    <p className="font-medium">
                                        {new Date(analisis.fecha_completado).toLocaleString('es-CO')}
                                    </p>
                                </div>
                            )}

                            {analisis.tiempo_procesamiento_display && (
                                <div>
                                    <p className="text-sm text-gray-500">Tiempo de Procesamiento</p>
                                    <p className="font-medium">{analisis.tiempo_procesamiento_display}</p>
                                </div>
                            )}

                            {analisis.incluir_vis && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="font-medium">Incluye VIS</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Analista */}
                    {analisis.analista_info && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Analista Asignado</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-lateral-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{analisis.analista_info.full_name}</p>
                                    <p className="text-sm text-gray-500">{analisis.analista_info.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Acciones</h3>
                        <div className="space-y-2">
                            <Link
                                to={`/owner/lote/${analisis.lote}`}
                                className="block w-full text-center px-4 py-2 bg-lateral-600 text-white rounded-lg hover:bg-lateral-700 transition-colors"
                            >
                                Ver Lote
                            </Link>

                            {analisis.archivo_informe && (
                                <a
                                    href={analisis.archivo_informe}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center px-4 py-2 border-2 border-lateral-600 text-lateral-600 rounded-lg hover:bg-lateral-50 transition-colors"
                                >
                                    Descargar Informe
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
