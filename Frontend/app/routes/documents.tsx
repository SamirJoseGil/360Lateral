import { useState, useEffect } from "react";
import { Link, Navigate } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";

interface Document {
  id: string;
  nombre: string;
  tipo: string;
  lote_id: string;
  lote_direccion: string;
  archivo_url: string;
  fecha_subida: string;
  tamaño: number;
  estado: "pendiente" | "aprobado" | "rechazado";
}

export default function Documents() {
  const { user, loading, hasRole } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedLote, setSelectedLote] = useState<string>("todos");
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/documents/my/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar los documentos");
      }

      const data = await response.json();
      setDocuments(data.results || data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar los documentos"
      );
      // Mock data para desarrollo
      setDocuments([
        {
          id: "1",
          nombre: "Escritura Pública",
          tipo: "escritura",
          lote_id: "1",
          lote_direccion: "Calle 10 # 20-30, El Poblado",
          archivo_url: "/documents/escritura_1.pdf",
          fecha_subida: "2024-01-15",
          tamaño: 2048000,
          estado: "aprobado",
        },
        {
          id: "2",
          nombre: "Certificado de Tradición",
          tipo: "certificado_tradicion",
          lote_id: "1",
          lote_direccion: "Calle 10 # 20-30, El Poblado",
          archivo_url: "/documents/tradicion_1.pdf",
          fecha_subida: "2024-01-16",
          tamaño: 1024000,
          estado: "pendiente",
        },
        {
          id: "3",
          nombre: "Avalúo Comercial",
          tipo: "avaluo",
          lote_id: "2",
          lote_direccion: "Carrera 50 # 15-25, Laureles",
          archivo_url: "/documents/avaluo_2.pdf",
          fecha_subida: "2024-02-10",
          tamaño: 3072000,
          estado: "aprobado",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/documents/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir el documento");
      }

      await loadDocuments();
      setUploadModal(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error al subir el documento"
      );
    } finally {
      setUploading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: "bg-yellow-100 text-yellow-800",
      aprobado: "bg-green-100 text-green-800",
      rechazado: "bg-red-100 text-red-800",
    };
    return badges[estado as keyof typeof badges] || "bg-gray-100 text-gray-800";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedLote === "todos") return true;
    return doc.lote_id === selectedLote;
  });

  const uniqueLotes = Array.from(new Set(documents.map((d) => d.lote_id)))
    .map((id) => documents.find((d) => d.lote_id === id))
    .filter(Boolean) as Document[];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documentos...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Mis Documentos</h1>
            <p className="text-gray-600 mt-2">
              Gestiona los documentos de tus lotes
            </p>
          </div>
          <button
            onClick={() => setUploadModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            + Subir Documento
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setSelectedLote("todos")}
              className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                selectedLote === "todos"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos los Lotes ({documents.length})
            </button>
            {uniqueLotes.map((lote) => (
              <button
                key={lote.lote_id}
                onClick={() => setSelectedLote(lote.lote_id)}
                className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                  selectedLote === lote.lote_id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {lote.lote_direccion} (
                {documents.filter((d) => d.lote_id === lote.lote_id).length})
              </button>
            ))}
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

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.nombre}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {doc.lote_direccion}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {doc.tipo.replace("_", " ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(
                        doc.estado
                      )}`}
                    >
                      {doc.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(doc.tamaño)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(doc.fecha_subida).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <a
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Ver
                      </a>
                      <a
                        href={doc.archivo_url}
                        download
                        className="text-green-600 hover:text-green-700"
                      >
                        Descargar
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="p-12 text-center">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay documentos
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedLote === "todos"
                ? "No has subido ningún documento aún"
                : "No hay documentos para este lote"}
            </p>
            <button
              onClick={() => setUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Subir Primer Documento
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Subir Documento
              </h3>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo
                  </label>
                  <input
                    type="file"
                    name="archivo"
                    required
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    name="tipo"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="escritura">Escritura Pública</option>
                    <option value="certificado_tradicion">
                      Certificado de Tradición
                    </option>
                    <option value="avaluo">Avalúo</option>
                    <option value="planos">Planos</option>
                    <option value="impuesto">Recibo de Impuesto</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote
                  </label>
                  <select
                    name="lote_id"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="">Seleccionar lote</option>
                    {uniqueLotes.map((lote) => (
                      <option key={lote.lote_id} value={lote.lote_id}>
                        {lote.lote_direccion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setUploadModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? "Subiendo..." : "Subir"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
