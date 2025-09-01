import { useState } from "react";
import { Form, useNavigation } from "@remix-run/react";

interface DocumentUploadFormProps {
    loteId: string | number;
    loteNombre?: string;
    onSuccess?: () => void;
}

export default function DocumentUploadForm({
    loteId,
    loteNombre,
    onSuccess
}: DocumentUploadFormProps) {
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<string>("general");
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [tags, setTags] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            if (!title) {
                // Pre-fill title with filename if title is empty
                setTitle(e.target.files[0].name.split('.')[0]);
            }
        }
    };

    const documentTypes = [
        { value: "general", label: "Documento general" },
        { value: "plano", label: "Plano" },
        { value: "contrato", label: "Contrato (CTL)" },
        { value: "licencia", label: "Licencia" },
        { value: "factura", label: "Factura" },
        { value: "otro", label: "Otro (Levantamiento topográfico)" }
    ]; return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {loteNombre
                        ? `Subir documento para el lote: ${loteNombre}`
                        : `Subir nuevo documento`
                    }
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Los documentos ayudan a mantener organizada toda la información relevante de tu lote.
                </p>
                <div className="mt-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-bold text-yellow-800">
                                IMPORTANTE: Documentos requeridos obligatorios
                            </p>
                            <p className="mt-1 text-sm text-yellow-700">
                                Para activar tu lote, debes subir los siguientes documentos en un plazo de 12 horas o el lote será eliminado automáticamente:
                            </p>
                            <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                                <li><strong>CTL (Certificado de Tradición y Libertad)</strong>: Selecciona tipo "Contrato" e incluye "CTL" en el título</li>
                                <li><strong>Planos</strong>: Selecciona tipo "Plano"</li>
                                <li><strong>Levantamiento topográfico</strong>: Selecciona tipo "Otro" e incluye "topografia" o "levantamiento" en el título</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>            <Form method="post" encType="multipart/form-data" className="p-5">
                {/* Hidden lote ID field */}
                <input type="hidden" name="lote" value={loteId} />

                {/* Title */}
                <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Título del documento *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Escritura del lote"
                    />
                </div>

                {/* Document Type */}
                <div className="mb-4">
                    <label htmlFor="document_type" className="block text-sm font-medium text-gray-700">
                        Tipo de documento *
                    </label>
                    <select
                        id="document_type"
                        name="document_type"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                    >
                        {documentTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                {/* File Upload */}
                <div className="mb-4">
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                        Archivo *
                    </label>
                    <div className="mt-1 flex items-center">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                {selectedFile ? "Cambiar archivo" : "Seleccionar archivo"}
                            </span>
                            <input
                                id="file"
                                name="file"
                                type="file"
                                required
                                className="sr-only"
                                onChange={handleFileChange}
                            />
                        </label>
                        {selectedFile && (
                            <span className="ml-4 text-sm text-gray-500">
                                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                            </span>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Formatos soportados: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, DWG, DXF, ZIP, RAR, 7Z.
                        Tamaño máximo: 50MB.
                    </p>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción detallada del documento..."
                    ></textarea>
                </div>

                {/* Tags */}
                <div className="mb-6">
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                        Etiquetas
                    </label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Ej: importante, legal, plano (separadas por comas)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Ingresa etiquetas separadas por comas para categorizar este documento.
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedFile}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Subiendo documento...
                            </span>
                        ) : "Subir documento"}
                    </button>
                </div>
            </Form>
        </div>
    );
}