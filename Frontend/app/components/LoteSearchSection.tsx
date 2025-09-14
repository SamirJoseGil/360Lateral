import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import LoteSearchForm from "./LoteSearchForm";
import DireccionSearchResults, { type DireccionResult } from "./DireccionSearchResults";
import LoadingModal from "./LoadingModal";

interface LoteSearchSectionProps {
    onDataReceived: (mapGisData: any) => void;
    onDireccionSelect: (result: DireccionResult) => void;
}

export default function LoteSearchSection({ onDataReceived, onDireccionSelect }: LoteSearchSectionProps) {
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [direccionResults, setDireccionResults] = useState<DireccionResult[]>([]);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const mapFetcher = useFetcher();

    // Función para manejar la búsqueda
    const handleSearch = async (searchType: 'cbml' | 'matricula' | 'direccion', value: string) => {
        // Reset all state related to search
        setIsSearching(true);
        setSearchError(null);
        setDireccionResults([]);
        setShowLoadingModal(true);
        setLoadingProgress(0);
        setSearchStartTime(Date.now());

        console.log(`Iniciando búsqueda de ${searchType}: ${value}`);

        // Limpiar timeout anterior si existe
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            setSearchTimeout(null);
        }

        // También reiniciar el fetcher para asegurar que estamos partiendo de cero
        // Esto ayuda cuando se hace una nueva búsqueda después de una anterior
        mapFetcher.state = 'idle' as any;
        mapFetcher.data = undefined;

        // Iniciar animación de progreso
        const progressInterval = setInterval(() => {
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
            clearInterval(progressInterval);
            setIsSearching(false);
            setShowLoadingModal(false);
            setSearchError('La consulta ha excedido el tiempo máximo de espera (50 segundos). Por favor intente nuevamente.');
        }, 50000);

        setSearchTimeout(timeout);

        try {
            // Usar submit en lugar de load para asegurar que se haga una nueva petición
            // y no se use caché del navegador
            mapFetcher.submit(
                { searchType, searchValue: value },
                {
                    method: 'get',
                    action: `/owner/lotes/nuevo?searchType=${searchType}&searchValue=${encodeURIComponent(value)}`
                }
            );

            // No cerramos el modal aquí, lo manejamos en el useEffect que observa mapFetcher.state
        } catch (error) {
            clearInterval(progressInterval);
            clearTimeout(timeout);
            setIsSearching(false);
            setShowLoadingModal(false);
            console.error('Error al realizar la búsqueda:', error);
            setSearchError('Error al realizar la búsqueda. Por favor intente nuevamente.');
        }
    };

    // Manejar el estado del fetcher
    useEffect(() => {
        // Cuando cambia el estado del fetcher a idle, significa que la búsqueda ha terminado
        if (mapFetcher.state === 'idle' && isSearching) {
            // Limpiar el timeout si existe
            if (searchTimeout) {
                clearTimeout(searchTimeout);
                setSearchTimeout(null);
            }

            // Calcular tiempo transcurrido
            const elapsedTime = searchStartTime ? Math.round((Date.now() - searchStartTime) / 1000) : 0;
            console.log(`Búsqueda completada en ${elapsedTime} segundos`);

            // Actualizar la barra de progreso a 100%
            setLoadingProgress(100);

            // Pequeño delay para mostrar el 100% antes de cerrar el modal
            setTimeout(() => {
                setShowLoadingModal(false);
                setIsSearching(false);
            }, 500);
        }
    }, [mapFetcher.state, isSearching, searchTimeout, searchStartTime]);

    // Manejar los resultados de la búsqueda
    useEffect(() => {
        if (
            mapFetcher.data &&
            typeof mapFetcher.data === "object" &&
            mapFetcher.data !== null
        ) {
            console.log("MapFetcher data received:", mapFetcher.data);

            if ("searchError" in mapFetcher.data) {
                setSearchError(mapFetcher.data.searchError as string);
            } else if (
                "searchType" in mapFetcher.data &&
                mapFetcher.data.searchType === "direccion" &&
                "searchResults" in mapFetcher.data
            ) {
                setDireccionResults(mapFetcher.data.searchResults as DireccionResult[]);
            } else if ("searchResult" in mapFetcher.data) {
                // Pasar los datos al componente padre
                onDataReceived(mapFetcher.data.searchResult);
            }
        }
    }, [mapFetcher.data, onDataReceived]);

    return (
        <>
            {/* Formulario de búsqueda MapGIS */}
            <LoteSearchForm onSearch={handleSearch} isSearching={isSearching} />

            {/* Mostrar error de búsqueda si existe */}
            {searchError && (
                <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700">{searchError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mostrar resultados de búsqueda por dirección */}
            {direccionResults.length > 0 && (
                <DireccionSearchResults
                    results={direccionResults}
                    onSelect={onDireccionSelect}
                />
            )}

            {/* Modal de carga para búsqueda MapGIS */}
            {showLoadingModal && (
                <LoadingModal
                    title="Consultando información en MapGIS"
                    message="Esta consulta puede tardar hasta 50 segundos. Por favor espere..."
                    progress={loadingProgress}
                    startTime={searchStartTime}
                />
            )}
        </>
    );
}