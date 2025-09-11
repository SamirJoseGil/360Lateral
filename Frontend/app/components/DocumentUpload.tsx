import React, { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import type { Document } from '~/services/documents.server';

interface DocumentUploadProps {
    loteId?: number;
    onUploadSuccess?: (document: Document) => void;
    onUploadError?: (error: string) => void;
    allowedTypes?: string[];
    maxFileSize?: number; // in MB
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
    loteId,
    onUploadSuccess,
    onUploadError,
    allowedTypes = ['general', 'plano', 'contrato', 'licencia', 'factura', 'otro'],
    maxFileSize = 50
}) => {
    const navigation = useNavigation();
    const actionData = useActionData() as { message?: string; success?: boolean } | undefined;
    const isSubmitting = navigation.state === 'submitting';

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        document_type: 'general',
        tags: ''
    });

    // Document types mapping according to documentation
    const documentTypes = [
        { value: 'general', label: 'General' },
        { value: 'plano', label: 'Plano' },
        { value: 'contrato', label: 'Contrato' },
        { value: 'licencia', label: 'Licencia' },
        { value: 'factura', label: 'Factura' },
        { value: 'otro', label: 'Otro' }
    ].filter(type => allowedTypes.includes(type.value));

    // Supported file formats according to documentation
    const acceptedFormats = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.dwg,.dxf,.zip,.rar,.7z';

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelection(files[0]);
        }
    };

    const handleFileSelection = (file: File) => {
        // Validate file size (50MB max according to documentation)
        if (file.size > maxFileSize * 1024 * 1024) {
            onUploadError?.(`El archivo excede el tamaño máximo de ${maxFileSize}MB`);
            return;
        }

        // Validate file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'dwg', 'dxf', 'zip', 'rar', '7z'];

        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            onUploadError?.('Tipo de archivo no soportado');
            return;
        }

        setSelectedFile(file);

        // Auto-fill title if not provided
        if (!formData.title) {
            setFormData(prev => ({
                ...prev,
                title: file.name.replace(/\.[^/.]+$/, '') // Remove extension
            }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setSelectedFile(null);
        setFormData({
            title: '',
            description: '',
            document_type: 'general',
            tags: ''
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Subir Documento</h3>

            <Form method="post" encType="multipart/form-data" className="space-y-4">
                {/* Hidden field for lote if provided */}
                {loteId && <input type="hidden" name="lote" value={loteId} />}

                {/* File drop area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : selectedFile
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {selectedFile ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                            <p className="text-xs text-green-600">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="text-xs text-red-600 hover:text-red-800"
                            >
                                Remover archivo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-600">
                                Arrastra un archivo aquí o{' '}
                                <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                    <span>selecciona uno</span>
                                    <input
                                        type="file"
                                        name="file"
                                        className="hidden"
                                        accept={acceptedFormats}
                                        onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
                                        required
                                    />
                                </label>
                            </p>
                            <p className="text-xs text-gray-500">
                                Máximo {maxFileSize}MB. Formatos: PDF, DOC, XLS, IMG, CAD, ZIP
                            </p>
                        </div>
                    )}
                </div>

                {/* Title field */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Título del documento *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        maxLength={100}
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Ingrese el título del documento"
                    />
                </div>

                {/* Document type */}
                <div>
                    <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de documento
                    </label>
                    <select
                        id="document_type"
                        name="document_type"
                        value={formData.document_type}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        {documentTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción (opcional)
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Descripción opcional del documento"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                        Etiquetas (opcional)
                    </label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Separar etiquetas con comas"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Ejemplo: urgente, revisión, principal
                    </p>
                </div>

                {/* Action data messages */}
                {actionData?.message && (
                    <div className={`p-3 rounded-md ${actionData.success
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        {actionData.message}
                    </div>
                )}

                {/* Submit button */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        disabled={isSubmitting}
                    >
                        Limpiar
                    </button>
                    <button
                        type="submit"
                        disabled={!selectedFile || isSubmitting}
                        className={`px-4 py-2 rounded-md text-sm font-medium text-white ${!selectedFile || isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isSubmitting ? 'Subiendo...' : 'Subir Documento'}
                    </button>
                </div>
            </Form>
        </div>
    );
};

export default DocumentUpload;