import { useAuth } from "~/hooks/useAuth";
import { Navigate } from "@remix-run/react";
import { useState } from "react";

export default function LotsSearch() {
  const { user, loading, hasRole } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([
    {
      id: "1",
      direccion: "Calle 10 # 20-30, El Poblado",
      area: "200 m²",
      precio: "$250,000,000",
    },
    {
      id: "2",
      direccion: "Carrera 50 # 15-25, Laureles",
      area: "150 m²",
      precio: "$180,000,000",
    },
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando lotes...</p>
        </div>
      </div>
    );
  }

  if (!hasRole("desarrollador")) {
    return <Navigate to="/" replace />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrar con backend
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Buscar Lotes</h1>
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Dirección, barrio, matrícula..."
          className="border border-gray-300 rounded-md px-3 py-2 w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
        >
          Buscar
        </button>
      </form>
      <div className="grid gap-6">
        {results.map((lote) => (
          <div
            key={lote.id}
            className="bg-white rounded-lg shadow p-6 flex justify-between items-center"
          >
            <div>
              <div className="font-medium text-blue-700">{lote.direccion}</div>
              <div className="text-sm text-gray-600">Área: {lote.area}</div>
              <div className="text-sm text-gray-600">Precio: {lote.precio}</div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              Agregar a Favoritos
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
