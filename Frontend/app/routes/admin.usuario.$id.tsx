import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getUserById } from "~/services/users.server";

// Tipos para los datos de la API
type User = {
    id: string;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    phone?: string;
    company?: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at?: string;
    updated_at?: string;
    last_login?: string;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const currentUser = await getUser(request);
    if (!currentUser) {
        return redirect("/login");
    }

    if (currentUser.role !== "admin") {
        return redirect("/" + currentUser.role);
    }

    const userId = params.id;
    if (!userId) {
        return redirect("/admin/usuarios");
    }

    try {
        const { user, headers } = await getUserById(request, userId);
        return json({ user, currentUser }, { headers });
    } catch (error) {
        console.error("Error cargando detalles del usuario:", error);
        return redirect("/admin/usuarios");
    }
}

// Helper para obtener el token
async function getUserToken(request: Request): Promise<string> {
    const cookieHeader = request.headers.get("Cookie") || "";
    // Esta función es simplificada, ajusta según tu auth.server.ts
    const match = cookieHeader.match(/l360_access=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    return token.replace(/^"(.*)"$/, '$1'); // Remove quotes if present
}

export default function UserDetailsPage() {
    const { user } = useLoaderData<typeof loader>();

    const displayName = user.full_name ||
        (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
        user.first_name ||
        user.username ||
        user.email?.split('@')[0] ||
        'Sin nombre';

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/admin/usuarios" className="text-blue-600 hover:text-blue-800">
                    ← Volver a Usuarios
                </Link>
                <h1 className="text-2xl font-bold">Perfil de Usuario</h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                    <div className="mt-1 text-lg">{displayName}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <div className="mt-1 text-lg">{user.email}</div>
                                </div>
                                {user.username && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Username</label>
                                        <div className="mt-1 text-lg">{user.username}</div>
                                    </div>
                                )}
                                {user.phone && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                        <div className="mt-1 text-lg">{user.phone}</div>
                                    </div>
                                )}
                                {user.company && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Empresa</label>
                                        <div className="mt-1 text-lg">{user.company}</div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'owner' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {user.role === 'admin' ? 'Administrador' :
                                                user.role === 'owner' ? 'Propietario' : 'Desarrollador'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Información de la Cuenta</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID</label>
                                    <div className="mt-1 text-sm text-gray-500 font-mono">{user.id}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Verificado</label>
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {user.is_verified ? 'Verificado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                                {user.created_at && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleString('es-CO')}
                                        </div>
                                    </div>
                                )}
                                {user.updated_at && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Última Actualización</label>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {new Date(user.updated_at).toLocaleString('es-CO')}
                                        </div>
                                    </div>
                                )}
                                {user.last_login && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Último Acceso</label>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {new Date(user.last_login).toLocaleString('es-CO')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex space-x-4">
                    <Link
                        to={`/admin/usuarios/${user.id}/editar`}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Editar Usuario
                    </Link>
                    <Link
                        to="/admin/usuarios"
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Volver a Lista
                    </Link>
                </div>
            </div>
        </div>
    );
}