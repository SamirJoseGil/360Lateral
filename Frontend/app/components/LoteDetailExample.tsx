import React from 'react';
import LotePotSection from './LotePotSection';

/**
 * Componente de ejemplo para mostrar cómo integrar el análisis POT en una vista de lote
 * 
 * NOTA: Este es solo un componente de ejemplo que muestra cómo integrar
 * el componente LotePotSection en cualquier vista de detalle de lote.
 */
export default function LoteDetailExample({ lote }: { lote: any }) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Encabezado del lote */}
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Lote {lote.cbml}
                    </h1>
                    <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {lote.direccion}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                            </svg>
                            {lote.area} m²
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button type="button" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Editar
                    </button>
                    <button type="button" className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Generar Informe
                    </button>
                </div>
            </div>

            {/* Grid layout para información principal y mapa */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Información principal del lote */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Información del Lote
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Detalles y documentación asociada.
                        </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">CBML</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lote.cbml}</dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lote.direccion}</dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Barrio</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lote.barrio || "No especificado"}</dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Área</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lote.area} m²</dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${lote.estado === 'activo' ? 'bg-green-100 text-green-800' :
                                            lote.estado === 'inactivo' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {lote.estado.charAt(0).toUpperCase() + lote.estado.slice(1)}
                                    </span>
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Fecha Creación</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lote.fechaCreacion}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Aquí iría el mapa */}
                <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                    <p className="text-gray-500">Mapa del lote</p>
                </div>
            </div>

            {/* INTEGRACIÓN DEL COMPONENTE DE ANÁLISIS POT */}
            <div className="mt-8">
                <LotePotSection cbml={lote.cbml} />
            </div>

            {/* Sección documentos */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Documentos Asociados</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Documentación</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Documentos relacionados con el lote.</p>
                    </div>
                    <div className="border-t border-gray-200">
                        <div className="bg-white overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                                {[
                                    { id: 1, nombre: "Escritura pública", tipo: "Escritura", fecha: "2024-05-10" },
                                    { id: 2, nombre: "Plano catastral", tipo: "Plano", fecha: "2024-04-22" },
                                    { id: 3, nombre: "Certificado libertad", tipo: "Certificado", fecha: "2024-05-15" }
                                ].map((documento) => (
                                    <li key={documento.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                                <p className="ml-3 text-sm font-medium text-gray-900">{documento.nombre}</p>
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {documento.tipo}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                    {documento.fecha}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <button className="text-blue-600 hover:text-blue-800">Ver</button>
                                                <span className="mx-2">|</span>
                                                <button className="text-blue-600 hover:text-blue-800">Descargar</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}