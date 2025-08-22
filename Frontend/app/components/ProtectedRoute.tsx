import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { AuthService } from '~/services/auth';
import type { User, UserRole } from '~/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    redirectTo?: string;
    fallback?: React.ReactNode;
}

/**
 * Componente para proteger rutas basado en autenticación y roles
 * Compatible con los nuevos servicios y documentación de la API
 */
export function ProtectedRoute({
    children,
    requiredRole,
    redirectTo = '/login',
    fallback
}: ProtectedRouteProps) {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                // Verificar si está autenticado
                if (!AuthService.isAuthenticated()) {
                    navigate(redirectTo, { replace: true });
                    return;
                }

                // Obtener datos del usuario
                const currentUser = await AuthService.getCurrentUser();
                setUser(currentUser);

                // Verificar rol si es requerido
                if (requiredRole) {
                    if (!hasRequiredRole(currentUser.role, requiredRole)) {
                        // Redirigir a dashboard apropiado si no tiene el rol
                        const dashboardPath = getDashboardPath(currentUser.role);
                        navigate(dashboardPath, { replace: true });
                        return;
                    }
                }

                setHasAccess(true);
            } catch (error) {
                console.error('Error checking access:', error);
                // Si hay error, limpiar tokens y redirigir
                AuthService.logout();
                navigate(redirectTo, { replace: true });
            } finally {
                setIsChecking(false);
            }
        };

        checkAccess();
    }, [navigate, requiredRole, redirectTo]);

    // Estado de carga
    if (isChecking) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Si no tiene acceso, no renderizar nada (ya se redirigió)
    if (!hasAccess) {
        return null;
    }

    return <>{children}</>;
}

/**
 * Verificar si el usuario tiene el rol requerido
 */
function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
    // Admin tiene acceso a todo
    if (userRole === 'admin') {
        return true;
    }

    // Para otros roles, debe coincidir exactamente
    return userRole === requiredRole;
}

/**
 * Obtener la ruta del dashboard según el rol
 */
function getDashboardPath(role: UserRole): string {
    switch (role) {
        case 'admin':
            return '/dashboard/admin';
        case 'owner':
            return '/dashboard/owner';
        case 'developer':
            return '/dashboard/developer';
        default:
            return '/dashboard';
    }
}

/**
 * HOC para proteger componentes
 */
export function withAuth<T extends object>(
    Component: React.ComponentType<T>,
    requiredRole?: UserRole
) {
    return function AuthenticatedComponent(props: T) {
        return (
            <ProtectedRoute requiredRole={requiredRole}>
                <Component {...props} />
            </ProtectedRoute>
        );
    };
}

/**
 * Componente para mostrar contenido solo a usuarios autenticados
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
}

/**
 * Componente para mostrar contenido solo a administradores
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="admin">
            {children}
        </ProtectedRoute>
    );
}

/**
 * Componente para mostrar contenido solo a propietarios
 */
export function OwnerGuard({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="owner">
            {children}
        </ProtectedRoute>
    );
}

/**
 * Componente para mostrar contenido solo a desarrolladores
 */
export function DeveloperGuard({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="developer">
            {children}
        </ProtectedRoute>
    );
}