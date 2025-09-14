import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, useSubmit, Link } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { getAllLotes, deleteLote, updateLote, type Lote } from "~/services/lotes.server";
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
    const ordering = url.searchParams.get("ordering") || "-created_at";

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
            case "delete":
                await deleteLote(request, loteId);
                return json({ success: true, message: "Lote eliminado correctamente" });

            case "activate":
                await updateLote(request, loteId, { status: "active" });
                return json({ success: true, message: "Lote activado correctamente" });

            case "deactivate":
                await updateLote(request, loteId, { status: "archived" });
                return json({ success: true, message: "Lote desactivado correctamente" });

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
    const [actionType, setActionType] = useState<'delete' | 'activate' | 'deactivate' | null>(null);

    const isLoading = navigation.state === "loading" || navigation.state === "submitting";

    const handleLoteAction = (lote: Lote, action: 'delete' | 'activate' | 'deactivate') => {
        setSelectedLote(lote);
        setActionType(action);
        setActionModalOpen(true);
    };

    const confirmAction = () => {
        if (selectedLote && actionType) {
            const formData = new FormData();
            formData.append("action", actionType);
            formData.append("loteId", selectedLote.id?.toString() || "");
            submit(formData, { method: "post" });
            setActionModalOpen(false);
            setSelectedLote(null);
            setActionType(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getActionLabel = () => {
        switch (actionType) {
            case 'delete':
                return 'eliminar';
            case 'activate':
                return 'activar';
            case 'deactivate':
                return 'desactivar';
            default:
                return 'procesar';
        }
    };

    // Función auxiliar para calcular el área total de forma segura
    const calcularAreaTotal = () => {
        if (!lotes || !Array.isArray(lotes) || lotes.length === 0) {
            return '0.00';
        }

        const total = lotes.reduce((sum, lote) => {
            const area = lote?.area;
            // Verificar que area sea un número válido
            if (typeof area === 'number' && !isNaN(area) && area > 0) {
                return sum + area;
            }
            return sum;
        }, 0);

        return total.toFixed(2);
    };

    return (
        <div className="p-6">
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
                        defaultValue="-created_at"
                    >
                        <option value="-created_at">Más recientes</option>
                        <option value="created_at">Más antiguos</option>
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
                    <div className="text-2xl font-bold text-green-600"></div>
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
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-purple-600">
                    {calcularAreaTotal()}
                </div>
                <div className="text-sm text-gray-600">Área Total (m²)</div>
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
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lote.status || 'pending')}`}>
                                            {lote.status === 'active' ? 'Activo' :
                                                lote.status === 'archived' ? 'Archivado' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lote.created_at ? new Date(lote.created_at).toLocaleDateString('es-CO') : 'N/A'}
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
                                        {lote.status === 'active' ? (
                                            <button
                                                onClick={() => handleLoteAction(lote, 'deactivate')}
                                                className="text-yellow-600 hover:text-yellow-900 ml-4"
                                            >
                                                Archivar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleLoteAction(lote, 'activate')}
                                                className="text-green-600 hover:text-green-900 ml-4"
                                            >
                                                Activar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleLoteAction(lote, 'delete')}
                                            className="text-red-600 hover:text-red-900 ml-4"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            )) : null}
                        </tbody>
                    </table>
                </div>

                {(!lotes || lotes.length === 0) && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No se encontraron lotes</p>
                    </div>
                )}
            </div>

            {/* Modal de confirmación */}
            {
                actionModalOpen && selectedLote && actionType && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Confirmar Acción
                                </h3>
                            </div>

                            <div className="px-6 py-4">
                                <p className="text-gray-600">
                                    ¿Estás seguro de que quieres {getActionLabel()} el lote{' '}
                                    <span className="font-medium">
                                        {selectedLote?.nombre} ({selectedLote?.cbml})
                                    </span>?
                                </p>
                                {actionType === 'delete' && (
                                    <p className="text-red-600 text-sm mt-2">
                                        Esta acción no se puede deshacer.
                                    </p>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t flex justify-end space-x-3">
                                <button
                                    onClick={() => setActionModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction}
                                    disabled={isLoading}
                                    className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${actionType === 'delete'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isLoading ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
