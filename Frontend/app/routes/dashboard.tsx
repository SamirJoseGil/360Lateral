// Ejemplo de ruta de dashboard protegida
import { ProtectedRoute } from "~/components/auth/AuthProvider";
import { useAuthContext } from "~/components/auth/AuthProvider";

export default function Dashboard() {
    const { user } = useAuthContext();

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="px-4 py-6 sm:px-0">
                        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                ¡Bienvenido, {user?.first_name}!
                            </h1>
                            <p className="text-gray-600 mb-6">
                                Has iniciado sesión exitosamente en 360Lateral.
                            </p>

                            {/* User Info Card */}
                            <div className="bg-white shadow rounded-lg p-6 mb-8">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    Tu información
                                </h2>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {user?.first_name} {user?.last_name}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Username</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Rol</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.role === 'admin'
                                                    ? 'bg-red-100 text-red-800'
                                                    : user?.role === 'owner'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                {user?.role === 'admin' ? 'Administrador' :
                                                    user?.role === 'owner' ? 'Propietario' : 'Desarrollador'}
                                            </span>
                                        </dd>
                                    </div>
                                    {user?.company && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user.company}</dd>
                                        </div>
                                    )}
                                    {user?.phone && (
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user.phone}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="bg-white shadow rounded-lg p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Mi Perfil</h3>
                                            <p className="text-sm text-gray-500">Gestiona tu información</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white shadow rounded-lg p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Proyectos</h3>
                                            <p className="text-sm text-gray-500">Ver mis proyectos</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white shadow rounded-lg p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Configuración</h3>
                                            <p className="text-sm text-gray-500">Ajustes de cuenta</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}