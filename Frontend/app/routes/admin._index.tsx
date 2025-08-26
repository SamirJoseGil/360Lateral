import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // El usuario ya ha sido verificado en el layout padre
    const user = await getUser(request);

    // Aquí podrías obtener datos del dashboard como estadísticas, etc.
    const stats = {
        users: 128,
        activeProjects: 45,
        pendingValidations: 12,
        recentActivity: 37
    };

    return json({ user, stats });
}

export default function AdminDashboard() {
    const { user, stats } = useLoaderData<typeof loader>();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tarjeta de estadísticas: Usuarios */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4">
                        <a href="/admin/usuarios" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Ver todos los usuarios
                        </a>
                    </div>
                </div>

                {/* Tarjeta de estadísticas: Proyectos Activos */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Proyectos Activos</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4">
                        <a href="/admin/proyectos" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Ver todos los proyectos
                        </a>
                    </div>
                </div>

                {/* Tarjeta de estadísticas: Pendientes de Validación */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pendientes de Validación</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.pendingValidations}</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4">
                        <a href="/admin/validacion" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Ver pendientes
                        </a>
                    </div>
                </div>

                {/* Tarjeta de estadísticas: Actividad Reciente */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Actividad Reciente</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.recentActivity}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-4">
                        <a href="/admin/actividad" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Ver actividad
                        </a>
                    </div>
                </div>
            </div>

            {/* Sección de bienvenida */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">¡Bienvenido, {user.name}!</h2>
                <p className="text-gray-600">
                    Este es tu panel de administración centralizado. Desde aquí puedes gestionar usuarios,
                    revisar validaciones pendientes, y ver análisis detallados de la plataforma.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 hover:bg-gray-50">
                        <h3 className="font-medium">Gestión de Usuarios</h3>
                        <p className="text-sm text-gray-500 mt-1">Administra los usuarios de la plataforma</p>
                        <a href="/admin/usuarios" className="mt-2 text-sm text-blue-600 flex items-center">
                            Ir a Usuarios
                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                    <div className="border rounded-lg p-4 hover:bg-gray-50">
                        <h3 className="font-medium">Validación de Documentos</h3>
                        <p className="text-sm text-gray-500 mt-1">Revisa y aprueba documentos pendientes</p>
                        <a href="/admin/validacion" className="mt-2 text-sm text-blue-600 flex items-center">
                            Ir a Validación
                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                    <div className="border rounded-lg p-4 hover:bg-gray-50">
                        <h3 className="font-medium">Análisis y Reportes</h3>
                        <p className="text-sm text-gray-500 mt-1">Visualiza métricas y genera reportes</p>
                        <a href="/admin/analisis" className="mt-2 text-sm text-blue-600 flex items-center">
                            Ir a Análisis
                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}