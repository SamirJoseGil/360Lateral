import { Link } from "@remix-run/react";

export interface Document {
    id: number;
    title: string;
    description?: string;
    document_type: string;
    file_url: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    created_at: string;
    updated_at?: string;
    user_name?: string;
    tags?: string[];
    is_active?: boolean;
}

interface DocumentListProps {
    documents: Document[];
    onDelete?: (id: number) => void;
    isLoading?: boolean;
}

export default function DocumentList({
    documents,
    onDelete,
    isLoading = false
}: DocumentListProps) {
    // Helper function to format file size
    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return 'Desconocido';
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    };

    // Helper function to format dates
    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    // Helper to get document type display name
    const getDocumentTypeLabel = (type: string): string => {
        const types: { [key: string]: string } = {
            'general': 'General',
            'plano': 'Plano',
            'contrato': 'Contrato',
            'licencia': 'Licencia',
            'factura': 'Factura',
            'otro': 'Otro'
        };
        return types[type] || type;
    };

    // Helper to get document type icon
    const getDocumentIcon = (type: string, mimeType?: string): JSX.Element => {
        // Base SVG for different document types
        if (mimeType?.includes('image')) {
            return (
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }

        if (type === 'plano' || mimeType?.includes('dwg') || mimeType?.includes('dxf')) {
            return (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            );
        }

        if (mimeType?.includes('pdf')) {
            return (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }

        // Default document icon
        return (
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="animate-pulse p-6">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-md"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (!documents || documents.length === 0) {
        return (
            <div className="text-center p-10 bg-gray-50 rounded-md">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 10v2m0 4v2m-4-8v10m4-10h-4m4 10H9" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Todavía no se han subido documentos para este lote.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <ul className="divide-y divide-gray-200">
                {documents.map((document) => (
                    <li key={document.id} className="p-4 sm:px-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {getDocumentIcon(document.document_type, document.mime_type)}
                            </div>
                            <div className="ml-4 flex-grow">
                                <h4 className="text-lg font-medium text-gray-900">{document.title}</h4>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-1">
                                    <div className="text-sm text-gray-500 space-x-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {getDocumentTypeLabel(document.document_type)}
                                        </span>
                                        <span>{formatFileSize(document.file_size)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 sm:mt-0">
                                        Subido el {formatDate(document.created_at)}
                                        {document.user_name && ` por ${document.user_name}`}
                                    </p>
                                </div>
                                {document.description && (
                                    <p className="mt-2 text-sm text-gray-600">{document.description}</p>
                                )}
                                {document.tags && document.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {document.tags.map((tag, index) => (
                                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="ml-4 flex-shrink-0 flex space-x-2">
                                <a
                                    href={document.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                >
                                    <svg className="-ml-0.5 mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"></path>
                                    </svg>
                                    Ver
                                </a>
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(document.id)}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-red-600 bg-white hover:bg-gray-50 focus:outline-none"
                                    >
                                        <svg className="-ml-0.5 mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}