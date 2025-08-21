import { Link, useLocation } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";
import type { UserRole } from "~/types/auth";
import { getNavItemsByRole } from "~/utils/navPermissions";

export function Navbar() {
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const effectiveRole = user?.role ?? null;
  const navItems = effectiveRole ? getNavItemsByRole(effectiveRole) : [];

  // Navbar pública si no hay rol
  if (loading) {
    return (
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <span className="text-xl font-bold text-gray-900">Lateral 360°</span>
            <div className="text-gray-500">Cargando...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (!effectiveRole) {
    return (
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Lateral 360°
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link to="auth/login" className="text-gray-600 hover:text-gray-900">
                Iniciar Sesión
              </Link>
              <Link
                to="auth/register"
                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            to={`/dashboard/${effectiveRole === "admin"
              ? "admin"
              : effectiveRole === "propietario"
                ? "owner"
                : "developer"
              }`}
            className="text-xl font-bold text-gray-900"
          >
            Lateral 360°
          </Link>

          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname === item.href
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {user ? (
            <UserMenu
              user={user}
              logout={logout}
            />
          ) : (
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="text-white bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1.5 rounded-md"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${location.pathname === item.href
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function UserMenu({
  user,
  logout,
}: {
  user: any;
  logout: () => Promise<void>;
}) {
  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "propietario":
        return "Dueño de Lote";
      case "desarrollador":
        return "Desarrollador";
      default:
        return role;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // La redirección se manejará en useAuth
    } catch (error) {
      console.error("Error en logout:", error);
    }
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
          {user.firstName?.charAt(0) || "U"}
        </div>
        <div className="hidden md:block text-left">
          <div className="font-medium">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs text-gray-500">
            {getRoleDisplay(user.role)}
          </div>
        </div>
        <span className="text-gray-400">▼</span>
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Mi Perfil
          </Link>
          <Link
            to="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Configuración
          </Link>
          <hr className="my-1" />
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}