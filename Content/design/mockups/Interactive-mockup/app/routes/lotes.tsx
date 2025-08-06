import { Link } from "@remix-run/react";
import Navbar from "~/components/Navbar";

export default function Lotes() {
  const mockLotes = [
    {
      id: 1,
      nombre: "Lote Villa Hermosa",
      ubicacion: "Calle 45 #23-67, Medellín",
      area: "250 m²",
      estrato: "4",
      precio: "$150,000,000",
      ocupado: false
    },
    {
      id: 2,
      nombre: "Lote El Poblado",
      ubicacion: "Carrera 43A #14-32, Medellín",
      area: "180 m²",
      estrato: "6",
      precio: "$280,000,000",
      ocupado: true
    },
    {
      id: 3,
      nombre: "Lote Laureles",
      ubicacion: "Calle 70 #48-15, Medellín",
      area: "320 m²",
      estrato: "5",
      precio: "$220,000,000",
      ocupado: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar currentPath="/lotes" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lotes Registrados</h1>
            <p className="text-gray-600">Gestiona y consulta todos los lotes del sistema</p>
          </div>
          
          <Link
            to="/crear-lote"
            className="px-6 py-3 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors"
          >
            Nuevo Lote
          </Link>
        </div>

        {/* Lots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockLotes.map((lote) => (
            <div key={lote.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200">
              {/* Status Badge */}
              <div className="p-4 pb-0">
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    lote.ocupado 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {lote.ocupado ? 'Ocupado' : 'Disponible'}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 pt-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{lote.nombre}</h3>
                <p className="text-sm text-gray-600 mb-3">{lote.ubicacion}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Área:</span>
                    <span className="font-medium text-gray-900">{lote.area}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estrato:</span>
                    <span className="font-medium text-gray-900">{lote.estrato}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-semibold text-blue-800">{lote.precio}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Ver Detalles
                  </button>
                  <Link 
                    to={`/documentos/${lote.id}`}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center"
                  >
                    Documentos
                  </Link>
                  <Link 
                    to={`/subir-documentos/${lote.id}`}
                    className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-center"
                  >
                    Subir Docs
                  </Link>
                  <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (if no lots) */}
        {mockLotes.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay lotes registrados</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer lote.</p>
            <div className="mt-6">
              <Link
                to="/crear-lote"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Crear Lote
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}