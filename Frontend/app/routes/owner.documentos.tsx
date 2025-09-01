import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { API_URL, fetchWithAuth } from "~/utils/auth.server";
import type { Document } from "~/services/documents.server";
import DocumentDetailModal from "~/components/DocumentDetailModal";

// Loader function to fetch user documents
export async function loader({ request }: LoaderFunctionArgs) {
    // Verify user is authenticated
    const user = await getUser(request);

    if (!user) {
        return json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    if (user.role !== "owner") {
        return json({ error: "No autorizado" }, { status: 403 });
    }

    try {
        // Parse URL to get filters
        const url = new URL(request.url);
        const documentType = url.searchParams.get("tipo");
        const searchQuery = url.searchParams.get("buscar");

        // Build API endpoint with filters
        let endpoint = `${API_URL}/api/documents/user/`;
        const params = new URLSearchParams();

        if (documentType) params.append("document_type", documentType);
        if (searchQuery) params.append("search", searchQuery);

        // Add sorting by date (most recent first)
        params.append("ordering", "-created_at");

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        // Fetch documents
        console.log("[Documentos] Fetching from endpoint:", endpoint);
        const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Documentos] Error fetching documents:", response.status, errorText);
            throw new Error(`Error fetching documents: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log(`[Documentos] Received ${data.results?.length || 0} documents`);

        return json({
            documents: data.results || [],
            count: data.count || 0,
            user: {
                id: user.id,
                name: user.name || user.email
            }
        }, {
            headers: setCookieHeaders
        });
    } catch (error) {
        console.error("[Documentos] Error in loader:", error);
        return json({
            error: "Error al cargar los documentos",
            documents: [],
            count: 0
        }, { status: 500 });
    }
}

// Document types for filtering
const documentTypes = [
    { value: "", label: "Todos" },
    { value: "general", label: "General" },
    { value: "plano", label: "Plano" },
    { value: "contrato", label: "Contrato" },
    { value: "licencia", label: "Licencia" },
    { value: "factura", label: "Factura" },
    { value: "otro", label: "Otro" }
];

export default function DocumentosPage() {
    const loaderData = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State variables
    const [documents, setDocuments] = useState<Document[]>(
        'documents' in loaderData ? loaderData.documents : []
    );
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filter state
    const [documentType, setDocumentType] = useState(searchParams.get("tipo") || "");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("buscar") || "");

    // Apply filters when they change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        if (documentType) {
            params.set("tipo", documentType);
        } else {
            params.delete("tipo");
        }

        if (searchQuery) {
            params.set("buscar", searchQuery);
        } else {
            params.delete("buscar");
        }

        setSearchParams(params);
    }, [documentType, searchQuery]);

    // Handle opening document detail modal
    const openDocumentDetail = (document: Document) => {
        setSelectedDocument(document);
        setShowDetailModal(true);
    };

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
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    // Get appropriate icon based on document type and mime type
    const getDocumentIcon = (doc: Document): JSX.Element => {
        const { document_type, mime_type } = doc;

        if (mime_type?.includes('image')) {
            return (
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }

        if (document_type === 'plano' || mime_type?.includes('dwg') || mime_type?.includes('dxf')) {
            return (
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            );
        }

        if (mime_type?.includes('pdf')) {
            return (
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }

        if (document_type === 'contrato') {
            return (
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        }

        // Default document icon
        return (
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    // Helper to get document type display name
    const getDocumentTypeLabel = (type: string): string => {
        const typeMap: { [key: string]: string } = {
            'general': 'General',
            'plano': 'Plano',
            'contrato': 'Contrato',
            'licencia': 'Licencia',
            'factura': 'Factura',
            'otro': 'Otro'
        };
        return typeMap[type] || type;
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Mis Documentos</h1>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-5 mb-6">
                <div className="flex flex-wrap items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de documento
                        </label>
                        <select
                            id="document-type"
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            {documentTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-auto flex-grow">
                        <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <input
                                type="text"
                                id="search-query"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por título, descripción..."
                                className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error message if any */}
            {'error' in loaderData && loaderData.error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{loaderData.error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Documents count */}
            <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{documents.length}</span> documentos
                    {'count' in loaderData && documents.length !== loaderData.count && (
                        <> de <span className="font-medium">{loaderData.count}</span> total</>
                    )}
                </p>
            </div>

            {/* Document grid */}
            {documents.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-10 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 10v2m0 4v2m-4-8v10m4-10h-4m4 10H9" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron documentos</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchQuery || documentType
                            ? "Prueba con otros filtros de búsqueda."
                            : "Aún no has subido ningún documento."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => openDocumentDetail(doc)}
                        >
                            <div className="p-5">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        {getDocumentIcon(doc)}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h3 className="text-lg font-medium text-gray-900 truncate" title={doc.title}>
                                            {doc.title}
                                        </h3>
                                        <div className="mt-1 flex items-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {getDocumentTypeLabel(doc.document_type)}
                                            </span>
                                            <span className="ml-2 text-sm text-gray-500">
                                                {formatFileSize(doc.file_size)}
                                            </span>
                                        </div>
                                        {doc.description && (
                                            <p className="mt-2 text-sm text-gray-600 line-clamp-2" title={doc.description}>
                                                {doc.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                        {doc.lote && (
                                            <Link
                                                to={`/owner/lote/${doc.lote}`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Lote #{doc.lote}
                                            </Link>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatDate(doc.created_at)}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-3">
                                <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Ver documento →
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Document detail modal */}
            {selectedDocument && (
                <DocumentDetailModal
                    isOpen={showDetailModal}
                    document={selectedDocument}
                    onClose={() => setShowDetailModal(false)}
                />
            )}
        </div>
    );
}