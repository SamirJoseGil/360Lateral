import React from 'react';
import type { Document } from '~/services/documents.server';

interface DocumentDetailModalProps {
    isOpen: boolean;
    document: Document;
    onClose: () => void;
    onDownload?: () => void;
    onDelete?: () => void;
    onArchive?: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
    isOpen,
    document,
    onClose,
    onDownload,
    onDelete,
    onArchive,
    canEdit = false,
    canDelete = false,
}) => {
    if (!isOpen) return null;

    // Document type mapping according to documentation
    const documentTypeLabels: { [key: string]: string } = {
        'general': 'General',
        'plano': 'Plano',
        'contrato': 'Contrato',
        'licencia': 'Licencia',
        'factura': 'Factura',
        'otro': 'Otro'
    };

    // Format file size
    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return 'Desconocido';
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    };

    // Format date
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

    // Get validation status
    const getValidationStatus = () => {
        const status = document.metadata?.validation_status || 'pendiente';
        const statusLabels: { [key: string]: { label: string; color: string } } = {
            'pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
            'validado': { label: 'Validado', color: 'bg-green-100 text-green-800' },
            'rechazado': { label: 'Rechazado', color: 'bg-red-100 text-red-800' }
        };
        return statusLabels[status] || statusLabels['pendiente'];
    };

    const validationStatus = getValidationStatus();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">
                        {document.title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Nombre del archivo</label>
                            <p className="text-sm text-gray-900 mt-1">{document.file_name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Tipo de documento</label>
                            <p className="text-sm text-gray-900 mt-1">
                                {documentTypeLabels[document.document_type] || document.document_type}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Tamaño</label>
                            <p className="text-sm text-gray-900 mt-1">{formatFileSize(document.file_size)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Tipo MIME</label>
                            <p className="text-sm text-gray-900 mt-1">{document.mime_type || 'No especificado'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Fecha de subida</label>
                            <p className="text-sm text-gray-900 mt-1">{formatDate(document.created_at)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Estado de validación</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${validationStatus.color}`}>
                                {validationStatus.label}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {document.description && (
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Descripción</label>
                            <p className="text-sm text-gray-900 mt-1">{document.description}</p>
                        </div>
                    )}

                    {/* User Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Subido por</label>
                            <p className="text-sm text-gray-900 mt-1">{document.user_name || `Usuario ${document.user}`}</p>
                        </div>
                        {document.lote && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Lote</label>
                                <p className="text-sm text-gray-900 mt-1">
                                    {document.lote_nombre || `Lote #${document.lote}`}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {document.tags && document.tags.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Etiquetas</label>
                            <div className="flex flex-wrap gap-2">
                                {document.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Validation Comments */}
                    {document.metadata?.validation_comments && (
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Comentarios de validación</label>
                            <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">
                                {document.metadata.validation_comments}
                            </p>
                        </div>
                    )}

                    {/* Metadata */}
                    {document.metadata && Object.keys(document.metadata).length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Metadatos adicionales</label>
                            <div className="bg-gray-50 rounded-md p-3">
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {JSON.stringify(document.metadata, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cerrar
                    </button>

                    {/* Download button */}
                    <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                        onClick={onDownload}
                    >
                        Descargar
                    </a>

                    {/* Archive button (if user can edit) */}
                    {canEdit && onArchive && (
                        <button
                            onClick={onArchive}
                            className="px-4 py-2 bg-yellow-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-yellow-700"
                        >
                            Archivar
                        </button>
                    )}

                    {/* Delete button (if user can delete) */}
                    {canDelete && onDelete && (
                        <button
                            onClick={onDelete}
                            className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                        >
                            Eliminar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentDetailModal;