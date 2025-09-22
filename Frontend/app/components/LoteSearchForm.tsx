// filepath: d:\Accesos Directos\Escritorio\frontendx\app\components\LoteSearchForm.tsx
import { useState } from 'react';
import { Form } from '@remix-run/react';

type LoteSearchFormProps = {
    onSearch: (searchType: 'cbml' | 'matricula' | 'direccion', value: string) => Promise<void>;
    isSearching: boolean;
};

export default function LoteSearchForm({ onSearch, isSearching }: LoteSearchFormProps) {
    const [searchType, setSearchType] = useState<'cbml' | 'matricula' | 'direccion'>('cbml');
    const [searchValue, setSearchValue] = useState('');

    // Function to sanitize input based on search type
    const sanitizeInput = (value: string, type: 'cbml' | 'matricula' | 'direccion'): string => {
        if (type === 'cbml' || type === 'matricula') {
            // Remove all non-numeric characters for CBML and matricula
            return value.replace(/[^0-9]/g, '');
        } else {
            // For direccion, keep alphanumeric characters, spaces, and basic punctuation
            return value.replace(/[^a-zA-Z0-9\s\-#]/g, '');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const sanitizedValue = sanitizeInput(rawValue, searchType);
        setSearchValue(sanitizedValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchValue.trim()) {
            await onSearch(searchType, searchValue.trim());
        }
    };

    const getPlaceholder = (type: 'cbml' | 'matricula' | 'direccion'): string => {
        switch (type) {
            case 'cbml':
                return 'Ingrese el código CBML';
            case 'matricula':
                return 'Ingrese la matrícula inmobiliaria';
            case 'direccion':
                return 'Ingrese la dirección del lote';
            default:
                return '';
        }
    };

    return (
        <div className="bg-white p-4 rounded-md shadow mb-6">
            <h2 className="text-lg font-medium mb-3">Buscar información del lote</h2>
            <p className="text-sm text-gray-600 mb-4">
                Busque un lote existente por CBML, matrícula inmobiliaria o dirección para autocompletar la información.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                    <label htmlFor="searchType" className="sr-only">
                        Tipo de búsqueda
                    </label>
                    <select
                        id="searchType"
                        value={searchType}
                        onChange={(e) => {
                            const newType = e.target.value as 'cbml' | 'matricula' | 'direccion';
                            setSearchType(newType);
                            // Clear and re-sanitize current value for new search type
                            setSearchValue(sanitizeInput(searchValue, newType));
                        }}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="cbml">CBML</option>
                        <option value="matricula">Matrícula Inmobiliaria</option>
                        <option value="direccion">Dirección</option>
                    </select>
                </div>

                <div className="sm:flex-1 sm:flex-grow-[2]">
                    <label htmlFor="searchValue" className="sr-only">
                        Valor de búsqueda
                    </label>
                    <input
                        type="text"
                        id="searchValue"
                        value={searchValue}
                        onChange={handleInputChange}
                        placeholder={getPlaceholder(searchType)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSearching || !searchValue.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isSearching ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Buscando...
                        </>
                    ) : (
                        'Buscar'
                    )}
                </button>
            </form>
        </div>
    );
}