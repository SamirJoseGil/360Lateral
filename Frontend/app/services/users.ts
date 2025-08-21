import type { User, UserUpdate } from "~/types/users";

const API_BASE_URL = "/api/auth/users/";

export class UsersService {
  static async list(token: string): Promise<User[]> {
    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Error al cargar usuarios");
    const data = await response.json();
    // Mapear campos del backend a los tipos del frontend
    return (data.results || data).map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role === "developer" ? "desarrollador" : u.role === "owner" ? "propietario" : u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
      lastLogin: u.updated_at,
      phone: u.phone,
      company: u.company,
      isVerified: u.is_verified,
      fullName: u.full_name,
    }));
  }

  static async get(id: string, token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}${id}/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Error al obtener usuario");
    const u = await response.json();
    return {
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role === "developer" ? "desarrollador" : u.role === "owner" ? "propietario" : u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
      lastLogin: u.updated_at,
      phone: u.phone,
      company: u.company,
      isVerified: u.is_verified,
      fullName: u.full_name,
    };
  }

  static async update(id: string, updates: UserUpdate, token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Error al actualizar usuario");
    const u = await response.json();
    return {
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role === "developer" ? "desarrollador" : u.role === "owner" ? "propietario" : u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
      lastLogin: u.updated_at,
      phone: u.phone,
      company: u.company,
      isVerified: u.is_verified,
      fullName: u.full_name,
    };
  }

  static async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Error al eliminar usuario");
  }
}
