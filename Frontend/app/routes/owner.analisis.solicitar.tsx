// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.analisis.solicitar.tsx
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, Link, useSearchParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getMisLotes } from "~/services/lotes.server";
import { recordEvent } from "~/services/stats.server";
// import { solicitarAnalisis } from "~/services/lotes.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    try {
        // Obtener los lotes del propietario
        const { lotes } = await getMisLotes(request);

        // Registrar evento de vista de solicitud de análisis
        await recordEvent(request, {
            type: "view",
            name: "owner_analysis_request_page",
            value: {
                user_id: user.id,
                role: user.role
            }
        });

        // Obtener el lote preseleccionado de la URL si existe
        const url = new URL(request.url);
        const lotePreseleccionado = url.searchParams.get("lote");

        return json({
            user,
            lotes,
            lotePreseleccionado
        });
    } catch (error) {
        console.error("Error cargando lotes:", error);
        return json({
            user,
            lotes: [],
            error: "Error al cargar los lotes. Por favor intente nuevamente."
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    try {
        // Procesar el formulario
        const formData = await request.formData();

        const loteId = formData.get("lote")?.toString();
        if (!loteId) {
            return json({
                error: "Debe seleccionar un lote",
                values: Object.fromEntries(formData)
            });
        }

        const tipoAnalisis = formData.get("tipoAnalisis")?.toString();
        if (!tipoAnalisis) {
            return json({
                error: "Debe seleccionar un tipo de análisis",
                values: Object.fromEntries(formData)
            });
        }

        const incluirVIS = formData.get("incluirVIS") === "true";

        // Solicitar el análisis
        // const resultado = await solicitarAnalisis(request, loteId, tipoAnalisis, incluirVIS);

        // Redirigir a la página del lote con un mensaje de éxito
        return redirect(`/owner/lote/${loteId}?analisis=solicitado`, {
            // headers: resultado.headers
        });
    } catch (error) {
        console.error("Error solicitando análisis:", error);
        return json({
            error: "Error al solicitar el análisis. Por favor intente nuevamente.",
            values: Object.fromEntries(await request.formData())
        });
    }
}

export default function SolicitarAnalisis() {
    const loaderData = useLoaderData<typeof loader>();
    const lotes = loaderData.lotes;
    const lotePreseleccionado = "lotePreseleccionado" in loaderData ? loaderData.lotePreseleccionado : null;
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [searchParams] = useSearchParams();

    const [selectedLote, setSelectedLote] = useState<string>(lotePreseleccionado || "");

    // Actualizar el lote seleccionado si cambia el lotePreseleccionado
    useEffect(() => {
        if (lotePreseleccionado) {
            setSelectedLote(lotePreseleccionado);
        }
    }, [lotePreseleccionado]);

    return (
        <div className="p-24">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Solicitar Análisis Urbanístico</h1>
                <p className="text-gray-600 mt-1">
                    Complete el formulario para solicitar un análisis de aprovechamiento urbanístico para su lote.
                </p>
            </div>

            {actionData?.error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{actionData.error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Form method="post" className="p-6">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="lote" className="block text-sm font-medium text-gray-700">
                                Seleccione un Lote *
                            </label>
                            <select
                                id="lote"
                                name="lote"
                                value={selectedLote}
                                onChange={(e) => setSelectedLote(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                required
                            >
                                <option value="">Seleccionar un lote</option>
                                {lotes.map((lote: { id: string; nombre: string; direccion: string; area: number }) =>
                                    lote ? (
                                        <option key={lote.id} value={lote.id}>
                                            {lote.nombre} - {lote.direccion} ({lote.area} m²)
                                        </option>
                                    ) : null
                                )}
                            </select>
                            {selectedLote && (
                                <div className="mt-2">
                                    <Link
                                        to={`/owner/lote/${selectedLote}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        Ver detalles del lote seleccionado
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="tipoAnalisis" className="block text-sm font-medium text-gray-700">
                                Tipo de Análisis *
                            </label>
                            <select
                                id="tipoAnalisis"
                                name="tipoAnalisis"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                defaultValue={typeof actionData?.values?.tipoAnalisis === "string" ? actionData.values.tipoAnalisis : ""}
                                required
                            >
                                <option value="">Seleccionar tipo de análisis</option>
                                <option value="maximo_potencial">Máximo Potencial</option>
                                <option value="factibilidad">Factibilidad</option>
                                <option value="normativa">Análisis Normativo</option>
                                <option value="financiero">Análisis Financiero</option>
                            </select>
                        </div>

                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="incluirVIS"
                                    name="incluirVIS"
                                    type="checkbox"
                                    value="true"
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    defaultChecked={actionData?.values?.incluirVIS === "true"}
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="incluirVIS" className="font-medium text-gray-700">
                                    Incluir VIS (Vivienda de Interés Social)
                                </label>
                                <p className="text-gray-500">
                                    Seleccione esta opción si desea incluir análisis para Vivienda de Interés Social.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700">
                                Comentarios o Requerimientos Específicos (opcional)
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="comentarios"
                                    name="comentarios"
                                    rows={4}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="Si tiene requerimientos específicos para el análisis, por favor indíquelos aquí."
                                    defaultValue={typeof actionData?.values?.comentarios === "string" ? actionData.values.comentarios : ""}
                                ></textarea>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Información de Procesamiento</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>
                                            El análisis urbanístico puede tardar hasta 48 horas hábiles en completarse.
                                            Se le notificará por correo electrónico una vez esté disponible.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link
                                to="/owner/analisis"
                                className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedLote}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                            >
                                {isSubmitting ? "Enviando..." : "Solicitar Análisis"}
                            </button>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}