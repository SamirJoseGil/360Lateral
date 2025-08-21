import { useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import type { UserUpdate } from '../types/users';
import { UserService } from '../services';
import { normalizeUser } from '../types/users';

export interface UseUserReturn {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchUser: (id: number) => Promise<User | null>;
  updateUser: (id: number, data: UserUpdate) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  canViewAllUsers: boolean;
  canEditUser: (userId: number) => boolean;
  canDeleteUser: (userId: number) => boolean;
  clearError: () => void;
}

/**
 * Hook para manejar operaciones de usuarios
 */
export function useUser(currentUserRole?: UserRole, currentUserId?: number): UseUserReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario actual del localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('lateral360_user_data');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await UserService.getUsers();
      const normalizedUsers = response.results.map(user => normalizeUser(user));
      setUsers(normalizedUsers);
    } catch (error: any) {
      console.error('Fetch users error:', error);
      setError(error.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async (id: number): Promise<User | null> => {
    try {
      const apiUser = await UserService.getUser(id);
      const user = normalizeUser(apiUser);
      
      // Actualizar en la lista si existe
      setUsers(prev => prev.map(u => u.id === id ? user : u));
      
      return user;
    } catch (error: any) {
      console.error('Fetch user error:', error);
      setError(error.message || `Error al cargar usuario ${id}`);
      return null;
    }
  }, []);

  const updateUser = useCallback(async (id: number, data: UserUpdate): Promise<boolean> => {
    try {
      // Convertir aliases a formato API
      const apiData: any = {};
      
      if (data.firstName) apiData.first_name = data.firstName;
      if (data.lastName) apiData.last_name = data.lastName;
      if (data.first_name) apiData.first_name = data.first_name;
      if (data.last_name) apiData.last_name = data.last_name;
      if (data.phone) apiData.phone = data.phone;
      if (data.company) apiData.company = data.company;
      if (data.role) apiData.role = data.role;
      if (data.isActive !== undefined) apiData.is_active = data.isActive;
      if (data.is_active !== undefined) apiData.is_active = data.is_active;

      const apiUser = await UserService.updateUser(id, apiData, currentUserRole);
      const updatedUser = normalizeUser(apiUser);
      
      // Actualizar en la lista
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      
      // Actualizar usuario actual si es el mismo
      if (currentUser && currentUser.id === id) {
        setCurrentUser(updatedUser);
        localStorage.setItem('lateral360_user_data', JSON.stringify(updatedUser));
      }

      return true;
    } catch (error: any) {
      console.error('Update user error:', error);
      setError(error.message || `Error al actualizar usuario ${id}`);
      return false;
    }
  }, [currentUserRole, currentUser]);

  const deleteUser = useCallback(async (id: number): Promise<boolean> => {
    try {
      await UserService.deleteUser(id);
      
      // Remover de la lista
      setUsers(prev => prev.filter(u => u.id !== id));
      
      return true;
    } catch (error: any) {
      console.error('Delete user error:', error);
      setError(error.message || `Error al eliminar usuario ${id}`);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verificaciones de permisos basadas en rol
  const canViewAllUsers = currentUserRole === 'admin';
  
  const canEditUser = useCallback((userId: number): boolean => {
    if (!currentUserRole || !currentUserId) return false;
    
    // Admin puede editar cualquier usuario
    if (currentUserRole === 'admin') return true;
    
    // Usuario normal solo puede editarse a sí mismo
    return userId === currentUserId;
  }, [currentUserRole, currentUserId]);

  const canDeleteUser = useCallback((userId: number): boolean => {
    if (!currentUserRole || !currentUserId) return false;
    
    // Solo admin puede eliminar usuarios y no puede eliminarse a sí mismo
    return currentUserRole === 'admin' && userId !== currentUserId;
  }, [currentUserRole, currentUserId]);

  return {
    users,
    currentUser,
    isLoading,
    error,
    fetchUsers,
    fetchUser,
    updateUser,
    deleteUser,
    canViewAllUsers,
    canEditUser,
    canDeleteUser,
    clearError,
  };
}