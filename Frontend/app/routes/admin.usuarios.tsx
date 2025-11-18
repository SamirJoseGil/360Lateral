import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, useSubmit, Link } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { getAllUsers, deleteUser, updateUserStatus, updateUser, type User } from "~/services/users.server";

type LoaderData = {
    user: any;
    users: User[];
    searchQuery: string;
    error: string | undefined;
};

export async function loader({ request }: LoaderFunctionArgs): Promise<ReturnType<typeof json<LoaderData>>> {
    try {
        // Verificar autenticación
        const user = await getUser(request);

        if (!user) {
            console.log("[Admin Usuarios] No user found, redirecting");
            return redirect("/login?message=Sesión expirada");
        }

        if (user.role !== "admin") {
            console.log(`[Admin Usuarios] User is not admin (${user.role}), redirecting`);
            return redirect("/unauthorized");
        }

        // ✅ LOGGING: Verificar que el usuario está autenticado
        console.log(`[Admin Usuarios] User authenticated: ${user.email} (${user.role})`);

        const url = new URL(request.url);
        const searchQuery = url.searchParams.get("search") || "";

        // Obtener usuarios con manejo de errores
        const { users: usersList, headers } = await getAllUsers(request, searchQuery);

        // Calcular el nombre completo para cada usuario
        const processedUsers: User[] = usersList.map((user: any) => ({
            ...user,
            name: user.full_name ||
                (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                user.first_name ||
                user.username ||
                user.email?.split('@')[0] ||
                'Sin nombre',
            status: user.is_active ? 'active' : 'inactive'
        }));

        return json({
            user,
            users: processedUsers,
            searchQuery,
            error: undefined
        }, { headers });

    } catch (error) {
        console.error("[Admin Usuarios] Loader error:", error);

        // Si es un error de autenticación, redirigir
        if (error instanceof Response) {
            throw error;
        }

        // Para otros errores, mostrar página de error
        throw new Response("Error cargando usuarios", { status: 500 });
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
                await deleteUser(request, userId);
                return json({ success: true, message: "Usuario eliminado correctamente" });

            case "activate":
                // Activar usuario usando is_active
                await updateUser(request, userId, { is_active: true });
                return json({ success: true, message: "Usuario activado correctamente" });

            case "deactivate":
                // Desactivar usuario usando is_active
                await updateUser(request, userId, { is_active: false });
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
        <div className="p-4 h-auto min-h-screen bg-gray-100">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                    <p className="text-gray-600 mt-2">
                        Administra usuarios del sistema 360 Lateral
                    </p>
                </div>
                <div>
                    <Link
                        to="/admin/usuarios/nuevo"
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        + Crear Usuario
                    </Link>
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
                <table className="min-w-full divide-y overflow-y-auto divide-gray-200">
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
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userItem.status ?? '')}`}>
                                        {userItem.status === 'active' ? 'Activo' :
                                            userItem.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(userItem.created_at).toLocaleDateString('es-CO')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <Link
                                        to={`/admin/usuario/${userItem.id}`}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        Ver
                                    </Link>
                                    <Link
                                        to={`/admin/usuarios/${userItem.id}/editar`}
                                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                                    >
                                        Editar
                                    </Link>
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