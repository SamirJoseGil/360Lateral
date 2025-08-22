import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from '@remix-run/react';
import { useAuth } from '~/hooks/useAuth';
import AppLayout from '~/components/layout/AppLayout';

export default function Dashboard() {
    const { user, isLoading, initialCheckDone, normalizeRole, getDashboardPath } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [redirectCount, setRedirectCount] = useState(0);
    
    // Ref para asegurar solo una redirección
    const redirectedRef = useRef(false);
    const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Log del estado para depuración
    useEffect(() => {
        console.log("📊 Dashboard estado:", { 
            pathname: location.pathname,
            user: user?.email, 
            userRole: user?.role,
            isLoading, 
            initialCheckDone,
            redirectCount,
            redirected: redirectedRef.current
        });
    }, [user, isLoading, initialCheckDone, location, redirectCount]);

    // Limpiar timeout al desmontar
    useEffect(() => {
        return () => {
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
        };
    }, []);

    // Efecto de redirección mejorado para evitar bucles
    useEffect(() => {
        // Prevenir redirecciones si ya está en curso
        if (redirectedRef.current) {
            return;
        }

        // Si ya cargó y hay un usuario, redireccionar al dashboard específico
        if (!isLoading && initialCheckDone) {
            if (user) {
                console.log("👤 Dashboard: Usuario autenticado, preparando redirección");
                const role = normalizeRole(user.role);
                const dashboardPath = getDashboardPath(role);
                
                // Evitar redirecciones circulares
                if (location.pathname !== dashboardPath) {
                    // Incrementar contador de redirecciones (para depuración)
                    setRedirectCount(prev => prev + 1);
                    
                    // Prevenir múltiples redirecciones
                    redirectedRef.current = true;
                    
                    console.log(`🔄 Redirigiendo de ${location.pathname} a ${dashboardPath}`);
                    
                    // Usar timeout para evitar ciclos de redirección y dar tiempo a que los logs se muestren
                    redirectTimeoutRef.current = setTimeout(() => {
                        navigate(dashboardPath, { replace: true });
                    }, 100);
                } else {
                    console.log("⚠️ Evitando redirección circular, ya estamos en", dashboardPath);
                }
            } else {
                // Si terminó de cargar y no hay usuario, redirigir a login
                console.log("🔒 Usuario no autenticado, redirigiendo a login");
                
                // Prevenir múltiples redirecciones
                if (!redirectedRef.current) {
                    redirectedRef.current = true;
                    
                    // Timeout breve para evitar ciclos
                    redirectTimeoutRef.current = setTimeout(() => {
                        navigate('/auth/login', { replace: true });
                    }, 100);
                }
            }
        }
    }, [user, isLoading, initialCheckDone, navigate, normalizeRole, getDashboardPath, location.pathname]);

    // Mostrar pantalla de carga mientras se redirige
    return (
        <AppLayout>
            <div className="p-6 flex items-center justify-center h-full flex-col">
                <div className="text-center mb-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redireccionando...</p>
                </div>
                
                {/* Panel de depuración */}
                {process.env.NODE_ENV !== 'production' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md w-full">
                        <h3 className="font-medium text-gray-700 mb-2">Información de depuración:</h3>
                        <div className="text-xs font-mono text-gray-600">
                            <p>Ruta actual: <span className="font-bold">{location.pathname}</span></p>
                            <p>Estado carga: {isLoading ? '⏳ Cargando' : '✅ Completado'}</p>
                            <p>Check inicial: {initialCheckDone ? '✅ Completado' : '⏳ Pendiente'}</p>
                            <p>Autenticado: {user ? '✅ Sí' : '❌ No'}</p>
                            {user && (
                                <>
                                    <p>Usuario: {user.email}</p>
                                    <p>Rol: {user.role} → {normalizeRole(user.role)}</p>
                                </>
                            )}
                            <p>Redirecciones: {redirectCount}</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}