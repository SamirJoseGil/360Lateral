// filepath: d:\Accesos Directos\Escritorio\frontendx\app\components\DireccionSearchResults.tsx
import React from 'react';

export type DireccionResult = {
    cbml: string;
    matricula: string;
    direccion: string;
    area: number;
};

type DireccionSearchResultsProps = {
    results: DireccionResult[];
    onSelect: (result: DireccionResult) => void;
};

export default function DireccionSearchResults({ results, onSelect }: DireccionSearchResultsProps) {
    if (results.length === 0) return null;

    return (
        <div className="bg-white rounded-md shadow overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">
                    Se encontraron {results.length} resultados
                </h3>
            </div>
            <ul className="divide-y divide-gray-200">
                {results.map((result, index) => (
                    <li key={index} className="px-4 py-3 hover:bg-gray-50">
                        <button
                            onClick={() => onSelect(result)}
                            className="w-full text-left flex flex-col sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{result.direccion}</p>
                                <p className="text-xs text-gray-500">CBML: {result.cbml}</p>
                            </div>
                            <div className="mt-2 sm:mt-0 flex items-center">
                                <span className="text-xs text-gray-500 mr-4">Área: {result.area} m²</span>
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                    Matrícula: {result.matricula || 'No disponible'}
                                </span>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}