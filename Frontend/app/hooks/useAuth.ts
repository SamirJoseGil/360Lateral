import { useState, useEffect, useRef } from 'react';
import { User, LoginCredentials, RegisterData } from '~/types/auth';
import authService from '~/services/auth';
import { UserRole } from '~/types/userRole';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Refs para controlar ciclos
  const initialCheckRef = useRef(false);
  const logoutInProgressRef = useRef(false);

  // Función para normalizar roles para compatibilidad
  const normalizeRole = (role?: string | null): UserRole => {
    if (!role) {
      console.debug('useAuth: Role vacío, usando "owner" por defecto');
      return "owner"; // Default role
    }
    
    const r = role.toLowerCase();
    
    if (["admin", "administrator", "administrador"].includes(r)) {
      return "admin";
    }
    if (["owner", "propietario", "dueno", "dueño"].includes(r)) {
      return "owner";
    }
    if (["developer", "desarrollador"].includes(r)) {
      return "developer";
    }
    
    console.warn(`useAuth: Role desconocido "${role}", usando "owner" por defecto`);
    return "owner"; // Default role
  };

  // Obtener ruta del dashboard según el rol
  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case "admin": 
        return "/dashboard/admin";
      case "owner": 
        return "/dashboard/owner";
      case "developer": 
        return "/dashboard/developer";
      default: 
        return "/dashboard";
    }
  };

  // Verificación de rol mejorada
  const hasRole = (requiredRole: string | string[]): boolean => {
    if (!user) {
      return false;
    }

    // Normalizar el rol del usuario para comparación
    const normalizedUserRole = normalizeRole(user.role);
    
    // Si admin, tiene acceso a todo
    if (normalizedUserRole === 'admin') {
      return true;
    }
    
    // Para verificar múltiples roles permitidos
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => normalizeRole(role) === normalizedUserRole);
    }
    
    // Verificación simple de un solo rol
    return normalizeRole(requiredRole) === normalizedUserRole;
  };

  // Cargar perfil al iniciar - solo una vez al montar el componente
  useEffect(() => {
    // Evitar múltiples comprobaciones iniciales
    if (initialCheckRef.current) return;
    
    const loadUserProfile = async () => {
      console.log("🔍 useAuth: Verificando estado de autenticación inicial");
      initialCheckRef.current = true;
      
      try {
        setAuthError(null);
        setIsLoading(true);
        
        // Verificar si hay token almacenado
        const hasToken = authService.isAuthenticated();
        
        if (!hasToken) {
          console.log("🔒 useAuth: No hay token, usuario no autenticado");
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // Intentar cargar el perfil
        try {
          const userData = await authService.getProfile();
          console.log("✅ useAuth: Perfil cargado exitosamente", { email: userData.email });
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("❌ useAuth: Error cargando perfil", error);
          // Limpiar estado pero NO llamar a logout para evitar bucle
          setIsAuthenticated(false);
          setUser(null);
          setAuthError("Sesión expirada o inválida");
        }
      } catch (error) {
        console.error("❌ useAuth: Error no manejado en verificación de autenticación", error);
      } finally {
        setIsLoading(false);
        setInitialCheckDone(true);
      }
    };

    // Solo hacer la carga inicial una vez
    if (!initialCheckDone) {
      loadUserProfile();
    }
  }, [initialCheckDone]);

  // Implementación segura de login
  const login = async (credentials: LoginCredentials) => {
    console.group('🔑 useAuth: Login');
    console.log("Iniciando proceso con email:", credentials.email);
    
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const response = await authService.login(credentials);
      
      if (response && response.user) {
        console.log("✅ Login exitoso para:", response.user.email);
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
      } else {
        console.error("❌ Respuesta de login incompleta", response);
        throw new Error('Datos de usuario incompletos en la respuesta');
      }
    } catch (error) {
      console.error("❌ Error en login", error);
      setAuthError(error instanceof Error ? error.message : 'Error en el inicio de sesión');
      throw error;
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  // Implementación segura de logout para evitar ciclos
  const logout = async () => {
    // Evitar múltiples logouts simultáneos
    if (logoutInProgressRef.current) {
      console.log("🚪 useAuth: Logout ya en progreso, ignorando");
      return;
    }
    
    console.group('🚪 useAuth: Logout');
    logoutInProgressRef.current = true;
    
    setIsLoading(true);
    try {
      await authService.logout();
      console.log("✅ Logout exitoso");
      
      // Actualizar estado después del logout
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
    } catch (error) {
      console.error("❌ Error durante logout", error);
    } finally {
      setIsLoading(false);
      logoutInProgressRef.current = false;
      console.groupEnd();
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    initialCheckDone,
    authError,
    login,
    logout,
    hasRole,
    getDashboardPath,
    normalizeRole
  };
}