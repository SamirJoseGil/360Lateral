import React from 'react';
import { Link } from '@remix-run/react';

type LoteCardProps = {
    lote: {
        id: string;
        nombre?: string;
        name?: string;
        direccion?: string;
        address?: string;
        area: number;
        precio?: number;
        price?: number;
        estrato?: number;
        zona?: string;
        zone?: string;
        barrio?: string;
        tratamiento?: string;
        treatment?: string;
        valorEstimado?: number;
        potentialValue?: number;
        isFavorite?: boolean;
        status?: string;
    };
    showDetailLink?: boolean;
    showAnalysisLink?: boolean;
    onFavoriteToggle?: (id: string) => void;
    className?: string;
    userRole?: 'owner' | 'developer' | 'admin';
};

// Formateador de moneda para COP
const formatCurrency = (value?: number): string => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(value);
};

export default function LoteCard({
    lote,
    showDetailLink = true,
    showAnalysisLink = false,
    onFavoriteToggle,
    className = '',
    userRole = 'owner'
}: LoteCardProps) {
    // Handle both naming conventions (Spanish/English)
    const nombre = lote.nombre || lote.name || 'Lote sin nombre';
    const direccion = lote.direccion || lote.address || 'Sin dirección';
    const precio = lote.precio || lote.price || 0;
    const zona = lote.zona || lote.zone || lote.barrio || '';
    const tratamiento = lote.tratamiento || lote.treatment || '';
    const valorEstimado = lote.valorEstimado || lote.potentialValue || 0;

    // Calculate ROI if we have both price and estimated value
    const roi = precio && valorEstimado ? ((valorEstimado - precio) / precio) * 100 : 0;

    // ✅ CORREGIDO: Usar ruta según rol del usuario
    const basePath = userRole === 'developer' ? '/developer' : '/owner';
    const detailPath = `${basePath}/lote/${lote.id}`;
    const analysisPath = `${basePath}/analysis/${lote.id}`;

    // Función para obtener color según estado
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'incomplete':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'active':
                return 'Activo';
            case 'pending':
                return 'Pendiente';
            case 'incomplete':
                return 'Incompleto';
            default:
                return 'Desconocido';
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 ${className}`}>
            {/* Header del Card */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{nombre}</h3>
                        <p className="text-indigo-100 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {direccion}
                        </p>
                    </div>
                    {onFavoriteToggle && (
                        <button
                            onClick={() => onFavoriteToggle(lote.id)}
                            className={`p-2 rounded-full transition-colors ${
                                lote.isFavorite 
                                    ? 'text-red-400 hover:text-red-300' 
                                    : 'text-white/50 hover:text-white'
                            }`}
                        >
                            <svg className="h-6 w-6" fill={lote.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Contenido del Card */}
            <div className="p-6">
                {/* Estado del lote */}
                {lote.status && (
                    <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lote.status)}`}>
                            <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
                            {getStatusLabel(lote.status)}
                        </span>
                    </div>
                )}

                {/* Grid de información */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Área */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center mb-1">
                            <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span className="text-xs text-gray-500 font-medium">Área</span>
                        </div>
                        <span className="font-bold text-gray-900">{lote.area.toLocaleString()} m²</span>
                    </div>

                    {/* Precio */}
                    {precio > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs text-gray-500 font-medium">Precio</span>
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{formatCurrency(precio)}</span>
                        </div>
                    )}

                    {/* Estrato */}
                    {lote.estrato && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="text-xs text-gray-500 font-medium">Estrato</span>
                            </div>
                            <span className="font-bold text-gray-900">{lote.estrato}</span>
                        </div>
                    )}

                    {/* Zona */}
                    {zona && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                <span className="text-xs text-gray-500 font-medium">Zona</span>
                            </div>
                            <span className="font-bold text-gray-900 text-sm line-clamp-1">{zona}</span>
                        </div>
                    )}

                    {/* Tratamiento */}
                    {tratamiento && (
                        <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                            <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs text-gray-500 font-medium">Tratamiento</span>
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{tratamiento}</span>
                        </div>
                    )}

                    {/* Valor Potencial y ROI */}
                    {valorEstimado > 0 && (
                        <>
                            <div className="bg-green-50 rounded-lg p-3">
                                <div className="flex items-center mb-1">
                                    <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span className="text-xs text-green-700 font-medium">Valor Potencial</span>
                                </div>
                                <span className="font-bold text-green-700 text-sm">{formatCurrency(valorEstimado)}</span>
                            </div>

                            {precio > 0 && (
                                <div className="bg-green-50 rounded-lg p-3">
                                    <div className="flex items-center mb-1">
                                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs text-green-700 font-medium">ROI Estimado</span>
                                    </div>
                                    <span className="font-bold text-green-700">{Math.round(roi)}%</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                    {showDetailLink && (
                        <Link
                            to={detailPath}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver Detalles
                        </Link>
                    )}
                    {showAnalysisLink && (
                        <Link
                            to={analysisPath}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Análisis
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}