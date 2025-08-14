import { useState } from "react";
import { Link, useNavigate } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";
import type { LoginCredentials } from "~/types/auth";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ Todos los hooks antes de cualquier return
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string>("");

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirigir si ya esta autenticado a su respectivo dashboard
  if (user) {
    const dashboardPath = getDashboardPath(user.role);
    navigate(dashboardPath, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");

    try {
      console.log("🔐 Intentando login con:", credentials.email);
      await login(credentials);
      navigate("/", { replace: true }); // ✅ ir a home, navbar cambia por rol
    } catch (error) {
      console.error("❌ Error en handleSubmit:", error);
      setError(
        error instanceof Error ? error.message : "Error al iniciar sesión"
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <span className="text-3xl font-bold text-gray-900">Lateral 360°</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="text-red-400 mr-2">⚠</div>
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  placeholder="admin@lateral360.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>
          </form>

          {/* Mock Users Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Usuarios de prueba:
            </h3>
            <div className="text-xs text-blue-600 space-y-1">
              <p>
                <strong>Administrador:</strong> admin@lateral360.com - admin123
              </p>
              <p>
                <strong>Dueño de Lote:</strong> propietario@lateral360.com -
                propietario123
              </p>
              <p>
                <strong>Desarrollador:</strong> desarrollador@lateral360.com -
                desarrollador123
              </p>
              <p className="text-blue-500 mt-2 italic">
                Autenticación real conectada al backend
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "propietario":
      return "/dashboard/owner";
    case "desarrollador":
      return "/dashboard/developer";
    default:
      return "/login";
  }
}
