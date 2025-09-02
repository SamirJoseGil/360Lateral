import React from "react";
import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";

// Tipo para los tratamientos POT
type TratamientoPOT = {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
};

// Tipo para la respuesta del loader
interface LoaderData {
    user?: any;
    tratamientos?: TratamientoPOT[];
    searchResult?: any;
    searchResults?: any[];
    searchError?: string;
    searchType?: string;
}

interface LoteFormFieldsProps {
    formValues: {
        nombre: string;
        direccion: string;
        area: string;
        estrato: string;
        descripcion: string;
        matricula: string;
        codigo_catastral: string;
        cbml: string;
        barrio: string;
        tratamiento_pot: string;
        uso_suelo: string;
        clasificacion_suelo: string;
        restriccion_ambiental_riesgo: string;
        restriccion_ambiental_retiros: string;
        densidad_habitacional: string;
        altura_normativa: string;
        latitud: string;
        longitud: string;
    };
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    usarUbicacion: boolean;
    setUsarUbicacion: (usar: boolean) => void;
    actionData?: any;
}

export default function LoteFormFields({
    formValues,
    onInputChange,
    usarUbicacion,
    setUsarUbicacion,
    actionData
}: LoteFormFieldsProps) {
    const [tratamientos, setTratamientos] = useState<TratamientoPOT[]>([]);
    const dataFetcher = useFetcher<LoaderData>();

    // Cargar los tratamientos al montar el componente
    useEffect(() => {
        // Fetchear los tratamientos POT disponibles
        dataFetcher.load("/owner/lote/nuevo");
    }, []);

    // Procesar los datos recibidos
    useEffect(() => {
        if (dataFetcher.data?.tratamientos) {
            setTratamientos(dataFetcher.data.tratamientos);
            console.log("Tratamientos POT cargados:", dataFetcher.data.tratamientos);
        }
    }, [dataFetcher.data]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sección: Información básica */}
            <div className="col-span-2">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Información básica del lote</h3>
            </div>

            <div className="space-y-1">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Nombre del Lote *
                </label>
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    placeholder="Ej: Lote Centro Medellín"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.nombre}
                    onChange={onInputChange}
                />
                {actionData?.errors?.nombre && (
                    <p className="text-xs text-red-600">{actionData.errors.nombre}</p>
                )}
            </div>

            <div className="space-y-1">
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                    Dirección *
                </label>
                <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    required
                    placeholder="Ej: Calle 50 #45-67"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.direccion}
                    onChange={onInputChange}
                />
                {actionData?.errors?.direccion && (
                    <p className="text-xs text-red-600">{actionData.errors.direccion}</p>
                )}
            </div>

            <div className="space-y-1">
                <label htmlFor="cbml" className="block text-sm font-medium text-gray-700">
                    CBML *
                </label>
                <input
                    type="text"
                    id="cbml"
                    name="cbml"
                    required
                    placeholder="Ej: 04050010105"
                    className={`mt-1 block w-full border ${actionData?.errors?.cbml ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    value={formValues.cbml}
                    onChange={onInputChange}
                />
                {actionData?.errors?.cbml ? (
                    <p className="text-xs text-red-600">{actionData.errors.cbml}</p>
                ) : (
                    <p className="text-xs text-gray-500 mt-1">
                        Código de Bien de Medellín - Requerido para la creación del lote
                    </p>
                )}
            </div>            <div className="space-y-1">
                <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                    Área (m²) *
                </label>
                <input
                    type="number"
                    id="area"
                    name="area"
                    step="0.01"
                    required
                    placeholder="Ej: 320.5"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.area}
                    onChange={onInputChange}
                />
                {actionData?.errors?.area && (
                    <p className="text-xs text-red-600">{actionData.errors.area}</p>
                )}
            </div>

            <div className="space-y-1">
                <label htmlFor="barrio" className="block text-sm font-medium text-gray-700">
                    Barrio
                </label>
                <input
                    type="text"
                    id="barrio"
                    name="barrio"
                    placeholder="Ej: El Poblado"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.barrio || ''}
                    onChange={onInputChange}
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="estrato" className="block text-sm font-medium text-gray-700">
                    Estrato
                </label>
                <select
                    id="estrato"
                    name="estrato"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.estrato}
                    onChange={onInputChange}
                >
                    <option value="">Seleccionar estrato</option>
                    {[1, 2, 3, 4, 5, 6].map(estrato => (
                        <option key={estrato} value={estrato}>
                            Estrato {estrato}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sección: Información de identificación */}
            <div className="col-span-2 mt-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Información legal e identificación</h3>
            </div>

            <div className="space-y-1">
                <label htmlFor="matricula" className="block text-sm font-medium text-gray-700">
                    Matrícula Inmobiliaria
                </label>
                <input
                    type="text"
                    id="matricula"
                    name="matricula"
                    placeholder="Ej: 01234567"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.matricula}
                    onChange={onInputChange}
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="codigo_catastral" className="block text-sm font-medium text-gray-700">
                    Código Catastral
                </label>
                <input
                    type="text"
                    id="codigo_catastral"
                    name="codigo_catastral"
                    placeholder="Ej: 050010105678900000"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.codigo_catastral}
                    onChange={onInputChange}
                />
            </div>

            {/* Sección: Información de clasificación y restricciones */}
            <div className="col-span-2 mt-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Información de clasificación y normativa</h3>
            </div>

            <div className="space-y-1">
                <label htmlFor="clasificacion_suelo" className="block text-sm font-medium text-gray-700">
                    Clasificación de Suelo
                </label>
                <input
                    type="text"
                    id="clasificacion_suelo"
                    name="clasificacion_suelo"
                    placeholder="Ej: Urbano"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.clasificacion_suelo}
                    onChange={onInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Tipo de suelo según el POT (Urbano, Rural, Expansión, etc.)
                </p>
            </div>

            <div className="space-y-1">
                <label htmlFor="tratamiento_pot" className="block text-sm font-medium text-gray-700">
                    Tratamiento POT
                </label>
                <select
                    id="tratamiento_pot"
                    name="tratamiento_pot"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.tratamiento_pot}
                    onChange={onInputChange}
                >
                    <option value="">Seleccionar tratamiento</option>
                    {(Array.isArray(tratamientos) ? tratamientos : []).map((tratamiento) => (
                        <option key={tratamiento.id} value={tratamiento.codigo}>
                            {tratamiento.nombre} ({tratamiento.codigo})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    Define el tipo de intervención urbana permitida en el lote
                </p>
            </div>

            <div className="space-y-1">
                <label htmlFor="restriccion_ambiental_riesgo" className="block text-sm font-medium text-gray-700">
                    Restricción Ambiental - Riesgo
                </label>
                <input
                    type="text"
                    id="restriccion_ambiental_riesgo"
                    name="restriccion_ambiental_riesgo"
                    placeholder="Ej: Sin condiciones de riesgo identificadas"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.restriccion_ambiental_riesgo}
                    onChange={onInputChange}
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="restriccion_ambiental_retiros" className="block text-sm font-medium text-gray-700">
                    Restricción Ambiental - Retiros
                </label>
                <input
                    type="text"
                    id="restriccion_ambiental_retiros"
                    name="restriccion_ambiental_retiros"
                    placeholder="Ej: Sin restricciones por retiros"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.restriccion_ambiental_retiros}
                    onChange={onInputChange}
                />
            </div>

            {/* Información de aprovechamiento urbano */}
            <div className="space-y-1">
                <label htmlFor="densidad_habitacional" className="block text-sm font-medium text-gray-700">
                    Densidad Habitacional Máxima
                </label>
                <input
                    type="text"
                    id="densidad_habitacional"
                    name="densidad_habitacional"
                    placeholder="Ej: 180 viv/ha"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.densidad_habitacional}
                    onChange={onInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Número máximo de viviendas por hectárea permitidas
                </p>
            </div>

            <div className="space-y-1">
                <label htmlFor="altura_normativa" className="block text-sm font-medium text-gray-700">
                    Altura Normativa
                </label>
                <input
                    type="text"
                    id="altura_normativa"
                    name="altura_normativa"
                    placeholder="Ej: 5 pisos"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.altura_normativa}
                    onChange={onInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Altura máxima permitida para construcción
                </p>
            </div>

            <div className="space-y-1">
                <label htmlFor="uso_suelo" className="block text-sm font-medium text-gray-700">
                    Uso de Suelo
                </label>
                <input
                    type="text"
                    id="uso_suelo"
                    name="uso_suelo"
                    placeholder="Ej: Mixto - comercial/residencial"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.uso_suelo}
                    onChange={onInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Define los tipos de actividades permitidas en este terreno
                </p>
            </div>

            {/* Descripción */}
            <div className="space-y-1 col-span-2">
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                    Descripción
                </label>
                <textarea
                    id="descripcion"
                    name="descripcion"
                    rows={3}
                    placeholder="Describa características importantes del lote..."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formValues.descripcion}
                    onChange={onInputChange}
                ></textarea>
            </div>
        </div>
    );
}