import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '~/hooks/useAuth';
import type { ApiUser } from '~/services/authNew';

interface AuthContextType {
    user: ApiUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const auth = useAuth();

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

// Componente de protección de rutas
interface ProtectedRouteProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { isAuthenticated, loading } = useAuthContext();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Acceso restringido
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Debes iniciar sesión para acceder a esta página
                    </p>
                    <a
                        href="/auth/login"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Iniciar sesión
                    </a>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

// Componente para mostrar información del usuario
export function UserInfo() {
    const { user, logout } = useAuthContext();

    if (!user) return null;

    return (
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                        {user.first_name[0]}{user.last_name[0]}
                    </span>
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                    {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                    {user.email}
                </p>
            </div>
            <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
            >
                Cerrar sesión
            </button>
        </div>
    );
}