import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    try {
        // Obtener análisis del usuario
        const { res: analisisRes, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/analisis/mis_analisis/`
        );

        let analisis = [];
        
        if (analisisRes.ok) {
            const data = await analisisRes.json();
            
            // ✅ CORREGIDO: Manejar diferentes estructuras de respuesta
            if (Array.isArray(data)) {
                analisis = data;
            } else if (data.results && Array.isArray(data.results)) {
                analisis = data.results;
            } else if (data.data && Array.isArray(data.data)) {
                analisis = data.data;
            } else {
                console.warn("Unexpected analisis response structure:", data);
                analisis = [];
            }
            
            console.log(`[owner.analisis] Loaded ${analisis.length} análisis`);
        } else {
            console.error(`[owner.analisis] Error loading: ${analisisRes.status}`);
        }

        return json({ user, analisis }, { headers: setCookieHeaders });
    } catch (error) {
        console.error("Error loading analisis:", error);
        return json({ 
            user, 
            analisis: [], // ✅ Siempre retornar array vacío en caso de error
            error: "Error al cargar análisis" 
        });
    }
}

export default function OwnerAnalisisIndex() {
    const { user, analisis, error } = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    // ✅ NUEVO: Asegurar que analisis siempre sea un array
    const analisisList = Array.isArray(analisis) ? analisis : [];

    const getStatusBadge = (estado: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
            'en_proceso': { bg: 'bg-blue-100', text: 'text-blue-800' },
            'completado': { bg: 'bg-green-100', text: 'text-green-800' },
            'rechazado': { bg: 'bg-red-100', text: 'text-red-800' }
        };
        return badges[estado] || badges.pendiente;
    };

    const getTipoIcon = (tipo: string) => {
        const icons: Record<string, string> = {
            'maximo_potencial': '🏗️',
            'factibilidad': '📊',
            'normativa': '📋',
            'financiero': '💰'
        };
        return icons[tipo] || '📄';
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

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Análisis Urbanísticos</h1>
                        <p className="text-gray-600 mt-1">
                            Solicita y consulta análisis de aprovechamiento urbanístico de tus lotes
                        </p>
                    </div>
                    <Link
                        to="/owner/analisis/solicitar"
                        className="px-6 py-3 bg-gradient-to-r from-lateral-600 to-lateral-700 text-white rounded-lg hover:from-lateral-700 hover:to-lateral-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Solicitar Análisis
                    </Link>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Lista de Análisis */}
            {analisisList.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No tienes análisis</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Comienza solicitando un análisis urbanístico para uno de tus lotes
                    </p>
                    <div className="mt-6">
                        <Link
                            to="/owner/analisis/solicitar"
                            className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-lateral-600 hover:bg-lateral-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Solicitar Análisis
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analisisList.map((item: any) => (
                        <Link
                            key={item.id}
                            to={`/owner/analisis/${item.id}`}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-2 border-transparent hover:border-lateral-200"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{getTipoIcon(item.tipo_analisis)}</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {item.tipo_analisis_display}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {item.lote_info?.nombre || 'Lote sin nombre'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Estado */}
                            <div className="mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.estado).bg} ${getStatusBadge(item.estado).text}`}>
                                    {item.estado_display}
                                </span>
                            </div>

                            {/* Detalles */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>
                                        Solicitado: {new Date(item.created_at).toLocaleDateString('es-CO')}
                                    </span>
                                </div>

                                {item.incluir_vis && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Incluye VIS</span>
                                    </div>
                                )}

                                {item.analista_info && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Analista: {item.analista_info.full_name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                    {item.lote_info?.direccion}
                                </span>
                                <svg className="w-5 h-5 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
