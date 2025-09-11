import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { usePageView, recordAction } from "~/hooks/useStats";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";
import { getNormativaPorCBML } from "~/services/pot.server";
import {
    getValidationSummary,
    getRecentDocumentsForValidation,
    getValidationDocuments,
    performDocumentAction
} from "~/services/documents.server";

export async function loader({ request }: LoaderFunctionArgs) {
    console.log("Admin validacion loader - processing request");

    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user) {
        console.log("Admin validacion loader - no user, redirecting to home");
        return redirect("/");
    }

    if (user.role !== "admin" && user.role !== "owner") {
        console.log(`Admin validacion loader - user is not authorized (${user.role})`);
        return redirect("/");
    }

    try {
        // Registrar evento de vista de la página de validación según documentación
        await recordEvent(request, {
            type: "view",
            name: "admin_validation_page",
            value: {
                user_id: user.id,
                role: user.role,
                section: "validacion"
            }
        });

        // Obtener resumen de validación
        const validationSummaryResponse = await getValidationSummary(request);

        // Obtener documentos recientes que necesitan validación
        const recentDocumentsResponse = await getRecentDocumentsForValidation(request, 10);

        // Obtener lista de documentos con paginación (primera página)
        const documentsResponse = await getValidationDocuments(request, {
            page: 1,
            page_size: 10
        });

        // Extraer datos del resumen de validación
        const summary = validationSummaryResponse.validationSummary;

        // Convertir los documentos recientes al formato esperado por el componente
        const documentos = recentDocumentsResponse.recentDocuments.map((doc: any) => ({
            id: doc.id.toString(),
            nombre: doc.title || doc.nombre || doc.titulo || `Documento ${doc.id}`,
            tipo: doc.document_type || doc.tipo_documento || "Otro",
            estado: doc.metadata?.validation_status || doc.estado_validacion || "pendiente",
            fechaSubida: doc.created_at || doc.fecha_subida || new Date().toISOString().split('T')[0],
            solicitante: doc.user_name || doc.usuario_nombre || `Usuario ${doc.user_id || doc.usuario_id || "desconocido"}`
        }));

        // Datos de validación desde la API
        const validacionData = {
            pendientes: summary.pendientes || summary.pendiente || 0,
            completadas: summary.validados || summary.validado || summary.completadas || 0,
            rechazadas: summary.rechazados || summary.rechazado || summary.rechazadas || 0,
            documentos,
            pagination: documentsResponse.pagination
        };

        return json({
            user,
            validacionData,
            realData: true,
            error: null
        }, {
            headers: {
                ...validationSummaryResponse.headers,
                ...recentDocumentsResponse.headers,
                ...documentsResponse.headers
            }
        });

    } catch (error) {
        console.error("Error cargando datos de validación:", error);

        // Por ahora datos de ejemplo como respaldo
        const validacionData = {
            pendientes: 15,
            completadas: 78,
            rechazadas: 7,
            documentos: [
                {
                    id: "doc-1",
                    nombre: "Escritura Lote 123",
                    tipo: "Escritura",
                    estado: "pendiente",
                    fechaSubida: "2025-08-20",
                    solicitante: "Juan Pérez"
                },
                {
                    id: "doc-2",
                    nombre: "Plano Topográfico Sector Norte",
                    tipo: "Plano",
                    estado: "completado",
                    fechaSubida: "2025-08-18",
                    solicitante: "María Gómez"
                },
                {
                    id: "doc-3",
                    nombre: "Certificado Tradición Lote 456",
                    tipo: "Certificado",
                    estado: "pendiente",
                    fechaSubida: "2025-08-22",
                    solicitante: "Carlos Ruiz"
                }
            ]
        };

        return json({
            user,
            validacionData,
            realData: false,
            error: "No se pudieron cargar los datos en tiempo real. Mostrando datos de respaldo."
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
        return redirect("/");
    }

    // Procesar el formulario
    const formData = await request.formData();
    const action = formData.get("action") as string;
    const documentId = formData.get("documentId") as string;
    const comentarios = formData.get("comentarios") as string || '';

    console.log(`Processing document action: ${action} for document ${documentId}`);

    if (!action || !documentId) {
        return json({
            success: false,
            message: "Datos de acción incompletos"
        });
    }

    try {
        // Registrar la acción como evento
        await recordEvent(request, {
            type: "action",
            name: `document_${action}`,
            value: {
                user_id: user.id,
                document_id: documentId,
                comentarios
            }
        });

        // Realizar la acción de validación o rechazo
        const actionResult = await performDocumentAction(
            request,
            documentId,
            action === "validar" ? "validar" : "rechazar",
            comentarios
        );

        return json({
            success: true,
            message: action === "validar" ? "Documento validado correctamente" : "Documento rechazado correctamente",
            result: actionResult.result
        }, {
            headers: actionResult.headers
        });
    } catch (error) {
        console.error(`Error performing document action ${action} for ${documentId}:`, error);
        return json({
            success: false,
            message: `Error al procesar la acción: ${(error as Error).message}`
        });
    }
}

type Documento = {
    id: string;
    nombre: string;
    tipo: string;
    estado: string;
    fechaSubida: string;
    solicitante: string;
};

export default function AdminValidacion() {
    const { validacionData, realData, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [expandedDocuments, setExpandedDocuments] = useState<string[]>([]);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [currentDoc, setCurrentDoc] = useState<Documento | null>(null);
    const [modalAction, setModalAction] = useState<'validar' | 'rechazar' | null>(null);
    const [comentarios, setComentarios] = useState<string>('');

    // Registrar vista de página de validación
    usePageView('admin_validation_page', {
        documents_count: validacionData.pendientes
    }, [validacionData.pendientes]);

    // Función para registrar eventos de validación (usando nuestro hook personalizado)
    const trackValidationAction = (action: string, docId: string, docName: string) => {
        recordAction(`document_${action}`, {
            document_id: docId,
            document_name: docName
        });
    };

    // Función para abrir el modal de acción
    const openActionModal = (action: 'validar' | 'rechazar', doc: Documento) => {
        setCurrentDoc(doc);
        setModalAction(action);
        setComentarios('');
        setModalOpen(true);
    };
    const toggleExpand = (id: string) => {
        setExpandedDocuments(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Función para obtener el color según tipo de documento
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Escritura':
                return 'blue';
            case 'Plano':
                return 'green';
            case 'Certificado':
                return 'purple';
            default:
                return 'gray';
        }
    };

    return (
        <div className="p-6">
            {/* Mensajes de error o advertencia */}
            {error && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {realData && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                    <p className="text-sm text-blue-700">
                        ✓ Mostrando datos reales de validaciones del sistema
                    </p>
                </div>
            )}

            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Validación de Documentos</h1>
                <p className="text-gray-600 mt-2">Gestión y validación de documentos subidos al sistema</p>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-gray-500 text-sm font-medium">Pendientes</h2>
                    <p className="text-3xl font-bold text-amber-500">{validacionData.pendientes}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-gray-500 text-sm font-medium">Validados</h2>
                    <p className="text-3xl font-bold text-green-500">{validacionData.completadas}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-gray-500 text-sm font-medium">Rechazados</h2>
                    <p className="text-3xl font-bold text-red-500">{validacionData.rechazadas}</p>
                </div>
            </div>

            {/* Tabla de documentos */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Documentos Recientes</h2>
                    <p className="text-gray-500 text-sm mt-1">Documentos que requieren validación</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de subida</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validacionData.documentos.map((doc: Documento) => (
                                <tr key={doc.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.tipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${doc.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                                                doc.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                            {doc.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.fechaSubida}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.solicitante}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <a href={`/admin/documentos/${doc.id}`} className="text-blue-600 hover:text-blue-900 mr-3">Ver</a>
                                        {doc.estado === 'pendiente' && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                    onClick={() => {
                                                        trackValidationAction('validate', doc.id, doc.nombre);
                                                        openActionModal('validar', doc);
                                                    }}
                                                >
                                                    Validar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-red-600 hover:text-red-900"
                                                    onClick={() => {
                                                        trackValidationAction('reject', doc.id, doc.nombre);
                                                        openActionModal('rechazar', doc);
                                                    }}
                                                >
                                                    Rechazar
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-medium">{validacionData.documentos.length}</span> de <span className="font-medium">{validacionData.pendientes}</span> documentos
                    </div>
                    <div className="flex-1 flex justify-end">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <span className="sr-only">Anterior</span>
                                &lt;
                            </a>
                            <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                1
                            </a>
                            <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600 hover:bg-blue-100">
                                2
                            </a>
                            <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                3
                            </a>
                            <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <span className="sr-only">Siguiente</span>
                                &gt;
                            </a>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Modal de acción */}
            {modalOpen && currentDoc && modalAction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {modalAction === 'validar' ? 'Validar' : 'Rechazar'} Documento
                            </h3>
                        </div>
                        <Form method="post" className="p-6">
                            <input type="hidden" name="documentId" value={currentDoc.id} />
                            <input type="hidden" name="action" value={modalAction} />

                            <div className="mb-4">
                                <p className="text-gray-700">
                                    {modalAction === 'validar'
                                        ? `¿Está seguro de validar el documento "${currentDoc.nombre}"?`
                                        : `¿Está seguro de rechazar el documento "${currentDoc.nombre}"?`}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 mb-1">
                                    {modalAction === 'validar' ? 'Comentarios adicionales (opcional)' : 'Motivo del rechazo'}
                                </label>
                                <textarea
                                    id="comentarios"
                                    name="comentarios"
                                    rows={4}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    placeholder={modalAction === 'validar' ? "Comentarios adicionales..." : "Indique el motivo del rechazo..."}
                                    required={modalAction === 'rechazar'}
                                    value={comentarios}
                                    onChange={(e) => setComentarios(e.target.value)}
                                ></textarea>
                            </div>

                            {actionData?.message && (
                                <div className={`mb-4 p-2 rounded ${actionData.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {actionData.message}
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                                    onClick={() => setModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 rounded-md font-medium text-white ${modalAction === 'validar'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Procesando...' : modalAction === 'validar' ? 'Validar' : 'Rechazar'}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}
        </div >
    );
}