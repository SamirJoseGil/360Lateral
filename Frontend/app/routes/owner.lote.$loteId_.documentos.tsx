import { useState } from "react";
import { Form, useActionData, useLoaderData, Link, useNavigation, useFetcher } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { requireAuth } from "~/utils/auth.server";
import {
    uploadDocument,
    getLoteDocuments,
    deleteDocument,
    getDocumentTypes,
    type DocumentType
} from "~/services/documents.server";
import { getLoteById } from "~/services/lotes.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await requireAuth(request);
    const loteId = params.loteId;

    if (!loteId) {
        throw new Response("Lote ID requerido", { status: 400 });
    }

    try {
        // Obtener datos del lote
        const { lote } = await getLoteById(request, loteId);

        if (!lote) {
            throw new Response("Lote no encontrado", { status: 404 });
        }

        // Verificar que el usuario sea el propietario
        if (lote.owner !== user.id && user.role !== 'admin') {
            throw new Response("No tienes permiso para ver este lote", { status: 403 });
        }

        // Obtener documentos del lote
        const documentsResult = await getLoteDocuments(request, loteId);

        return json({
            lote,
            documents: documentsResult.documents || [],
            documentTypes: getDocumentTypes(),
            user,
        });

    } catch (error) {
        console.error("Error en loader de documentos:", error);
        if (error instanceof Response) {
            throw error;
        }
        throw new Response("Error interno del servidor", { status: 500 });
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    const user = await requireAuth(request);
    const loteId = params.loteId;

    if (!loteId) {
        return json(
            { success: false, error: "Lote ID requerido" },
            { status: 400 }
        );
    }

    try {
        const formData = await request.formData();
        const intent = formData.get("intent");

        if (intent === "upload") {
            // ✅ CORREGIDO: Obtener archivo correctamente
            const file = formData.get("file") as File;
            const documentType = formData.get("document_type") as DocumentType;
            const title = formData.get("title") as string;
            const description = formData.get("description") as string;

            if (!file || !file.size) {
                return json(
                    { success: false, error: "Archivo es requerido" },
                    { status: 400 }
                );
            }

            if (!documentType || !title) {
                return json(
                    { success: false, error: "Tipo de documento y título son requeridos" },
                    { status: 400 }
                );
            }

            console.log(`[Documentos Action] Subiendo archivo: ${file.name}, size: ${file.size}`);

            const uploadResult = await uploadDocument(request, {
                document_type: documentType,
                title,
                description,
                file,
                lote: loteId,
            });

            if (!uploadResult.success) {
                console.error("[Documentos Action] Error al subir documento:", uploadResult.error);
                return json(
                    { success: false, error: uploadResult.error },
                    { status: 400 }
                );
            }

            console.log("[Documentos Action] Documento subido exitosamente");
            return json({
                success: true,
                message: "Documento subido exitosamente",
                document: uploadResult.document,
            });

        } else if (intent === "delete") {
            const documentId = formData.get("documentId") as string;

            if (!documentId) {
                return json(
                    { success: false, error: "ID de documento requerido" },
                    { status: 400 }
                );
            }

            const deleteResult = await deleteDocument(request, documentId);

            if (!deleteResult.success) {
                return json(
                    { success: false, error: deleteResult.error },
                    { status: 400 }
                );
            }

            return json({
                success: true,
                message: "Documento eliminado exitosamente",
            });
        }

        return json(
            { success: false, error: "Acción no válida" },
            { status: 400 }
        );

    } catch (error) {
        console.error("Error en action de documentos:", error);
        return json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export default function LoteDocumentos() {
    const { lote, documents, documentTypes } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const deleteFetcher = useFetcher();

    const [isUploadFormVisible, setIsUploadFormVisible] = useState(false);

    const isUploading = navigation.state === "submitting" && navigation.formData?.get("intent") === "upload";
    const isDeleting = deleteFetcher.state === "submitting";

    // Función para obtener el color del tipo de documento
    const getDocumentTypeColor = (type: DocumentType) => {
        const colors: Record<DocumentType, string> = {
            ctl: "bg-blue-100 text-blue-800",
            planos: "bg-green-100 text-green-800",
            topografia: "bg-yellow-100 text-yellow-800",
            licencia_construccion: "bg-purple-100 text-purple-800",
            escritura_publica: "bg-red-100 text-red-800",
            certificado_libertad: "bg-indigo-100 text-indigo-800",
            avaluo_comercial: "bg-pink-100 text-pink-800",
            estudio_suelos: "bg-gray-100 text-gray-800",
            otros: "bg-orange-100 text-orange-800",
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    // Función para obtener el ícono del tipo de documento
    const getDocumentIcon = (type: DocumentType) => {
        switch (type) {
            case "ctl":
            case "certificado_libertad":
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case "planos":
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            case "topografia":
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                );
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // ✅ NUEVO: Función para obtener badge de estado de validación
    const getValidationStatusBadge = (status: string) => {
        const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            'pendiente': {
                bg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                text: 'Pendiente',
                icon: (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                )
            },
            'validado': {
                bg: 'bg-green-100 text-green-800 border-green-300',
                text: 'Validado',
                icon: (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )
            },
            'rechazado': {
                bg: 'bg-red-100 text-red-800 border-red-300',
                text: 'Rechazado',
                icon: (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                )
            }
        };

        const config = configs[status] || configs['pendiente'];

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
                {config.icon}
                {config.text}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    to={`/owner/lote/${lote.id}`}
                    className="text-indigo-600 hover:text-indigo-800 mb-2 inline-flex items-center text-sm font-medium transition-colors"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver al lote
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Documentos del Lote</h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{lote.nombre}</span>
                    {lote.ciudad && (
                        <>
                            <span>•</span>
                            <span>{lote.ciudad}</span>
                        </>
                    )}
                    <span>•</span>
                    <span>{lote.direccion}</span>
                </div>
            </div>

            {/* ✅ CORREGIDO: Mensaje de éxito */}
            {actionData && "success" in actionData && actionData.success && actionData.message && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{actionData.message}</p>
                        </div>
                    </div>
                </div>
            )}
            {actionData && "error" in actionData && actionData.error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{actionData.error}</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Formulario de subida */}
            {isUploadFormVisible && (
                <div className="mb-8 bg-white shadow-sm rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Subir Nuevo Documento</h3>
                    </div>
                    <div className="p-6">
                        <Form method="post" encType="multipart/form-data" className="space-y-6">
                            <input type="hidden" name="intent" value="upload" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de Documento *
                                    </label>
                                    <select
                                        id="document_type"
                                        name="document_type"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        {documentTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: CTL actualizado 2024"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Descripción opcional del documento..."
                                />
                            </div>

                            <div>
                                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                                    Archivo *
                                </label>
                                <input
                                    type="file"
                                    id="file"
                                    name="file"
                                    required
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dwg,.zip"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Formatos permitidos: PDF, DOC, DOCX, JPG, PNG, DWG, ZIP (máx. 10MB)
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadFormVisible(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {isUploading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Subiendo...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Subir Documento
                                        </>
                                    )}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}

            {/* Lista de documentos */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Documentos ({documents.length})
                    </h3>
                </div>

                {documents.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Comienza subiendo el primer documento de este lote.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => setIsUploadFormVisible(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Subir Primer Documento
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {documents.map((document) => (
                            <div key={document.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className="flex-shrink-0 space-y-2">
                                            {/* Tipo de documento */}
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(document.document_type)}`}>
                                                {getDocumentIcon(document.document_type)}
                                                <span className="ml-1">
                                                    {documentTypes.find(t => t.value === document.document_type)?.label || document.document_type}
                                                </span>
                                            </div>

                                            {/* ✅ NUEVO: Estado de validación */}
                                            {document.validation_status && (
                                                <div>
                                                    {getValidationStatusBadge(document.validation_status)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{document.title}</p>

                                            {document.description && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{document.description}</p>
                                            )}

                                            {/* ✅ NUEVO: Mostrar razón de rechazo si existe */}
                                            {document.validation_status === 'rechazado' && document.rejection_reason && (
                                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-red-800">Razón del rechazo:</p>
                                                            <p className="text-xs text-red-700 mt-1">{document.rejection_reason}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                                                <span className="flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(document.created_at).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                {document.file_size && (
                                                    <span className="flex items-center">
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        {formatFileSize(document.file_size)}
                                                    </span>
                                                )}
                                                {document.mime_type && (
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                                        {document.mime_type.split('/')[1]?.toUpperCase()}
                                                    </span>
                                                )}

                                                {/* ✅ NUEVO: Mostrar fecha de validación si existe */}
                                                {document.validated_at && document.validation_status === 'validado' && (
                                                    <span className="flex items-center text-green-600">
                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Validado el {new Date(document.validated_at).toLocaleDateString('es-ES')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        {/* Botón de descarga */}
                                        <a
                                            href={document.file_url || document.file}
                                            download={document.file_name || document.title}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-2 border border-indigo-300 shadow-sm text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Descargar
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}