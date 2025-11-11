import { json } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getLoteById } from "~/services/lotes.server";
import { getNormativaPorCBML } from "~/services/pot.server";
import { getLoteDocuments, type Document } from "~/services/documents.server";
import DocumentStatusIndicator from "~/components/DocumentStatusIndicator";
import RequiredDocumentsNotice from "~/components/RequiredDocumentsNotice";
import POTInfo from "~/components/POTInfo";

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);

    if (!user) {
        return json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    if (user.role !== "owner" && user.role !== "admin") {
        return json({ error: "No autorizado" }, { status: 403 });
    }

    const loteId = params.loteId;

    if (!loteId) {
        return json({ error: "ID de lote no proporcionado" }, { status: 400 });
    }

    try {
        // Get lote details
        const loteResponse = await getLoteById(request, loteId);

        // Verificar que el lote pertenezca al usuario (a menos que sea admin)
        if (user.role !== 'admin' && loteResponse.lote.owner !== user.id) {
            return json({ error: "No tienes permiso para ver este lote" }, { status: 403 });
        }

        // Get POT normativa if CBML is available
        let normativaPOT = null;
        if (loteResponse.lote.cbml) {
            try {
                const potResponse = await getNormativaPorCBML(request, loteResponse.lote.cbml);
                normativaPOT = potResponse.normativa;
                console.log(`[LotePage] Normativa POT obtenida para CBML ${loteResponse.lote.cbml}`);
            } catch (potError) {
                console.error(`[LotePage] Error fetching POT data for CBML ${loteResponse.lote.cbml}:`, potError);
                // Continue without POT data
            }
        }

        // Get documents for this lote (with error handling)
        let documents: Document[] = [];
        let documentsCount = 0;

        try {
            const docsResponse = await getLoteDocuments(request, loteId);

            // ✅ CORREGIDO: Verificar que docsResponse tenga la estructura esperada
            if (docsResponse.success && docsResponse.documents) {
                documents = docsResponse.documents;
                documentsCount = docsResponse.documents.length;
            }

            console.log(`[LotePage] Documentos obtenidos para lote ${loteId}: ${documentsCount}`);
        } catch (docsError) {
            console.error(`[LotePage] Error fetching documents for lote ${loteId}:`, docsError);
            // Continue even if documents couldn't be fetched
        }

        // ✅ CORREGIDO: Combinar headers correctamente
        const combinedHeaders = new Headers();

        // Agregar headers del lote si existen
        if (loteResponse.headers) {
            for (const [key, value] of loteResponse.headers.entries()) {
                combinedHeaders.append(key, value);
            }
        }

        return json({
            lote: loteResponse.lote,
            normativaPOT,
            documents,
            documentsCount
        }, {
            headers: combinedHeaders
        });
    } catch (error) {
        console.error(`[LotePage] Error al cargar lote ${loteId}:`, error);
        return json({ error: "Error al cargar la información del lote" }, { status: 500 });
    }
}

export default function LotePage() {
    const { loteId } = useParams();
    const loaderData = useLoaderData<typeof loader>();
    const lote = 'lote' in loaderData ? loaderData.lote : {};
    const normativaPOT = 'normativaPOT' in loaderData ? loaderData.normativaPOT : null;

    return (
        <div className="p-4"> {/* ✅ Aumentado padding-top */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Detalles del Lote</h1>

                <div className="flex space-x-3">
                    <Link
                        to={`/owner/lote/${loteId}/documentos`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Documentos
                    </Link>
                </div>
            </div>

            {'error' in loaderData ? (
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-800">{loaderData.error}</p>
                </div>
            ) : (
                <div className="space-y-6"> {/* ✅ Espaciado entre secciones */}
                    {/* Card principal del lote */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="mb-6 flex justify-between items-start">
                            <h2 className="text-xl font-semibold">{lote.nombre || 'Lote sin nombre'}</h2>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${lote.status === 'active' ? 'bg-green-100 text-green-800' :
                                lote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {lote.status === 'active' ? 'Activo' :
                                    lote.status === 'pending' ? 'Pendiente' :
                                        lote.status || 'Estado desconocido'}
                            </span>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{lote.direccion || 'No especificada'}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Área</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {lote.area ? `${lote.area.toLocaleString()} m²` : 'No especificada'}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">CBML</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{lote.cbml || 'No especificado'}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Barrio</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{lote.barrio || 'No especificado'}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Estrato</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {lote.estrato ? `Estrato ${lote.estrato}` : 'No especificado'}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Código catastral</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{lote.codigo_catastral || 'No especificado'}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Matrícula inmobiliaria</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{lote.matricula || 'No especificada'}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {lote.created_at ? new Date(lote.created_at).toLocaleDateString() : 'No disponible'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Información normativa si está disponible */}
                        {(lote.tratamiento_pot || lote.uso_suelo || lote.clasificacion_suelo) && (
                            <div className="mt-8 border-t border-gray-200 pt-4">
                                <h3 className="text-lg font-medium mb-4">Información normativa</h3>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Tratamiento POT</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{lote.tratamiento_pot || 'No especificado'}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Uso del suelo</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{lote.uso_suelo || 'No especificado'}</dd>
                                    </div>

                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Clasificación del suelo</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{lote.clasificacion_suelo || 'No especificado'}</dd>
                                    </div>
                                </dl>
                            </div>
                        )}

                        {/* Normativa POT detallada desde el servicio usando el componente */}
                        {normativaPOT && normativaPOT.codigo_tratamiento && (
                            <div className="mt-8 border-t border-gray-200 pt-4">
                                <h3 className="text-lg font-medium mb-4">Normativa POT Detallada</h3>
                                <POTInfo
                                    potData={normativaPOT}
                                    showMapGisData={true}
                                    className="shadow-sm"
                                />
                            </div>
                        )}

                        {/* Descripción si está disponible */}
                        {lote.descripcion && (
                            <div className="mt-8 border-t border-gray-200 pt-4">
                                <h3 className="text-lg font-medium mb-2">Descripción</h3>
                                <p className="text-sm text-gray-900">{lote.descripcion}</p>
                            </div>
                        )}
                    </div>

                    {/* Required Documents Notice - Solo si está incompleto */}
                    {'lote' in loaderData && loaderData.lote && loaderData.lote.status === 'incomplete' && (
                        <RequiredDocumentsNotice lote={loaderData.lote} />
                    )}

                    {/* Document status indicator - Con más espacio */}
                    {'documents' in loaderData && (
                        <DocumentStatusIndicator
                            loteId={loteId || ''}
                            documents={loaderData.documents || []}
                            totalCount={'documentsCount' in loaderData ? loaderData.documentsCount : undefined}
                        />
                    )}
                </div>
            )}
        </div>
    );
}