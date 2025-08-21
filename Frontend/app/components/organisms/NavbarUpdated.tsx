import { useEffect } from "react";
import { useAuth } from "../../hooks";
import type { User } from "../../types";

interface NavbarProps {
    className?: string;
}

export function Navbar({ className = "" }: NavbarProps) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            // Redirect will be handled by the auth hook
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (isLoading) {
        return (
            <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">360Lateral</h1>
                        </div>
                        <div className="flex items-center">
                            <div className="animate-pulse bg-gray-300 h-8 w-24 rounded"></div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">360Lateral</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <a
                                href="/login"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Iniciar Sesión
                            </a>
                            <a
                                href="/register"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Registrarse
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'owner':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'developer':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
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

    return (
        <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo y navegación principal */}
                    <div className="flex items-center space-x-8">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-semibold text-gray-900">360Lateral</h1>
                        </div>

                        <div className="hidden md:flex space-x-8">
                            <a
                                href="/dashboard"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Dashboard
                            </a>

                            {user.role === 'admin' && (
                                <a
                                    href="/admin/users"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Usuarios
                                </a>
                            )}

                            <a
                                href="/profile"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Mi Perfil
                            </a>
                        </div>
                    </div>

                    {/* Usuario y acciones */}
                    <div className="flex items-center space-x-4">
                        {/* Badge de rol */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                        </span>

                        {/* Información del usuario */}
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                        {user.firstName?.[0] || user.first_name?.[0] || user.email[0].toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="hidden md:block">
                                <div className="text-sm font-medium text-gray-900">
                                    {user.fullName || `${user.firstName || user.first_name} ${user.lastName || user.last_name}`}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                        </div>

                        {/* Menú de acciones */}
                        <div className="relative">
                            <button
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 hover:border-gray-400"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navegación móvil */}
            <div className="md:hidden border-t border-gray-200">
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <a
                        href="/dashboard"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                        Dashboard
                    </a>

                    {user.role === 'admin' && (
                        <a
                            href="/admin/users"
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        >
                            Usuarios
                        </a>
                    )}

                    <a
                        href="/profile"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                        Mi Perfil
                    </a>
                </div>
            </div>
        </nav>
    );
}