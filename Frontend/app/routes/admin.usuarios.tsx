import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { getUsers, deleteUser, updateUserStatus, type User } from "~/services/users.server";

type LoaderData = {
    user: any;
    users: User[];
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

    try {
        // En lugar de usar la API real, usar datos mock por ahora
        // const { users: usersResponse } = await getUsers(request, { search: searchQuery });

        // Mock users data para desarrollo
        const mockUsers: User[] = [
            {
                id: "1",
                name: "Juan Pérez",
                email: "juan@example.com",
                role: "owner",
                status: "active",
                created_at: "2024-01-15T10:00:00Z",
                is_verified: true
            },
            {
                id: "2",
                name: "María García",
                email: "maria@example.com",
                role: "developer",
                status: "active",
                created_at: "2024-01-10T15:30:00Z",
                is_verified: true
            },
            {
                id: "3",
                name: "Carlos López",
                email: "carlos@example.com",
                role: "admin",
                status: "pending",
                created_at: "2024-01-12T09:15:00Z",
                is_verified: false
            },
            {
                id: "4",
                name: "Ana Rodríguez",
                email: "ana@example.com",
                role: "owner",
                status: "inactive",
                created_at: "2024-01-08T11:45:00Z",
                is_verified: true
            },
            {
                id: "5",
                name: "Pedro Martínez",
                email: "pedro@example.com",
                role: "developer",
                status: "active",
                created_at: "2024-01-14T14:20:00Z",
                is_verified: true
            },
            {
                id: "6",
                name: "Laura Sánchez",
                email: "laura@example.com",
                role: "owner",
                status: "active",
                created_at: "2024-01-11T16:10:00Z",
                is_verified: true
            },
            {
                id: "7",
                name: "Diego Torres",
                email: "diego@example.com",
                role: "admin",
                status: "active",
                created_at: "2024-01-09T13:25:00Z",
                is_verified: true
            },
            {
                id: "8",
                name: "Sofia Moreno",
                email: "sofia@example.com",
                role: "developer",
                status: "pending",
                created_at: "2024-01-13T12:30:00Z",
                is_verified: false
            }
        ];

        const filteredUsers = searchQuery
            ? mockUsers.filter(user =>
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : mockUsers;

        return json({
            user,
            users: filteredUsers,
            searchQuery,
            error: undefined
        });
    } catch (error) {
        console.error("Error loading users:", error);
        return json({
            user,
            users: [],
            searchQuery,
            error: "Error al cargar usuarios"
        });
    }
}

// Acción para manejar operaciones como eliminar usuario o cambiar estado
export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    const formData = await request.formData();
    const action = formData.get("action");
    const userId = formData.get("userId") as string;

    try {
        switch (action) {
            case "delete":
                // await deleteUser(request, userId);
                console.log(`Deleting user: ${userId}`);
                return json({ success: true, message: "Usuario eliminado correctamente" });

            case "activate":
                // await updateUserStatus(request, userId, "active");
                console.log(`Activating user: ${userId}`);
                return json({ success: true, message: "Usuario activado correctamente" });

            case "deactivate":
                // await updateUserStatus(request, userId, "inactive");
                console.log(`Deactivating user: ${userId}`);
                return json({ success: true, message: "Usuario desactivado correctamente" });

            default:
                return json({ error: "Acción no válida" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in user action:", error);
        return json({ error: "Error al procesar la acción" }, { status: 500 });
    }
}

export default function AdminUsers() {
    const { user, users, searchQuery, error } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'delete' | 'activate' | 'deactivate' | null>(null);

    const isLoading = navigation.state === "loading" || navigation.state === "submitting";

    const handleUserAction = (user: User, action: 'delete' | 'activate' | 'deactivate') => {
        setSelectedUser(user);
        setActionType(action);
        setActionModalOpen(true);
    };

    const confirmAction = () => {
        if (selectedUser && actionType) {
            const formData = new FormData();
            formData.append("action", actionType);
            formData.append("userId", selectedUser.id);
            submit(formData, { method: "post" });
            setActionModalOpen(false);
            setSelectedUser(null);
            setActionType(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Administrador';
            case 'owner':
                return 'Propietario';
            case 'developer':
                return 'Desarrollador';
            default:
                return role;
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

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <p className="text-gray-600 mt-2">
                    Administra usuarios del sistema 360 Lateral
                </p>
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
                            placeholder="Buscar por nombre o email..."
                            defaultValue={searchQuery}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                        />
                    </div>
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
                    <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                    <div className="text-sm text-gray-600">Total Usuarios</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-green-600">
                        {users.filter(u => u.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-600">Activos</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-yellow-600">
                        {users.filter(u => u.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-2xl font-bold text-red-600">
                        {users.filter(u => u.status === 'inactive').length}
                    </div>
                    <div className="text-sm text-gray-600">Inactivos</div>
                </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha de Registro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((userItem) => (
                            <tr key={userItem.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {userItem.name?.charAt(0) || userItem.email.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {userItem.name || userItem.first_name || userItem.email?.split('@')[0] || 'Sin nombre'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {userItem.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {getRoleLabel(userItem.role)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userItem.status)}`}>
                                        {userItem.status === 'active' ? 'Activo' :
                                            userItem.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(userItem.created_at).toLocaleDateString('es-CO')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {userItem.status === 'active' ? (
                                        <button
                                            onClick={() => handleUserAction(userItem, 'deactivate')}
                                            className="text-yellow-600 hover:text-yellow-900"
                                        >
                                            Desactivar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUserAction(userItem, 'activate')}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Activar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleUserAction(userItem, 'delete')}
                                        className="text-red-600 hover:text-red-900 ml-4"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No se encontraron usuarios</p>
                    </div>
                )}
            </div>

            {/* Modal de confirmación */}
            {actionModalOpen && selectedUser && actionType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                Confirmar Acción
                            </h3>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-600">
                                ¿Estás seguro de que quieres {getActionLabel()} al usuario{' '}
                                <span className="font-medium">
                                    {selectedUser.name || selectedUser.email}
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
            )}
        </div>
    );
}