import React, { useState, useEffect } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { MapGisLoteDetalle } from '~/services/mapgis.server';

interface LoteFormProps {
    mapGisData?: MapGisLoteDetalle | null;
    initialValues?: any;
    onSubmit?: (data: any) => void;
    isEditing?: boolean;
}

export default function LoteForm({ mapGisData, initialValues, onSubmit, isEditing = false }: LoteFormProps) {
    const navigation = useNavigation();
    const actionData = useActionData<{ error?: string }>();
    const isSubmitting = navigation.state === "submitting";

    // Form state
    const [formData, setFormData] = useState({
        cbml: '',
        area: '',
        clasificacion_suelo: '',
        uso_suelo_categoria: '',
        uso_suelo_subcategoria: '',
        tratamiento: '',
        densidad_habitacional_max: '',
        altura_normativa: '',
        amenaza_riesgo: '',
        retiros_rios: '',
        // Campos adicionales que pueden ser útiles
        direccion: '',
        matricula: '',
        barrio: '',
        comuna: '',
        estrato: '',
        // ... otros campos del formulario
    });

    // Actualizar el formulario cuando cambien los datos de MapGIS
    useEffect(() => {
        if (mapGisData) {
            setFormData({
                cbml: mapGisData.cbml || '',
                area: mapGisData.area_lote_m2?.toString() || '',
                clasificacion_suelo: mapGisData.clasificacion_suelo || '',
                uso_suelo_categoria: mapGisData.uso_suelo?.categoria_uso || '',
                uso_suelo_subcategoria: mapGisData.uso_suelo?.subcategoria_uso || '',
                tratamiento: mapGisData.aprovechamiento_urbano?.tratamiento || '',
                densidad_habitacional_max: mapGisData.aprovechamiento_urbano?.densidad_habitacional_max?.toString() || '',
                altura_normativa: mapGisData.aprovechamiento_urbano?.altura_normativa || '',
                amenaza_riesgo: mapGisData.restricciones_ambientales?.amenaza_riesgo || '',
                retiros_rios: mapGisData.restricciones_ambientales?.retiros_rios || '',
                direccion: mapGisData.direccion || '',
                matricula: mapGisData.matricula || '',
                barrio: mapGisData.barrio || '',
                comuna: mapGisData.comuna || '',
                estrato: mapGisData.estrato?.toString() || '',
                // ... actualizar otros campos
            });
        } else if (initialValues) {
            setFormData(initialValues);
        }
    }, [mapGisData, initialValues]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(formData);
        }
    };

    return (
        <Form method="post" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
                <h2 className="text-xl font-bold mb-4">Datos del Lote</h2>

                {/* CBML */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cbml">
                        CBML (11 dígitos) {/* ✅ CORREGIDO: Indicar 11 dígitos */}
                    </label>
                    <input
                        type="text"
                        name="cbml"
                        id="cbml"
                        maxLength={11}  {/* ✅ CORREGIDO: 11 caracteres (antes era 14) */}
                        value={formData.cbml}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        readOnly={!!mapGisData}
                        placeholder="05001000000"  {/* ✅ CORREGIDO: Ejemplo de 11 dígitos */}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Código de identificación catastral de MapGIS Medellín
                    </p>
                </div>

                {/* Área */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="area">
                        Área (m²)
                    </label>
                    <input
                        type="text"
                        name="area"
                        id="area"
                        value={formData.area}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                {/* Clasificación del Suelo */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clasificacion_suelo">
                        Clasificación del Suelo
                    </label>
                    <input
                        type="text"
                        name="clasificacion_suelo"
                        id="clasificacion_suelo"
                        value={formData.clasificacion_suelo}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Uso del Suelo - Categoría */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="uso_suelo_categoria">
                            Categoría de Uso
                        </label>
                        <input
                            type="text"
                            name="uso_suelo_categoria"
                            id="uso_suelo_categoria"
                            value={formData.uso_suelo_categoria}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    {/* Uso del Suelo - Subcategoría */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="uso_suelo_subcategoria">
                            Subcategoría de Uso
                        </label>
                        <input
                            type="text"
                            name="uso_suelo_subcategoria"
                            id="uso_suelo_subcategoria"
                            value={formData.uso_suelo_subcategoria}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-2">Aprovechamiento Urbano</h3>

                {/* Tratamiento */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tratamiento">
                        Tratamiento
                    </label>
                    <input
                        type="text"
                        name="tratamiento"
                        id="tratamiento"
                        value={formData.tratamiento}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Densidad Habitacional Máxima */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="densidad_habitacional_max">
                            Densidad Habitacional Máxima
                        </label>
                        <input
                            type="text"
                            name="densidad_habitacional_max"
                            id="densidad_habitacional_max"
                            value={formData.densidad_habitacional_max}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    {/* Altura Normativa */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="altura_normativa">
                            Altura Normativa
                        </label>
                        <input
                            type="text"
                            name="altura_normativa"
                            id="altura_normativa"
                            value={formData.altura_normativa}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-2">Restricciones Ambientales</h3>

                {/* Amenaza/Riesgo */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amenaza_riesgo">
                        Amenaza/Riesgo
                    </label>
                    <input
                        type="text"
                        name="amenaza_riesgo"
                        id="amenaza_riesgo"
                        value={formData.amenaza_riesgo}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                {/* Retiros Ríos */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="retiros_rios">
                        Retiros Ríos
                    </label>
                    <input
                        type="text"
                        name="retiros_rios"
                        id="retiros_rios"
                        value={formData.retiros_rios}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                {/* Botón de envío */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
                    >
                        {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Lote' : 'Crear Lote'}
                    </button>
                </div>

                {/* Mensaje de error */}
                {actionData?.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4" role="alert">
                        <p>{actionData.error}</p>
                    </div>
                )}
            </div>
        </Form>
    );
}