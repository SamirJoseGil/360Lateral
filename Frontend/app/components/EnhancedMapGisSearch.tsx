import React, { useState, useEffect } from 'react';
import { Form, useFetcher } from '@remix-run/react';
import type { MapGisLoteDetalle, MapGisResponseDetalle } from '~/services/mapgis.server';

interface MapGisSearchProps {
    onResult: (data: MapGisLoteDetalle) => void;
}

export default function EnhancedMapGisSearch({ onResult }: MapGisSearchProps) {
    const [searchType, setSearchType] = useState<'cbml' | 'matricula' | 'direccion'>('cbml');
    const [searchValue, setSearchValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    const fetcher = useFetcher();
    const isSearching = fetcher.state !== 'idle';

    // Manejar estado de carga cuando cambia el estado del fetcher
    useEffect(() => {
        if (fetcher.state === 'submitting') {
            // Iniciando búsqueda
            setShowLoadingModal(true);
            setLoadingProgress(0);
            setStartTime(Date.now());
            setErrorMessage('');

            // Iniciar animación de progreso
            const intervalId = setInterval(() => {
                setLoadingProgress(prev => {
                    // Incremento progresivo que se ralentiza cerca del final
                    const remaining = 100 - prev;
                    const increment = remaining * 0.03; // Incremento del 3% del restante
                    const newProgress = prev + increment;
                    return newProgress > 95 ? 95 : newProgress; // Mantenemos por debajo del 95% hasta tener respuesta
                });
            }, 300);

            // Establecer timeout para la búsqueda (50 segundos)
            const timeout = setTimeout(() => {
                clearInterval(intervalId);
                setErrorMessage('La consulta ha excedido el tiempo máximo de espera (50 segundos). Por favor intente nuevamente.');
                setShowLoadingModal(false);
            }, 50000);

            setTimeoutId(timeout);

            return () => {
                clearInterval(intervalId);
                if (timeoutId) clearTimeout(timeoutId);
            };
        } else if (fetcher.state === 'idle' && showLoadingModal) {
            // Completamos la animación al recibir respuesta
            setLoadingProgress(100);

            // Calcular tiempo transcurrido
            const elapsedTime = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
            console.log(`Búsqueda completada en ${elapsedTime} segundos`);

            // Pequeño delay para mostrar el 100% antes de cerrar el modal
            const closeDelay = setTimeout(() => {
                setShowLoadingModal(false);
            }, 500);

            return () => clearTimeout(closeDelay);
        }
    }, [fetcher.state, showLoadingModal, startTime, timeoutId]);

    // Procesar la respuesta cuando llega
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            // Limpiar timeout si existe
            if (timeoutId) {
                clearTimeout(timeoutId);
                setTimeoutId(null);
            }

            const response = fetcher.data as {
                success: boolean;
                data?: MapGisResponseDetalle;
                error?: string;
                isTimeout?: boolean;
            };

            if (response.success && response.data && response.data.encontrado) {
                // Si se encontró el lote, pasamos los datos al componente padre
                onResult(response.data.datos);
            } else if (response.isTimeout) {
                setErrorMessage('La consulta ha excedido el tiempo máximo de espera. Por favor intente nuevamente.');
            } else if (response.error) {
                setErrorMessage(response.error);
            } else if (response.data && !response.data.encontrado) {
                setErrorMessage(`No se encontró información para ${searchType === 'cbml' ? 'el CBML' :
                    searchType === 'matricula' ? 'la matrícula' : 'la dirección'}: ${searchValue}`);
            } else {
                setErrorMessage('Se produjo un error al procesar la solicitud. Intente nuevamente.');
            }
        }
    }, [fetcher.data, fetcher.state, onResult, searchType, searchValue, timeoutId]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchValue.trim()) {
            setErrorMessage('Por favor ingrese un valor de búsqueda.');
            return;
        }

        // Limpiar timeout anterior si existe
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }

        // Realizar la búsqueda utilizando useFetcher para evitar navegación
        fetcher.submit(
            { searchType, searchValue },
            { method: 'post', action: '/api/mapgis-search-new' }
        );
    };

    // Formatear tiempo para el modal
    const getFormattedTime = () => {
        if (!startTime) return '0 segundos';
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        return `${elapsedSeconds} segundos`;
    };

    return (
        <>
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
                <h2 className="text-xl font-bold mb-4">Buscar Lote en MapGIS</h2>

                <Form onSubmit={handleSearch} className="space-y-4">
                    <div className="flex flex-col space-y-2">
                        <label className="block text-gray-700 text-sm font-bold">Tipo de búsqueda</label>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="cbml"
                                    checked={searchType === 'cbml'}
                                    onChange={() => setSearchType('cbml')}
                                    className="form-radio h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2">CBML</span>
                            </label>

                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="matricula"
                                    checked={searchType === 'matricula'}
                                    onChange={() => setSearchType('matricula')}
                                    className="form-radio h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2">Matrícula</span>
                            </label>

                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="direccion"
                                    checked={searchType === 'direccion'}
                                    onChange={() => setSearchType('direccion')}
                                    className="form-radio h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2">Dirección</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="searchValue" className="block text-gray-700 text-sm font-bold mb-2">
                            {searchType === 'cbml' ? 'CBML' : searchType === 'matricula' ? 'Matrícula' : 'Dirección'}
                        </label>
                        <input
                            type="text"
                            id="searchValue"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder={`Ingrese ${searchType === 'cbml' ? 'CBML' : searchType === 'matricula' ? 'matrícula' : 'dirección'}`}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={isSearching || !searchValue.trim()}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
                        >
                            {isSearching ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </Form>

                {errorMessage && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4" role="alert">
                        <p>{errorMessage}</p>
                    </div>
                )}
            </div>

            {/* Modal de carga */}
            {showLoadingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Consultando información en MapGIS</h3>

                        <div className="mb-4">
                            <p className="text-gray-600 mb-2">
                                Buscando {searchType === 'cbml' ? 'CBML' : searchType === 'matricula' ? 'matrícula' : 'dirección'}: <span className="font-semibold">{searchValue}</span>
                            </p>
                            <p className="text-gray-600 mb-2 text-sm">
                                Esta consulta puede tardar hasta 50 segundos. Por favor espere...
                            </p>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>

                        {/* Animación de carga */}
                        <div className="flex justify-center my-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>

                        <p className="text-center text-sm text-gray-500">
                            Tiempo transcurrido: {getFormattedTime()}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}