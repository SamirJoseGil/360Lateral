import React from 'react';
import { Link } from '@remix-run/react';

type LoteCardProps = {
    lote: {
        id: number;
        nombre?: string;
        name?: string; // Some APIs might return name instead of nombre
        direccion?: string;
        address?: string; // Some APIs might return address instead of direccion
        area: number;
        precio?: number;
        price?: number; // Some APIs might return price instead of precio
        estrato?: number;
        zona?: string;
        zone?: string;
        tratamiento?: string;
        treatment?: string;
        valorEstimado?: number;
        potentialValue?: number;
        isFavorite?: boolean;
    };
    showDetailLink?: boolean;
    showAnalysisLink?: boolean;
    onFavoriteToggle?: (id: number) => void;
    className?: string;
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
    className = ''
}: LoteCardProps) {
    // Handle both naming conventions (Spanish/English)
    const nombre = lote.nombre || lote.name || 'Lote sin nombre';
    const direccion = lote.direccion || lote.address || 'Sin dirección';
    const precio = lote.precio || lote.price || 0;
    const zona = lote.zona || lote.zone || '';
    const tratamiento = lote.tratamiento || lote.treatment || '';
    const valorEstimado = lote.valorEstimado || lote.potentialValue || 0;

    // Calculate ROI if we have both price and estimated value
    const roi = precio && valorEstimado ? ((valorEstimado - precio) / precio) * 100 : 0;

    return (
        <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg mb-1">{nombre}</h3>
                    {onFavoriteToggle && (
                        <button
                            onClick={() => onFavoriteToggle(lote.id)}
                            className={`p-1 rounded-full ${lote.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        >
                            <svg className="h-6 w-6" fill={lote.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    )}
                </div>

                <p className="text-gray-500 mb-4">{direccion}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <span className="block text-xs text-gray-500">Área</span>
                        <span className="font-medium">{lote.area} m²</span>
                    </div>
                    {precio > 0 && (
                        <div>
                            <span className="block text-xs text-gray-500">Precio</span>
                            <span className="font-medium">{formatCurrency(precio)}</span>
                        </div>
                    )}
                    {lote.estrato && (
                        <div>
                            <span className="block text-xs text-gray-500">Estrato</span>
                            <span className="font-medium">{lote.estrato}</span>
                        </div>
                    )}
                    {zona && (
                        <div>
                            <span className="block text-xs text-gray-500">Zona</span>
                            <span className="font-medium">{zona}</span>
                        </div>
                    )}
                    {tratamiento && (
                        <div>
                            <span className="block text-xs text-gray-500">Tratamiento</span>
                            <span className="font-medium">{tratamiento}</span>
                        </div>
                    )}
                    {valorEstimado > 0 && (
                        <div>
                            <span className="block text-xs text-gray-500">Valor Potencial</span>
                            <span className="font-medium text-green-600">
                                {formatCurrency(valorEstimado)}
                            </span>
                        </div>
                    )}
                    {precio > 0 && valorEstimado > 0 && (
                        <div>
                            <span className="block text-xs text-gray-500">ROI Estimado</span>
                            <span className="font-medium text-green-600">
                                {Math.round(roi)}%
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 border-t pt-3">
                    {showDetailLink && (
                        <Link
                            to={`/developer/lots/${lote.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                        >
                            Ver Detalles
                        </Link>
                    )}
                    {showAnalysisLink && (
                        <Link
                            to={`/developer/analysis/${lote.id}`}
                            className="text-blue-600 hover:text-blue-900"
                        >
                            Análisis
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}