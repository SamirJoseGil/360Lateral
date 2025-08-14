import { useState, useEffect } from "react";
import { Navigate, Link } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "propietario" | "desarrollador";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsers() {
  const { user, loading, hasRole, token } = useAuth(); // ✅ Añadido token para autenticación
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Verificar permisos de admin
  if (!loading && (!user || !hasRole("admin"))) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/users/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Autenticación con token
        },
      });
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Autenticación con token
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error("Error al actualizar usuario");
      }
      loadUsers(); // Recargar usuarios después de actualizar
    } catch (error) {
      console.error("Error actualizando usuario:", error);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    const matchesSearch =
      searchTerm === "" ||
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRole && matchesSearch;
  });

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "propietario":
        return "Propietario";
      case "desarrollador":
        return "Desarrollador";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "propietario":
        return "bg-green-100 text-green-800";
      case "desarrollador":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra todos los usuarios de la plataforma
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700"
            >
              Buscar usuarios
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar por nombre o email..."
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Filtrar por rol
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="propietario">Propietarios</option>
              <option value="desarrollador">Desarrolladores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loadingUsers ? (
            <li className="px-4 py-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando usuarios...</p>
            </li>
          ) : filteredUsers.length === 0 ? (
            <li className="px-4 py-4 text-center">
              <p className="text-sm text-gray-500">
                No se encontraron usuarios
              </p>
            </li>
          ) : (
            filteredUsers.map((userItem) => (
              <li key={userItem.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {userItem.firstName} {userItem.lastName}
                        </div>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            userItem.role
                          )}`}
                        >
                          {getRoleDisplay(userItem.role)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {userItem.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      onClick={
                        () => updateUser(userItem.id, { role: "admin" }) // Ejemplo: Cambiar rol
                      }
                    >
                      Cambiar a Admin
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
