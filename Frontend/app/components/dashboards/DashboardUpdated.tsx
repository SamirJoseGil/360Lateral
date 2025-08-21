import { useEffect } from "react";
import { useAuth, useUser } from "../../hooks";

export function DashboardUpdated() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const {
        users,
        isLoading: usersLoading,
        error: usersError,
        fetchUsers,
        canViewAllUsers
    } = useUser(user?.role, user?.id);

    useEffect(() => {
        if (isAuthenticated && user && canViewAllUsers) {
            fetchUsers();
        }
    }, [isAuthenticated, user, canViewAllUsers, fetchUsers]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Requerido</h2>
                    <p className="text-gray-600 mb-6">Debes iniciar sesión para acceder al dashboard.</p>
                    <a
                        href="/login"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium"
                    >
                        Iniciar Sesión
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Header del Dashboard */}
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-b border-gray-200 pb-5">
                        <h1 className="text-3xl font-bold leading-6 text-gray-900">
                            Dashboard
                        </h1>
                        <p className="mt-2 max-w-4xl text-sm text-gray-500">
                            Bienvenido de vuelta, {user.fullName || `${user.first_name} ${user.last_name}`}
                        </p>
                    </div>
                </div>

                {/* Estadísticas principales */}
                <div className="px-4 py-6 sm:px-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card de información del usuario */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                            <span className="text-sm font-medium text-white">
                                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Tu Rol
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900 capitalize">
                                                {user.role === 'admin' ? 'Administrador' :
                                                    user.role === 'owner' ? 'Propietario' :
                                                        user.role === 'developer' ? 'Desarrollador' : user.role}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card de estado */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${user.is_active ? 'bg-green-500' : 'bg-red-500'
                                            }`}>
                                            <span className="text-sm font-medium text-white">
                                                {user.is_active ? '✓' : '✕'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Estado
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card de fecha de registro */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
                                            <span className="text-sm font-medium text-white">📅</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Miembro desde
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {new Date(user.date_joined).toLocaleDateString()}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card de usuarios totales (solo para admin) */}
                        {canViewAllUsers && (
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                                                <span className="text-sm font-medium text-white">👥</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Total Usuarios
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {usersLoading ? '...' : users.length}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabla de usuarios (solo para admin) */}
                {canViewAllUsers && (
                    <div className="px-4 py-6 sm:px-0">
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Gestión de Usuarios
                                </h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                    Lista de todos los usuarios registrados en el sistema.
                                </p>
                            </div>

                            {usersError ? (
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="text-center">
                                        <div className="text-red-600 mb-2">❌</div>
                                        <p className="text-red-600">{usersError}</p>
                                        <button
                                            onClick={() => fetchUsers()}
                                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                </div>
                            ) : usersLoading ? (
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-2 text-gray-600">Cargando usuarios...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-gray-200">
                                    <div className="bg-gray-50 px-4 py-5 sm:px-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium text-gray-900">
                                                {users.length} usuarios encontrados
                                            </h4>
                                            <a
                                                href="/admin/users"
                                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                            >
                                                Ver todos →
                                            </a>
                                        </div>
                                    </div>

                                    <ul className="divide-y divide-gray-200">
                                        {users.slice(0, 5).map((userItem) => (
                                            <li key={userItem.id} className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {userItem.first_name?.[0] || userItem.email[0].toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {userItem.fullName || `${userItem.first_name} ${userItem.last_name}`}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {userItem.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                                userItem.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-green-100 text-green-800'
                                                            }`}>
                                                            {userItem.role === 'admin' ? 'Admin' :
                                                                userItem.role === 'owner' ? 'Owner' :
                                                                    userItem.role === 'developer' ? 'Dev' : userItem.role}
                                                        </span>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {userItem.is_active ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Acciones rápidas */}
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Acciones Rápidas
                            </h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <a
                                    href="/profile"
                                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl">👤</span>
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                Editar Perfil
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                Actualiza tu información personal
                                            </p>
                                        </div>
                                    </div>
                                </a>

                                {canViewAllUsers && (
                                    <a
                                        href="/admin/users"
                                        className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <span className="text-2xl">⚙️</span>
                                            </div>
                                            <div className="ml-3">
                                                <h4 className="text-sm font-medium text-gray-900">
                                                    Administrar Usuarios
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                    Gestiona los usuarios del sistema
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                )}

                                <a
                                    href="/settings"
                                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <span className="text-2xl">🔧</span>
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                Configuración
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                Ajusta las preferencias de tu cuenta
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}