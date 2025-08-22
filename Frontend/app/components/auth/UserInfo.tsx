import { Link } from '@remix-run/react';
import { useAuthContext } from './AuthProvider';

export default function UserInfo() {
    const { user, isAuthenticated, logout } = useAuthContext();

    if (!isAuthenticated || !user) {
        return (
            <div className="flex gap-4 items-center">
                <Link
                    to="/auth/login"
                    className="text-gray-500 hover:text-indigo-600"
                >
                    Iniciar sesión
                </Link>
                <Link
                    to="/auth/register"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    Registrarse
                </Link>
            </div>
        );
    }

    // Obtener iniciales del nombre completo
    const getInitials = () => {
        if (!user.first_name) return 'U';

        const nameParts = user.first_name.split(' ');
        if (nameParts.length >= 2) {
            return nameParts[0].charAt(0) + nameParts[1].charAt(0);
        }
        return nameParts[0].charAt(0);
    };

    return (
        <div className="relative group">
            <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                    {getInitials()}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700">{user.first_name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                </div>
            </div>

            <div className="absolute right-0 w-48 py-2 mt-2 bg-white rounded-md shadow-lg hidden group-hover:block">
                <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                >
                    Mi perfil
                </Link>

                {user.role === 'admin' && (
                    <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                    >
                        Administración
                    </Link>
                )}

                <button
                    onClick={() => logout()}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                >
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}
