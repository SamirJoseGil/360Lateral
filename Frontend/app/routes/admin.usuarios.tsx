import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams, useFetcher } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState, useEffect } from "react";
import { usePageView, recordAction } from "~/hooks/useStats";
import { getAllUsers, deleteUser, updateUserStatus, handleApiError, type User } from "~/services/users.server";
import { recordEvent } from "~/services/stats.server";

type LoaderData = {
    user: any;
    users: User[];
    searchQuery: string;
    error: string | undefined;
};

export async function loader({ request }: LoaderFunctionArgs): Promise<ReturnType<typeof json<LoaderData>>> {
    console.log("Admin users loader - processing request");

    // Verificar que el usuario esté autenticado y sea admin (redundante con el padre pero por seguridad)
    const user = await getUser(request);
    if (!user) {
        console.log("Admin users loader - no user, redirecting to home");
        return json({ user: null, users: [], searchQuery: "", error: "No autorizado" });
    }

    if (user.role !== "admin") {
        console.log(`Admin users loader - user is not admin (${user.role})`);
        return json({ user, users: [], searchQuery: "", error: "Acceso restringido" });
    }

    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q") || "";
    console.log(`Admin users loader - search query: "${searchQuery}"`);

    try {
        // Obtener usuarios de la API
        const { users, headers } = await getAllUsers(request, searchQuery);
        console.log(`Admin users loader - fetched ${users.length} users`);

        // Registrar evento de vista de la página de usuarios
        try {
            await recordEvent(request, {
                type: "view",
                name: "admin_users_page",
                value: {
                    user_id: user.id,
                    search_query: searchQuery || undefined
                }
            });
        } catch (error) {
            console.error("Error al registrar evento de estadísticas:", error);
        }

        // Devolver los datos con las cookies actualizadas si es necesario
        return json({
            user,
            users,
            searchQuery,
            error: undefined
        }, {
            headers
        });
    } catch (error) {
        console.error("Error loading users:", error);

        // Usar datos de ejemplo como fallback en caso de error de API
        console.log("Admin users loader - using fallback data");

        const fallbackUsers: User[] = [
            { id: "1", name: "Juan Pérez", email: "juan@lateral360.com", role: "owner", status: "active", createdAt: "2023-01-15" },
            { id: "2", name: "María Rodríguez", email: "maria@lateral360.com", role: "developer", status: "active", createdAt: "2023-02-20" },
            { id: "3", name: "Carlos Gómez", email: "carlos@lateral360.com", role: "owner", status: "inactive", createdAt: "2023-03-10" },
            { id: "4", name: "Laura Sánchez", email: "laura@lateral360.com", role: "developer", status: "active", createdAt: "2023-03-15" },
            { id: "5", name: "Roberto López", email: "roberto@lateral360.com", role: "owner", status: "pending", createdAt: "2023-04-05" },
            { id: "6", name: "Ana Martínez", email: "ana@lateral360.com", role: "developer", status: "active", createdAt: "2023-04-22" },
            { id: "7", name: "Pedro Díaz", email: "pedro@lateral360.com", role: "owner", status: "active", createdAt: "2023-05-12" },
            { id: "8", name: "Sofía Torres", email: "sofia@lateral360.com", role: "developer", status: "inactive", createdAt: "2023-06-01" }
        ];

        // Filtrar usuarios según el término de búsqueda
        const filteredUsers = searchQuery
            ? fallbackUsers.filter(
                user =>
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : fallbackUsers;

        return json({
            user,
            users: filteredUsers,
            searchQuery,
            error: "Error al cargar usuarios: " + (error instanceof Error ? error.message : "Error de conexión")
        });
    }
}

// Acción para manejar operaciones como eliminar usuario o cambiar estado
export async function action({ request }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const formData = await request.formData();
    const action = formData.get("_action") as string;
    const userId = formData.get("userId") as string;

    console.log(`Admin users action - ${action} for userId: ${userId}`);

    try {
        if (action === "delete") {
            const result = await deleteUser(request, userId);

            // Registrar evento de eliminación de usuario
            try {
                await recordEvent(request, {
                    type: "action",
                    name: "user_delete_server",
                    value: { userId }
                });
            } catch (error) {
                console.error("Error al registrar evento de eliminación:", error);
            }

            return json({
                success: true,
                message: "Usuario eliminado exitosamente"
            }, {
                headers: result.headers
            });
        }

        if (action === "updateStatus") {
            const status = formData.get("status") as "active" | "inactive" | "pending";
            const result = await updateUserStatus(request, userId, status);

            // Registrar evento de actualización de estado
            try {
                await recordEvent(request, {
                    type: "action",
                    name: "user_status_update_server",
                    value: { userId, status }
                });
            } catch (error) {
                console.error("Error al registrar evento de actualización:", error);
            }

            return json({
                success: true,
                message: `Estado actualizado a ${status}`,
                user: result.user
            }, {
                headers: result.headers
            });
        }

        return json({ success: false, error: "Acción no reconocida" }, { status: 400 });
    } catch (error) {
        console.error("Error en action:", error);
        const { error: errorMessage, status } = handleApiError(error, "Error al procesar la acción");
        return json({ success: false, error: errorMessage }, { status });
    }
}

export default function AdminUsers() {
    const { user, users, searchQuery, error } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
    const actionFetcher = useFetcher();
    const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

    // Estado para mostrar notificaciones
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // Registrar vista de página de usuarios
    usePageView('admin_users_page', {
        user_id: user.id,
        search_query: searchQuery || undefined,
        users_count: users.length
    }, [user.id, searchQuery, users.length]);

    // Limpiar notificación después de 3 segundos
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Manejar cambio de estado de usuario
    const handleStatusChange = (userId: string, name: string, newStatus: "active" | "inactive" | "pending") => {
        setStatusUpdating(userId);
        actionFetcher.submit(
            {
                _action: "updateStatus",
                userId,
                status: newStatus
            },
            { method: "post" }
        );

        // Registrar evento de acción (del lado del cliente)
        recordAction('user_status_change', {
            userId,
            name,
            status: newStatus
        });

        setNotification({
            type: 'success',
            message: `Estado de ${name} actualizado a ${newStatus === "active" ? "Activo" :
                newStatus === "inactive" ? "Inactivo" : "Pendiente"
                }`
        });
    };

    // Manejar eliminación de usuario
    const handleDeleteUser = (userId: string, name: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${name}?`)) {
            actionFetcher.submit(
                { _action: "delete", userId },
                { method: "post" }
            );

            // Registrar evento de acción (del lado del cliente)
            recordAction('user_delete', { userId, name });

            setNotification({
                type: 'success',
                message: `Usuario ${name} eliminado exitosamente`
            });
        }
    };

    return (
        <div className="p-6">
            {/* Notificación flotante */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-800' :
                    'bg-red-100 border border-red-400 text-red-800'
                    }`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {notification.type === 'success' ? (
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{notification.message}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setNotification(null)}
                                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mensaje de error si existe */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{error}</p>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <h1 className="text-2xl font-bold mb-4 md:mb-0">Gestión de Usuarios</h1>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <Form method="get" className="flex">
                        <input
                            type="text"
                            name="q"
                            placeholder="Buscar usuario..."
                            defaultValue={searchQuery}
                            className="px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Buscar
                        </button>
                    </Form>
                    <Link
                        to="/admin/usuarios/nuevo"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-center"
                    >
                        Crear Usuario
                    </Link>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha Registro
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users && users.length > 0 ? (
                                users.map((user: User) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                                    {(user.name && user.name.charAt(0)) || "?"}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'}`}>
                                                {user.role === 'admin' ? 'Administrador' :
                                                    user.role === 'owner' ? 'Propietario' : 'Desarrollador'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        const menu = document.getElementById(`status-menu-${user.id}`);
                                                        if (menu) {
                                                            menu.classList.toggle('hidden');
                                                        }
                                                    }}
                                                    className="flex items-center"
                                                >
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                        {user.status === 'active' ? 'Activo' :
                                                            user.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
                                                    </span>
                                                    <svg className="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                <div id={`status-menu-${user.id}`} className="hidden absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                                        <button
                                                            onClick={() => {
                                                                document.getElementById(`status-menu-${user.id}`)?.classList.add('hidden');
                                                                handleStatusChange(user.id, user.name, "active");
                                                            }}
                                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                            disabled={statusUpdating === user.id}
                                                        >
                                                            Activo
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                document.getElementById(`status-menu-${user.id}`)?.classList.add('hidden');
                                                                handleStatusChange(user.id, user.name, "inactive");
                                                            }}
                                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                            disabled={statusUpdating === user.id}
                                                        >
                                                            Inactivo
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                document.getElementById(`status-menu-${user.id}`)?.classList.add('hidden');
                                                                handleStatusChange(user.id, user.name, "pending");
                                                            }}
                                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                                            disabled={statusUpdating === user.id}
                                                        >
                                                            Pendiente
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.createdAt}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center space-x-2">
                                                <Link
                                                    to={`/admin/usuarios/${user.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Ver
                                                </Link>
                                                <Link
                                                    to={`/admin/usuarios/${user.id}/editar`}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="text-red-600 hover:text-red-900"
                                                    disabled={actionFetcher.state !== "idle"}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Indicador de carga durante operaciones */}
            {actionFetcher.state !== "idle" && (
                <div className="fixed bottom-4 right-4 bg-white p-3 rounded-md shadow-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Procesando...</span>
                    </div>
                </div>
            )}
        </div>
    );
}