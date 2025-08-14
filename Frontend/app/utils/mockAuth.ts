import type { User, AuthResponse } from '~/types/auth';

// Mock users for development
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@lateral360.com',
    firstName: 'Admin',
    lastName: 'Sistema',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'propietario@lateral360.com',
    firstName: 'María',
    lastName: 'González',
    role: 'propietario',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    email: 'desarrollador@lateral360.com',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    role: 'desarrollador',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export function createMockAuthResponse(user: User): AuthResponse {
  return {
    user,
    token: `mock-token-${user.id}`,
    refreshToken: `mock-refresh-${user.id}`
  };
}
