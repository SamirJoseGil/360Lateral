import { usePotData } from "~/hooks/usePotData";
import PotAnalysis from "~/components/PotAnalysis";

interface LotePotSectionProps {
    cbml: string;
    compact?: boolean;
}

/**
 * Componente para mostrar datos POT y análisis de vendibilidad en la vista de detalle de lote
 */
export default function LotePotSection({ cbml, compact = false }: LotePotSectionProps) {
    const { potData, loading, error } = usePotData(cbml);

    if (loading) {
        return (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/5"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!potData) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">No se encontraron datos POT para este lote.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Versión compacta para mostrar solo lo esencial
    if (compact) {
        return (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-4">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Información POT y Vendibilidad
                    </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
                        {potData.tratamiento && (
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Tratamiento</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{potData.tratamiento}</dd>
                            </div>
                        )}

                        {potData.uso_suelo && (
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Uso del Suelo</dt>
                                <dd className="mt-1 text-sm text-gray-900">{potData.uso_suelo}</dd>
                            </div>
                        )}

                        {potData.restricciones !== undefined && (
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Restricciones</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {potData.restricciones > 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            {potData.restricciones} {potData.restricciones === 1 ? 'tipo' : 'tipos'}
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

                    <div className="mt-6">
                        <a
                            href="#pot-details"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Ver análisis completo
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Versión completa con análisis detallado
    return (
        <section id="pot-details">
            <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Análisis POT y Vendibilidad</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Análisis basado en la normativa del Plan de Ordenamiento Territorial
                </p>
            </div>

            <PotAnalysis potData={potData} />

            {potData.rawText && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Datos POT Originales
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <pre className="text-xs text-gray-800 bg-gray-50 p-3 rounded overflow-auto max-h-64">
                            {potData.rawText}
                        </pre>
                    </div>
                </div>
            )}
        </section>
    );
}