import { Link } from "@remix-run/react";

interface LoteCardProps {
    lote: {
        id: number;
        nombre: string;
        direccion?: string;
        area?: number;
        cbml?: string;
        estrato?: number;
        barrio?: string;
        descripcion?: string;
        status?: string;
        fecha_creacion?: string;
    };
}

export default function LoteCard({ lote }: LoteCardProps) {
    // Formato para la fecha
    const formatearFecha = (fecha: string) => {
        if (!fecha) return '';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="px-5 py-4 flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                        {lote.nombre || "Lote sin nombre"}
                    </h3>
                    {lote.status && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${lote.status === 'active' ? 'bg-green-100 text-green-800' :
                            lote.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {lote.status === 'active' ? 'Activo' :
                                lote.status === 'inactive' ? 'Inactivo' :
                                    lote.status}
                        </span>
                    )}
                </div>

                <div className="space-y-2 mt-2">
                    {lote.direccion && (
                        <p className="text-sm text-gray-600 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {lote.direccion}
                        </p>
                    )}

                    {lote.area && (
                        <p className="text-sm text-gray-600 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            {lote.area.toLocaleString()} m²
                        </p>
                    )}

                    {lote.cbml && (
                        <p className="text-sm text-gray-600 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            CBML: {lote.cbml}
                        </p>
                    )}

                    {lote.barrio && (
                        <p className="text-sm text-gray-600 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {lote.barrio}
                        </p>
                    )}

                    {lote.estrato && (
                        <p className="text-sm text-gray-600 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                            Estrato {lote.estrato}
                        </p>
                    )}

                    {lote.fecha_creacion && (
                        <p className="text-xs text-gray-500 mt-3 flex items-center">
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Registrado el {formatearFecha(lote.fecha_creacion)}
                        </p>
                    )}
                </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 flex justify-end">
                <Link
                    to={`/owner/lote/${lote.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                    Ver detalles →
                </Link>
            </div>
        </div>
    );
}