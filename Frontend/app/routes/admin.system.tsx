// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\routes\admin.system.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getUser } from "~/utils/auth.server";
import {
    getComprehensiveHealth,
    getSystemHealth,
    getDatabaseHealth,
    getCacheHealth,
    getVersionInfo,
    getSystemStatus,
    getCorsDebugInfo
} from "~/services/common.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    try {
        // Obtener información completa del sistema
        const comprehensiveData = await getComprehensiveHealth(request);

        return json({
            user,
            ...comprehensiveData,
            lastUpdate: new Date().toISOString()
        }, {
            headers: comprehensiveData.headers
        });
    } catch (error) {
        console.error("Error cargando información del sistema:", error);
        return json({
            user,
            error: "Error al cargar información del sistema",
            systemHealth: {
                status: "unhealthy" as const,
                timestamp: new Date().toISOString(),
                services: {
                    database: {
                        status: "unhealthy" as const,
                        message: "Error loading system information"
                    }
                }
            },
            databaseHealth: {
                database: {
                    status: "unhealthy" as const,
                    message: "Error loading database information"
                },
                timestamp: new Date().toISOString()
            },
            cacheHealth: {
                cache: {
                    status: "unhealthy" as const,
                    message: "Error loading cache information"
                },
                timestamp: new Date().toISOString()
            },
            versionInfo: {
                version: "unknown",
                django_version: "unknown",
                python_version: "unknown",
                apps: [],
                environment: "unknown"
            },
            systemStatus: {
                database: "unknown",
                cache: "unknown",
                middleware: "unknown",
                apps_loaded: 0,
                debug_mode: false,
                environment: "unknown"
            },
            lastUpdate: new Date().toISOString()
        });
    }
}

export default function AdminSystemMonitoring() {
    const loaderData = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30); // seconds
    const [corsDebugInfo, setCorsDebugInfo] = useState<any>(null);
    const [showCorsDebug, setShowCorsDebug] = useState(false);

    const isLoading = navigation.state === "loading";

    // Auto refresh functionality
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            window.location.reload();
        }, refreshInterval * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    // Función para obtener información de CORS debug
    const fetchCorsDebug = async () => {
        try {
            const response = await fetch('/admin/system/cors-debug');
            const data = await response.json();
            setCorsDebugInfo(data);
            setShowCorsDebug(true);
        } catch (error) {
            console.error('Error fetching CORS debug:', error);
        }
    };

    // Extraer datos del loader con manejo de errores
    const systemHealth = 'systemHealth' in loaderData ? loaderData.systemHealth : null;
    const databaseHealth = 'databaseHealth' in loaderData ? loaderData.databaseHealth : null;
    const cacheHealth = 'cacheHealth' in loaderData ? loaderData.cacheHealth : null;
    const versionInfo = 'versionInfo' in loaderData ? loaderData.versionInfo : null;
    const systemStatus = 'systemStatus' in loaderData ? loaderData.systemStatus : null;
    const error = 'error' in loaderData ? loaderData.error : null;
    const lastUpdate = 'lastUpdate' in loaderData ? loaderData.lastUpdate : null;

    // Función para determinar el color del estado
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-800 bg-green-100';
            case 'warning':
                return 'text-yellow-800 bg-yellow-100';
            case 'unhealthy':
                return 'text-red-800 bg-red-100';
            default:
                return 'text-gray-800 bg-gray-100';
        }
    };

    // Función para formatear el tiempo
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Monitoreo del Sistema</h1>
                        <p className="text-gray-600 mt-2">
                            Estado en tiempo real de todos los componentes del sistema
                        </p>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Auto refresh controls */}
                        <div className="flex items-center space-x-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                />
                                <span className="ml-2 text-sm text-gray-700">Auto-actualizar</span>
                            </label>

                            {autoRefresh && (
                                <select
                                    value={refreshInterval}
                                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                    className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                >
                                    <option value={10}>10s</option>
                                    <option value={30}>30s</option>
                                    <option value={60}>1m</option>
                                    <option value={300}>5m</option>
                                </select>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? "Actualizando..." : "Actualizar"}
                        </button>
                    </div>
                </div>

                {lastUpdate && (
                    <p className="text-sm text-gray-500 mt-2">
                        Última actualización: {formatTime(lastUpdate)}
                    </p>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Overall System Status */}
            {systemHealth && (
                <div className="mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Estado General del Sistema</h2>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.status)}`}>
                                {systemHealth.status.toUpperCase()}
                            </span>
                        </div>

                        {/* Información básica del sistema */}
                        <div className="text-sm text-gray-600">
                            Estado del sistema actualizado: {formatTime(systemHealth.timestamp)}
                        </div>
                    </div>
                </div>
            )}

            {/* Services Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Database Health */}
                {databaseHealth && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                Base de Datos
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(databaseHealth.database.status)}`}>
                                {databaseHealth.database.status}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm">{databaseHealth.database.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{formatTime(databaseHealth.timestamp)}</p>
                    </div>
                )}

                {/* Cache Health */}
                {cacheHealth && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Cache
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cacheHealth.cache.status)}`}>
                                {cacheHealth.cache.status}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm">{cacheHealth.cache.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{formatTime(cacheHealth.timestamp)}</p>
                    </div>
                )}
            </div>

            {/* System Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Version Information */}
                {versionInfo && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Información de Versión
                        </h3>
                        <dl className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Versión del Sistema:</dt>
                                <dd className="font-medium">{versionInfo.version}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Django:</dt>
                                <dd className="font-medium">{versionInfo.django_version}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Python:</dt>
                                <dd className="font-medium">{versionInfo.python_version}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Entorno:</dt>
                                <dd className="font-medium">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${versionInfo.environment === 'production' ? 'bg-red-100 text-red-800' :
                                        versionInfo.environment === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {versionInfo.environment}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 mb-1">Apps Cargadas ({versionInfo.apps.length}):</dt>
                                <dd className="text-xs">
                                    <div className="flex flex-wrap gap-1">
                                        {versionInfo.apps.map((app) => (
                                            <span key={app} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                                {app}
                                            </span>
                                        ))}
                                    </div>
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}

                {/* System Status */}
                {systemStatus && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Estado del Sistema
                        </h3>
                        <dl className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Base de Datos:</dt>
                                <dd className={`font-medium ${systemStatus.database === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                                    {systemStatus.database}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Cache:</dt>
                                <dd className={`font-medium ${systemStatus.cache === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                    {systemStatus.cache}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Middleware:</dt>
                                <dd className={`font-medium ${systemStatus.middleware === 'loaded' ? 'text-green-600' : 'text-red-600'}`}>
                                    {systemStatus.middleware}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Apps Cargadas:</dt>
                                <dd className="font-medium">{systemStatus.apps_loaded}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Modo Debug:</dt>
                                <dd className={`font-medium ${systemStatus.debug_mode ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {systemStatus.debug_mode ? 'Activado' : 'Desactivado'}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Entorno:</dt>
                                <dd className="font-medium">{systemStatus.environment}</dd>
                            </div>
                        </dl>
                    </div>
                )}
            </div>
        </div>
    );
}