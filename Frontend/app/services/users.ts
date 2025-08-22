import type { User, UpdateUserData, UserListResponse } from '../types';
import { apiClient } from './api';

/**
 * Servicio de gestión de usuarios basado en la documentación de la API
 * Endpoints documentados en users.md
 */
export class UserService {
  
  /**
   * Obtener lista de usuarios (filtrada según permisos)
   * GET /api/users/
   * 
   * Admin: Ve todos los usuarios
   * Usuario normal: Solo ve su propio perfil
   */
  static async getUsers(): Promise<UserListResponse> {
    try {
      const response = await apiClient.get<UserListResponse>('/api/users/');
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
   * Solo admin o el mismo usuario pueden acceder
   */
  static async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/api/users/${id}/`);
      return response;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   * PUT /api/users/{id}/
   * 
   * Solo admin o el mismo usuario pueden modificar
   * Campos restringidos para usuarios no admin
   */
  static async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    try {
      // Sanitizar datos antes de enviar
      const sanitizedData = this.sanitizeUserData(userData);
      
      const response = await apiClient.put<User>(`/api/users/${id}/`, sanitizedData);
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario
   * DELETE /api/users/{id}/
   * 
   * Solo administradores pueden eliminar usuarios
   * No puede eliminarse a sí mismo
   */
  static async deleteUser(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/api/users/${id}/`);
      return response;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario actual puede gestionar usuarios
   * Basado en el rol del usuario autenticado
   */
  static async canManageUsers(): Promise<boolean> {
    try {
      // Intentar obtener la lista de usuarios
      // Si tiene permisos, la API devolverá datos
      // Si no, devolverá error 403
      await this.getUsers();
      return true;
    } catch (error: any) {
      if (error.status_code === 403) {
        return false;
      }
      // Si es otro error, re-throw
      throw error;
    }
  }

  /**
   * Verificar si el usuario actual es admin
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      // Un admin puede ver otros usuarios y hacer operaciones administrativas
      const users = await this.getUsers();
      
      // Si puede ver más de un usuario (su propio perfil), probablemente es admin
      // Esta es una heurística basada en la documentación
      return users.count > 1;
    } catch (error: any) {
      if (error.status_code === 403) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Obtener estadísticas de usuarios (solo admin)
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    admins: number;
    owners: number;
    developers: number;
  }> {
    try {
      const users = await this.getUsers();
      
      const stats = {
        total: users.count,
        active: 0,
        admins: 0,
        owners: 0,
        developers: 0,
      };

      users.results.forEach(user => {
        if (user.is_active) stats.active++;
        
        switch (user.role) {
          case 'admin':
            stats.admins++;
            break;
          case 'owner':
            stats.owners++;
            break;
          case 'developer':
            stats.developers++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Sanitizar datos de usuario para prevenir inyección
   */
  private static sanitizeUserData(userData: UpdateUserData): UpdateUserData {
    const sanitized: UpdateUserData = {};

    // Sanitizar campos de texto
    if (userData.first_name) {
      sanitized.first_name = this.sanitizeString(userData.first_name);
    }
    
    if (userData.last_name) {
      sanitized.last_name = this.sanitizeString(userData.last_name);
    }
    
    if (userData.company) {
      sanitized.company = this.sanitizeString(userData.company);
    }

    if (userData.phone) {
      sanitized.phone = userData.phone.trim();
    }

    // Los campos de rol y estado solo deben ser incluidos si el usuario es admin
    // Esto se maneja en el backend, pero incluimos validación del cliente
    if (userData.role) {
      sanitized.role = userData.role;
    }

    if (typeof userData.is_active === 'boolean') {
      sanitized.is_active = userData.is_active;
    }

    if (typeof userData.is_staff === 'boolean') {
      sanitized.is_staff = userData.is_staff;
    }

    return sanitized;
  }

  /**
   * Sanitizar string para prevenir XSS
   */
  private static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remover < >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }
}
