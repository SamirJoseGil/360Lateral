import { useState, useEffect } from "react";
import { Link, Navigate } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";

interface Lote {
  id: string;
  matricula: string;
  direccion: string;
  area_terreno: number;
  precio_esperado: number;
  tipo_uso: string;
  estado: string;
  fecha_registro: string;
  ofertas_count?: number;
  cbml?: string;
  barrio?: string;
}

export default function MyLots() {
  const { user, loading, hasRole } = useAuth();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<string>("todos");

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

  useEffect(() => {
    loadLotes();
  }, []);

  const loadLotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/lotes/my/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los lotes");
      }

      const data = await response.json();
      setLotes(data.results || data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al cargar los lotes"
      );
      // Mock data para desarrollo
      setLotes([
        {
          id: "1",
          matricula: "001-123456",
          direccion: "Calle 10 # 20-30, El Poblado",
          area_terreno: 200,
          precio_esperado: 250000000,
          tipo_uso: "residencial",
          estado: "disponible",
          fecha_registro: "2024-01-15",
          ofertas_count: 3,
          barrio: "El Poblado",
          cbml: "14180230004",
        },
        {
          id: "2",
          matricula: "001-789012",
          direccion: "Carrera 50 # 15-25, Laureles",
          area_terreno: 150,
          precio_esperado: 180000000,
          tipo_uso: "residencial",
          estado: "en_negociacion",
          fecha_registro: "2024-02-10",
          ofertas_count: 1,
          barrio: "Laureles",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLotes = lotes.filter((lote) => {
    if (filter === "todos") return true;
    return lote.estado === filter;
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      disponible: "bg-green-100 text-green-800",
      en_negociacion: "bg-yellow-100 text-yellow-800",
      reservado: "bg-blue-100 text-blue-800",
      vendido: "bg-gray-100 text-gray-800",
    };
    return badges[estado as keyof typeof badges] || "bg-gray-100 text-gray-800";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mis lotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Lotes</h1>
            <p className="text-gray-600 mt-2">
              Gestiona todos tus lotes registrados
            </p>
          </div>
          <Link
            to="/lot/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            + Registrar Lote
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter("todos")}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === "todos"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos ({lotes.length})
            </button>
            <button
              onClick={() => setFilter("disponible")}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === "disponible"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Disponibles (
              {lotes.filter((l) => l.estado === "disponible").length})
            </button>
            <button
              onClick={() => setFilter("en_negociacion")}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === "en_negociacion"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              En Negociación (
              {lotes.filter((l) => l.estado === "en_negociacion").length})
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="text-yellow-400 mr-2">⚠</div>
            <div className="text-sm text-yellow-700">
              {error} (Mostrando datos de ejemplo)
            </div>
          </div>
        </div>
      )}

      {/* Lotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLotes.map((lote) => (
          <div
            key={lote.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {lote.direccion}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Matrícula: {lote.matricula}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(
                    lote.estado
                  )}`}
                >
                  {lote.estado.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Área:</span>
                  <span className="text-sm font-medium">
                    {lote.area_terreno} m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Precio:</span>
                  <span className="text-sm font-medium">
                    {formatPrice(lote.precio_esperado)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <span className="text-sm font-medium capitalize">
                    {lote.tipo_uso}
                  </span>
                </div>
                {lote.ofertas_count !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ofertas:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {lote.ofertas_count}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/lot/${lote.id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Ver Detalles
                </Link>
                <Link
                  to={`/lot/${lote.id}/edit`}
                  className="flex-1 bg-gray-100 text-gray-700 text-center py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  Editar
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLotes.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H5a2 2 0 01-2-2m0 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10M7 11h4m0 4h10m-10-4V9a2 2 0 011-1h4a2 2 0 011 1v2a2 2 0 01-1 1"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === "todos"
              ? "No tienes lotes registrados"
              : `No tienes lotes ${filter.replace("_", " ")}`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === "todos"
              ? "Comienza registrando tu primer lote en la plataforma"
              : "Cambia el filtro para ver otros lotes"}
          </p>
          {filter === "todos" && (
            <Link
              to="/lot/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Registrar Mi Primer Lote
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
