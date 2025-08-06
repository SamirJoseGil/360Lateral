import { Link } from "@remix-run/react";
import { useState } from "react";
import Navbar from "~/components/Navbar";

export default function Registrarse() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "desarrollador",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate registration - in real app this would create account
    alert("Cuenta registrada exitosamente");
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
          <Navbar currentPath="/registrarse" />
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Nombre completo"
                required
              />
            </div>

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
                minLength={6}
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
                  id="desarrollador-reg"
                  name="role"
                  value="desarrollador"
                  checked={formData.role === "desarrollador"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="desarrollador-reg"
                  className="text-sm font-medium text-gray-700"
                >
                  Desarrollador
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="administrador-reg"
                  name="role"
                  value="administrador"
                  checked={formData.role === "administrador"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="administrador-reg"
                  className="text-sm font-medium text-gray-700"
                >
                  Administrador
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="dueno-reg"
                  name="role"
                  value="dueno"
                  checked={formData.role === "dueno"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="dueno-reg"
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
              Registrarme
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ¿Ya tienes cuenta? Ingresa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
