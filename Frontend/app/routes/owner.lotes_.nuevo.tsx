// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.lote.nuevo.tsx
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { createLote } from "~/services/lotes.server";

// Tipo para los datos de un nuevo lote
type NuevoLoteData = {
    nombre: string; // Obligatorio
    cbml?: string;
    descripcion?: string;
    direccion?: string;
    area?: number;
    codigo_catastral?: string;
    matricula?: string;
    barrio?: string;
    estrato?: number;
    latitud?: number;
    longitud?: number;
    uso_suelo?: string;
    clasificacion_suelo?: string;
    metadatos?: Record<string, any>;
    status?: string; // Por defecto 'active'
    owner?: string | number; // ID del propietario
};

// Endpoint adicional para búsquedas de MapGIS
export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar autenticación
    const user = await getUser(request);

    if (!user) {
        return json({ error: "No autenticado" }, { status: 401 });
    }

    if (user.role !== "owner") {
        return json({ error: "No autorizado" }, { status: 403 });
    }

    // No se necesita lógica de búsqueda
    return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    try {
        // Procesar el formulario
        const formData = await request.formData();

        // Obtener los campos adicionales para crear la descripción detallada
        const clasificacionSuelo = formData.get("clasificacion_suelo")?.toString();
        const restriccionRiesgo = formData.get("restriccion_ambiental_riesgo")?.toString();
        const restriccionRetiros = formData.get("restriccion_ambiental_retiros")?.toString();
        const usoSuelo = formData.get("uso_suelo")?.toString();

        // Descripción original
        let descripcion = formData.get("descripcion")?.toString() || "";

        // Si existe información normativa pero no hay descripción personalizada, 
        // generar una descripción automática con la información normativa (sin campos POT)
        if (!descripcion && (clasificacionSuelo || restriccionRiesgo || restriccionRetiros)) {
            descripcion = `Información normativa del lote:\n\n`;
            if (clasificacionSuelo) descripcion += `Clasificación de suelo: ${clasificacionSuelo}\n\n`;
            if (restriccionRiesgo || restriccionRetiros) {
                descripcion += `Restricciones ambientales:\n`;
                if (restriccionRiesgo) descripcion += `- ${restriccionRiesgo}\n`;
                if (restriccionRetiros) descripcion += `- ${restriccionRetiros}\n\n`;
            }
            if (usoSuelo) descripcion += `\nUso de suelo: ${usoSuelo}`;
        }

        const loteData: NuevoLoteData = {
            nombre: formData.get("nombre")?.toString() || "",
            descripcion: descripcion,
            direccion: formData.get("direccion")?.toString() || "",
            area: parseFloat(formData.get("area")?.toString() || "0"),
            codigo_catastral: formData.get("codigo_catastral")?.toString(),
            matricula: formData.get("matricula")?.toString(),
            cbml: formData.get("cbml")?.toString(),
            estrato: parseInt(formData.get("estrato")?.toString() || "0") || undefined,
            uso_suelo: usoSuelo,
            latitud: parseFloat(formData.get("latitud")?.toString() || "0") || undefined,
            longitud: parseFloat(formData.get("longitud")?.toString() || "0") || undefined,
        };

        // Validaciones SIMPLIFICADAS - solo requerir nombre y dirección
        const errors: {
            nombre?: string;
            direccion?: string;
            form?: string;
        } = {};

        if (!loteData.nombre) errors.nombre = "El nombre es obligatorio";
        if (!loteData.direccion) errors.direccion = "La dirección es obligatoria";
        // ✅ TEMPORAL: CBML ya no es obligatorio
        // if (!loteData.cbml) errors.cbml = "El código CBML es obligatorio";

        // Si hay errores, retornarlos
        if (Object.keys(errors).length > 0) {
            return json({ errors, values: loteData });
        }

        console.log("Creando nuevo lote:", loteData.nombre);

        // Crear el lote con los campos obligatorios y opcionales
        // Definir metadatos como objeto vacío (puedes agregar lógica para poblarlo si lo necesitas)
        const metadatos: Record<string, any> = {};

        const lotePayload = {
            nombre: loteData.nombre,
            direccion: loteData.direccion || "",
            descripcion: loteData.descripcion,
            cbml: loteData.cbml || "", // ✅ Opcional temporalmente
            matricula: loteData.matricula,
            codigo_catastral: loteData.codigo_catastral,
            estrato: loteData.estrato,
            uso_suelo: loteData.uso_suelo,
            clasificacion_suelo: loteData.clasificacion_suelo,
            metadatos: Object.keys(metadatos).length > 0 ? metadatos : undefined,
            status: "active", // Por defecto activo
            owner: user.id // Agregar el owner requerido
        };

        // Añadir campos opcionales solo si tienen valor
        if (loteData.area) {
            (lotePayload as any).area = loteData.area;
        }

        if (loteData.latitud && loteData.longitud) {
            (lotePayload as any).latitud = loteData.latitud;
            (lotePayload as any).longitud = loteData.longitud;
        }

        if (formData.get("barrio")) {
            (lotePayload as any).barrio = formData.get("barrio")?.toString();
        }

        try {
            console.log("Enviando payload al servidor:", lotePayload);
            const resultado = await createLote(request, lotePayload);
            console.log("[Lotes] Lote creado con ID:", resultado.lote.id);

            // Preparar los datos para la redirección y el modal
            console.log(`[Lotes] Lote creado con ID: ${resultado.lote.id}`);

            // Redirigir a la página del lote creado, pero incluir información para el modal
            return redirect(`/owner/lote/${resultado.lote.id}`, {
                headers: {
                    ...resultado.headers,
                    'X-Lote-Created': 'true',
                    'X-Lote-Id': resultado.lote.id.toString()
                }
            });
        } catch (error) {
            console.error("[Lotes] Error en la creación:", error);
            return json({
                errors: {
                    form: "Error al crear el lote en el servidor. Por favor intente nuevamente."
                },
                values: loteData
            });
        }
    } catch (error) {
        console.error("Error creando lote:", error);
        return json({
            errors: { form: "Error al crear el lote. Por favor intente nuevamente." },
            values: Object.fromEntries(await request.formData())
        });
    }
}

export default function NuevoLote() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();

    // ✅ FORMULARIO SIMPLIFICADO - Solo campos esenciales
    const [formData, setFormData] = useState({
        // Campos obligatorios
        nombre: '',
        direccion: '',

        // Campos importantes (opcionales)
        area: '',
        cbml: '',
        matricula: '',
        descripcion: '',
        barrio: '',
        estrato: '',

        // Campos automáticos (se llenan desde MapGIS) - TEMPORALMENTE MANUALES
        latitud: '',
        longitud: '',
        clasificacion_suelo: '',
        uso_suelo: '',
        tratamiento_pot: '',
    });

    const isSubmitting = navigation.state === "submitting";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Lote</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Complete los campos básicos para registrar un lote. Solo Nombre y Dirección son obligatorios.
                        </p>
                    </div>
                    <Link
                        to="/owner"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        ← Volver
                    </Link>
                </div>
            </div>

            {/* Formulario principal */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Información del Lote</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Los campos marcados con * son obligatorios. Los demás campos son opcionales.
                    </p>
                </div>

                <Form method="post" className="p-6">
                    {/* Mostrar errores generales */}
                    {actionData?.errors && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">
                                        {typeof actionData.errors === "object"
                                            ? actionData.errors.form
                                            : actionData.errors}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ✅ CAMPOS OBLIGATORIOS */}

                        {/* Nombre del lote */}
                        <div className="md:col-span-2">
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del Lote *
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Lote Central Poblado"
                            />
                            {actionData?.errors && "nombre" in actionData.errors && actionData.errors.nombre && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.nombre}</p>
                            )}
                        </div>

                        {/* Dirección */}
                        <div className="md:col-span-2">
                            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección *
                            </label>
                            <input
                                type="text"
                                id="direccion"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Carrera 43A #16-25"
                            />
                            {actionData?.errors && typeof actionData.errors === "object" && "direccion" in actionData.errors && actionData.errors.direccion && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.direccion}</p>
                            )}
                        </div>

                        {/* ✅ CAMPOS OPCIONALES (ahora todos editables) */}

                        {/* Área */}
                        <div>
                            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                                Área (m²)
                            </label>
                            <input
                                type="number"
                                id="area"
                                name="area"
                                value={formData.area}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: 500"
                            />
                        </div>

                        {/* Estrato */}
                        <div>
                            <label htmlFor="estrato" className="block text-sm font-medium text-gray-700 mb-2">
                                Estrato
                            </label>
                            <select
                                id="estrato"
                                name="estrato"
                                value={formData.estrato}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccionar estrato</option>
                                <option value="1">Estrato 1</option>
                                <option value="2">Estrato 2</option>
                                <option value="3">Estrato 3</option>
                                <option value="4">Estrato 4</option>
                                <option value="5">Estrato 5</option>
                                <option value="6">Estrato 6</option>
                            </select>
                        </div>

                        {/* CBML */}
                        <div>
                            <label htmlFor="cbml" className="block text-sm font-medium text-gray-700 mb-2">
                                CBML
                            </label>
                            <input
                                type="text"
                                id="cbml"
                                name="cbml"
                                value={formData.cbml}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: 01005001234"
                            />
                        </div>

                        {/* Matrícula */}
                        <div>
                            <label htmlFor="matricula" className="block text-sm font-medium text-gray-700 mb-2">
                                Matrícula Inmobiliaria
                            </label>
                            <input
                                type="text"
                                id="matricula"
                                name="matricula"
                                value={formData.matricula}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: 174838"
                            />
                        </div>

                        {/* Barrio */}
                        <div>
                            <label htmlFor="barrio" className="block text-sm font-medium text-gray-700 mb-2">
                                Barrio
                            </label>
                            <input
                                type="text"
                                id="barrio"
                                name="barrio"
                                value={formData.barrio}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: El Poblado"
                            />
                        </div>

                        {/* ✅ CAMPOS AUTOMÁTICOS (ahora editables temporalmente) */}

                        {/* Clasificación del suelo */}
                        <div>
                            <label htmlFor="clasificacion_suelo" className="block text-sm font-medium text-gray-700 mb-2">
                                Clasificación del Suelo
                            </label>
                            <input
                                type="text"
                                id="clasificacion_suelo"
                                name="clasificacion_suelo"
                                value={formData.clasificacion_suelo}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Suelo de expansión urbana"
                            />
                        </div>

                        {/* Uso del suelo */}
                        <div>
                            <label htmlFor="uso_suelo" className="block text-sm font-medium text-gray-700 mb-2">
                                Uso del Suelo
                            </label>
                            <input
                                type="text"
                                id="uso_suelo"
                                name="uso_suelo"
                                value={formData.uso_suelo}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Residencial"
                            />
                        </div>

                        {/* Descripción */}
                        <div className="md:col-span-2">
                            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Descripción opcional del lote..."
                            />
                        </div>
                    </div>

                    {/* Hidden fields para campos automáticos */}
                    <input type="hidden" name="latitud" value={formData.latitud} />
                    <input type="hidden" name="longitud" value={formData.longitud} />
                    <input type="hidden" name="tratamiento_pot" value={formData.tratamiento_pot} />

                    {/* Botones */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <Link
                            to="/owner"
                            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Registrando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Registrar Lote</span>
                                </>
                            )}
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}