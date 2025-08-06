import { Link, useParams } from "@remix-run/react";
import { useState } from "react";
import Navbar from "~/components/Navbar";

interface DocumentFile {
  file: File;
  tipo: string;
  descripcion: string;
  id: string;
}

export default function SubirDocumentosLote() {
  const { loteId } = useParams();
  const [selectedFiles, setSelectedFiles] = useState<DocumentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  // Mock data based on loteId
  const loteInfo = {
    "1": { nombre: "Lote Villa Hermosa", ubicacion: "Calle 45 #23-67, Medellín" },
    "2": { nombre: "Lote El Poblado", ubicacion: "Carrera 43A #14-32, Medellín" },
    "3": { nombre: "Lote Laureles", ubicacion: "Calle 70 #48-15, Medellín" }
  }[loteId || "1"] || { nombre: "Lote Desconocido", ubicacion: "Ubicación no disponible" };

  const documentTypes = [
    { value: "escritura", label: "Escritura Pública", required: true },
    { value: "catastral", label: "Certificado Catastral", required: true },
    { value: "avaluo", label: "Avalúo Comercial", required: false },
    { value: "permiso", label: "Permiso de Construcción", required: false },
    { value: "servicios", label: "Certificado de Servicios", required: false },
    { value: "otro", label: "Otro Documento", required: false }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      file,
      tipo: "otro",
      descripcion: "",
      id: Math.random().toString(36).substr(2, 9)
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const updateFileInfo = (id: string, field: string, value: string) => {
    setSelectedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const simulateUpload = async (fileId: string) => {
    const intervals = [];
    const progress = { current: 0 };
    
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        progress.current += Math.random() * 15;
        if (progress.current >= 100) {
          progress.current = 100;
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          clearInterval(interval);
          resolve();
        } else {
          setUploadProgress(prev => ({ ...prev, [fileId]: Math.floor(progress.current) }));
        }
      }, 200);
      intervals.push(interval);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    // Reset progress
    const initialProgress = selectedFiles.reduce((acc, file) => {
      acc[file.id] = 0;
      return acc;
    }, {} as {[key: string]: number});
    setUploadProgress(initialProgress);

    // Simulate upload for each file
    const uploadPromises = selectedFiles.map(file => simulateUpload(file.id));
    
    try {
      await Promise.all(uploadPromises);
      
      // Show success message
      setTimeout(() => {
        alert(`${selectedFiles.length} documento(s) subido(s) exitosamente para ${loteInfo.nombre}`);
        setSelectedFiles([]);
        setUploadProgress({});
        setUploading(false);
      }, 500);
    } catch (error) {
      setUploading(false);
      alert("Error al subir algunos documentos");
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar currentPath="/documentos" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link 
          to={`/documentos/${loteId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Volver a Documentos
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subir Documentos - {loteInfo.nombre}
          </h1>
          <p className="text-gray-600">{loteInfo.ubicacion}</p>
        </div>

        {/* Document Types Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Tipos de Documentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((type) => (
              <div key={type.value} className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-3 ${type.required ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                <span className="text-sm text-blue-800">{type.label}</span>
                {type.required && <span className="text-xs text-red-600 ml-1">(Requerido)</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Seleccionar Archivos</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className="mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  Seleccionar archivos
                </span>
                <span className="text-gray-500"> o arrastrar aquí</span>
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
            
            <p className="text-sm text-gray-500">PDF, DOC, DOCX, JPG, PNG hasta 10MB cada uno</p>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Archivos Seleccionados ({selectedFiles.length})
            </h3>
            
            <div className="space-y-4">
              {selectedFiles.map((docFile) => (
                <div key={docFile.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {getFileIcon(docFile.file.name)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {docFile.file.name}
                        </h4>
                        <button
                          onClick={() => removeFile(docFile.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-3">
                        Tamaño: {(docFile.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tipo de Documento *
                          </label>
                          <select
                            value={docFile.tipo}
                            onChange={(e) => updateFileInfo(docFile.id, 'tipo', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {documentTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descripción (Opcional)
                          </label>
                          <input
                            type="text"
                            value={docFile.descripcion}
                            onChange={(e) => updateFileInfo(docFile.id, 'descripcion', e.target.value)}
                            placeholder="Descripción adicional..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Progress bar during upload */}
                      {uploading && uploadProgress[docFile.id] !== undefined && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Subiendo...</span>
                            <span>{uploadProgress[docFile.id]}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[docFile.id] || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {uploading ? "Subiendo documentos..." : `Subir ${selectedFiles.length} documento(s)`}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}