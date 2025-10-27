import { useState } from "react";

interface LoteSearchSectionProps {
    onDataReceived: (mapGisData: any) => void;
}

// ✅ Definir tipos para las respuestas
interface MapGisResponse {
    success: boolean;
    encontrado: boolean;
    data?: any;
    message?: string;
    error?: string;
}

export default function LoteSearchSection({ onDataReceived }: LoteSearchSectionProps) {
    const [matriculaValue, setMatriculaValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any>(null);

    // ✅ FUNCIÓN TEMPORALMENTE DESHABILITADA
    const handleMatriculaSearch = async () => {
        if (!matriculaValue.trim()) {
            setSearchError('Por favor ingrese un número de matrícula');
            return;
        }

        // ✅ MENSAJE TEMPORAL - MapGIS deshabilitado
        setSearchError('La consulta a MapGIS está temporalmente deshabilitada. Puede llenar el formulario manualmente.');
        return;

        // Código original comentado hasta que MapGIS esté disponible
        /*
        setIsSearching(true);
        setSearchError('');
        setSearchResults(null);

        try {
            console.log(`🔍 Buscando matrícula: ${matriculaValue}`);
            
            // Aquí iría la lógica de búsqueda real
            const resultado: MapGisResponse = {
                success: false,
                encontrado: false,
                message: 'Servicio temporalmente no disponible'
            };

            if (resultado.success && resultado.encontrado && resultado.data) {
                console.log('✅ Datos encontrados:', resultado.data);
                
                onDataReceived(resultado.data);
                
                setSearchResults({
                    type: 'matricula',
                    data: resultado.data,
                    message: resultado.message || `Datos encontrados para matrícula ${matriculaValue}`
                });
                
                setMatriculaValue('');
                
            } else {
                console.log('❌ No se encontraron datos');
                setSearchError(
                    resultado.message || 
                    `No se encontraron datos para la matrícula ${matriculaValue}`
                );
            }

        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            setSearchError('Error al consultar MapGIS. Intente nuevamente.');
        } finally {
            setIsSearching(false);
        }
        */
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSearching) {
            handleMatriculaSearch();
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-500">Buscar por Matrícula Inmobiliaria</h2>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Temporalmente deshabilitado
                </span>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong>MapGIS temporalmente no disponible:</strong> La consulta automática está deshabilitada.
                            Puede llenar manualmente los campos del formulario mientras se restaura el servicio.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex space-x-3">
                <div className="flex-1">
                    <input
                        type="text"
                        value={matriculaValue}
                        onChange={(e) => setMatriculaValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ej: 174838 (temporalmente deshabilitado)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                        disabled={true} // ✅ Siempre deshabilitado temporalmente
                    />
                </div>
                <button
                    onClick={handleMatriculaSearch}
                    disabled={true} // ✅ Siempre deshabilitado temporalmente
                    className="px-6 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                    <span>No disponible</span>
                </button>
            </div>

            {/* Mostrar mensaje informativo */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>Cómo proceder:</strong> Llene manualmente los campos obligatorios del formulario
                            (Nombre y Dirección son requeridos). Los demás campos son opcionales y pueden completarse después.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mostrar error de búsqueda */}
            {searchError && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{searchError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mostrar resultados exitosos */}
            {searchResults && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">
                                ✅ Información encontrada y cargada automáticamente en el formulario
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}