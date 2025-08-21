import type {
  User,
  UserListResponse,
  UpdateUserData,
  UserRole,
} from '../types';
import { apiClient } from './api';
import { PermissionValidator, ValidationUtils } from '../utils';

/**
 * Servicio de gestión de usuarios basado en la documentación de la API
 */
export class UserService {
  /**
   * Listar usuarios con filtrado automático por rol
   * GET /api/users/
   * 
   * - Admin: Ve todos los usuarios
   * - Usuario normal: Solo ve su propio perfil
   */
  static async getUsers(params?: { page?: number; limit?: number }): Promise<UserListResponse> {
    try {
      const queryParams: Record<string, string> = {};
      
      if (params?.page) {
        queryParams.page = params.page.toString();
      }
      
      if (params?.limit) {
        queryParams.limit = params.limit.toString();
      }

      const response = await apiClient.get<UserListResponse>('/api/users/', { params: queryParams });
      return response;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de un usuario específico
   * GET /api/users/{id}/
   * 
   * Seguridad:
   * - Solo admin o el mismo usuario pueden acceder
   * - Campos limitados según permisos
   */
  static async getUser(userId: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/api/users/${userId}/`);
      return response;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   * PUT /api/users/{id}/
   * 
   * Seguridad:
   * - Solo admin o el mismo usuario pueden modificar
   * - Campos restringidos para usuarios no admin
   */
  static async updateUser(userId: number, data: UpdateUserData, currentUserRole?: UserRole): Promise<User> {
    // Validar y filtrar campos según permisos
    const filteredData = this.filterUpdateFields(data, currentUserRole);
    
    // Validaciones del lado del cliente
    this.validateUpdateData(filteredData);

    try {
      const response = await apiClient.put<User>(`/api/users/${userId}/`, filteredData);
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario (solo admin)
   * DELETE /api/users/{id}/
   * 
   * Seguridad:
   * - Solo administradores pueden eliminar usuarios
   * - No puede eliminarse a sí mismo
   */
  static async deleteUser(userId: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/api/users/${userId}/`);
      return response;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Verificar permisos del usuario actual para una acción específica
   */
  static async checkPermissions(action: 'view' | 'edit' | 'delete', targetUserId: number): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUserFromStorage();
      if (!currentUser) return false;

      switch (action) {
        case 'view':
          return PermissionValidator.canViewAllUsers(currentUser.role) || currentUser.id === targetUserId;
        
        case 'edit':
          return PermissionValidator.canEditUser(currentUser.role, targetUserId, currentUser.id);
        
        case 'delete':
          return PermissionValidator.canDeleteUsers(currentUser.role) && currentUser.id !== targetUserId;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Check permissions error:', error);
      return false;
    }
  }

  /**
   * Obtener lista de usuarios que el usuario actual puede ver
   * (Helper para componentes de UI)
   */
  static async getAccessibleUsers(): Promise<User[]> {
    try {
      const response = await this.getUsers();
      return response.results;
    } catch (error) {
      console.error('Get accessible users error:', error);
      return [];
    }
  }

  /**
   * Buscar usuarios por término (si es admin)
   */
  static async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      const response = await apiClient.get<UserListResponse>('/api/users/', {
        params: { search: searchTerm }
      });
      return response.results;
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de usuarios (solo admin)
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    by_role: Record<UserRole, number>;
  }> {
    try {
      const response = await this.getUsers();
      const users = response.results;

      const stats = {
        total: response.count,
        active: users.filter(user => user.is_active).length,
        by_role: {
          admin: users.filter(user => user.role === 'admin').length,
          owner: users.filter(user => user.role === 'owner').length,
          developer: users.filter(user => user.role === 'developer').length,
        } as Record<UserRole, number>
      };

      return stats;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Filtrar campos de actualización según permisos del usuario
   */
  private static filterUpdateFields(data: UpdateUserData, userRole?: UserRole): UpdateUserData {
    const filtered: UpdateUserData = {};

    // Campos que todos los usuarios pueden actualizar
    if (data.first_name !== undefined) filtered.first_name = data.first_name;
    if (data.last_name !== undefined) filtered.last_name = data.last_name;
    if (data.phone !== undefined) filtered.phone = data.phone;
    if (data.company !== undefined) filtered.company = data.company;

    // Campos restringidos solo para admin
    if (userRole && PermissionValidator.canChangeRoles(userRole)) {
      if (data.role !== undefined) filtered.role = data.role;
      if (data.is_staff !== undefined) filtered.is_staff = data.is_staff;
      if (data.is_superuser !== undefined) filtered.is_superuser = data.is_superuser;
      if (data.is_active !== undefined) filtered.is_active = data.is_active;
    }

    return filtered;
  }

  /**
   * Validar datos de actualización
   */
  private static validateUpdateData(data: UpdateUserData): void {
    const errors: Record<string, string[]> = {};

    // Validar nombres si se proporcionan
    if (data.first_name !== undefined && !data.first_name.trim()) {
      errors.first_name = ['Nombre no puede estar vacío'];
    }

    if (data.last_name !== undefined && !data.last_name.trim()) {
      errors.last_name = ['Apellido no puede estar vacío'];
    }

    // Validar teléfono si se proporciona
    if (data.phone !== undefined && data.phone.trim() && !ValidationUtils.isValidPhone(data.phone)) {
      errors.phone = ['Formato de teléfono inválido'];
    }

    // Validar rol si se proporciona
    if (data.role !== undefined && !['admin', 'owner', 'developer'].includes(data.role)) {
      errors.role = ['Rol inválido'];
    }

    if (Object.keys(errors).length > 0) {
      throw {
        error: 'Validation failed',
        message: 'Datos de actualización inválidos',
        status_code: 400,
        field_errors: errors,
      };
    }
  }

  /**
   * Obtener usuario actual desde el almacenamiento local
   * (Helper para verificaciones de permisos)
   */
  private static async getCurrentUserFromStorage(): Promise<User | null> {
    try {
      // Intentar obtener del localStorage primero (más rápido)
      const storedUser = localStorage.getItem('lateral360_user_data');
      if (storedUser) {
        return JSON.parse(storedUser);
      }

      // Si no está en localStorage, obtener de la API
      const { AuthService } = require('./auth');
      const user = await AuthService.getCurrentUser();
      
      // Guardar en localStorage para futuras consultas
      localStorage.setItem('lateral360_user_data', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Get current user from storage error:', error);
      return null;
    }
  }
}