import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticateAdmin } from "~/utils/auth.server";
import {
    getValidationSummary,
    getRecentDocumentsForValidation,
    getValidationDocuments, // ✅ AGREGADO: Import faltante
    getValidationDocumentsGrouped,
    performDocumentAction,
} from "~/services/documents.server";

// Loader para cargar datos de validación
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await authenticateAdmin(request);

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(url.searchParams.get("page_size") || "10");
    const view = url.searchParams.get("view") || "grouped";

    try {
        console.log(`[Admin Validación] Loading data - view: ${view}, status: ${status || 'all'}, page: ${page}`);

        // Obtener resumen de validación
        const { validationSummary, headers: summaryHeaders } = await getValidationSummary(request);

        // ✅ NUEVO: Obtener documentos según la vista
        let lotes = [];
        let documents = [];
        let pagination = { page: 1, page_size: 10, total: 0, total_pages: 0 };

        if (view === "grouped") {
            const { lotes: lotesData, pagination: paginationData } = 
                await getValidationDocumentsGrouped(request, { page, page_size, status });
            
            lotes = lotesData || []; // ✅ Asegurar array vacío si es null/undefined
            pagination = paginationData;
        } else {
            const { documents: docsData, pagination: paginationData } = 
                await getValidationDocuments(request, { page, page_size, status });
            
            documents = docsData || []; // ✅ Asegurar array vacío si es null/undefined
            pagination = paginationData;
        }

        // Obtener documentos recientes si no hay filtro
        let recentDocuments = [];
        if (!status && view !== "grouped") {
            const { recentDocuments: docs } = await getRecentDocumentsForValidation(request, 5);
            recentDocuments = docs || [];
        }

        console.log(`[Admin Validación] Loaded - view: ${view}, items: ${view === 'grouped' ? lotes.length : documents.length}`);

        // ✅ CORREGIDO: NO retornar error si simplemente no hay datos
        return json({
            user,
            summary: validationSummary,
            view,
            lotes,
            documents,
            recentDocuments,
            pagination,
            currentStatus: status,
            error: null // ✅ Sin error cuando simplemente no hay datos
        }, {
            headers: summaryHeaders
        });

    } catch (error) {
        console.error("[Admin Validación] Error loading data:", error);
        
        // ✅ MEJORADO: Solo mostrar error si realmente hubo un problema
        return json({
            user,
            summary: {
                pendientes: 0,
                validados: 0,
                rechazados: 0,
                total: 0
            },
            view: "grouped",
            lotes: [],
            documents: [],
            recentDocuments: [],
            pagination: {
                page: 1,
                page_size: 10,
                total: 0,
                total_pages: 0
            },
            currentStatus: status,
            error: "Hubo un problema al cargar los datos. Por favor, recarga la página." // ✅ Mensaje más específico
        });
    }
}

// Action para realizar acciones de validación
export async function action({ request }: ActionFunctionArgs) {
    const user = await authenticateAdmin(request);

    const formData = await request.formData();
    const intent = formData.get("intent");
    const documentId = formData.get("documentId") as string;
    const action = formData.get("action") as "validar" | "rechazar";
    const comments = formData.get("comments") as string || "";

    if (intent === "validate" && documentId && action) {
        try {
            console.log(`[Admin Validación] Performing action: ${action} on document: ${documentId}`);

            const { result, headers } = await performDocumentAction(
                request,
                documentId,
                action,
                comments
            );

            return json({
                success: true,
                message: `Documento ${action === "validar" ? "validado" : "rechazado"} exitosamente`,
                result
            }, {
                headers
            });

        } catch (error) {
            console.error("[Admin Validación] Error performing action:", error);
            return json({
                success: false,
                error: error instanceof Error ? error.message : "Error al procesar la acción"
            }, {
                status: 400
            });
        }
    }

    return json({ success: false, error: "Acción inválida" }, { status: 400 });
}

export default function AdminValidacion() {
    const { summary, view, lotes, documents, recentDocuments, pagination, currentStatus, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();

    const [selectedDocument, setSelectedDocument] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [validationComments, setValidationComments] = useState("");
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<any>(null);
    const [expandedLotes, setExpandedLotes] = useState<Set<string>>(new Set());
    // ✅ NUEVO: Estado para rastrear documentos procesados (evitar duplicados)
    const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());

    const isSubmitting = navigation.state === "submitting";

    // ✅ NUEVO: Limpiar documentos procesados cuando cambie la acción
    useEffect(() => {
        if (actionData?.success) {
            // Esperar un momento y limpiar
            const timer = setTimeout(() => {
                setProcessingDocs(new Set());
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [actionData]);

    // ✅ NUEVO: Función para toggle de lotes
    const toggleLote = (loteId: string) => {
        setExpandedLotes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(loteId)) {
                newSet.delete(loteId);
            } else {
                newSet.add(loteId);
            }
            return newSet;
        });
    };

    // ✅ NUEVO: Expandir todos los lotes por defecto
    useEffect(() => {
        if (view === 'grouped' && lotes.length > 0) {
            setExpandedLotes(new Set(lotes.map((l: any) => l.lote_id)));
        }
    }, [view, lotes]);

    const getDocumentTypeLabel = (type: string) => {
        const types: { [key: string]: string } = {
            'ctl': 'Certificado de Tradición y Libertad',
            'planos': 'Planos Arquitectónicos',
            'topografia': 'Levantamiento Topográfico',
            'licencia_construccion': 'Licencia de Construcción',
            'escritura_publica': 'Escritura Pública',
            'certificado_libertad': 'Certificado de Libertad',
            'avaluo_comercial': 'Avalúo Comercial',
            'estudio_suelos': 'Estudio de Suelos',
            'otros': 'Otros Documentos',
        };
        return types[type] || type;
    };

    // ✅ MEJORADO: Helper para verificar si un documento puede ser modificado
    const canModifyDocument = (document: any): boolean => {
        const currentStatus = document.estado || document.metadata?.validation_status || 'pendiente';
        const isProcessing = processingDocs.has(document.id);
        
        return currentStatus === 'pendiente' && !isProcessing && !isSubmitting;
    };

    // ✅ MEJORADO: Helper para obtener clase de badge según estado
    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            case 'validado':
                return 'bg-green-100 text-green-800 border border-green-300';
            case 'rechazado':
                return 'bg-red-100 text-red-800 border border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-300';
        }
    };

    const handleValidateClick = (document: any, action: "validar" | "rechazar") => {
        // ✅ EVITAR DUPLICADOS: Verificar si ya está procesándose
        if (processingDocs.has(document.id)) {
            console.log('[Admin] ⚠️ Documento ya en procesamiento:', document.id);
            return;
        }
        
        // ✅ EVITAR DUPLICADOS: Verificar estado actual
        const currentStatus = document.estado || document.metadata?.validation_status || 'pendiente';
        
        if (action === 'validar' && currentStatus === 'validado') {
            alert('Este documento ya está validado');
            return;
        }
        
        if (action === 'rechazar' && currentStatus === 'rechazado') {
            alert('Este documento ya está rechazado');
            return;
        }
        
        // Marcar como procesándose
        setProcessingDocs(prev => new Set(prev).add(document.id));
        
        setSelectedDocument({ ...document, action });
        setShowModal(true);
    };

    const handlePreviewClick = (document: any) => {
        console.log('[Admin] Opening preview for document:', {
            id: document.id,
            file: document.file,
            file_url: document.file_url,
            nombre: document.nombre || document.title
        });
        setPreviewDocument(document);
        setShowPreviewModal(true);
    };

    // ✅ NUEVO: Helper para obtener URL del archivo
    const getFileUrl = (document: any): string => {
        // ✅ LOGGING MEJORADO
        console.log('[Admin] Getting file URL for document:', {
            id: document.id,
            nombre: document.nombre || document.title,
            file: document.file,
            file_url: document.file_url,
            keys: Object.keys(document)
        });

        const url = document.file_url || document.file;

        if (!url) {
            console.error('[Admin] ⚠️ No URL found for document:', document);
        } else {
            console.log('[Admin] ✅ File URL:', url);
        }

        return url || '';
    };

    // ✅ CORRECTO: Usar suppressHydrationWarning en lugar de isClient
    const formatDate = (dateString: string): string => {
        // En servidor, retornar formato ISO para evitar diferencias
        return new Date(dateString).toISOString().split('T')[0];
    };

    const isPDF = (document: any) => {
        return document.file && (
            document.file.toLowerCase().endsWith('.pdf') ||
            document.mime_type?.includes('pdf')
        );
    };

    const isImage = (document: any) => {
        return document.mime_type?.startsWith('image/') ||
            /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(document.file || '');
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Validación de Documentos</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Gestiona y valida los documentos subidos por los propietarios
                </p>
            </div>

            {/* Mensajes de acción */}
            {actionData?.success && "message" in actionData && actionData.message && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                    <p className="text-sm text-green-700">{actionData.message}</p>
                </div>
            )}

            {actionData && "error" in actionData && actionData.error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <p className="text-sm text-red-700">{actionData.error}</p>
                </div>
            )}

            {/* ✅ MEJORADO: Solo mostrar error si hay un error real */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <div className="flex">
                        <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Resumen de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total</p>
                            <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
                        </div>
                        <div className="bg-blue-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pendientes</p>
                            <p className="text-3xl font-bold text-yellow-600">{summary.pendientes}</p>
                        </div>
                        <div className="bg-yellow-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Validados</p>
                            <p className="text-3xl font-bold text-green-600">{summary.validados}</p>
                        </div>
                        <div className="bg-green-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Rechazados</p>
                            <p className="text-3xl font-bold text-red-600">{summary.rechazados}</p>
                        </div>
                        <div className="bg-red-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ NUEVO: Toggle de vista */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Vista de Documentos</h3>
                    <div className="flex gap-2">
                        <a
                            href={`/admin/validacion?view=grouped${currentStatus ? `&status=${currentStatus}` : ''}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                view === 'grouped'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Por Lote
                        </a>
                        <a
                            href={`/admin/validacion?view=flat${currentStatus ? `&status=${currentStatus}` : ''}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                view === 'flat'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Lista Simple
                        </a>
                    </div>
                </div>

                {/* Filtros de estado */}
                <div className="flex flex-wrap gap-3">
                    <a
                        href={`/admin/validacion?view=${view}`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!currentStatus
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Todos ({summary.total})
                    </a>
                    <a
                        href={`/admin/validacion?view=${view}&status=pendiente`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentStatus === 'pendiente'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Pendientes ({summary.pendientes})
                    </a>
                    <a
                        href={`/admin/validacion?view=${view}&status=validado`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentStatus === 'validado'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Validados ({summary.validados})
                    </a>
                    <a
                        href={`/admin/validacion?view=${view}&status=rechazado`}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentStatus === 'rechazado'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Rechazados ({summary.rechazados})
                    </a>
                </div>
            </div>

            {/* ✅ MEJORADO: Vista agrupada por lote con collapse */}
            {view === 'grouped' ? (
                <div className="space-y-6">
                    {lotes.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay lotes con documentos</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {currentStatus
                                    ? `No hay lotes con documentos "${currentStatus}"`
                                    : "No hay lotes con documentos en este momento"}
                            </p>
                        </div>
                    ) : (
                        lotes.map((lote: any) => {
                            const isExpanded = expandedLotes.has(lote.lote_id);
                            
                            return (
                                <div key={lote.lote_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Header del lote */}
                                    <div 
                                        className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition-colors"
                                        onClick={() => toggleLote(lote.lote_id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 flex items-center gap-3">
                                                {/* ✅ NUEVO: Icono de expand/collapse */}
                                                <svg 
                                                    className={`w-5 h-5 text-indigo-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>

                                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>

                                                <div className="flex-1">
                                                    <h3 className="text-xl font-semibold text-gray-900">
                                                        {lote.lote_nombre}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">{lote.lote_direccion}</p>
                                                </div>
                                            </div>

                                            {/* ✅ CORREGIDO: Mostrar conteo real */}
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-indigo-600">
                                                        {lote.total_documentos}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        documento{lote.total_documentos !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    {lote.pendientes > 0 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            {lote.pendientes} pendiente{lote.pendientes !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {lote.validados > 0 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {lote.validados} validado{lote.validados !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {lote.rechazados > 0 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            {lote.rechazados} rechazado{lote.rechazados !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contenido colapsable */}
                                    {isExpanded && (
                                        <div className="divide-y divide-gray-200">
                                            {lote.documentos.map((document: any) => {
                                                const currentStatus = document.estado || document.metadata?.validation_status || 'pendiente';
                                                const canModify = canModifyDocument(document);
                                                const isProcessing = processingDocs.has(document.id);
                                                
                                                return (
                                                    <div key={document.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="text-base font-medium text-gray-900 truncate">
                                                                        {document.nombre || document.title}
                                                                    </h4>
                                                                    {/* ✅ Badge con estado actualizado */}
                                                                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(currentStatus)}`}>
                                                                        {isProcessing ? 'procesando...' : currentStatus}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                    <span>{getDocumentTypeLabel(document.tipo || document.document_type)}</span>
                                                                    <span>•</span>
                                                                    <span suppressHydrationWarning>
                                                                        {formatDate(document.fecha_subida || document.created_at)}
                                                                    </span>
                                                                    {document.solicitante && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{document.solicitante}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Acciones */}
                                                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                                                <button
                                                                    onClick={() => handlePreviewClick(document)}
                                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                                                    title="Ver documento"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </button>

                                                                {/* ✅ Solo mostrar botones si puede modificarse */}
                                                                {canModify && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleValidateClick(document, "validar")}
                                                                            disabled={!canModify}
                                                                            className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                            title="Validar"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleValidateClick(document, "rechazar")}
                                                                            disabled={!canModify}
                                                                            className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                            title="Rechazar"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    {!isExpanded && (
                                        <div className="px-6 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                                            Click para ver {lote.total_documentos} documento{lote.total_documentos !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                // Vista plana (original) - código existente sin cambios
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Documentos {currentStatus ? `- ${currentStatus}` : ''} ({documents.length})
                        </h3>
                    </div>

                    {documents.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay documentos</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {currentStatus
                                    ? `No hay documentos con estado "${currentStatus}"`
                                    : "No hay documentos para validar en este momento"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {documents.map((document: any) => (
                                <div key={document.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-lg font-medium text-gray-900">{document.nombre || document.title}</h4>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(document.estado || 'pendiente')}`}>
                                                    {document.estado || 'pendiente'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Tipo:</span>
                                                    <span className="ml-2 font-medium text-gray-900">
                                                        {getDocumentTypeLabel(document.tipo || document.document_type)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Solicitante:</span>
                                                    <span className="ml-2 font-medium text-gray-900">
                                                        {document.solicitante || 'Desconocido'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Fecha:</span>
                                                    <span className="ml-2 font-medium text-gray-900">
                                                        {/* ✅ Usar suppressHydrationWarning para fechas */}
                                                        <span suppressHydrationWarning>
                                                            {formatDate(document.fecha_subida || document.created_at)}
                                                        </span>
                                                    </span>
                                                </div>
                                                {document.lote_nombre && (
                                                    <div>
                                                        <span className="text-gray-500">Lote:</span>
                                                        <span className="ml-2 font-medium text-gray-900">
                                                            {document.lote_nombre}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => handlePreviewClick(document)}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Ver Documento
                                            </button>

                                            {(!document.estado || document.estado === 'pendiente') && (
                                                <>
                                                    <button
                                                        onClick={() => handleValidateClick(document, "validar")}
                                                        disabled={isSubmitting}
                                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Validar
                                                    </button>
                                                    <button
                                                        onClick={() => handleValidateClick(document, "rechazar")}
                                                        disabled={isSubmitting}
                                                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {pagination.total_pages > 1 && (
                        <div className="mt-6 px-6 py-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                            <p className="text-sm text-gray-700">
                                Mostrando página <span className="font-medium">{pagination.page}</span> de{' '}
                                <span className="font-medium">{pagination.total_pages}</span>
                                {' '}({pagination.total} {view === 'grouped' ? 'lotes' : 'documentos'})
                            </p>
                            <div className="flex space-x-2">
                                {pagination.page > 1 && (
                                    <a
                                        href={`?view=${view}&page=${pagination.page - 1}${currentStatus ? `&status=${currentStatus}` : ''}`}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Anterior
                                    </a>
                                )}
                                {pagination.page < pagination.total_pages && (
                                    <a
                                        href={`?view=${view}&page=${pagination.page + 1}${currentStatus ? `&status=${currentStatus}` : ''}`}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Siguiente
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de confirmación */}
            {showModal && selectedDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {selectedDocument.action === "validar" ? "Validar Documento" : "Rechazar Documento"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                ¿Estás seguro de que deseas {selectedDocument.action === "validar" ? "validar" : "rechazar"} el documento "{selectedDocument.nombre || selectedDocument.title}"?
                            </p>

                            <Form method="post" onSubmit={() => setShowModal(false)}>
                                <input type="hidden" name="intent" value="validate" />
                                <input type="hidden" name="documentId" value={selectedDocument.id} />
                                <input type="hidden" name="action" value={selectedDocument.action} />

                                <div className="mb-4">
                                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                                        Comentarios {selectedDocument.action === "rechazar" && "(requerido)"}
                                    </label>
                                    <textarea
                                        id="comments"
                                        name="comments"
                                        rows={3}
                                        value={validationComments}
                                        onChange={(e) => setValidationComments(e.target.value)}
                                        required={selectedDocument.action === "rechazar"}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Escribe tus comentarios aquí..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setValidationComments("");
                                        }}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${selectedDocument.action === "validar"
                                            ? "bg-green-600 hover:bg-green-700"
                                            : "bg-red-600 hover:bg-red-700"
                                            }`}
                                    >
                                        {isSubmitting ? "Procesando..." : selectedDocument.action === "validar" ? "Validar" : "Rechazar"}
                                    </button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de vista previa de documento */}
            {showPreviewModal && previewDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        {/* Header del modal */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex-1">
                                <h3 className="text-xl font-medium text-gray-900">
                                    {previewDocument.nombre || previewDocument.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {getDocumentTypeLabel(previewDocument.tipo || previewDocument.document_type)} •
                                    <span suppressHydrationWarning>
                                        Subido el {formatDate(previewDocument.fecha_subida || previewDocument.created_at)}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Contenido del modal - Vista previa */}
                        <div className="flex-1 overflow-auto p-6 bg-gray-50">
                            {(() => {
                                const fileUrl = getFileUrl(previewDocument);

                                if (!fileUrl) {
                                    return (
                                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                            <svg className="mx-auto h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <h3 className="mt-4 text-lg font-medium text-gray-900">Archivo no disponible</h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                No se encontró la URL del documento
                                            </p>
                                        </div>
                                    );
                                }

                                if (isPDF(previewDocument)) {
                                    return (
                                        <div className="bg-white rounded-lg shadow-sm h-full">
                                            <iframe
                                                src={fileUrl}
                                                className="w-full h-full min-h-[600px] rounded-lg"
                                                title="Vista previa del documento"
                                                onError={(e) => {
                                                    console.error('[Admin] Error cargando PDF:', fileUrl);
                                                }}
                                            />
                                        </div>
                                    );
                                } else if (isImage(previewDocument)) {
                                    return (
                                        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center">
                                            <img
                                                src={fileUrl}
                                                alt={previewDocument.nombre || previewDocument.title}
                                                className="max-w-full max-h-[600px] object-contain rounded"
                                                onError={(e) => {
                                                    console.error('[Admin] Error cargando imagen:', fileUrl);
                                                }}
                                            />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="mt-4 text-lg font-medium text-gray-900">Vista previa no disponible</h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                Este tipo de archivo no se puede visualizar en el navegador
                                            </p>
                                            <a
                                                href={fileUrl}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-6 inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                                onClick={(e) => {
                                                    console.log('[Admin] Downloading from no-preview:', fileUrl);
                                                }}
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Descargar Documento
                                            </a>
                                        </div>
                                    );
                                }
                            })()}
                        </div>

                        {/* Footer del modal con acciones */}
                        <div className="border-t border-gray-200 p-6 bg-white flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <a
                                    href={getFileUrl(previewDocument)}
                                    download={previewDocument.file_name || previewDocument.nombre || previewDocument.title}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        const url = getFileUrl(previewDocument);
                                        console.log('[Admin] Descargando desde modal:', url);
                                        if (!url) {
                                            e.preventDefault();
                                            alert('URL del documento no disponible');
                                        }
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descargar
                                </a>
                            </div>

                            {(!previewDocument.estado || previewDocument.estado === 'pendiente') && (
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowPreviewModal(false);
                                            handleValidateClick(previewDocument, "rechazar");
                                        }}
                                        className="inline-flex items-center px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Rechazar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPreviewModal(false);
                                            handleValidateClick(previewDocument, "validar");
                                        }}
                                        className="inline-flex items-center px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Validar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}