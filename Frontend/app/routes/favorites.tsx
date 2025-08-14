import { useAuth } from "~/hooks/useAuth";
import { Navigate } from "@remix-run/react";

export default function Favorites() {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  if (!hasRole("desarrollador")) {
    return <Navigate to="/" replace />;
  }

  // Mock favoritos
  const favoritos = [
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
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Mis Favoritos</h1>
      {favoritos.length === 0 ? (
        <div className="text-gray-500">No tienes lotes favoritos aún.</div>
      ) : (
        <div className="grid gap-6">
          {favoritos.map((lote) => (
            <div
              key={lote.id}
              className="bg-white rounded-lg shadow p-6 flex justify-between items-center"
            >
              <div>
                <div className="font-medium text-blue-700">
                  {lote.direccion}
                </div>
                <div className="text-sm text-gray-600">Área: {lote.area}</div>
                <div className="text-sm text-gray-600">
                  Precio: {lote.precio}
                </div>
              </div>
              <button className="text-red-600 hover:text-red-800 text-sm">
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
