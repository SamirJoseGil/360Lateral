import { Link, useParams } from "@remix-run/react";
import { useState } from "react";
import Navbar from "~/components/Navbar";

export default function DocumentosLote() {
  const { loteId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  // Mock data based on loteId
  const loteInfo = {
    "1": { nombre: "Lote Villa Hermosa", ubicacion: "Calle 45 #23-67, Medellín" },
    "2": { nombre: "Lote El Poblado", ubicacion: "Carrera 43A #14-32, Medellín" },
    "3": { nombre: "Lote Laureles", ubicacion: "Calle 70 #48-15, Medellín" }
  }[loteId || "1"] || { nombre: "Lote Desconocido", ubicacion: "Ubicación no disponible" };

  const mockDocuments = [
    {
      id: 1,
      nombre: `Escritura Pública - ${loteInfo.nombre}`,
      tipo: "escritura",
      fecha: "2024-01-15",
      tamaño: "2.4 MB"
    },
    {
      id: 2,
      nombre: `Certificado Catastral - ${loteInfo.nombre}`,
      tipo: "catastral",
      fecha: "2024-02-10",
      tamaño: "1.8 MB"
    }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;
    
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setSelectedFiles(null);
      alert(`Documentos subidos exitosamente para ${loteInfo.nombre}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar currentPath="/documentos" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link 
          to="/lotes" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Volver a Lotes
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Documentos de {loteInfo.nombre}
            </h1>
            <p className="text-gray-600">{loteInfo.ubicacion}</p>
          </div>
          
          <div className="flex space-x-3">
            <Link 
              to={`/subir-documentos/${loteId}`}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              Subir Documentos
            </Link>
            <Link 
              to="/lotes"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              Ver Todos los Lotes
            </Link>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Subir Documentos para {loteInfo.nombre}
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className="mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  Haz clic para subir archivos
                </span>
                <span className="text-gray-500"> o arrastra y suelta</span>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </div>
            
            <p className="text-sm text-gray-500">PDF, DOC, DOCX, JPG, PNG hasta 10MB</p>
            
            {selectedFiles && (
              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-2">
                  {selectedFiles.length} archivo(s) seleccionado(s)
                </p>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? "Subiendo..." : "Subir Archivos"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Documentos de {loteInfo.nombre}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {mockDocuments.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{doc.nombre}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">Fecha: {doc.fecha}</span>
                        <span className="text-xs text-gray-500">Tamaño: {doc.tamaño}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {doc.tipo.charAt(0).toUpperCase() + doc.tipo.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Descargar
                    </button>
                    <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}