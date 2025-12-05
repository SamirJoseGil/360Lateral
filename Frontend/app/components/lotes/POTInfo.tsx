// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\components\POTInfo.tsx
import React from 'react';

export type POTData = {
    cbml: string;
    tratamiento_encontrado: string;
    codigo_tratamiento: string;
    normativa: {
        id: number;
        codigo: string;
        nombre: string;
        descripcion: string;
        indice_ocupacion: string;
        indice_construccion: string;
        altura_maxima: number;
        retiro_frontal?: string;
        retiro_lateral?: string;
        retiro_posterior?: string;
        frentes_minimos?: Array<{
            id: number;
            tipo_vivienda: string;
            tipo_vivienda_display: string;
            frente_minimo: string;
        }>;
        areas_minimas_lote?: Array<{
            id: number;
            tipo_vivienda: string;
            tipo_vivienda_display: string;
            area_minima: string;
        }>;
        areas_minimas_vivienda?: Array<{
            id: number;
            tipo_vivienda: string;
            tipo_vivienda_display: string;
            area_minima: string;
        }>;
        activo: boolean;
    };
    datos_mapgis?: {
        area_lote_m2: number;
        clasificacion_suelo: string;
        aprovechamiento_urbano: {
            tratamiento: string;
            densidad_habitacional_max: number;
            altura_normativa: number;
        };
    };
};

interface POTInfoProps {
    potData: POTData;
    showMapGisData?: boolean;
    compact?: boolean;
    className?: string;
}

export default function POTInfo({
    potData,
    showMapGisData = true,
    compact = false,
    className = ""
}: POTInfoProps) {
    if (!potData || !potData.codigo_tratamiento) {
        return (
            <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
                <p className="text-gray-500 text-sm">No hay información de normativa POT disponible</p>
            </div>
        );
    }

    const { normativa, datos_mapgis } = potData;

    if (compact) {
        return (
            <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
                <div className="flex justify-between items-start mb-2">
                    <h4 className="text-md font-semibold text-blue-900">
                        {potData.tratamiento_encontrado}
                    </h4>
                    <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded">
                        {potData.codigo_tratamiento}
                    </span>
                </div>

                {normativa && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-700 font-medium">IO:</span>
                            <span className="text-blue-800 ml-1">
                                {(parseFloat(normativa.indice_ocupacion) * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div>
                            <span className="text-blue-700 font-medium">IC:</span>
                            <span className="text-blue-800 ml-1">{normativa.indice_construccion}</span>
                        </div>
                        <div>
                            <span className="text-blue-700 font-medium">Alt:</span>
                            <span className="text-blue-800 ml-1">{normativa.altura_maxima}p</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
            {/* Header del tratamiento */}
            <div className="bg-blue-50 px-4 py-3 border-b">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900">
                            {potData.tratamiento_encontrado}
                        </h3>
                        <p className="text-blue-700 text-sm">Código: {potData.codigo_tratamiento}</p>
                    </div>
                    <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                        POT
                    </span>
                </div>

                {normativa?.descripcion && (
                    <p className="text-blue-800 text-sm mt-2">{normativa.descripcion}</p>
                )}
            </div>

            <div className="p-4">
                {/* Índices urbanísticos principales */}
                {normativa && (
                    <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Índices Urbanísticos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded p-3">
                                <dt className="text-sm font-medium text-gray-500">Índice de Ocupación</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">
                                    {(parseFloat(normativa.indice_ocupacion) * 100).toFixed(0)}%
                                </dd>
                            </div>

                            <div className="bg-gray-50 rounded p-3">
                                <dt className="text-sm font-medium text-gray-500">Índice de Construcción</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">
                                    {normativa.indice_construccion}
                                </dd>
                            </div>

                            <div className="bg-gray-50 rounded p-3">
                                <dt className="text-sm font-medium text-gray-500">Altura Máxima</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">
                                    {normativa.altura_maxima} pisos
                                </dd>
                            </div>
                        </div>
                    </div>
                )}

                {/* Retiros mínimos */}
                {normativa && (normativa.retiro_frontal || normativa.retiro_lateral || normativa.retiro_posterior) && (
                    <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Retiros Mínimos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {normativa.retiro_frontal && (
                                <div className="bg-gray-50 rounded p-3">
                                    <dt className="text-sm font-medium text-gray-500">Frontal</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{normativa.retiro_frontal} m</dd>
                                </div>
                            )}

                            {normativa.retiro_lateral && (
                                <div className="bg-gray-50 rounded p-3">
                                    <dt className="text-sm font-medium text-gray-500">Lateral</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{normativa.retiro_lateral} m</dd>
                                </div>
                            )}

                            {normativa.retiro_posterior && (
                                <div className="bg-gray-50 rounded p-3">
                                    <dt className="text-sm font-medium text-gray-500">Posterior</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{normativa.retiro_posterior} m</dd>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Frentes mínimos */}
                {normativa?.frentes_minimos && normativa.frentes_minimos.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Frentes Mínimos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {normativa.frentes_minimos.map((frente) => (
                                <div key={frente.id} className="bg-gray-50 rounded p-3">
                                    <dt className="text-sm font-medium text-gray-500">{frente.tipo_vivienda_display}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{frente.frente_minimo} m</dd>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Áreas mínimas de lote */}
                {normativa?.areas_minimas_lote && normativa.areas_minimas_lote.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Áreas Mínimas de Lote</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {normativa.areas_minimas_lote.map((area) => (
                                <div key={area.id} className="bg-gray-50 rounded p-3">
                                    <dt className="text-sm font-medium text-gray-500">{area.tipo_vivienda_display}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{area.area_minima} m²</dd>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Áreas mínimas de vivienda */}
                {normativa?.areas_minimas_vivienda && normativa.areas_minimas_vivienda.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Áreas Mínimas de Vivienda</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {normativa.areas_minimas_vivienda.map((area) => (
                                <div key={area.id} className="bg-gray-50 rounded p-3">
                                    <dt className="text-sm font-medium text-gray-500">{area.tipo_vivienda_display}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{area.area_minima} m²</dd>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Datos de MapGIS */}
                {showMapGisData && datos_mapgis && (
                    <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-md font-medium text-green-900 mb-3">Información de MapGIS</h4>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {datos_mapgis.area_lote_m2 && (
                                <div>
                                    <dt className="font-medium text-green-700">Área del lote</dt>
                                    <dd className="text-green-800">{datos_mapgis.area_lote_m2.toLocaleString()} m²</dd>
                                </div>
                            )}

                            {datos_mapgis.clasificacion_suelo && (
                                <div>
                                    <dt className="font-medium text-green-700">Clasificación del suelo</dt>
                                    <dd className="text-green-800">{datos_mapgis.clasificacion_suelo}</dd>
                                </div>
                            )}

                            {datos_mapgis.aprovechamiento_urbano?.densidad_habitacional_max && (
                                <div>
                                    <dt className="font-medium text-green-700">Densidad habitacional máx.</dt>
                                    <dd className="text-green-800">
                                        {datos_mapgis.aprovechamiento_urbano.densidad_habitacional_max} viv/ha
                                    </dd>
                                </div>
                            )}

                            {datos_mapgis.aprovechamiento_urbano?.altura_normativa && (
                                <div>
                                    <dt className="font-medium text-green-700">Altura normativa</dt>
                                    <dd className="text-green-800">
                                        {datos_mapgis.aprovechamiento_urbano.altura_normativa} pisos
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                )}
            </div>
        </div>
    );
}