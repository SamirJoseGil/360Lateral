import React, { useState, useEffect } from 'react';
import { Form, useFetcher } from '@remix-run/react';
import type { MapGisLoteDetalle, MapGisResponseDetalle } from '~/services/mapgis.server';

interface MapGisSearchProps {
    onResult: (data: MapGisLoteDetalle) => void;
}

export default function MapGisSearch({ onResult }: MapGisSearchProps) {
    const [searchType, setSearchType] = useState<'cbml' | 'matricula' | 'direccion'>('cbml');
    const [searchValue, setSearchValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const fetcher = useFetcher();
    const isSearching = fetcher.state !== 'idle';

    // Manejo de la barra de progreso y timeout
    useEffect(() => {
        if (isSearching && !showLoadingModal) {
            setShowLoadingModal(true);
            setLoadingProgress(0);

            // Iniciar el timeout de 50 segundos
            const timeout = setTimeout(() => {
                setErrorMessage('La consulta ha tomado demasiado tiempo. Por favor intente nuevamente.');
                setShowLoadingModal(false);
                // Aquí podríamos abortar la petición si tuviéramos acceso a un AbortController
            }, 50000); // 50 segundos

            setTimeoutId(timeout);

            // Incrementar la barra de progreso gradualmente durante los 50 segundos
            const interval = setInterval(() => {
                setLoadingProgress(prev => {
                    const newProgress = prev + (100 / (50 * 10)); // Incremento gradual (10 actualizaciones por segundo)
                    return newProgress > 98 ? 98 : newProgress; // Mantenemos en 98% máximo hasta que haya respuesta
                });
            }, 100);

            return () => {
                clearInterval(interval);
                if (timeoutId) clearTimeout(timeoutId);
            };
        }

        if (!isSearching && showLoadingModal) {
            // Completar la barra de progreso cuando termine la búsqueda
            setLoadingProgress(100);
            // Pequeño delay antes de cerrar el modal para mostrar el 100%
            const closeDelay = setTimeout(() => {
                setShowLoadingModal(false);
            }, 500);

            return () => clearTimeout(closeDelay);
        }
    }, [isSearching, showLoadingModal, timeoutId]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

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

    // Procesar la respuesta cuando llega
    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            // Limpiar timeout si existe
            if (timeoutId) {
                clearTimeout(timeoutId);
                setTimeoutId(null);
            }

            const response = fetcher.data as { success: boolean; data?: MapGisResponseDetalle; error?: string };

            if (response.success && response.data && response.data.encontrado) {
                // Si se encontró el lote, pasamos los datos al componente padre
                onResult(response.data.datos);
            } else if (response.error) {
                setErrorMessage(response.error);
            } else if (response.data && !response.data.encontrado) {
                setErrorMessage('No se encontró información para el valor ingresado.');
            }
        }
    }, [fetcher.data, fetcher.state, onResult, timeoutId]); return (
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
                            Tiempo estimado: {Math.round(loadingProgress / 2)} segundos transcurridos
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}