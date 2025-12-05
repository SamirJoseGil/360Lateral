import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useNavigate, Link } from "@remix-run/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { requireUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";
import { getFavoriteLotes } from "~/services/lotes.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== 'developer') {
        return redirect(`/${user.role}`);
    }

    try {
        const { favorites, count, headers } = await getFavoriteLotes(request);
        
        // Filtrar solo favoritos con CBML
        const analyzableLots = favorites.filter((fav: any) => {
            const lote = fav.lote_details || fav.lote || {};
            return !!lote.cbml;
        });

        console.log(`[developer.analisis.solicitar] Loaded ${analyzableLots.length} analyzable favorites`);

        return json({
            user,
            favorites: analyzableLots,
            totalFavorites: count
        }, { headers });

    } catch (error) {
        console.error("[developer.analisis.solicitar] Error:", error);
        return json({
            user,
            favorites: [],
            totalFavorites: 0,
            error: error instanceof Error ? error.message : "Error cargando favoritos"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== 'developer') {
        return redirect(`/${user.role}`);
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create") {
        try {
            const favoriteId = formData.get("favorite");
            
            // Obtener datos del favorito para extraer el lote_id
            const { favorites } = await getFavoriteLotes(request);
            const favorite = favorites.find((fav: any) => fav.id.toString() === favoriteId);
            
            if (!favorite) {
                return json({
                    success: false,
                    error: "Favorito no encontrado"
                }, { status: 404 });
            }

            const lote = favorite.lote_details || favorite.lote || {};

            const { res: createRes, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/analisis/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lote: lote.id,
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

            return redirect("/developer/analisis", { headers: setCookieHeaders });

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

export default function DeveloperSolicitarAnalisis() {
    const { user, favorites, error: loaderError } = useLoaderData<typeof loader>();
    const actionData = useActionData<any>();
    const navigation = useNavigation();
    const navigate = useNavigate();

    const isSubmitting = navigation.state === "submitting";

    const [formData, setFormData] = useState({
        favorite: "",
        tipo_analisis: "maximo_potencial",
        incluir_vis: false,
        comentarios: ""
    });

    // Obtener lote seleccionado
    const selectedFavorite = favorites.find((fav: any) => fav.id.toString() === formData.favorite);
    const selectedLote = selectedFavorite?.lote_details || selectedFavorite?.lote || {};

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                >
                    <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Volver</span>
                </button>

                <h1 className="text-3xl font-bold text-gray-900">Solicitar Análisis Urbanístico</h1>
                <p className="text-gray-600 mt-1">
                    Solicita un análisis profesional para uno de tus lotes favoritos
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
                        {/* Selección de Lote Favorito */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lote Favorito <span className="text-red-500">*</span>
                            </label>
                            
                            {favorites.length === 0 ? (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        No tienes lotes favoritos con CBML válido. 
                                        <Link to="/developer/favorites" className="font-medium underline ml-1">
                                            Agrega algunos ahora
                                        </Link>
                                    </p>
                                </div>
                            ) : (
                                <select
                                    name="favorite"
                                    value={formData.favorite}
                                    onChange={(e) => setFormData(prev => ({ ...prev, favorite: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all"
                                    required
                                >
                                    <option value="">Seleccionar lote favorito</option>
                                    {favorites.map((fav: any) => {
                                        const lote = fav.lote_details || fav.lote || {};
                                        return (
                                            <option key={fav.id} value={fav.id}>
                                                {lote.nombre} - {lote.direccion} (CBML: {lote.cbml})
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>

                        {/* Preview del lote seleccionado */}
                        {selectedLote.id && (
                            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                                <h3 className="font-semibold text-indigo-900 mb-3">Lote Seleccionado</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-indigo-600">Nombre:</p>
                                        <p className="font-medium text-gray-900">{selectedLote.nombre}</p>
                                    </div>
                                    <div>
                                        <p className="text-indigo-600">CBML:</p>
                                        <p className="font-mono font-medium text-gray-900">{selectedLote.cbml}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-indigo-600">Dirección:</p>
                                        <p className="font-medium text-gray-900">{selectedLote.direccion}</p>
                                    </div>
                                    {selectedLote.area && (
                                        <div>
                                            <p className="text-indigo-600">Área:</p>
                                            <p className="font-medium text-gray-900">{selectedLote.area} m²</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tipo de Análisis */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Análisis <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { value: 'maximo_potencial', label: 'Máximo Potencial', icon: '🏗️', desc: 'Aprovechamiento máximo permitido' },
                                    { value: 'factibilidad', label: 'Factibilidad', icon: '📊', desc: 'Viabilidad del proyecto' },
                                    { value: 'normativa', label: 'Análisis Normativo', icon: '📋', desc: 'Cumplimiento de normas POT' },
                                    { value: 'financiero', label: 'Análisis Financiero', icon: '💰', desc: 'Evaluación financiera' }
                                ].map(({ value, label, icon, desc }) => (
                                    <label
                                        key={value}
                                        className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            formData.tipo_analisis === value
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-indigo-300'
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

                        {/* Incluir VIS */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="incluir_vis"
                                    name="incluir_vis"
                                    type="checkbox"
                                    checked={formData.incluir_vis}
                                    onChange={(e) => setFormData(prev => ({ ...prev, incluir_vis: e.target.checked }))}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all resize-none"
                                placeholder="Indique cualquier requerimiento específico para el análisis..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                            <div className="flex">
                                <svg className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                                disabled={isSubmitting || !formData.favorite || favorites.length === 0}
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
