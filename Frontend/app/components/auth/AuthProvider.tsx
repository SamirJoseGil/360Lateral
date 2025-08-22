import React, { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from '@remix-run/react';
import { AuthContextType } from '~/types/auth';
import { useAuth } from '~/hooks/useAuth';
import { AuditEvent } from '~/types/index';

// Actualizar el tipo AuthContextType para incluir lastAuditEvent
import { LoginCredentials, LoginResponse } from '~/types/auth'; // asegúrate de importar estos tipos si no están ya

import { UserRole } from '~/types/userRole';

interface ExtendedAuthContextType extends Omit<AuthContextType, 'login' | 'getDashboardPath'> {
    login: (credentials: LoginCredentials) => Promise<LoginResponse>;
    lastAuditEvent: AuditEvent | null;
    authError: string | null;
    navigationHistory: string[];
    initialCheckDone: boolean;
    getDashboardPath: (role: UserRole) => string;
}

// Crear contexto con el tipo extendido
const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

// Props para el AuthProvider
interface AuthProviderProps {
    children: ReactNode;
}

// Props para ProtectedRoute
interface ProtectedRouteProps {
    children: ReactNode;
    requireAdmin?: boolean;
    requiredRoles?: string | string[];
}

export function AuthProvider({ children }: AuthProviderProps) {
    const auth = useAuth();
    const location = useLocation();
    const [lastAuditEvent, setLastAuditEvent] = React.useState<AuditEvent | null>(null);
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

    // Ref para controlar ciclos
    const navigationMonitoringRef = useRef(false);
    const cycleDetectedRef = useRef(false);

    // Monitorear cambios de ruta para detectar ciclos (solo una vez)
    useEffect(() => {
        if (navigationMonitoringRef.current) return;
        navigationMonitoringRef.current = true;

        // Log inicial
        console.log("AuthProvider: Iniciando monitoreo de navegación");
        setNavigationHistory([location.pathname]);
    }, []);

    // Monitorear cambios de ruta para detectar ciclos
    useEffect(() => {
        // Evitar el primer renderizado
        if (navigationHistory.length === 0) {
            return;
        }

        // Registrar la nueva ruta
        console.log(`📍 Navegación a ${location.pathname}`, {
            from: navigationHistory[navigationHistory.length - 1]
        });

        // Detectar posibles ciclos de redirección
        const lastThreeRoutes = [...navigationHistory.slice(-5), location.pathname];
        setNavigationHistory(prev => [...prev, location.pathname]);

        // Buscar patrones de redirección entre login y dashboard
        if (lastThreeRoutes.length >= 6) {
            const isLoginLoop = lastThreeRoutes[0] === '/auth/login' &&
                lastThreeRoutes[2] === '/auth/login' &&
                lastThreeRoutes[4] === '/auth/login';

            const isDashboardLoop = lastThreeRoutes[0] === '/dashboard' &&
                lastThreeRoutes[2] === '/dashboard' &&
                lastThreeRoutes[4] === '/dashboard';

            if ((isLoginLoop || isDashboardLoop) && !cycleDetectedRef.current) {
                cycleDetectedRef.current = true;
                console.error('🔄 CICLO DE REDIRECCIÓN DETECTADO', {
                    routes: lastThreeRoutes,
                    authState: {
                        isAuthenticated: auth.isAuthenticated,
                        isLoading: auth.isLoading,
                        initialCheckDone: auth.initialCheckDone,
                        user: auth.user ? {
                            email: auth.user.email,
                            role: auth.user.role
                        } : null
                    }
                });

                // Limpieza de emergencia para romper el ciclo
                if (typeof localStorage !== 'undefined') {
                    console.warn('🧹 Limpiando tokens para romper ciclo de redirección');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
        }
    }, [location.pathname]);

    // Habilitar el almacenamiento de auditoría en desarrollo
    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            localStorage.setItem('enable_audit_storage', 'true');
        }
    }, []);

    // Log el estado de autenticación cada vez que cambia
    useEffect(() => {
        if (auth.initialCheckDone) {
            console.log('🔐 Estado de autenticación actualizado', {
                isAuthenticated: auth.isAuthenticated,
                isLoading: auth.isLoading,
                user: auth.user ? {
                    email: auth.user.email,
                    role: auth.user.role
                } : null,
                authError: auth.authError
            });
        }
    }, [auth.isAuthenticated, auth.user, auth.initialCheckDone, auth.authError]);

    return (
        <AuthContext.Provider value={{
            ...auth, lastAuditEvent, navigationHistory
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para usar el contexto de autenticación
export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext debe ser usado dentro de un AuthProvider');
    }
    return context;
}

// Componente para proteger rutas
export function ProtectedRoute({ children, requireAdmin = false, requiredRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, initialCheckDone, hasRole, user } = useAuthContext();
    const location = useLocation();
    const redirectedRef = useRef(false);

    useEffect(() => {
        console.debug('🔒 ProtectedRoute: Evaluando acceso a ruta protegida', {
            path: location.pathname,
            isLoading,
            initialCheckDone,
            isAuthenticated,
            requireAdmin,
            requiredRoles
        });
    }, [location.pathname, isLoading, initialCheckDone, isAuthenticated, requireAdmin, requiredRoles]);

    // Esperar a que se complete la verificación inicial
    if (isLoading || !initialCheckDone) {
        return <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando...</span>
        </div>;
    }

    // Evitar múltiples redirecciones
    if (redirectedRef.current) {
        return null;
    }

    if (!isAuthenticated) {
        // Redirigir a login si no está autenticado
        console.warn('⛔ ProtectedRoute: Usuario no autenticado, redirigiendo a login');
        redirectedRef.current = true;
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    // Verificar rol de admin si es requerido
    if (requireAdmin && !hasRole('admin')) {
        // Redirigir al dashboard si no es admin pero la ruta requiere admin
        console.warn('⛔ ProtectedRoute: Acceso denegado: se requiere rol admin');
        redirectedRef.current = true;
        return <Navigate to="/dashboard" replace />;
    }

    // Verificar roles específicos si son requeridos
    if (requiredRoles && !hasRole(requiredRoles)) {
        console.warn('⛔ ProtectedRoute: Acceso denegado: roles requeridos no coinciden');
        redirectedRef.current = true;
        return <Navigate to="/dashboard" replace />;
    }

    console.log('✅ ProtectedRoute: Acceso permitido', {
        path: location.pathname,
        user: user ? { email: user.email, role: user.role } : null
    });

    return <>{children}</>;
}

// Componente para redirigir usuarios autenticados (por ejemplo, desde login)
export function AuthRedirect({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, initialCheckDone, user, getDashboardPath, normalizeRole } = useAuthContext();
    const location = useLocation();
    const redirectedRef = useRef(false);

    useEffect(() => {
        console.debug('🔄 AuthRedirect: Evaluando redirección', {
            path: location.pathname,
            isLoading,
            initialCheckDone,
            isAuthenticated
        });
    }, [location.pathname, isLoading, initialCheckDone, isAuthenticated]);

    // Esperar a que se complete la verificación inicial
    if (isLoading || !initialCheckDone) {
        return <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando...</span>
        </div>;
    }

    // Evitar múltiples redirecciones
    if (redirectedRef.current) {
        return null;
    }

    if (isAuthenticated && user) {
        const role = normalizeRole(user.role);
        const dashboardPath = getDashboardPath(role);
        console.log('✅ AuthRedirect: Usuario autenticado, redirigiendo a dashboard', {
            from: location.pathname,
            to: dashboardPath,
            user: { email: user.email, role: user.role }
        });

        redirectedRef.current = true;
        return <Navigate to={dashboardPath} replace />;
    }

    console.log('👁️ AuthRedirect: Mostrando contenido público', { path: location.pathname });
    return <>{children}</>;
}