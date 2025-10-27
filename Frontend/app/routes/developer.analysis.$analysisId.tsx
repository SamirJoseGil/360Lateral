import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";

type AnalysisData = {
    id: number;
    name: string;
    status: "pending" | "completed" | "in_progress";
    createdAt: string;
    updatedAt: string;
    lotInfo: {
        id: number;
        name: string;
        address: string;
        area: number;
        cbml: string;
        zone: string;
        treatment: string;
    };
    owner: {
        name: string;
        contact: string;
    };
    results: {
        buildableArea: number;
        maxHeight: string;
        maxDensity: number;
        permittedUses: string[];
        restrictions: string[];
        estimatedValue: number;
    };
    documents: {
        id: string;
        name: string;
        type: string;
        uploadDate: string;
        url: string;
    }[];
};

type LoaderData = {
    analysis: AnalysisData;
    error?: string;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);
    const analysisId = params.analysisId;

    if (!analysisId) {
        return json<LoaderData>({
            analysis: {} as AnalysisData,
            error: "ID de análisis no válido"
        }, { status: 400 });
    }

    try {
        // Registrar evento de vista de análisis
        await recordEvent(request, {
            type: "view",
            name: "developer_analysis_detail",
            value: {
                user_id: user?.id || "unknown",
                analysis_id: analysisId
            }
        });

        // En una aplicación real, estos datos vendrían de una API
        const analysis: AnalysisData = {
            id: parseInt(analysisId),
            name: `Análisis Urbanístico Lote #${analysisId}`,
            status: parseInt(analysisId) % 3 === 0 ? "pending" : parseInt(analysisId) % 3 === 1 ? "in_progress" : "completed",
            createdAt: "2023-08-15",
            updatedAt: "2023-08-18",
            lotInfo: {
                id: parseInt(analysisId) + 100,
                name: `Lote ${parseInt(analysisId) + 100}`,
                address: `Calle Principal #${parseInt(analysisId) + 10}, Comuna ${parseInt(analysisId) % 5 + 1}`,
                area: 450 + (parseInt(analysisId) * 50),
                cbml: `05001${analysisId.padStart(10, '0')}`,
                zone: ["Norte", "Sur", "Este", "Oeste", "Centro"][parseInt(analysisId) % 5],
                treatment: ["Residencial", "Comercial", "Mixto", "Industrial"][parseInt(analysisId) % 4]
            },
            owner: {
                name: "Juan Pérez",
                contact: "juan.perez@ejemplo.com"
            },
            results: {
                buildableArea: 380 + (parseInt(analysisId) * 40),
                maxHeight: `${parseInt(analysisId) + 4} pisos`,
                maxDensity: 120 + (parseInt(analysisId) * 10),
                permittedUses: ["Vivienda", "Comercio local", "Oficinas"],
                restrictions: ["Retiro frontal de 5m", "Retiro posterior de 3m"],
                estimatedValue: 500000000 + (parseInt(analysisId) * 50000000)
            },
            documents: [
                {
                    id: `doc1-${analysisId}`,
                    name: "Normativa POT",
                    type: "pdf",
                    uploadDate: "2023-08-16",
                    url: "#"
                },
                {
                    id: `doc2-${analysisId}`,
                    name: "Plano de Edificabilidad",
                    type: "dwg",
                    uploadDate: "2023-08-17",
                    url: "#"
                },
                {
                    id: `doc3-${analysisId}`,
                    name: "Reporte de Análisis",
                    type: "pdf",
                    uploadDate: "2023-08-18",
                    url: "#"
                }
            ]
        };

        return json<LoaderData>({ analysis });
    } catch (error) {
        console.error(`Error cargando análisis ${analysisId}:`, error);
        return json<LoaderData>({
            analysis: {} as AnalysisData,
            error: "Error al cargar los detalles del análisis"
        }, { status: 500 });
    }
}

// Formateador de moneda para COP
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function AnalysisDetail() {
    const { analysis, error } = useLoaderData<typeof loader>();

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-24">
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-6 ">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{analysis.name}</h1>
                    <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                                analysis.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                            }`}>
                            {analysis.status === 'completed' ? 'Completado' :
                                analysis.status === 'in_progress' ? 'En Progreso' :
                                    'Pendiente'}
                        </span>
                        <span className="text-gray-500 text-sm ml-4">
                            Creado: {analysis.createdAt} | Actualizado: {analysis.updatedAt}
                        </span>
                    </div>
                </div>
                <div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
                        Descargar Reporte
                    </button>
                </div>
            </div>

            {/* Contenido principal - Layout de 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Detalles del análisis */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-bold mb-4">Resultados del Análisis</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-1">Área Construible</h3>
                                <p className="text-xl font-semibold">{analysis.results?.buildableArea} m²</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-1">Altura Máxima</h3>
                                <p className="text-xl font-semibold">{analysis.results?.maxHeight}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-1">Densidad Máxima</h3>
                                <p className="text-xl font-semibold">{analysis.results?.maxDensity} viv/ha</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-1">Valor Estimado</h3>
                                <p className="text-xl font-semibold text-green-600">{formatCurrency(analysis.results?.estimatedValue || 0)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Usos Permitidos</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.results?.permittedUses.map((use, index) => (
                                        <li key={index} className="text-gray-700">{use}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Restricciones</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.results?.restrictions.map((restriction, index) => (
                                        <li key={index} className="text-gray-700">{restriction}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Documentos */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-bold mb-4">Documentos del Análisis</h2>

                        <div className="space-y-3">
                            {analysis.documents?.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            {doc.type === 'pdf' ? (
                                                <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 384 512">
                                                    <path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-16.8 15.8-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z" />
                                                </svg>
                                            ) : doc.type === 'dwg' ? (
                                                <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 512 512">
                                                    <path d="M320 336c0 8.84-7.16 16-16 16h-96c-8.84 0-16-7.16-16-16v-48H0v144c0 25.6 22.4 48 48 48h416c25.6 0 48-22.4 48-48V288H320v48zm144-208h-80V80c0-25.6-22.4-48-48-48H176c-25.6 0-48 22.4-48 48v48H48c-25.6 0-48 22.4-48 48v80h512v-80c0-25.6-22.4-48-48-48zm-144 0H192V96h128v32z" />
                                                </svg>
                                            ) : (
                                                <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 384 512">
                                                    <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {doc.type.toUpperCase()} • Subido el {doc.uploadDate}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800"
                                    >
                                        Descargar
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mapa (Simulado) */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-bold mb-4">Ubicación</h2>
                        <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
                            <p className="text-gray-500">Mapa no disponible en esta vista</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar con info del lote */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-bold mb-4">Información del Lote</h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs text-gray-500">Nombre</h3>
                                <p className="font-medium">{analysis.lotInfo?.name}</p>
                            </div>

                            <div>
                                <h3 className="text-xs text-gray-500">Dirección</h3>
                                <p className="font-medium">{analysis.lotInfo?.address}</p>
                            </div>

                            <div>
                                <h3 className="text-xs text-gray-500">CBML</h3>
                                <p className="font-medium">{analysis.lotInfo?.cbml}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-xs text-gray-500">Área</h3>
                                    <p className="font-medium">{analysis.lotInfo?.area} m²</p>
                                </div>

                                <div>
                                    <h3 className="text-xs text-gray-500">Zona</h3>
                                    <p className="font-medium">{analysis.lotInfo?.zone}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs text-gray-500">Tratamiento</h3>
                                <p className="font-medium">{analysis.lotInfo?.treatment}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-bold mb-4">Propietario</h2>

                        <div className="flex items-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                {analysis.owner?.name?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium">{analysis.owner?.name}</p>
                                <p className="text-sm text-gray-500">{analysis.owner?.contact}</p>
                            </div>
                        </div>

                        <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                            Contactar Propietario
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-bold mb-4">Acciones</h2>

                        <div className="space-y-3">
                            <button className="w-full text-left flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Editar Análisis
                            </button>

                            <button className="w-full text-left flex items-center px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100">
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Descargar Todos los Documentos
                            </button>

                            <button className="w-full text-left flex items-center px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100">
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar Análisis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
