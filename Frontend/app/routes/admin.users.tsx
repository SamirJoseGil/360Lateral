import { useState, useEffect } from "react";
import { Navigate, Link } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";
import { UsersService } from "~/services/users";
import type { User, UserUpdate, UserRole } from "~/types/users";

export default function AdminUsers() {
  const { user, loading, hasRole, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string>("");

  // ✅ Verificar permisos de admin
  if (!loading && (!user || !hasRole("admin"))) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (token) loadUsers();
    // eslint-disable-next-line
  }, [token]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError("");
      const data = await UsersService.list(token!);
      setUsers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al cargar usuarios");
      setLoadingUsers(false); // Asegura que loading se detenga en error
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUser = async (id: string, updates: UserUpdate) => {
    try {
      setError("");
      await UsersService.update(id, updates, token!);
      await loadUsers();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al actualizar usuario"
      );
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      setError("");
      await UsersService.delete(id, token!);
      await loadUsers();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al eliminar usuario"
      );
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
        return "bg-purple-700 text-white";
      case "propietario":
        return "bg-green-700 text-white";
      case "desarrollador":
        return "bg-blue-700 text-white";
      default:
        return "bg-gray-600 text-white";
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
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra todos los usuarios de la plataforma
          </p>
        </div>
        <Link
          to="/admin"
          className="mt-4 md:mt-0 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          ← Volver al Panel Admin
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-700 focus:border-blue-700 sm:text-sm"
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
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-700 focus:border-blue-700 sm:text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="propietario">Propietarios</option>
              <option value="desarrollador">Desarrolladores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="text-red-400 mr-2">❌</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Último acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingUsers ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-4"></div>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {userItem.firstName} {userItem.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {userItem.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                          userItem.role
                        )}`}
                      >
                        {getRoleDisplay(userItem.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userItem.isActive
                          ? "bg-green-600 text-white"
                          : "bg-gray-400 text-white"
                          }`}
                      >
                        {userItem.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {userItem.lastLogin
                        ? new Date(userItem.lastLogin).toLocaleString()
                        : "Nunca"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-yellow-600 text-white text-xs font-semibold hover:bg-yellow-700 transition"
                        onClick={() =>
                          updateUser(userItem.id, {
                            role:
                              userItem.role === "admin"
                                ? "propietario"
                                : "admin",
                          })
                        }
                        title="Cambiar rol"
                      >
                        Cambiar Rol
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
                        onClick={() => deleteUser(userItem.id)}
                        title="Eliminar usuario"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}