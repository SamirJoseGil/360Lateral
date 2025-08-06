import { Link } from "@remix-run/react";
import { useState } from "react";
import Navbar from "~/components/Navbar";

export default function Ingresar() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "desarrollador",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login - in real app this would validate credentials
    window.location.href = "/dashboard";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-6">
      {/* Header with Navbar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="bg-white/10 backdrop-blur-sm">
          <Navbar currentPath="/ingresar" />
        </div>
      </div>

      {/* Card Container */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex mt-20">
        {/* Left side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Modern architecture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-gray-600">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Correo electrónico"
                required
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Contraseña"
                required
              />
            </div>

            {/* Role selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecciona tu rol:
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="desarrollador"
                  name="role"
                  value="desarrollador"
                  checked={formData.role === "desarrollador"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="desarrollador"
                  className="text-sm font-medium text-gray-700"
                >
                  Desarrollador
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="administrador"
                  name="role"
                  value="administrador"
                  checked={formData.role === "administrador"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="administrador"
                  className="text-sm font-medium text-gray-700"
                >
                  Administrador
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="dueno"
                  name="role"
                  value="dueno"
                  checked={formData.role === "dueno"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="dueno"
                  className="text-sm font-medium text-gray-700"
                >
                  Dueño de lote
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-900 transition-colors font-medium shadow-md"
            >
              Ingresar
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/registrarse"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ¿No tienes cuenta? Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}