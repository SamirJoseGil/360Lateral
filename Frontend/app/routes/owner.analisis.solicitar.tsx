// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.analisis.solicitar.tsx
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useNavigate } from "@remix-run/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { requireUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    try {
        // Obtener lotes del propietario
        const { res: lotesRes, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/lotes/`
        );

        let lotes = [];
        
        if (lotesRes.ok) {
            const data = await lotesRes.json();
            
            // ✅ CORREGIDO: Manejar diferentes estructuras de respuesta
            if (Array.isArray(data)) {
                lotes = data;
            } else if (data.results && Array.isArray(data.results)) {
                lotes = data.results;
            } else if (data.data && Array.isArray(data.data)) {
                lotes = data.data;
            } else {
                console.warn("Unexpected lotes response structure:", data);
                lotes = [];
            }
            
            console.log(`[owner.analisis.solicitar] Loaded ${lotes.length} lotes`);
        } else {
            console.error(`[owner.analisis.solicitar] Error loading lotes: ${lotesRes.status}`);
        }

        return json({ user, lotes }, { headers: setCookieHeaders });
    } catch (error) {
        console.error("Error loading lotes:", error);
        return json({ 
            user, 
            lotes: [], // ✅ Siempre retornar array vacío en caso de error
            error: "Error al cargar lotes" 
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create") {
        try {
            const { res: createRes, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/analisis/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lote: formData.get("lote"),
                        tipo_analisis: formData.get("tipo_analisis"),
                        incluir_vis: formData.get("incluir_vis") === "on",
                        comentarios_solicitante: formData.get("comentarios")
                    })
                }
            );

            if (!createRes.ok) {
                const errorData = await createRes.json();
                return json({
                    success: false,
                    error: errorData.error || "Error al crear análisis"
                }, { status: createRes.status });
            }

            return redirect("/owner/analisis", { headers: setCookieHeaders });

        } catch (error) {
            console.error("Error creating analisis:", error);
            return json({
                success: false,
                error: "Error al solicitar análisis"
            }, { status: 500 });
        }
    }

    return json({ success: false, error: "Intent inválido" }, { status: 400 });
}

export default function SolicitarAnalisis() {
    const { user, lotes, error: loaderError } = useLoaderData<typeof loader>();
    const actionData = useActionData<any>();
    const navigation = useNavigation();
    const navigate = useNavigate();

    const isSubmitting = navigation.state === "submitting";

    // ✅ NUEVO: Asegurar que lotes siempre sea un array
    const lotesList = Array.isArray(lotes) ? lotes : [];

    const [formData, setFormData] = useState({
        lote: "",
        tipo_analisis: "maximo_potencial",
        incluir_vis: false,
        comentarios: ""
    });

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

                <h1 className="text-3xl font-bold text-gray-900">Solicitar Análisis Urbanístico</h1>
                <p className="text-gray-600 mt-1">
                    Complete el formulario para solicitar un análisis de aprovechamiento urbanístico
                </p>
            </div>

            {/* Alertas */}
            {(loaderError || actionData?.error) && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-fade-in">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-800 font-medium">{loaderError || actionData?.error}</p>
                    </div>
                </div>
            )}

            {/* Formulario */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <Form method="post">
                    <input type="hidden" name="intent" value="create" />

                    <div className="space-y-6">
                        {/* Selección de Lote */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lote <span className="text-red-500">*</span>
                            </label>
                            
                            {/* ✅ NUEVO: Mostrar mensaje si no hay lotes */}
                            {lotesList.length === 0 ? (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        No tienes lotes registrados. 
                                        <Link to="/owner/lotes/nuevo" className="font-medium underline ml-1">
                                            Crear uno ahora
                                        </Link>
                                    </p>
                                </div>
                            ) : (
                                <select
                                    name="lote"
                                    value={formData.lote}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lote: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-lateral-500 focus:ring-4 focus:ring-lateral-200 focus:outline-none transition-all"
                                    required
                                >
                                    <option value="">Seleccionar lote</option>
                                    {lotesList.map((lote: any) => (
                                        <option key={lote.id} value={lote.id}>
                                            {lote.nombre} - {lote.direccion} ({lote.area ? `${lote.area} m²` : 'Área no especificada'})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Tipo de Análisis */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Análisis <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {{
                                    maximo_potencial: { label: 'Máximo Potencial', icon: '🏗️', desc: 'Aprovechamiento máximo permitido' },
                                    factibilidad: { label: 'Factibilidad', icon: '📊', desc: 'Viabilidad del proyecto' },
                                    normativa: { label: 'Análisis Normativo', icon: '📋', desc: 'Cumplimiento de normas POT' },
                                    financiero: { label: 'Análisis Financiero', icon: '💰', desc: 'Evaluación financiera' }
                                }[formData.tipo_analisis] && (
                                    <div className="col-span-full">
                                        <span className="text-sm font-medium text-gray-700 mb-2 block">
                                            Tipo de Análisis <span className="text-red-500">*</span>
                                        </span>
                                        <div className="flex gap-2">
                                            {Object.entries({
                                                maximo_potencial: { label: 'Máximo Potencial', icon: '🏗️', desc: 'Aprovechamiento máximo permitido' },
                                                factibilidad: { label: 'Factibilidad', icon: '📊', desc: 'Viabilidad del proyecto' },
                                                normativa: { label: 'Análisis Normativo', icon: '📋', desc: 'Cumplimiento de normas POT' },
                                                financiero: { label: 'Análisis Financiero', icon: '💰', desc: 'Evaluación financiera' }
                                            }).map(([value, { label, icon, desc }]) => (
                                                <label
                                                    key={value}
                                                    className={`relative flex-1 flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                        formData.tipo_analisis === value
                                                            ? 'border-lateral-500 bg-lateral-50'
                                                            : 'border-gray-200 hover:border-lateral-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="tipo_analisis"
                                                        value={value}
                                                        checked={formData.tipo_analisis === value}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, tipo_analisis: e.target.value }))}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-2xl mr-3">{icon}</span>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{label}</div>
                                                        <div className="text-sm text-gray-500">{desc}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Incluir VIS */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="incluir_vis"
                                    name="incluir_vis"
                                    type="checkbox"
                                    checked={formData.incluir_vis}
                                    onChange={(e) => setFormData(prev => ({ ...prev, incluir_vis: e.target.checked }))}
                                    className="h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3">
                                <label htmlFor="incluir_vis" className="font-medium text-gray-700">
                                    Incluir VIS (Vivienda de Interés Social)
                                </label>
                                <p className="text-sm text-gray-500">
                                    Incluir análisis específico para Vivienda de Interés Social
                                </p>
                            </div>
                        </div>

                        {/* Comentarios */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comentarios o Requerimientos Específicos
                            </label>
                            <textarea
                                name="comentarios"
                                value={formData.comentarios}
                                onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-lateral-500 focus:ring-4 focus:ring-lateral-200 focus:outline-none transition-all resize-none"
                                placeholder="Indique cualquier requerimiento específico para el análisis..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                            <div className="flex">
                                <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-blue-700 font-medium">Tiempo de Procesamiento</h3>
                                    <p className="text-blue-600 text-sm mt-1">
                                        El análisis puede tardar hasta 48 horas hábiles. Te notificaremos por email cuando esté listo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all"
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.lote || lotesList.length === 0}
                                className="px-6 py-2 bg-gradient-to-r from-lateral-600 to-lateral-700 text-white rounded-lg hover:from-lateral-700 hover:to-lateral-800 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Solicitar Análisis
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}