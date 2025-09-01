import { useState } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useParams, useActionData, Link, useNavigation } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getLoteById } from "~/services/lotes.server";
import { uploadDocument, getLoteDocuments, deleteDocument } from "~/services/documents.server";
import DocumentUploadForm from "~/components/DocumentUploadForm";
import DocumentList, { Document } from "~/components/DocumentList";
import StatusModal from "~/components/StatusModal";

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);

    if (!user) {
        return json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    if (user.role !== "owner") {
        return json({ error: "No autorizado" }, { status: 403 });
    }

    const loteId = params.loteId;

    if (!loteId) {
        return json({ error: "ID de lote no proporcionado" }, { status: 400 });
    }

    try {
        // Obtener información del lote
        const loteResponse = await getLoteById(request, loteId);

        // Verificar que el lote pertenezca al usuario (a menos que sea admin)
        if (user.role !== 'admin' && loteResponse.lote.owner !== user.id) {
            return json({ error: "No tienes permiso para ver este lote" }, { status: 403 });
        }

        // Obtener documentos del lote
        const documentsResponse = await getLoteDocuments(request, loteId);

        return json({
            lote: loteResponse.lote,
            documents: documentsResponse.documents,
            documentsCount: documentsResponse.count
        }, {
            headers: {
                ...loteResponse.headers,
                ...documentsResponse.headers
            }
        });
    } catch (error) {
        console.error("[Documentos Loader] Error:", error);
        return json({ error: "Error al cargar la información" }, { status: 500 });
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);

    if (!user) {
        return json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    if (user.role !== "owner") {
        return json({ error: "No autorizado" }, { status: 403 });
    }

    const loteId = params.loteId;

    if (!loteId) {
        return json({ error: "ID de lote no proporcionado" }, { status: 400 });
    }

    // Determinar la acción según el método y los datos del formulario
    const formData = await request.formData();
    const action = formData.get("_action");

    // Para eliminar documento
    if (action === "delete" && formData.has("documentId")) {
        const documentId = formData.get("documentId") as string;

        try {
            const result = await deleteDocument(request, documentId);
            return json({ success: true, message: "Documento eliminado correctamente" }, { headers: result.headers });
        } catch (error) {
            console.error("[Documentos Action] Error al eliminar documento:", error);
            return json({ success: false, error: "Error al eliminar el documento" }, { status: 500 });
        }
    }

    // Para subir documento (acción por defecto)
    try {
        const { document, headers } = await uploadDocument(request);

        return json({
            success: true,
            document,
            message: "Documento subido correctamente"
        }, { headers });
    } catch (error) {
        console.error("[Documentos Action] Error al subir documento:", error);
        return json({
            success: false,
            error: "Error al subir el documento"
        }, { status: 500 });
    }
}

export default function LoteDocumentos() {
    const loaderData = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const params = useParams();

    const [showUploadForm, setShowUploadForm] = useState(true);
    const [documents, setDocuments] = useState<Document[]>(
        'documents' in loaderData ? loaderData.documents : []
    );

    // Modal state
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalProps, setStatusModalProps] = useState({
        type: "success" as "loading" | "success" | "error",
        title: "",
        message: ""
    });

    // Handle document deletion
    const handleDeleteDocument = async (documentId: number) => {
        if (!confirm("¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.")) {
            return;
        }

        // Create a form to submit the delete action
        const form = new FormData();
        form.append("_action", "delete");
        form.append("documentId", documentId.toString());

        const response = await fetch(`/owner/lote/${params.loteId}/documentos`, {
            method: "POST",
            body: form
        });

        const result = await response.json();

        if (result.success) {
            // Update the documents list
            setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

            // Show success message
            setStatusModalProps({
                type: "success",
                title: "Documento eliminado",
                message: "El documento se ha eliminado correctamente."
            });
            setShowStatusModal(true);
        } else {
            // Show error message
            setStatusModalProps({
                type: "error",
                title: "Error",
                message: result.error || "Ha ocurrido un error al eliminar el documento."
            });
            setShowStatusModal(true);
        }
    };

    // Handle form submission success
    const handleUploadSuccess = () => {
        // Refresh the page to see the new document
        window.location.reload();
    };

    // Show status modal if there's action data
    useState(() => {
        if (actionData) {
            if ('success' in actionData && actionData.success) {
                setStatusModalProps({
                    type: "success",
                    title: "Operación exitosa",
                    message: 'message' in actionData ? actionData.message : "La operación se completó correctamente."
                });
                setShowStatusModal(true);
            } else if ('error' in actionData) {
                setStatusModalProps({
                    type: "error",
                    title: "Error",
                    message: actionData.error
                });
                setShowStatusModal(true);
            }
        }
    });

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link to={`/owner/lote/${params.loteId}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al lote
                </Link>
            </div>

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    Documentos {'lote' in loaderData && loaderData.lote?.nombre && `- ${loaderData.lote.nombre}`}
                </h1>
                <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {showUploadForm ? (
                        <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Ocultar formulario
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Subir nuevo documento
                        </>
                    )}
                </button>
            </div>

            {showUploadForm && (
                <div className="mb-8">
                    <DocumentUploadForm
                        loteId={params.loteId || ""}
                        loteNombre={'lote' in loaderData ? loaderData.lote?.nombre : undefined}
                        onSuccess={handleUploadSuccess}
                    />
                </div>
            )}

            <div>
                <h2 className="text-xl font-semibold mb-4">
                    Documentos existentes
                    {'documentsCount' in loaderData && loaderData.documentsCount > 0 &&
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({loaderData.documentsCount})
                        </span>
                    }
                </h2>

                <DocumentList
                    documents={documents}
                    onDelete={handleDeleteDocument}
                    isLoading={navigation.state === "loading"}
                />
            </div>

            {/* Status Modal */}
            <StatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                type={statusModalProps.type}
                title={statusModalProps.title}
                message={statusModalProps.message}
            />
        </div>
    );
}