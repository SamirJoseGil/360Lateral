import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, useSubmit, Link } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import {
    getAllLotes,
    verifyLote,
    rejectLote,
    archiveLote,
    reactivateLote,
    type Lote
} from "~/services/lotes.server";
import { getUserById } from "~/services/users.server";

type LoteWithOwnerInfo = Lote & {
    ownerInfo?: {
        id: string;
        name: string;
        email: string;
    } | null;
};

type LoaderData = {
    user: any;
    lotes: LoteWithOwnerInfo[];
    count: number;
    searchQuery: string;
    error: string | undefined;
};

export async function loader({ request }: LoaderFunctionArgs): Promise<ReturnType<typeof json<LoaderData>>> {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("search") || "";
    const ordering = url.searchParams.get("ordering") || "-fecha_creacion"; // ✅ CORREGIDO

    try {
        const { lotes, count, headers } = await getAllLotes(request, {
            search: searchQuery,
            ordering,
            limit: 50
        });

        // Obtener información de los propietarios para cada lote
        const lotesWithOwnerInfo: LoteWithOwnerInfo[] = await Promise.all(
            lotes.map(async (lote: Lote) => {
                let ownerInfo = null;

                if (lote.owner) {
                    try {
                        const { user: ownerData } = await getUserById(request, lote.owner.toString());
                        ownerInfo = {
                            id: ownerData.id,
                            name: ownerData.full_name ||
                                (ownerData.first_name && ownerData.last_name ? `${ownerData.first_name} ${ownerData.last_name}` : null) ||
                                ownerData.first_name ||
                                ownerData.username ||
                                ownerData.email?.split('@')[0] ||
                                'Sin nombre',
                            email: ownerData.email
                        };
                    } catch (error) {
                        console.error(`Error obteniendo información del propietario ${lote.owner}:`, error);
                        // Si no se puede obtener la info del usuario, usar datos básicos
                        ownerInfo = {
                            id: lote.owner.toString(),
                            name: 'Usuario no encontrado',
                            email: 'N/A'
                        };
                    }
                }

                return {
                    ...lote,
                    ownerInfo
                };
            })
        );

        return json({
            user,
            lotes: lotesWithOwnerInfo,
            count,
            searchQuery,
            error: undefined
        }, { headers });
    } catch (error) {
        console.error("Error loading lotes:", error);
        return json({
            user,
            lotes: [],
            count: 0,
            searchQuery,
            error: "Error al cargar lotes"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    const formData = await request.formData();
    const action = formData.get("action");
    const loteId = formData.get("loteId") as string;

    try {
        switch (action) {
            case "verify":
                const verifyResult = await verifyLote(request, loteId);
                return json({
                    success: true,
                    message: verifyResult.data.message
                }, { headers: verifyResult.headers });

            case "reject":
                const reason = formData.get("reason") as string || "Sin razón especificada";
                const rejectResult = await rejectLote(request, loteId, reason);
                return json({
                    success: true,
                    message: rejectResult.data.message
                }, { headers: rejectResult.headers });

            case "archive":
                const archiveResult = await archiveLote(request, loteId);
                return json({
                    success: true,
                    message: archiveResult.data.message
                }, { headers: archiveResult.headers });

            case "reactivate":
                const reactivateResult = await reactivateLote(request, loteId);
                return json({
                    success: true,
                    message: reactivateResult.data.message
                }, { headers: reactivateResult.headers });

            default:
                return json({ error: "Acción no válida" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in lote action:", error);
        return json({ error: "Error al procesar la acción" }, { status: 500 });
    }
}

export default function AdminLotes() {
    const { user, lotes, count, searchQuery, error } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'verify' | 'reject' | 'archive' | 'reactivate' | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const isLoading = navigation.state === "loading" || navigation.state === "submitting";

    const handleLoteAction = (lote: Lote, action: 'verify' | 'reject' | 'archive' | 'reactivate') => {
        setSelectedLote(lote);
        setActionType(action);
        setActionModalOpen(true);
    };

    const confirmAction = () => {
        if (selectedLote && actionType) {
            const formData = new FormData();
            formData.append("action", actionType);
            formData.append("loteId", selectedLote.id?.toString() || "");

            if (actionType === 'reject') {
                formData.append("reason", rejectReason);
            }

            submit(formData, { method: "post" });
            setActionModalOpen(false);
            setSelectedLote(null);
            setActionType(null);
            setRejectReason("");
        }
    };

    const getStatusBadge = (lote: Lote) => {
        const baseClass = "px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center";

        if (lote.is_verified) {
            return (
                <span className={`${baseClass} bg-green-100 text-green-800`}>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verificado
                </span>
            );
        }

        switch (lote.status) {
            case 'active':
                return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Activo</span>;
            case 'pending':
                return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>Pendiente</span>;
            case 'rejected':
                return <span className={`${baseClass} bg-red-100 text-red-800`}>Rechazado</span>;
            case 'archived':
                return <span className={`${baseClass} bg-gray-100 text-gray-800`}>Archivado</span>;
            default:
                return <span className={`${baseClass} bg-gray-100 text-gray-800`}>{lote.status}</span>;
        }
    };

    const getActionButtons = (lote: Lote) => {
        if (lote.status === 'pending') {
            return (
                <>
                    <button
                        onClick={() => handleLoteAction(lote, 'verify')}
                        className="text-green-600 hover:text-green-900"
                        title="Verificar lote"
                    >
                        Verificar
                    </button>
                    <button
                        onClick={() => handleLoteAction(lote, 'reject')}
                        className="text-red-600 hover:text-red-900 ml-4"
                        title="Rechazar lote"
                    >
                        Rechazar
                    </button>
                </>
            );
        }

        if (lote.status === 'active' || lote.is_verified) {
            return (
                <button
                    onClick={() => handleLoteAction(lote, 'archive')}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Archivar lote"
                >
                    Archivar
                </button>
            );
        }

        if (lote.status === 'archived' || lote.status === 'rejected') {
            return (
                <button
                    onClick={() => handleLoteAction(lote, 'reactivate')}
                    className="text-blue-600 hover:text-blue-900"
                    title="Reactivar lote"
                >
                    Reactivar
                </button>
            );
        }

        return null;
    };

    return (
        <div className="p-24">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Lotes</h1>
                    <p className="text-gray-600 mt-2">
                        Administra todos los lotes del sistema 360 Lateral
                    </p>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Filtros y búsqueda */}
            <div className="mb-6 bg-white rounded-lg shadow p-6">
                <Form method="get" className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            name="search"
                            placeholder="Buscar por nombre, CBML, dirección..."
                            defaultValue={searchQuery}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                        />
                    </div>
                    <select
                        name="ordering"
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                        defaultValue="-fecha_creacion"
                    >
                        <option value="-fecha_creacion">Más recientes</option>
                        <option value="fecha_creacion">Más antiguos</option>
                        <option value="nombre">Nombre A-Z</option>
                        <option value="-nombre">Nombre Z-A</option>
                        <option value="area">Menor área</option>
                        <option value="-area">Mayor área</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? "Buscando..." : "Buscar"}
                    </button>
                </Form>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                    <div className="text-sm text-gray-600">Total Lotes</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-green-600">
                        {lotes ? lotes.filter(l => l?.status === 'active').length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Activos</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-yellow-600">
                        {lotes ? lotes.filter(l => l?.status === 'pending').length : 0}
                    </div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                </div>
            </div>
            {/* Tabla de lotes */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lote
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CBML
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Propietario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Área (m²)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado / Verificación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lotes && Array.isArray(lotes) ? lotes.map((lote) => (
                                <tr key={lote.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {lote.nombre}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                {lote.direccion}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {lote.cbml}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {lote.ownerInfo ? (
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8">
                                                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-gray-700">
                                                            {lote.ownerInfo.name?.charAt(0) || lote.ownerInfo.email.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {lote.ownerInfo.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {lote.ownerInfo.email}
                                                    </div>
                                                </div>
                                                <div className="ml-2">
                                                    <Link
                                                        to={`/admin/usuario/${lote.ownerInfo.id}`}
                                                        className="text-blue-600 hover:text-blue-900 text-xs"
                                                        title="Ver perfil del propietario"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500 italic">Sin propietario asignado</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {lote.area ? lote.area.toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(lote)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <Link
                                            to={`/admin/lote/${lote.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Ver
                                        </Link>
                                        <Link
                                            to={`/admin/lotes/${lote.id}/editar`}
                                            className="text-indigo-600 hover:text-indigo-900 ml-4"
                                        >
                                            Editar
                                        </Link>
                                        {getActionButtons(lote)}
                                    </td>
                                </tr>
                            )) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de confirmación MEJORADO */}
            {actionModalOpen && selectedLote && actionType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {actionType === 'verify' && 'Verificar Lote'}
                                {actionType === 'reject' && 'Rechazar Lote'}
                                {actionType === 'archive' && 'Archivar Lote'}
                                {actionType === 'reactivate' && 'Reactivar Lote'}
                            </h3>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-600">
                                ¿Estás seguro de que quieres{' '}
                                {actionType === 'verify' && 'verificar'}
                                {actionType === 'reject' && 'rechazar'}
                                {actionType === 'archive' && 'archivar'}
                                {actionType === 'reactivate' && 'reactivar'}
                                {' '}el lote{' '}
                                <span className="font-medium">
                                    {selectedLote?.nombre} ({selectedLote?.cbml})
                                </span>?
                            </p>

                            {actionType === 'reject' && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Razón del rechazo:
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Especifica por qué se rechaza este lote..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setActionModalOpen(false);
                                    setRejectReason("");
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={isLoading || (actionType === 'reject' && !rejectReason.trim())}
                                className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${actionType === 'verify' ? 'bg-green-600 hover:bg-green-700' :
                                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                        actionType === 'archive' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                            'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isLoading ? 'Procesando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
