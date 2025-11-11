import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation, Link, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getUser } from "~/utils/auth.server";
import { fetchWithAuth } from "~/utils/auth.server";

// Definir constante para la URL base de la API
const API_URL = process.env.API_URL || "http://localhost:8000";
interface RequestSummary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    by_type: Record<string, number>;
}

interface RequestDetail {
    id: number;
    user: number;
    user_name: string;
    request_type: string;
    request_type_display: string;
    title: string;
    description: string;
    status: string;
    status_display: string;
    reference_id?: string;
    metadata?: Record<string, any>;
    reviewer?: number;
    reviewer_name?: string;
    review_notes?: string;
    created_at: string;
    updated_at: string;
}

interface ActionResponse {
    success: boolean;
    error?: string;
    request?: any;
}

/**
 * Obtiene el listado de solicitudes del usuario actual
 */
async function getMyRequests(request: Request, filters?: { type?: string, status?: string }) {
    try {
        let endpoint = `${API_URL}/api/users/requests/my_requests/`;

        // Añadir filtros si se proporcionan
        if (filters) {
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.status) params.append('status', filters.status);

            if (params.toString()) {
                endpoint += `?${params.toString()}`;
            }
        }

        const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);

        if (!response.ok) {
            console.error(`Error obteniendo solicitudes: ${response.status} ${response.statusText}`);
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const requests = await response.json();
        return { requests, headers: setCookieHeaders };
    } catch (error) {
        console.error("Error obteniendo solicitudes:", error);
        throw error;
    }
}

/**
 * Obtiene los detalles de una solicitud específica
 */
async function getRequestDetails(request: Request, requestId: number) {
    try {
        const endpoint = `${API_URL}/api/users/requests/${requestId}/`;
        const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);

        if (!response.ok) {
            console.error(`Error obteniendo detalles de solicitud: ${response.status} ${response.statusText}`);
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const requestDetails = await response.json();
        return { requestDetails, headers: setCookieHeaders };
    } catch (error) {
        console.error(`Error obteniendo detalles de la solicitud ${requestId}:`, error);
        throw error;
    }
}

/**
 * Obtiene el resumen de estados de las solicitudes
 */
async function getRequestsSummary(request: Request) {
    try {
        const endpoint = `${API_URL}/api/users/requests/summary/`;
        const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);

        if (!response.ok) {
            console.error(`Error obteniendo resumen de solicitudes: ${response.status} ${response.statusText}`);
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const summary = await response.json();
        return { summary, headers: setCookieHeaders };
    } catch (error) {
        console.error("Error obteniendo resumen de solicitudes:", error);
        throw error;
    }
}

/**
 * Obtiene las actualizaciones recientes de solicitudes
 */
async function getRecentUpdates(request: Request, days: number = 30, limit: number = 5) {
    try {
        const endpoint = `${API_URL}/api/users/requests/recent_updates/?days=${days}&limit=${limit}`;
        const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint);

        if (!response.ok) {
            console.error(`Error obteniendo actualizaciones recientes: ${response.status} ${response.statusText}`);
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const updates = await response.json();
        return { updates, headers: setCookieHeaders };
    } catch (error) {
        console.error("Error obteniendo actualizaciones recientes:", error);
        throw error;
    }
}

/**
 * Crea una nueva solicitud
 */
async function createRequest(request: Request, requestData: any) {
    try {
        const endpoint = `${API_URL}/api/users/requests/`;
        const { res: response, setCookieHeaders } = await fetchWithAuth(request, endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            console.error(`Error creando solicitud: ${response.status} ${response.statusText}`);
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const newRequest = await response.json();
        return { newRequest, headers: setCookieHeaders };
    } catch (error) {
        console.error("Error creando solicitud:", error);
        throw error;
    }
}

// Definir una interfaz para los datos de respuesta del loader
interface LoaderData {
    user: any;
    requests: any[] | null;
    summary: RequestSummary | null;
    recentUpdates: any[] | null;
    requestDetails: RequestDetail | null;
    error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario está autenticado
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    // Obtener parámetros de filtrado de la URL
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || undefined;
    const typeFilter = url.searchParams.get('type') || undefined;
    const requestId = url.searchParams.get('id') ? parseInt(url.searchParams.get('id')!, 10) : null;

    try {
        // Si se proporciona un ID, obtener los detalles de esa solicitud
        if (requestId) {
            const { requestDetails, headers } = await getRequestDetails(request, requestId);
            return json<LoaderData>({
                user,
                requestDetails,
                requests: null,
                summary: null,
                recentUpdates: null
            }, { headers });
        }

        // Obtener datos principales
        const [requestsResponse, summaryResponse, updatesResponse] = await Promise.all([
            getMyRequests(request, { status: statusFilter, type: typeFilter }),
            getRequestsSummary(request),
            getRecentUpdates(request)
        ]);

        // Combinar headers de todas las respuestas
        const headers = new Headers();
        [
            requestsResponse.headers,
            summaryResponse.headers,
            updatesResponse.headers
        ].forEach(h => {
            if (h) {
                for (const [key, value] of h.entries()) {
                    headers.append(key, value);
                }
            }
        });

        return json<LoaderData>({
            user,
            requests: requestsResponse.requests,
            summary: summaryResponse.summary,
            recentUpdates: updatesResponse.updates,
            requestDetails: null
        }, { headers });

    } catch (error) {
        console.error("Error en el loader de solicitudes:", error);
        return json<LoaderData>({
            user,
            error: "Ha ocurrido un error al cargar las solicitudes. Por favor, inténtelo de nuevo más tarde.",
            requests: [],
            summary: null,
            recentUpdates: [],
            requestDetails: null
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    const formData = await request.formData();
    const action = formData.get("_action") as string;

    try {
        if (action === "create") {
            const requestData = {
                request_type: formData.get("requestType") as string,
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                metadata: JSON.parse(formData.get("metadata") as string || "{}")
            };

            const { newRequest, headers } = await createRequest(request, requestData);
            return json({ success: true, request: newRequest } as ActionResponse, { headers });
        }

        return json({ success: false, error: "Acción no soportada" } as ActionResponse, { status: 400 });
    } catch (error: any) {
        return json({
            success: false,
            error: error.message || "Ha ocurrido un error al procesar su solicitud."
        } as ActionResponse, { status: 400 });
    }
}

export default function OwnerSolicitudes() {
    const { user, requests, summary, recentUpdates, requestDetails, error } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const fetcher = useFetcher<ActionResponse>();
    const isSubmitting = navigation.state === "submitting" || fetcher.state === "submitting";

    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'todas' | 'pendientes' | 'aprobadas' | 'rechazadas'>('todas');
    const [filterType, setFilterType] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Cuando cambia la pestaña activa, actualizar la URL con el filtro correspondiente
        let status: string | undefined;
        switch (activeTab) {
            case 'pendientes':
                status = 'pending';
                break;
            case 'aprobadas':
                status = 'approved';
                break;
            case 'rechazadas':
                status = 'rejected';
                break;
            default:
                status = undefined;
        }

        // Construir la URL con los filtros
        const url = new URL(window.location.href);
        if (status) {
            url.searchParams.set('status', status);
        } else {
            url.searchParams.delete('status');
        }

        if (filterType) {
            url.searchParams.set('type', filterType);
        } else {
            url.searchParams.delete('type');
        }

        // Actualizar la URL sin recargar la página
        window.history.pushState({}, '', url.toString());
    }, [activeTab, filterType]);

    // Traducciones para los tipos de solicitud y estados
    const requestTypeTranslations: Record<string, string> = {
        'developer': 'Desarrollador',
        'access': 'Acceso',
        'feature': 'Funcionalidad',
        'support': 'Soporte',
        'other': 'Otro'
    };

    const statusTranslations: Record<string, string> = {
        'pending': 'Pendiente',
        'in_review': 'En revisión',
        'approved': 'Aprobada',
        'rejected': 'Rechazada',
        'closed': 'Cerrada'
    };

    // Colores para los estados
    const statusColors: Record<string, { bg: string, text: string }> = {
        'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        'in_review': { bg: 'bg-blue-100', text: 'text-blue-800' },
        'approved': { bg: 'bg-green-100', text: 'text-green-800' },
        'rejected': { bg: 'bg-red-100', text: 'text-red-800' },
        'closed': { bg: 'bg-gray-100', text: 'text-gray-800' }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Mis Solicitudes</h1>

            {error && (
                <div className="mb-6 bg-red-100 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Si se está viendo el detalle de una solicitud */}
            {requestDetails && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">{requestDetails.title}</h2>
                        <Link to="/owner/solicitudes" className="text-blue-600 hover:text-blue-800">
                            Volver a todas las solicitudes
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-gray-600 text-sm">ID de referencia</p>
                            <p>{requestDetails.reference_id || `REQ-${requestDetails.id}`}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Tipo</p>
                            <p>{requestTypeTranslations[requestDetails.request_type] || requestDetails.request_type_display}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Estado</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[requestDetails.status]?.bg || 'bg-gray-100'} ${statusColors[requestDetails.status]?.text || 'text-gray-800'}`}>
                                {statusTranslations[requestDetails.status] || requestDetails.status_display}
                            </span>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Fecha de creación</p>
                            <p>{new Date(requestDetails.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-gray-600 text-sm">Descripción</p>
                        <p className="mt-1 whitespace-pre-wrap">{requestDetails.description}</p>
                    </div>

                    {requestDetails.reviewer_name && (
                        <div className="mb-4">
                            <p className="text-gray-600 text-sm">Revisor</p>
                            <p>{requestDetails.reviewer_name}</p>
                            {requestDetails.review_notes && (
                                <div className="mt-2">
                                    <p className="text-gray-600 text-sm">Notas del revisor</p>
                                    <p className="mt-1 bg-gray-50 p-3 rounded whitespace-pre-wrap">{requestDetails.review_notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {requestDetails.metadata && Object.keys(requestDetails.metadata).length > 0 && (
                        <div>
                            <p className="text-gray-600 text-sm mb-2">Información adicional</p>
                            <div className="bg-gray-50 p-3 rounded">
                                {Object.entries(requestDetails.metadata).map(([key, value]) => (
                                    <div key={key} className="mb-1">
                                        <span className="font-medium">{key}: </span>
                                        <span>{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Resumen y lista de solicitudes */}
            {!requestDetails && (
                <>
                    {/* Panel de resumen */}
                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-sm font-medium text-gray-500">Total Solicitudes</h3>
                                <p className="text-3xl font-bold text-gray-900">{summary.total || 0}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
                                <p className="text-3xl font-bold text-yellow-600">{summary.pending || 0}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-sm font-medium text-gray-500">Aprobadas</h3>
                                <p className="text-3xl font-bold text-green-600">{summary.approved || 0}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-sm font-medium text-gray-500">Rechazadas</h3>
                                <p className="text-3xl font-bold text-red-600">{summary.rejected || 0}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mb-6">
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setActiveTab('todas')}
                                className={`px-3 py-2 rounded-md ${activeTab === 'todas'
                                    ? 'bg-blue-100 text-blue-800 font-medium'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setActiveTab('pendientes')}
                                className={`px-3 py-2 rounded-md ${activeTab === 'pendientes'
                                    ? 'bg-yellow-100 text-yellow-800 font-medium'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                Pendientes
                            </button>
                            <button
                                onClick={() => setActiveTab('aprobadas')}
                                className={`px-3 py-2 rounded-md ${activeTab === 'aprobadas'
                                    ? 'bg-green-100 text-green-800 font-medium'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                Aprobadas
                            </button>
                            <button
                                onClick={() => setActiveTab('rechazadas')}
                                className={`px-3 py-2 rounded-md ${activeTab === 'rechazadas'
                                    ? 'bg-red-100 text-red-800 font-medium'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                Rechazadas
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm"
                            >
                                Nueva Solicitud
                            </button>
                        </div>
                    </div>

                    {/* Filtro de tipo de solicitud */}
                    {summary && summary.by_type && Object.keys(summary.by_type).length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por tipo:</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilterType(undefined)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${!filterType ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                >
                                    Todos
                                </button>
                                {Object.entries(summary.by_type as Record<string, number>).map(([type, count]) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${filterType === type ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                    >
                                        {requestTypeTranslations[type] || type} ({count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lista de solicitudes */}
                    {requests && requests.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Título
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tipo
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {requests.map((req: any) => (
                                            <tr key={req.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {req.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {req.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {requestTypeTranslations[req.request_type] || req.request_type_display}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status]?.bg || 'bg-gray-100'} ${statusColors[req.status]?.text || 'text-gray-800'}`}>
                                                        {statusTranslations[req.status] || req.status_display}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link
                                                        to={`/owner/solicitudes?id=${req.id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Ver detalles
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <p className="text-gray-500">No hay solicitudes que mostrar{filterType ? ` del tipo ${requestTypeTranslations[filterType] || filterType}` : ''}.</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Crear nueva solicitud
                            </button>
                        </div>
                    )}

                    {/* Modal para crear nueva solicitud */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Nueva Solicitud</h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <fetcher.Form method="post" className="space-y-4">
                                    <input type="hidden" name="_action" value="create" />

                                    <div>
                                        <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo de solicitud
                                        </label>
                                        <select
                                            id="requestType"
                                            name="requestType"
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                            required
                                        >
                                            <option value="">Seleccione un tipo</option>
                                            <option value="feature">Funcionalidad</option>
                                            <option value="access">Acceso</option>
                                            <option value="developer">Desarrollador</option>
                                            <option value="support">Soporte</option>
                                            <option value="other">Otro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                            Título
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                            Descripción
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={4}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            required
                                        ></textarea>
                                    </div>

                                    <input type="hidden" name="metadata" value="{}" />

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                                        >
                                            {isSubmitting ? "Enviando..." : "Enviar solicitud"}
                                        </button>
                                    </div>

                                    {fetcher.data?.error && (
                                        <div className="text-red-600 text-sm mt-2">
                                            {fetcher.data.error}
                                        </div>
                                    )}
                                </fetcher.Form>
                            </div>
                        </div>
                    )}

                    {/* Actualizaciones recientes */}
                    {recentUpdates && recentUpdates.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold mb-4">Actualizaciones Recientes</h2>
                            <div className="bg-white rounded-lg shadow-md p-4">
                                <div className="space-y-4">
                                    {recentUpdates.map((update: any) => (
                                        <div key={update.id} className="border-l-4 border-blue-500 pl-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium">{update.title}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {requestTypeTranslations[update.request_type] || update.request_type_display}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[update.status]?.bg || 'bg-gray-100'} ${statusColors[update.status]?.text || 'text-gray-800'}`}>
                                                    {statusTranslations[update.status] || update.status_display}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Actualizado: {new Date(update.updated_at).toLocaleString()}
                                            </p>
                                            <Link
                                                to={`/owner/solicitudes?id=${update.id}`}
                                                className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                                            >
                                                Ver detalles
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}