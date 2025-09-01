import { Link } from "@remix-run/react";
import type { Document } from "~/services/documents.server";

interface DocumentStatusIndicatorProps {
    loteId: string;
    documents: Document[];
    totalCount?: number;
    className?: string;
}

// Document types to check for
const documentTypes = [
    { key: 'plano', label: 'Plano' },
    { key: 'contrato', label: 'Contrato' },
    { key: 'licencia', label: 'Licencia' },
    { key: 'general', label: 'General' }
];

export default function DocumentStatusIndicator({
    loteId,
    documents,
    totalCount,
    className = ""
}: DocumentStatusIndicatorProps) {
    // Get count of each document type
    const documentTypeCounts = documentTypes.reduce((acc, type) => {
        acc[type.key] = documents.filter(doc => doc.document_type === type.key).length;
        return acc;
    }, {} as Record<string, number>);

    // Count of other document types
    const otherDocumentsCount = documents.length - Object.values(documentTypeCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div className={`rounded-lg bg-white shadow ${className}`}>
            <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Documentos del lote</h3>
                <p className="mt-1 text-sm text-gray-500">
                    {documents.length > 0
                        ? `Este lote tiene ${documents.length} ${documents.length === 1 ? 'documento' : 'documentos'} asociados.`
                        : "Este lote no tiene documentos asociados."
                    }
                </p>
            </div>

            <div className="px-4 py-5 sm:p-6">
                {documents.length === 0 ? (
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 10v2m0 4v2m-4-8v10m4-10h-4m4 10H9" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Sin documentos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Agrega documentos para mantener organizada la información de este lote.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {documentTypes.map(type => (
                                <div
                                    key={type.key}
                                    className="border rounded-md p-3 bg-gray-50 flex flex-col items-center"
                                >
                                    <div className="text-xl font-bold text-gray-700">{documentTypeCounts[type.key] || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">{type.label + (documentTypeCounts[type.key] !== 1 ? 's' : '')}</div>
                                </div>
                            ))}
                        </div>

                        {otherDocumentsCount > 0 && (
                            <div className="text-sm text-gray-500 text-center">
                                Y {otherDocumentsCount} {otherDocumentsCount === 1 ? 'documento adicional' : 'documentos adicionales'} de otros tipos.
                            </div>
                        )}

                        {totalCount !== undefined && totalCount > documents.length && (
                            <div className="text-sm text-gray-500 text-center italic">
                                Mostrando {documents.length} de {totalCount} documentos.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 px-4 py-4 sm:px-6 rounded-b-lg">
                <div className="text-right">
                    <Link
                        to={`/owner/lote/${loteId}/documentos`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {documents.length === 0 ? (
                            <>
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Subir documentos
                            </>
                        ) : (
                            <>
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Gestionar documentos
                            </>
                        )}
                    </Link>
                </div>
            </div>
        </div>
    );
}