import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser, getAccessTokenFromCookies } from "~/utils/auth.server";

// Tipos para los datos de la API
type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at?: string;
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

    try {
        const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
            headers: {
                Authorization: `Bearer ${await getAccessTokenFromCookies(request)}`,
            },
        }); if (!response.ok) {
            throw new Error("Error al cargar detalles del usuario");
        }

        const user = await response.json();

        return json({ user, currentUser });
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
                                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                    <div className="mt-1 text-lg">{user.name}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <div className="mt-1 text-lg">{user.email}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'owner' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {user.role}
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
                                {user.created_at && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                                {user.last_login && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Último Acceso</label>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {new Date(user.last_login).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex space-x-4">
                    <Link
                        to={`/usuarios/${user.id}/editar`}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
                    >
                        Editar Usuario
                    </Link>
                    <button
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                        onClick={() => {
                            if (window.confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
                                // Manejar eliminación
                            }
                        }}
                    >
                        Eliminar Usuario
                    </button>
                </div>
            </div>
        </div>
    );
}