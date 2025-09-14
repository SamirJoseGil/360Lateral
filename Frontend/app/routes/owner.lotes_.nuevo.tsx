// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.lote.nuevo.tsx
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { createLote, getTratamientosPOT } from "~/services/lotes.server";
import { getNormativaPorCBML, getTratamientosActivosPOT } from "~/services/pot.server";
import StatusModal from "~/components/StatusModal";
import { useNavigate } from "@remix-run/react";
import { consultarPorCBML, consultarPorMatricula, consultarPorDireccion } from "~/services/mapgis.server";
import LoteSearchSection from "~/components/LoteSearchSection";
import LoteFormFields from "~/components/LoteFormFields";
import type { DireccionResult } from "~/components/DireccionSearchResults";
import { analyzeSellability, extractPotDataFromText } from "~/utils/pot-analysis";
import PotAnalysis from "~/components/PotAnalysis";

// Tipo para los datos de un nuevo lote
type NuevoLoteData = {
    nombre: string; // Obligatorio
    cbml?: string; // Obligatorio según la documentación
    descripcion?: string;
    direccion?: string;
    area?: number;
    codigo_catastral?: string;
    matricula?: string;
    barrio?: string;
    estrato?: number;
    latitud?: number;
    longitud?: number;
    // Eliminamos el campo tratamiento_pot
    uso_suelo?: string;
    clasificacion_suelo?: string;
    metadatos?: Record<string, any>;
    status?: string; // Por defecto 'active'
    owner?: string | number; // ID del propietario
};

// Endpoint adicional para búsquedas de MapGIS
export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    const url = new URL(request.url);
    const searchType = url.searchParams.get('searchType');
    const searchValue = url.searchParams.get('searchValue');

    // Si hay parámetros de búsqueda, realizar la consulta a MapGIS
    if (searchType && searchValue) {
        console.log(`Loader: Buscando ${searchType}: ${searchValue}`);
        try {
            let result;

            switch (searchType) {
                case 'cbml':
                    result = await consultarPorCBML(request, searchValue);
                    console.log('Resultado CBML:', result);
                    if ((result.resultado as any).encontrado) {
                        // Intentar obtener datos POT adicionales
                        let potData = null;
                        try {
                            const potResponse = await getNormativaPorCBML(request, searchValue);
                            potData = potResponse.normativa;
                            console.log('Datos POT obtenidos:', potData);
                        } catch (potError) {
                            console.error('Error obteniendo datos POT:', potError);
                            // Seguimos sin datos POT, no es crítico
                        }

                        return json({
                            user,
                            searchResult: result.resultado.datos,
                            searchType: 'cbml',
                            potData,
                            headers: result.headers
                        });
                    }
                    break;

                case 'matricula':
                    result = await consultarPorMatricula(request, searchValue);
                    console.log('Resultado matrícula:', result);
                    if (result.resultado.encontrado) {
                        return json({
                            user,
                            searchResult: result.resultado.datos,
                            searchType: 'matricula',
                            headers: result.headers
                        });
                    }
                    break;

                case 'direccion':
                    result = await consultarPorDireccion(request, searchValue);
                    if (result.resultado.encontrado) {
                        return json({
                            user,
                            searchResults: result.resultado.resultados,
                            searchType: 'direccion',
                            headers: result.headers
                        });
                    }
                    break;
            }

            // Si llegamos aquí, la búsqueda no tuvo éxito
            return json({
                user,
                searchError: `No se encontraron resultados para ${searchValue}`,
                searchType
            });
        } catch (error) {
            console.error('Error en búsqueda MapGIS:', error);
            return json({
                user,
                searchError: 'Ocurrió un error al realizar la búsqueda',
                searchType
            });
        }
    }

    try {
        // Obtener los tratamientos POT disponibles usando el servicio correcto
        const { tratamientos } = await getTratamientosActivosPOT(request);
        return json({ user, tratamientos });
    } catch (error) {
        console.error("Error obteniendo tratamientos:", error);
        return json({ user, tratamientos: [], error: "Error cargando tratamientos" });
    }
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
        // Eliminamos las referencias a los campos de tratamiento POT
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
            // Eliminamos el campo tratamiento_pot
            uso_suelo: usoSuelo,
            latitud: parseFloat(formData.get("latitud")?.toString() || "0") || undefined,
            longitud: parseFloat(formData.get("longitud")?.toString() || "0") || undefined,
        };

        // Validaciones
        const errors: {
            nombre?: string;
            direccion?: string;
            area?: string;
            cbml?: string;
            form?: string;
        } = {};

        if (!loteData.nombre) errors.nombre = "El nombre es obligatorio";
        if (!loteData.direccion) errors.direccion = "La dirección es obligatoria";
        if (!loteData.area) errors.area = "El área es obligatoria y debe ser mayor que 0";
        if (!loteData.cbml) errors.cbml = "El código CBML es obligatorio";

        // Si hay errores, retornarlos
        if (Object.keys(errors).length > 0) {
            return json({ errors, values: loteData });
        }

        console.log("Creando nuevo lote:", loteData.nombre);

        // Asegurar que los datos requeridos estén presentes
        if (!loteData.cbml) {
            errors.form = "El código CBML es obligatorio";
            return json({ errors, values: loteData });
        }

        // Crear un objeto con los metadatos adicionales
        const metadatos: Record<string, any> = {};

        // Guardar información de POT y campos normativos en metadatos (sin campos de tratamiento)
        if (
            formData.get("clasificacion_suelo") ||
            formData.get("restriccion_ambiental_riesgo") ||
            formData.get("restriccion_ambiental_retiros") ||
            formData.get("uso_suelo")
        ) {
            metadatos.pot = {
                clasificacion_suelo: formData.get("clasificacion_suelo")?.toString() || '',
                restricciones_ambientales: {
                    amenaza_riesgo: formData.get("restriccion_ambiental_riesgo")?.toString() || '',
                    retiros_rios: formData.get("restriccion_ambiental_retiros")?.toString() || ''
                },
                aprovechamiento_urbano: {
                    uso_suelo: formData.get("uso_suelo")?.toString() || ''
                    // Eliminamos los campos relacionados con tratamiento POT
                }
            };
        }

        // Crear el lote con los campos obligatorios y opcionales
        const lotePayload = {
            nombre: loteData.nombre,
            cbml: loteData.cbml || "", // Obligatorio
            direccion: loteData.direccion || "",
            descripcion: loteData.descripcion,
            matricula: loteData.matricula,
            codigo_catastral: loteData.codigo_catastral,
            estrato: loteData.estrato,
            // Eliminamos el campo tratamiento_pot
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
    const navigate = useNavigate();
    const isSubmitting = navigation.state === "submitting";
    const navigationFormMethod = navigation.formMethod;
    const navigationHasData = Object.keys(navigation).includes('formData');
    const [usarUbicacion, setUsarUbicacion] = useState(false);

    // Estados para el modal de estado
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalProps, setStatusModalProps] = useState({
        type: "loading" as "loading" | "success" | "error",
        title: "Procesando",
        message: "Creando el lote...",
        redirectUrl: "",
        redirectText: ""
    });

    // Estado del formulario con campos adicionales para la información normativa
    const [formValues, setFormValues] = useState({
        nombre: '',
        direccion: '',
        area: '',
        estrato: '',
        descripcion: '',
        matricula: '',
        codigo_catastral: '',
        cbml: '',
        barrio: '',
        tratamiento_pot: '',
        uso_suelo: '',
        clasificacion_suelo: '',
        restriccion_ambiental_riesgo: '',
        restriccion_ambiental_retiros: '',
        densidad_habitacional: '',
        altura_normativa: '',
        latitud: '',
        longitud: ''
    });

    // Estado para almacenar los datos del POT estructurados y el análisis de vendibilidad
    const [potData, setPotData] = useState<any>(null);
    const [sellabilityAnalysis, setSellabilityAnalysis] = useState<any>(null);

    // Función para manejar los datos recibidos del componente de búsqueda
    const handleMapGisDataReceived = (mapGisData: any) => {
        if (!mapGisData) return;

        console.log("MapGIS data received in parent:", mapGisData);

        // Extraer datos de las propiedades anidadas
        const areaValue = mapGisData.area_lote_m2?.toString() || '';
        const cbmlValue = mapGisData.cbml || '';
        const clasificacionSuelo = mapGisData.clasificacion_suelo || '';
        const barrioValue = mapGisData.barrio || '';

        // ELIMINADO: No procesar datos de tratamiento POT temporalmente
        let usoSuelo = '';
        let restriccionRiesgo = '';
        let restriccionRetiros = '';

        // Extraer información de uso de suelo
        if (mapGisData.uso_suelo && typeof mapGisData.uso_suelo === 'object') {
            const uso = mapGisData.uso_suelo;
            usoSuelo = `${uso.categoria_uso || ''}${uso.subcategoria_uso ? ` - ${uso.subcategoria_uso}` : ''}`;

            // Añadir porcentaje si está disponible
            if (uso.porcentaje) {
                usoSuelo += ` (${uso.porcentaje.toFixed(2)}%)`;
            }
        }

        // Extraer información de restricciones ambientales
        if (mapGisData.restricciones_ambientales && typeof mapGisData.restricciones_ambientales === 'object') {
            restriccionRiesgo = mapGisData.restricciones_ambientales.amenaza_riesgo || '';
            restriccionRetiros = mapGisData.restricciones_ambientales.retiros_rios || '';
        }

        // Actualizar el formulario con todos los datos extraídos (sin campos POT)
        setFormValues(prevValues => ({
            ...prevValues,
            direccion: mapGisData.direccion || prevValues.direccion,
            area: areaValue || prevValues.area,
            cbml: cbmlValue || prevValues.cbml,
            matricula: mapGisData.matricula || prevValues.matricula,
            codigo_catastral: mapGisData.codigo_catastral || prevValues.codigo_catastral,
            barrio: barrioValue || prevValues.barrio,
            uso_suelo: usoSuelo || prevValues.uso_suelo,
            clasificacion_suelo: clasificacionSuelo || prevValues.clasificacion_suelo,
            restriccion_ambiental_riesgo: restriccionRiesgo || prevValues.restriccion_ambiental_riesgo,
            restriccion_ambiental_retiros: restriccionRetiros || prevValues.restriccion_ambiental_retiros,
            // Eliminamos los campos de tratamientos POT
            tratamiento_pot: '', // Valor vacío en lugar de usar tratamiento
            densidad_habitacional: '', // Valor vacío en lugar de usar densidad
            altura_normativa: '', // Valor vacío en lugar de usar altura
            latitud: mapGisData.latitud?.toString() || prevValues.latitud,
            longitud: mapGisData.longitud?.toString() || prevValues.longitud
        }));

        // Si tiene coordenadas, activar la sección de ubicación
        if (mapGisData.latitud && mapGisData.longitud) {
            setUsarUbicacion(true);
        }

        // Construir datos del POT para análisis (sin campos de tratamiento)
        const newPotData = {
            area: parseFloat(areaValue) || undefined,
            clasificacion: clasificacionSuelo,
            uso_suelo: usoSuelo,
            tratamiento: '', // Valor vacío en lugar de tratamiento
            densidad: undefined, // No usar densidad
            restricciones: (restriccionRiesgo || restriccionRetiros) ?
                (restriccionRiesgo && restriccionRetiros ? 2 : 1) : 0,
            detalles_restricciones: [
                restriccionRiesgo,
                restriccionRetiros
            ].filter(Boolean)
        };

        // Guardar los datos del POT y realizar análisis de vendibilidad
        setPotData(newPotData);
        const analysis = analyzeSellability(newPotData);
        setSellabilityAnalysis(analysis);

        console.log("Análisis de vendibilidad generado:", analysis);
    };

    // Manejar selección de un resultado de dirección
    const handleDireccionSelect = async (result: DireccionResult) => {
        // Actualizar los campos básicos
        setFormValues(prev => ({
            ...prev,
            direccion: result.direccion,
            area: result.area.toString(),
            matricula: result.matricula,
            cbml: result.cbml
        }));
    };

    // Función para manejar cambios en los inputs del formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));

        // Actualizar análisis POT cuando cambien campos relevantes
        const potFields = ['area', 'clasificacion_suelo', 'uso_suelo', 'tratamiento_pot',
            'restriccion_ambiental_riesgo', 'restriccion_ambiental_retiros',
            'densidad_habitacional'];

        if (potFields.includes(name)) {
            // Actualizar con un pequeño retraso para permitir que el estado se actualice
            setTimeout(() => {
                const updatedValues = { ...formValues, [name]: value };
                const updatedPotData = {
                    area: parseFloat(updatedValues.area) || undefined,
                    clasificacion: updatedValues.clasificacion_suelo,
                    uso_suelo: updatedValues.uso_suelo,
                    tratamiento: updatedValues.tratamiento_pot,
                    densidad: parseFloat(updatedValues.densidad_habitacional) || undefined,
                    restricciones: (updatedValues.restriccion_ambiental_riesgo || updatedValues.restriccion_ambiental_retiros) ?
                        ((updatedValues.restriccion_ambiental_riesgo && updatedValues.restriccion_ambiental_retiros) ? 2 : 1) : 0,
                    detalles_restricciones: [
                        updatedValues.restriccion_ambiental_riesgo,
                        updatedValues.restriccion_ambiental_retiros
                    ].filter(Boolean)
                };

                setPotData(updatedPotData);
                const analysis = analyzeSellability(updatedPotData);
                setSellabilityAnalysis(analysis);
            }, 100);
        }
    };

    // Manejar el estado de navegación para mostrar el modal de carga/éxito
    useEffect(() => {
        console.log("Navigation state changed:", navigation.state);
        console.log("Navigation location:", navigation.location?.pathname);
        console.log("Current location:", window.location.pathname);

        // Mostrar modal de carga cuando se inicia la submisión del formulario
        if (navigation.state === "submitting") {
            setStatusModalProps({
                type: "loading",
                title: "Procesando",
                message: "Creando el lote...",
                redirectUrl: "",
                redirectText: ""
            });
            setShowStatusModal(true);
        }
        // Verificar cuando la navegación cambia a loading (redirección) o idle
        else if (navigation.state === "loading" || navigation.state === "idle") {
            // Si hay errores en los datos de acción
            if (actionData?.errors) {
                setStatusModalProps({
                    type: "error",
                    title: "Error al crear el lote",
                    message: actionData.errors.form || "Hubo un problema al crear el lote. Por favor revise los datos e intente nuevamente.",
                    redirectUrl: "",
                    redirectText: "Entendido"
                });
                // Mantener el modal visible
                setShowStatusModal(true);
            }
            // Si estamos en la ruta de un lote específico después de un POST, probablemente fue creado
            else if (navigationFormMethod === "post" && navigation.location &&
                (navigation.location.pathname.includes('/lote/') || window.location.pathname.includes('/lote/'))) {

                // Determinar el ID del lote de la navegación o de la ubicación actual
                const locationPath = navigation.location?.pathname || window.location.pathname;
                const pathParts = locationPath.split('/');
                const loteId = pathParts[pathParts.length - 1];

                if (loteId && loteId !== 'nuevo') {
                    console.log("Lote creado con ID:", loteId);
                    // Mostrar mensaje de éxito
                    setStatusModalProps({
                        type: "success",
                        title: "¡Lote creado exitosamente!",
                        message: `El lote ha sido registrado correctamente en el sistema con ID: ${loteId}.`,
                        redirectUrl: `/owner/lote/${loteId}/documentos`,
                        redirectText: "Subir documentos"
                    });
                    setShowStatusModal(true);

                    // Si estamos en loading, significa que estamos siendo redirigidos
                    // Asegurarnos que el modal se cierre después de un tiempo
                    if (navigation.state === "loading") {
                        setTimeout(() => {
                            window.location.href = `/owner/lote/${loteId}/documentos`;
                        }, 2000);
                    }
                }
            }
        }
    }, [navigation.state, navigation.location, navigationFormMethod, actionData]);    // Verificar si hay datos POT en la respuesta del loader
    useEffect(() => {
        if (navigation.location && navigation.location.search.includes('searchType=cbml')) {
            const state = navigation.state === 'loading' ? 'loading' :
                navigation.state === 'submitting' ? 'submitting' : 'idle';

            if (state === 'idle' && navigation.formData === undefined) {
                // Extraer los datos de la navegación
                const data = (navigation as any).data;

                if (data?.potData) {
                    console.log("Datos POT recibidos del backend:", data.potData);

                    // Convertir los datos en el formato que espera nuestro análisis
                    const rawPotData = data.potData.raw_text || '';
                    let structuredPotData;

                    if (rawPotData) {
                        // Usar el extractor de texto si hay texto sin procesar
                        structuredPotData = extractPotDataFromText(rawPotData);
                    } else {
                        // Crear estructura manualmente con los datos disponibles
                        structuredPotData = {
                            area: data.potData.area,
                            clasificacion: data.potData.clasificacion_suelo,
                            uso_suelo: data.potData.uso_suelo?.categoria_uso,
                            tratamiento: data.potData.aprovechamiento_urbano?.tratamiento,
                            densidad: parseFloat(data.potData.aprovechamiento_urbano?.densidad_habitacional_max || '0'),
                            restricciones: data.potData.restricciones_ambientales ?
                                (data.potData.restricciones_ambientales.amenaza_riesgo &&
                                    data.potData.restricciones_ambientales.retiros_rios ? 2 : 1) : 0
                        };
                    }

                    // Actualizar el estado para el análisis
                    setPotData(structuredPotData);

                    // Generar análisis de vendibilidad
                    const analysis = analyzeSellability(structuredPotData);
                    setSellabilityAnalysis(analysis);
                }
            }
        }
    }, [navigation.state, navigation.location]);

    return (
        <>
            <div className="p-8 py-32">
                <div className="mb-6 flex items-center">
                    <Link
                        to="/owner/lotes"
                        className="mr-4 text-indigo-600 hover:text-indigo-900"
                    >
                        ← Volver a mis lotes
                    </Link>
                    <h1 className="text-2xl font-bold">Registrar Nuevo Lote</h1>
                </div>

                {/* Componente de búsqueda de MapGIS */}
                <LoteSearchSection
                    onDataReceived={handleMapGisDataReceived}
                    onDireccionSelect={handleDireccionSelect}
                />

                {actionData?.errors?.form && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{actionData.errors.form}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <Form method="post" className="p-6">
                        {/* Componente de campos del formulario */}
                        <LoteFormFields
                            formValues={formValues}
                            onInputChange={handleInputChange}
                            usarUbicacion={usarUbicacion}
                            setUsarUbicacion={setUsarUbicacion}
                            actionData={actionData}
                        />
                        <div className="mt-6 flex items-center justify-end">
                            <Link
                                to="/owner/lotes"
                                className="mr-4 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={() => {
                                    if (!isSubmitting) {
                                        console.log("Submit button clicked");
                                        setStatusModalProps({
                                            type: "loading",
                                            title: "Procesando",
                                            message: "Creando el lote...",
                                            redirectUrl: "",
                                            redirectText: ""
                                        });
                                        setShowStatusModal(true);
                                    }
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Guardando...
                                    </>
                                ) : "Registrar Lote"}
                            </button>
                        </div>
                    </Form>
                </div>
            </div>

            {/* Modal de estado (loading/success/error) */}
            <StatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                type={statusModalProps.type}
                title={statusModalProps.title}
                message={statusModalProps.message}
                redirectUrl={statusModalProps.redirectUrl}
                redirectText={statusModalProps.redirectText}
                onRedirect={(url) => {
                    console.log("Redirigiendo a:", url);
                    setShowStatusModal(false);
                    navigate(url);
                }}
            />
        </>
    );
}