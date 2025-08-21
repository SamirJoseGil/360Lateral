export type UserRole = "admin" | "propietario" | "desarrollador";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: UserRole;
  phone?: string;
  company?: string;
  isVerified?: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  phone?: string;
  company?: string;
}
