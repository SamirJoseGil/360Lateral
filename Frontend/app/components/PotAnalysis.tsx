import { useState } from "react";
import { PotData, SellabilityResult, analyzeSellability, extractPotDataFromText } from "~/utils/pot-analysis";

interface PotAnalysisProps {
    potData: PotData | string | null | undefined;
}

export default function PotAnalysis({ potData }: PotAnalysisProps) {
    // Procesar datos POT si vienen como string
    const processedData = typeof potData === 'string'
        ? extractPotDataFromText(potData)
        : (potData || {});

    // Analizar vendibilidad
    const analysis = analyzeSellability(processedData);

    // Estado para mostrar/ocultar detalles
    const [showDetails, setShowDetails] = useState(false);

    // Si no hay datos POT
    if (!processedData || Object.keys(processedData).length === 0) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            No se encontraron datos POT para este lote.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Análisis POT del Lote
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Evaluación de datos del Plan de Ordenamiento Territorial
                </p>
            </div>

            {/* Indicador de vendibilidad */}
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        {analysis.canSell ? (
                            <div className="bg-green-100 rounded-full p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        ) : (
                            <div className="bg-red-100 rounded-full p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                        <div className="ml-3">
                            <h3 className="text-lg font-medium">
                                {analysis.canSell ? 'Lote Vendible' : 'Lote con Restricciones para Venta'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {analysis.canSell
                                    ? 'Este lote puede comercializarse según evaluación POT'
                                    : 'Este lote presenta restricciones significativas para su venta'}
                            </p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">
                            {analysis.score}%
                        </div>
                        <div className="text-xs text-gray-500">Puntaje de viabilidad</div>
                    </div>
                </div>
            </div>

            {/* Datos básicos POT */}
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    {processedData.area && (
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Área</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {new Intl.NumberFormat('es-CO').format(processedData.area)} m²
                            </dd>
                        </div>
                    )}

                    {processedData.clasificacion && (
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Clasificación</dt>
                            <dd className="mt-1 text-sm text-gray-900">{processedData.clasificacion}</dd>
                        </div>
                    )}

                    {processedData.uso_suelo && (
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Uso del Suelo</dt>
                            <dd className="mt-1 text-sm text-gray-900">{processedData.uso_suelo}</dd>
                        </div>
                    )}

                    {processedData.tratamiento && (
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Tratamiento</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-semibold">{processedData.tratamiento}</dd>
                        </div>
                    )}

                    {processedData.densidad !== undefined && (
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Densidad</dt>
                            <dd className="mt-1 text-sm text-gray-900">{processedData.densidad} viv/ha</dd>
                        </div>
                    )}

                    {processedData.restricciones !== undefined && (
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Restricciones</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {processedData.restricciones > 0 ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        {processedData.restricciones} {processedData.restricciones === 1 ? 'tipo' : 'tipos'}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Sin restricciones
                                    </span>
                                )}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {/* Resumen análisis */}
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Razones</h4>
                    {analysis.reasons.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                            {analysis.reasons.map((reason, index) => (
                                <li key={index} className="text-sm text-gray-900 flex items-start">
                                    <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    {reason}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-green-600">No se encontraron problemas significativos.</p>
                    )}
                </div>

                <div>
                    <h4 className="text-sm font-medium text-gray-500">Recomendaciones</h4>
                    <ul className="mt-2 space-y-1">
                        {analysis.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm text-gray-900 flex items-start">
                                <svg className="h-4 w-4 text-blue-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {recommendation}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Detalles del tratamiento (colapsable) */}
            {analysis.treatmentDetails && (
                <div className="border-t border-gray-200">
                    <button
                        className="w-full px-4 py-3 text-sm text-left font-medium text-gray-700 focus:outline-none"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        <div className="flex justify-between items-center">
                            <span>Información del Tratamiento: {analysis.treatmentDetails.name}</span>
                            <svg
                                className={`h-5 w-5 text-gray-500 transform ${showDetails ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    {showDetails && (
                        <div className="px-4 py-5 sm:px-6 bg-gray-50">
                            <p className="text-sm text-gray-700 mb-4">
                                {analysis.treatmentDetails.description}
                            </p>

                            <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Implicaciones:</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.treatmentDetails.implications.map((item, index) => (
                                        <li key={index} className="text-sm text-gray-600">{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Requisitos:</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.treatmentDetails.requirements.map((item, index) => (
                                        <li key={index} className="text-sm text-gray-600">{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Oportunidades:</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.treatmentDetails.opportunities.map((item, index) => (
                                        <li key={index} className="text-sm text-gray-600">{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}