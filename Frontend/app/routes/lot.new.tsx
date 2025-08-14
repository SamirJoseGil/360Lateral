import { useState } from "react";
import { Link, useNavigate, Navigate } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

interface LoteFormData {
  matricula: string;
  direccion: string;
  area_terreno: number;
  precio_esperado: number;
  descripcion: string;
  tipo_uso: string;
  estado: string;
  cbml?: string;
  barrio?: string;
  comuna?: string;
}

export default function NewLot() {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoteFormData>({
    matricula: "",
    direccion: "",
    area_terreno: 0,
    precio_esperado: 0,
    descripcion: "",
    tipo_uso: "residencial",
    estado: "disponible",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

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

  if (!hasRole("propietario")) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/lotes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar el lote");
      }

      const result = await response.json();
      navigate("/lots/my", {
        state: { message: "Lote registrado exitosamente" },
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al registrar el lote"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            to="/dashboard/owner"
            className="text-blue-600 hover:text-blue-700"
          >
            ← Volver al Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Registrar Nuevo Lote
        </h1>
        <p className="text-gray-600 mt-2">
          Agrega un nuevo lote a la plataforma
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="text-red-400 mr-2">⚠</div>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matrícula Inmobiliaria *
                </label>
                <input
                  type="text"
                  name="matricula"
                  required
                  value={formData.matricula}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Ej: 001-123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CBML (Opcional)
                </label>
                <input
                  type="text"
                  name="cbml"
                  value={formData.cbml || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Ej: 14180230004"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  required
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Ej: Calle 10 # 20-30, El Poblado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barrio
                </label>
                <input
                  type="text"
                  name="barrio"
                  value={formData.barrio || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Ej: El Poblado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comuna
                </label>
                <input
                  type="text"
                  name="comuna"
                  value={formData.comuna || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Ej: Comuna 14"
                />
              </div>
            </div>
          </div>

          {/* Características */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Características del Lote
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área del Terreno (m²) *
                </label>
                <input
                  type="number"
                  name="area_terreno"
                  required
                  min="1"
                  value={formData.area_terreno}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Ej: 200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Esperado (COP) *
                </label>
                <input
                  type="number"
                  name="precio_esperado"
                  required
                  min="0"
                  value={formData.precio_esperado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Ej: 250000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Uso *
                </label>
                <select
                  name="tipo_uso"
                  required
                  value={formData.tipo_uso}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="residencial">Residencial</option>
                  <option value="comercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  name="estado"
                  required
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="disponible">Disponible</option>
                  <option value="en_negociacion">En Negociación</option>
                  <option value="reservado">Reservado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={4}
              value={formData.descripcion}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Describe las características especiales del lote..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              to="/dashboard/owner"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </div>
              ) : (
                "Registrar Lote"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
