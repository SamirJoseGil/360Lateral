import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Link } from "@remix-run/react";
import type { Document } from "~/services/documents.server";

interface DocumentDetailModalProps {
    isOpen: boolean;
    document: Document;
    onClose: () => void;
    onDelete?: (id: number) => void;
}

export default function DocumentDetailModal({
    isOpen,
    document: doc,
    onClose,
    onDelete
}: DocumentDetailModalProps) {
    // Format file size for display
    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return 'Desconocido';
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    // Get document type display name
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

    // Get file extension
    const getFileExtension = (filename: string): string => {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2) || "";
    };

    // Get mime type display name
    const getMimeTypeDisplay = (mimeType?: string): string => {
        if (!mimeType) return "Desconocido";

        const mimeMap: { [key: string]: string } = {
            'application/pdf': 'PDF',
            'image/jpeg': 'JPEG',
            'image/png': 'PNG',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
            'application/msword': 'Word',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
            'application/vnd.ms-excel': 'Excel',
            'application/zip': 'ZIP',
            'application/x-rar-compressed': 'RAR',
            'application/x-7z-compressed': '7Z',
            'application/octet-stream': 'Archivo Binario',
            'text/plain': 'Texto Plano'
        };

        return mimeMap[mimeType] || mimeType.split('/')[1] || mimeType;
    };

    // Get appropriate file icon based on mime type
    const getFileIcon = (): JSX.Element => {
        const { mime_type, document_type } = doc;

        if (mime_type?.includes('image')) {
            return (
                <svg className="h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }

        if (document_type === 'plano' || mime_type?.includes('dwg') || mime_type?.includes('dxf')) {
            return (
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            );
        }

        if (mime_type?.includes('pdf')) {
            return (
                <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }

        if (mime_type?.includes('word') || mime_type?.includes('document')) {
            return (
                <svg className="h-12 w-12 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        }

        if (mime_type?.includes('excel') || mime_type?.includes('sheet')) {
            return (
                <svg className="h-12 w-12 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        }

        // Default document icon
        return (
            <svg className="h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    // Check if the document is an image
    const isImage = doc.mime_type?.includes('image') || false;

    // Check if the document is a PDF (for embedding)
    const isPdf = doc.mime_type?.includes('pdf') || false;

    // Document content preview
    const renderDocumentPreview = () => {
        if (isImage) {
            return (
                <div className="relative h-48 sm:h-64 bg-gray-100 rounded-md overflow-hidden">
                    <img
                        src={doc.file_url}
                        alt={doc.title}
                        className="w-full h-full object-contain"
                    />
                </div>
            );
        }

        if (isPdf) {
            return (
                <div className="relative h-64 sm:h-96 bg-gray-100 rounded-md overflow-hidden">
                    <iframe
                        src={`${doc.file_url}#toolbar=0`}
                        title={doc.title}
                        className="w-full h-full"
                    />
                </div>
            );
        }

        // For other file types, show icon and info
        return (
            <div className="py-8 flex flex-col items-center justify-center bg-gray-50 rounded-md">
                {getFileIcon()}
                <p className="mt-4 text-sm font-medium text-gray-900">
                    {doc.file_name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    {formatFileSize(doc.file_size)} • {getMimeTypeDisplay(doc.mime_type)}
                </p>
                <a
                    href={doc.file_url}
                    download={doc.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar
                </a>
            </div>
        );
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={onClose}>
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />
                    </Transition.Child>

                    {/* This element is to trick the browser into centering the modal contents. */}
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                        &#8203;
                    </span>

                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    >
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
                            <div>
                                {/* Header with close button */}
                                <div className="flex justify-between items-start mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 truncate" title={doc.title}>
                                        {doc.title}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Cerrar</span>
                                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Document preview */}
                                <div className="mb-6">
                                    {renderDocumentPreview()}
                                </div>

                                {/* Document metadata */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Detalles del documento</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Tipo:</span>{" "}
                                            <span className="font-medium">{getDocumentTypeLabel(doc.document_type)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Formato:</span>{" "}
                                            <span className="font-medium uppercase">{getFileExtension(doc.file_name) || getMimeTypeDisplay(doc.mime_type)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Tamaño:</span>{" "}
                                            <span className="font-medium">{formatFileSize(doc.file_size)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Fecha de subida:</span>{" "}
                                            <span className="font-medium">{formatDate(doc.created_at)}</span>
                                        </div>
                                        {doc.lote && (
                                            <div className="col-span-2">
                                                <span className="text-gray-500">Lote asociado:</span>{" "}
                                                <Link
                                                    to={`/owner/lote/${doc.lote}`}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                >
                                                    Ver lote #{doc.lote}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Document description */}
                                {doc.description && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Descripción</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-line">{doc.description}</p>
                                    </div>
                                )}

                                {/* Document tags */}
                                {doc.tags && doc.tags.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Etiquetas</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {doc.tags.map((tag, index) => (
                                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Document metadata (if any) */}
                                {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Metadatos adicionales</h4>
                                        <div className="bg-gray-50 rounded p-3 overflow-x-auto">
                                            <pre className="text-xs text-gray-700">{JSON.stringify(doc.metadata, null, 2)}</pre>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cerrar
                                    </button>

                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Ver documento
                                    </a>

                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => onDelete(doc.id)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}