import { useAuth } from "~/hooks/useAuth";
import { Navigate } from "@remix-run/react";
import { useState } from "react";

export default function SearchCriteria() {
  const { user, loading, hasRole } = useAuth();
  const [criteria, setCriteria] = useState({
    ubicacion: "El Poblado, Laureles",
    areaMin: "150 m²",
    areaMax: "500 m²",
    presupuesto: "$100M - $300M",
    tratamiento: "Consolidación",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando criterios...</p>
        </div>
      </div>
    );
  }

  if (!hasRole("desarrollador")) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCriteria({ ...criteria, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Guardar criterios en backend
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Criterios de Búsqueda
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ubicación
          </label>
          <input
            type="text"
            name="ubicacion"
            value={criteria.ubicacion}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Área mínima
            </label>
            <input
              type="text"
              name="areaMin"
              value={criteria.areaMin}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Área máxima
            </label>
            <input
              type="text"
              name="areaMax"
              value={criteria.areaMax}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Presupuesto
          </label>
          <input
            type="text"
            name="presupuesto"
            value={criteria.presupuesto}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tratamiento
          </label>
          <input
            type="text"
            name="tratamiento"
            value={criteria.tratamiento}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
          >
            Guardar Criterios
          </button>
        </div>
      </form>
    </div>
  );
}
