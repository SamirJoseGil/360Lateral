// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\components\SystemMonitor.tsx
import React, { useState, useEffect } from 'react';
import { getSystemHealth, getSimpleHealth } from '~/services/common.server';

interface SystemMonitorProps {
    showFullDetails?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number; // seconds
    className?: string;
}

export default function SystemMonitor({
    showFullDetails = false,
    autoRefresh = true,
    refreshInterval = 30,
    className = ""
}: SystemMonitorProps) {
    const [healthData, setHealthData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Función para obtener datos de salud
    const fetchHealthData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Hacer request al endpoint de health del frontend
            const response = await fetch('/health');
            const data = await response.json();

            setHealthData(data);
            setLastUpdate(new Date());
        } catch (err) {
            setError((err as Error).message);
            console.error('Error fetching health data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para carga inicial
    useEffect(() => {
        fetchHealthData();
    }, []);

    // Efecto para auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchHealthData, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    // Función para determinar el color del estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-800 bg-green-100 border-green-200';
            case 'warning':
                return 'text-yellow-800 bg-yellow-100 border-yellow-200';
            case 'unhealthy':
                return 'text-red-800 bg-red-100 border-red-200';
            default:
                return 'text-gray-800 bg-gray-100 border-gray-200';
        }
    };

    // Función para formatear el tiempo
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (loading && !healthData) {
        return (
            <div className={`bg-white rounded-lg border p-4 ${className}`}>
                <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-600">Verificando estado del sistema...</span>
                </div>
            </div>
        );
    }

    if (error && !healthData) {
        return (
            <div className={`bg-white rounded-lg border border-red-200 p-4 ${className}`}>
                <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-red-600">Error monitoreando sistema: {error}</span>
                </div>
                <button
                    onClick={fetchHealthData}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const frontendStatus = healthData?.status || 'unknown';
    const backendStatus = healthData?.backend?.status || 'unknown';

    return (
        <div className={`bg-white rounded-lg border p-4 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-900">Estado del Sistema</h3>
                {lastUpdate && (
                    <span className="text-xs text-gray-500">
                        {formatTime(lastUpdate)}
                    </span>
                )}
            </div>

            {/* Estado general */}
            <div className="space-y-2">
                {/* Frontend Status */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Frontend:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(frontendStatus)}`}>
                        {frontendStatus}
                    </span>
                </div>

                {/* Backend Status */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Backend:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(backendStatus)}`}>
                        {backendStatus}
                    </span>
                </div>

                {/* Detalles adicionales si se muestran */}
                {showFullDetails && healthData?.backend && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                            <div>Servicio: {healthData.backend.service}</div>
                            <div>Mensaje: {healthData.backend.message}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Indicador de loading durante refresh */}
            {loading && healthData && (
                <div className="mt-2 flex items-center space-x-1">
                    <svg className="animate-spin h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs text-gray-400">Actualizando...</span>
                </div>
            )}

            {/* Botón manual de refresh si auto-refresh está desactivado */}
            {!autoRefresh && (
                <button
                    onClick={fetchHealthData}
                    disabled={loading}
                    className="mt-2 w-full text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                    Actualizar Estado
                </button>
            )}
        </div>
    );
}