import { useState, useEffect, useCallback } from 'react';
import { authService } from '~/services/authNew';
import type { ApiUser } from '~/services/authNew';

interface UseAuthReturn {
  user: ApiUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Hook personalizado para manejo de autenticación
 * Compatible con los nuevos servicios configurados
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación y cargar usuario al iniciar
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getProfile();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // Si hay error, limpiar el estado
      setUser(null);
      setIsAuthenticated(false);
      // Intentar limpiar tokens inválidos
      await authService.logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Función de login
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authService.login({ email, password });
        setUser(response.user);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        throw error;
      }
    },
    []
  );

  // Función de logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Función para refrescar datos del usuario
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Si falla, posiblemente el token expiró
      await logout();
    }
  }, [isAuthenticated, logout]);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Configurar un intervalo para verificar tokens (opcional)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Verificar token cada 5 minutos
    const interval = setInterval(() => {
      if (!authService.isAuthenticated()) {
        logout();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };
}