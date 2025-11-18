// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\routes\requests.tsx
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useFetcher } from "@remix-run/react";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import {
    getUserRequests,
    createUserRequest,
    getUserRequestsSummary,
    getRecentRequestUpdates
} from "~/services/users.server";

type ActionData = {
    errors?: {
        request_type?: string;
        title?: string;
        description?: string;
        general?: string;
    };
    success?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    try {
        // Obtener solicitudes, resumen y actualizaciones recientes
        const [requestsResponse, summaryResponse, updatesResponse] = await Promise.all([
            getUserRequests(request),
            getUserRequestsSummary(request).catch(() => ({ summary: null, headers: new Headers() })),
            getRecentRequestUpdates(request, 30, 5).catch(() => ({ updates: [], headers: new Headers() }))
        ]);

        return json({
            user,
            requests: requestsResponse.requests || [],
            summary: summaryResponse.summary,
            recentUpdates: updatesResponse.updates || [],
            error: null
        }, {
            headers: new Headers([
                ...Array.from(requestsResponse.headers?.entries() || []),
                ...Array.from(summaryResponse.headers?.entries() || []),
                ...Array.from(updatesResponse.headers?.entries() || [])
            ])
        });
    } catch (error) {
        console.error("Error cargando solicitudes:", error);
        return json({
            user,
            requests: [],
            summary: null,
            recentUpdates: [],
            error: "Error al cargar las solicitudes"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "createRequest") {
        try {
            const requestData = {
                request_type: formData.get("request_type") as "access" | "feature" | "support" | "developer" | "project" | "other",
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                reference_id: formData.get("reference_id") as string || undefined,
            };

            // Validaciones básicas
            const errors: ActionData["errors"] = {};

            if (!requestData.request_type) {
                errors.request_type = "El tipo de solicitud es obligatorio";
            }

            if (!requestData.title || requestData.title.trim() === "") {
                errors.title = "El título es obligatorio";
            }

            if (!requestData.description || requestData.description.trim() === "") {
                errors.description = "La descripción es obligatoria";
            }

            if (Object.keys(errors).length > 0) {
                return json({ errors }, { status: 400 });
            }

            // Crear solicitud
            const { request: newRequest, headers } = await createUserRequest(request, requestData);

            return json({
                success: "Solicitud creada correctamente"
            }, { headers });

        } catch (error) {
            console.error("Error creando solicitud:", error);
            return json({
                errors: {
                    general: error instanceof Error ? error.message : "Error de conexión al servidor"
                }
            }, { status: 500 });
        }
    }

    return json({ errors: { general: "Operación no válida" } }, { status: 400 });
}

export default function RequestsPage() {
    const { user, requests, summary, recentUpdates, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>() as ActionData | undefined;
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState("list");
    const [showNewRequestForm, setShowNewRequestForm] = useState(false);
    const isSubmitting = navigation.state === "submitting";

    const requestTypes = {
        access: "Solicitud de Acceso",
        feature: "Nueva Funcionalidad",
        support: "Soporte Técnico",
        developer: "Solicitud de Desarrollador",
        project: "Proyecto",
        other: "Otros"
    };

    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        in_review: "bg-blue-100 text-blue-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        completed: "bg-gray-100 text-gray-800"
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mis Solicitudes</h1>
                    <p className="mt-2 text-gray-600">Gestiona tus solicitudes y seguimiento</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" role="alert">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="ml-3 text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Total Solicitudes</h3>
                            <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
                            <p className="text-3xl font-bold text-yellow-600">{summary.pending}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Aprobadas</h3>
                            <p className="text-3xl font-bold text-green-600">{summary.approved}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-gray-500">Rechazadas</h3>
                            <p className="text-3xl font-bold text-red-600">{summary.rejected}</p>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab("list")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "list"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                Mis Solicitudes
                            </button>
                            <button
                                onClick={() => setActiveTab("create")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "create"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                Nueva Solicitud
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Alerts */}
                        {actionData?.success && (
                            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg" role="alert">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="ml-3 text-green-700 font-medium">{actionData.success}</p>
                                </div>
                            </div>
                        )}

                        {actionData?.errors?.general && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" role="alert">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="ml-3 text-red-700 font-medium">{actionData.errors.general}</p>
                                </div>
                            </div>
                        )}

                        {/* List Tab */}
                        {activeTab === "list" && (
                            <div className="space-y-6">
                                {requests.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Solicitud
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Tipo
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Estado
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Fecha
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {requests.map((request: {
                                                    id: string;
                                                    title: string;
                                                    description: string;
                                                    request_type_display: string;
                                                    status: string;
                                                    status_display: string;
                                                    created_at: string;
                                                }) => (
                                                    <tr key={request.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {request.title}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {request.description.substring(0, 100)}...
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-900">
                                                                {request.request_type_display}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                                                                {request.status_display}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(request.created_at).toLocaleDateString('es-ES')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes</h3>
                                        <p className="mt-1 text-sm text-gray-500">Comienza creando tu primera solicitud.</p>
                                        <div className="mt-6">
                                            <button
                                                onClick={() => setActiveTab("create")}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Nueva Solicitud
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Create Tab */}
                        {activeTab === "create" && (
                            <Form method="post" className="space-y-6">
                                <input type="hidden" name="intent" value="createRequest" />

                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Solicitud</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de Solicitud *
                                            </label>
                                            <select
                                                name="request_type"
                                                id="request_type"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Seleccionar tipo</option>
                                                {Object.entries(requestTypes).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                            {actionData?.errors?.request_type && (
                                                <p className="mt-1 text-sm text-red-600">{actionData.errors.request_type}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="reference_id" className="block text-sm font-medium text-gray-700 mb-2">
                                                ID de Referencia (Opcional)
                                            </label>
                                            <input
                                                type="text"
                                                name="reference_id"
                                                id="reference_id"
                                                placeholder="Ej: LOTE-123, TICKET-456"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                                Título *
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                id="title"
                                                placeholder="Título descriptivo de tu solicitud"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {actionData?.errors?.title && (
                                                <p className="mt-1 text-sm text-red-600">{actionData.errors.title}</p>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                                Descripción *
                                            </label>
                                            <textarea
                                                name="description"
                                                id="description"
                                                rows={6}
                                                placeholder="Describe detalladamente tu solicitud..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {actionData?.errors?.description && (
                                                <p className="mt-1 text-sm text-red-600">{actionData.errors.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Crear Solicitud
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}