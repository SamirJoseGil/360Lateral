import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    if (user.role !== "admin") {
        return redirect(`/${user.role}`);
    }

    // ✅ SIMPLIFICADO: Solo contar desde relaciones del usuario
    // No hacer requests HTTP adicionales para evitar problemas de auth
    
    return json({
        user,
        error: null
    });
}

export default function AdminDashboard() {
    const { user, error } = useLoaderData<typeof loader>();

    return (
        <div className="p-4">
            {error && (
                <div className="mb-6 bg-red-100 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Panel de Administración</h1>
                <p className="text-gray-600 mt-2">
                    Bienvenido/a {user.first_name || user.email}
                </p>
            </div>

            {/* ✅ CARDS SIMPLIFICADAS - Sin estadísticas que requieran autenticación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card de Usuarios */}
                <Link to="/admin/usuarios" className="block">
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Usuarios</h3>
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Gestionar usuarios del sistema</p>
                    </div>
                </Link>

                {/* Card de Lotes */}
                <Link to="/admin/lotes" className="block">
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Lotes</h3>
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Administrar lotes registrados</p>
                    </div>
                </Link>

                {/* Card de Documentos */}
                <Link to="/admin/validacion" className="block">
                    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
                            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Validar documentos cargados</p>
                    </div>
                </Link>
            </div>

            {/* ✅ NUEVO: Información útil */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Tu Rol</p>
                        <p className="text-lg font-bold text-blue-600 capitalize">{user.role}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="text-sm font-medium text-green-600 truncate">{user.email}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Estado</p>
                        <p className="text-lg font-bold text-purple-600">
                            {user.is_active ? 'Activo' : 'Inactivo'}
                        </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Verificado</p>
                        <p className="text-lg font-bold text-orange-600">
                            {user.is_verified ? 'Sí' : 'No'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}