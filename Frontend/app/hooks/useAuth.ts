import { useState, useEffect, useCallback } from 'react';
import type { User, LoginData, RegisterData } from '../types';
import type { AuthState } from '../types/authFixed';
import { AuthService } from '../services';
import { normalizeUser } from '../types/users';

/**
 * Hook para manejar la autenticación del usuario
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      if (AuthService.isAuthenticated()) {
        const apiUser = await AuthService.getCurrentUser();
        const user = normalizeUser(apiUser);
        
        // Guardar usuario en localStorage
        localStorage.setItem('lateral360_user_data', JSON.stringify(user));
        
        setAuthState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }));
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Error de autenticación',
      }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await AuthService.login(credentials);
      const user = normalizeUser(response.user);
      
      // Guardar usuario en localStorage
      localStorage.setItem('lateral360_user_data', JSON.stringify(user));
      
      setAuthState(prev => ({
        ...prev,
        user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));

      return { success: true, user };
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.status_code === 429 
        ? error.message
        : error.field_errors 
        ? Object.values(error.field_errors).flat().join(', ')
        : error.message || 'Error de inicio de sesión';

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await AuthService.register(userData);
      const user = normalizeUser(response.user);
      
      // Guardar usuario en localStorage
      localStorage.setItem('lateral360_user_data', JSON.stringify(user));
      
      setAuthState(prev => ({
        ...prev,
        user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));

      return { success: true, user };
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorMessage = error.status_code === 429 
        ? error.message
        : error.field_errors 
        ? Object.values(error.field_errors).flat().join(', ')
        : error.message || 'Error de registro';

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Limpiar estado local siempre
      localStorage.removeItem('lateral360_user_data');
      setAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshUser = useCallback(async () => {
    if (authState.isAuthenticated) {
      try {
        const apiUser = await AuthService.getCurrentUser();
        const user = normalizeUser(apiUser);
        
        localStorage.setItem('lateral360_user_data', JSON.stringify(user));
        setAuthState(prev => ({ ...prev, user }));
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  }, [authState.isAuthenticated]);

  return {
    ...authState,
    login,
    register,
    logout,
    clearError,
    refreshUser,
    checkAuthStatus,
  };
}