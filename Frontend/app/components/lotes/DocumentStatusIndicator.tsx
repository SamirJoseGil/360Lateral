import { Link } from "@remix-run/react";

interface Document {
    id: string;
    document_type: string;
    title: string;
    created_at: string;
}

interface DocumentStatusIndicatorProps {
    loteId: string;
    documents: Document[];
    totalCount?: number;
}

const DOCUMENT_TYPES = [
    { value: "ctl", label: "Certificado de Tradición y Libertad", icon: "📜" },
    { value: "planos", label: "Planos Arquitectónicos", icon: "📐" },
    { value: "topografia", label: "Levantamiento Topográfico", icon: "🗺️" },
    { value: "licencia_construccion", label: "Licencia de Construcción", icon: "🏗️" },
    { value: "escritura_publica", label: "Escritura Pública", icon: "📄" },
    { value: "certificado_libertad", label: "Certificado de Libertad", icon: "✅" },
    { value: "avaluo_comercial", label: "Avalúo Comercial", icon: "💰" },
    { value: "estudio_suelos", label: "Estudio de Suelos", icon: "🔬" },
    { value: "otros", label: "Otros Documentos", icon: "📎" },
];

export default function DocumentStatusIndicator({
    loteId,
    documents,
    totalCount,
}: DocumentStatusIndicatorProps) {
    // Agrupar documentos por tipo
    const documentsByType = documents.reduce((acc, doc) => {
        const type = doc.document_type || "otros";
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(doc);
        return acc;
    }, {} as Record<string, Document[]>);

    const totalDocuments = totalCount !== undefined ? totalCount : documents.length;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 rounded-lg p-2">
                        <svg
                            className="w-6 h-6 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Documentos del Lote</h3>
                        <p className="text-sm text-gray-500">
                            {totalDocuments === 0
                                ? "No hay documentos cargados"
                                : `${totalDocuments} documento${totalDocuments !== 1 ? "s" : ""} total${totalDocuments !== 1 ? "es" : ""}`}
                        </p>
                    </div>
                </div>

                {/* Botón para gestionar documentos */}
                <Link
                    to={`/owner/lote/${loteId}/documentos`}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                >
                    <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    {totalDocuments === 0 ? "Subir Documentos" : "Gestionar"}
                </Link>
            </div>

            {/* Contenido */}
            {totalDocuments === 0 ? (
                // Estado vacío mejorado
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">
                        No hay documentos cargados
                    </h4>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                        Comienza subiendo los documentos necesarios para completar la información de tu lote
                    </p>
                    <Link
                        to={`/owner/lote/${loteId}/documentos`}
                        className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        Subir Primer Documento
                    </Link>
                </div>
            ) : (
                // Grid de documentos por tipo
                <div className="space-y-4">
                    {DOCUMENT_TYPES.map((docType) => {
                        const count = documentsByType[docType.value]?.length || 0;

                        // Solo mostrar tipos que tienen documentos
                        if (count === 0) return null;

                        return (
                            <div
                                key={docType.value}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                            >
                                <div className="flex items-center space-x-3 flex-1">
                                    <span className="text-2xl">{docType.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {docType.label}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {count} archivo{count !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Indicador de cantidad */}
                                <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                                        {count}
                                    </span>
                                    <svg
                                        className="w-5 h-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        );
                    })}

                    {/* Resumen adicional si hay documentos */}
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">
                                Total de documentos:
                            </span>
                            <span className="text-indigo-600 font-semibold text-lg">
                                {totalDocuments}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}