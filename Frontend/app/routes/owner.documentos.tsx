import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { fetchWithAuth } from "~/utils/auth.server";
import type { Document } from "~/services/documents.server";
import { API_URL } from "~/utils/env.server";

// Loader function to fetch user documents
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);

    if (!user) {
        return json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    if (user.role !== "owner") {
        return json({ error: "No autorizado" }, { status: 403 });
    }

    try {
        const url = new URL(request.url);
        const documentType = url.searchParams.get("tipo");
        const searchQuery = url.searchParams.get("buscar");
        const groupByLote = url.searchParams.get("agrupar") === "lote"; // ✅ NUEVO

        let endpoint = `${API_URL}/api/documents/user/`;
        const params = new URLSearchParams();

        if (documentType) params.append("document_type", documentType);
        if (searchQuery) params.append("search", searchQuery);
        params.append("ordering", "-created_at");

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        console.log("[Documentos] Fetching from:", endpoint);
        const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Documentos] Error:", response.status, errorText);
            throw new Error(`Error fetching documents: ${response.status}`);
        }

        const data = await response.json();
        const documents = Array.isArray(data) ? data : (data.results || []);

        // ✅ NUEVO: Agrupar por lote si se solicita
        let groupedByLote: Record<string, any> = {};
        let documentsWithoutLote: any[] = [];

        if (groupByLote) {
            documents.forEach((doc: any) => {
                if (doc.lote) {
                    const loteId = doc.lote;
                    if (!groupedByLote[loteId]) {
                        groupedByLote[loteId] = {
                            lote_id: loteId,
                            lote_info: doc.lote_info || null,
                            documents: []
                        };
                    }
                    groupedByLote[loteId].documents.push(doc);
                } else {
                    documentsWithoutLote.push(doc);
                }
            });
        }

        console.log(`[Documentos] Loaded ${documents.length} documents`);

        return json({
            documents,
            groupedByLote: Object.values(groupedByLote),
            documentsWithoutLote,
            count: data.count || documents.length,
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
            groupedByLote: [],
            documentsWithoutLote: [],
            count: 0
        }, { status: 500 });
    }
}

export default function DocumentosPage() {
    const loaderData = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();

    const [documents, setDocuments] = useState<Document[]>(
        'documents' in loaderData ? loaderData.documents : []
    );
    const [documentType, setDocumentType] = useState(searchParams.get("tipo") || "");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("buscar") || "");
    const [groupByLote, setGroupByLote] = useState(searchParams.get("agrupar") === "lote"); // ✅ NUEVO

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

        // ✅ NUEVO: Parámetro de agrupación
        if (groupByLote) {
            params.set("agrupar", "lote");
        } else {
            params.delete("agrupar");
        }

        setSearchParams(params);
    }, [documentType, searchQuery, groupByLote]);

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
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const getDocumentIcon = (doc: Document): JSX.Element => {
        const { mime_type } = doc;

        if (mime_type?.includes('image')) {
            return (
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }

        if (mime_type?.includes('pdf')) {
            return (
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }

        return (
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    const documentTypes: { [key: string]: string } = {
        'ctl': 'bg-purple-100 text-purple-800',
        'planos': 'bg-blue-100 text-blue-800',
        'topografia': 'bg-green-100 text-green-800',
        'licencia_construccion': 'bg-yellow-100 text-yellow-800',
        'escritura_publica': 'bg-indigo-100 text-indigo-800',
        'certificado_libertad': 'bg-pink-100 text-pink-800',
        'avaluo_comercial': 'bg-orange-100 text-orange-800',
        'estudio_suelos': 'bg-teal-100 text-teal-800',
        'otros': 'bg-gray-100 text-gray-800',
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Mis Documentos</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Gestiona todos tus documentos cargados en la plataforma
                </p>
            </div>

            {/* Filtros mejorados */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Selector de tipo */}
                    <div>
                        <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de documento
                        </label>
                        <select
                            id="document-type"
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        >
                            {Object.entries(documentTypes).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Buscador */}
                    <div>
                        <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar documentos
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="search-query"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por título..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* ✅ NUEVO: Toggle de agrupación */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vista
                        </label>
                        <button
                            onClick={() => setGroupByLote(!groupByLote)}
                            className={`w-full flex items-center justify-center px-4 py-2 border rounded-lg transition-colors ${groupByLote
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            {groupByLote ? 'Agrupado por Lote' : 'Vista de Lista'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {'error' in loaderData && loaderData.error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
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

            {/* Contador */}
            <div className="mb-6 flex justify-between items-center">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold">{documents.length}</span> documento{documents.length !== 1 ? 's' : ''} encontrado{documents.length !== 1 ? 's' : ''}
                </p>

                <Link
                    to="/owner/lotes"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Subir Documentos
                </Link>
            </div>

            {/* ✅ NUEVO: Renderizado condicional según agrupación */}
            {documents.length === 0 ? (
                <div className="bg-white shadow-sm rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron documentos</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {searchQuery || documentType
                            ? "Prueba ajustando los filtros de búsqueda"
                            : "Comienza subiendo documentos desde tus lotes"}
                    </p>
                    {!searchQuery && !documentType && (
                        <div className="mt-6">
                            <Link
                                to="/owner/lotes"
                                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Ir a Mis Lotes
                            </Link>
                        </div>
                    )}
                </div>
            ) : groupByLote ? (
                // ✅ VISTA AGRUPADA POR LOTE
                <div className="space-y-8">
                    {/* Documentos agrupados por lote */}
                    {'groupedByLote' in loaderData && loaderData.groupedByLote.map((group: any) => (
                        <div key={group.lote_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Header del grupo */}
                            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {group.lote_info?.nombre || `Lote ${group.lote_id}`}
                                        </h3>
                                        {group.lote_info?.direccion && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {group.lote_info.direccion}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-indigo-600">
                                            {group.documents.length} documento{group.documents.length !== 1 ? 's' : ''}
                                        </span>
                                        <Link
                                            to={`/owner/lote/${group.lote_id}`}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                                        >
                                            Ver lote
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Documentos del lote */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {group.documents.map((doc: Document) => (
                                    <DocumentCard key={doc.id} doc={doc} showLoteLink={false} />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Documentos sin lote */}
                    {'documentsWithoutLote' in loaderData && loaderData.documentsWithoutLote.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Documentos sin lote asociado
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {loaderData.documentsWithoutLote.length} documento{loaderData.documentsWithoutLote.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {loaderData.documentsWithoutLote.map((doc: Document) => (
                                    <DocumentCard key={doc.id} doc={doc} showLoteLink={false} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // ✅ VISTA DE LISTA NORMAL
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <DocumentCard key={doc.id} doc={doc} showLoteLink={true} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ✅ NUEVO: Componente reutilizable para tarjetas de documento
function DocumentCard({ doc, showLoteLink }: { doc: Document; showLoteLink: boolean }) {
    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return 'Desconocido';
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    };

    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const getDocumentIcon = (doc: Document): JSX.Element => {
        const { mime_type } = doc;

        if (mime_type?.includes('image')) {
            return (
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }

        if (mime_type?.includes('pdf')) {
            return (
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        }

        return (
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    const documentTypes: { [key: string]: string } = {
        'ctl': 'bg-purple-100 text-purple-800',
        'planos': 'bg-blue-100 text-blue-800',
        'topografia': 'bg-green-100 text-green-800',
        'licencia_construccion': 'bg-yellow-100 text-yellow-800',
        'escritura_publica': 'bg-indigo-100 text-indigo-800',
        'certificado_libertad': 'bg-pink-100 text-pink-800',
        'avaluo_comercial': 'bg-orange-100 text-orange-800',
        'estudio_suelos': 'bg-teal-100 text-teal-800',
        'otros': 'bg-gray-100 text-gray-800',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 group">
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start justify-between">
                    <div className="flex-shrink-0 bg-white rounded-lg p-3 shadow-sm">
                        {getDocumentIcon(doc)}
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${documentTypes[doc.document_type] || 'bg-gray-100 text-gray-800'}`}>
                        {doc.document_type}
                    </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-900 line-clamp-2" title={doc.title}>
                    {doc.title}
                </h3>

                {doc.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {doc.description}
                    </p>
                )}
            </div>

            {/* Detalles */}
            <div className="px-6 py-4 bg-white space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tamaño:</span>
                    <span className="font-medium text-gray-900">{formatFileSize(doc.file_size)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subido:</span>
                    <span className="font-medium text-gray-900">{formatDate(doc.created_at)}</span>
                </div>

                {showLoteLink && doc.lote && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-500">Lote:</span>
                        <Link
                            to={`/owner/lote/${doc.lote}`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                        >
                            Ver lote
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center border-t border-gray-100">
                <a
                    href={doc.file_url || doc.file}
                    download={doc.file_name || doc.title}
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar
                </a>

                <a
                    href={doc.file_url || doc.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                    Ver
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </div>
    );
}