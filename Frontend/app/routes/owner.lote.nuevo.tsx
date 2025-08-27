// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.lote.nuevo.tsx
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { createLote, getTratamientosPOT } from "~/services/lotes.server";
import LoteSearchForm from "~/components/LoteSearchForm";
import DireccionSearchResults, { type DireccionResult } from "~/components/DireccionSearchResults";
import { consultarPorCBML, consultarPorMatricula, consultarPorDireccion } from "~/services/mapgis.server";

// Tipo para los datos de un nuevo lote
type NuevoLoteData = {
    nombre: string;
    descripcion?: string;
    direccion: string;
    area: number;
    codigo_catastral?: string;
    matricula?: string;
    cbml?: string;
    latitud?: number;
    longitud?: number;
    estrato?: number;
    tratamiento_pot?: string;
    uso_suelo?: string;
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
                        return json({
                            user,
                            searchResult: result.resultado.datos,
                            searchType: 'cbml',
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
        // Obtener los tratamientos POT disponibles
        const { tratamientos } = await getTratamientosPOT(request);
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
        const loteData: NuevoLoteData = {
            nombre: formData.get("nombre")?.toString() || "",
            descripcion: formData.get("descripcion")?.toString(),
            direccion: formData.get("direccion")?.toString() || "",
            area: parseFloat(formData.get("area")?.toString() || "0"),
            codigo_catastral: formData.get("codigo_catastral")?.toString(),
            matricula: formData.get("matricula")?.toString(),
            cbml: formData.get("cbml")?.toString(),
            estrato: parseInt(formData.get("estrato")?.toString() || "0") || undefined,
            tratamiento_pot: formData.get("tratamiento_pot")?.toString() || undefined,
            uso_suelo: formData.get("uso_suelo")?.toString(),
            latitud: parseFloat(formData.get("latitud")?.toString() || "0") || undefined,
            longitud: parseFloat(formData.get("longitud")?.toString() || "0") || undefined,
        };

        // Validaciones
        const errors: {
            nombre?: string;
            direccion?: string;
            area?: string;
            form?: string;
        } = {};

        if (!loteData.nombre) errors.nombre = "El nombre es obligatorio";
        if (!loteData.direccion) errors.direccion = "La dirección es obligatoria";
        if (!loteData.area) errors.area = "El área es obligatoria y debe ser mayor que 0";

        // Si hay errores, retornarlos
        if (Object.keys(errors).length > 0) {
            return json({ errors, values: loteData });
        }

        // Crear el lote
        const resultado = await createLote(request, {
            ...loteData,
            status: "active", // Por defecto activo
            owner: user.id // Agregar el owner requerido
        });

        // Redirigir a la página del lote creado
        return redirect(`/owner/lote/${resultado.lote.id}`, {
            headers: resultado.headers
        });
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
    const isSubmitting = navigation.state === "submitting";
    const [usarUbicacion, setUsarUbicacion] = useState(false);

    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [direccionResults, setDireccionResults] = useState<DireccionResult[]>([]);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [formValues, setFormValues] = useState({
        nombre: '',
        direccion: '',
        area: '',
        estrato: '',
        descripcion: '',
        matricula: '',
        codigo_catastral: '',
        cbml: '',
        tratamiento_pot: '',
        uso_suelo: '',
        latitud: '',
        longitud: ''
    });

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
                    action: `/owner/lote/nuevo?searchType=${searchType}&searchValue=${encodeURIComponent(value)}`
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
                // Rellenar formulario con los datos encontrados
                const mapGisData = mapFetcher.data.searchResult as any;
                console.log("MapGIS search result data:", mapGisData);

                // Extraer los datos requeridos de la estructura anidada del API
                let areaValue = '';
                let tratamiento = '';
                let usoSuelo = '';
                let densidad = '';
                let cbmlValue = '';

                // Extraer valores si existen en la respuesta
                if (mapGisData) {
                    // Extraer área
                    if (mapGisData.area_lote_m2) {
                        areaValue = mapGisData.area_lote_m2.toString();
                    }

                    // Extraer CBML
                    cbmlValue = mapGisData.cbml || '';

                    // Extraer tratamiento POT si existe
                    if (mapGisData.aprovechamiento_urbano &&
                        typeof mapGisData.aprovechamiento_urbano === 'object') {
                        tratamiento = mapGisData.aprovechamiento_urbano.tratamiento || '';

                        // Extraer densidad habitacional si existe
                        if (mapGisData.aprovechamiento_urbano.densidad_habitacional_max) {
                            densidad = `${mapGisData.aprovechamiento_urbano.densidad_habitacional_max} viv/ha`;
                        }
                    }

                    // Extraer uso de suelo si existe
                    if (mapGisData.uso_suelo &&
                        typeof mapGisData.uso_suelo === 'object') {
                        const uso = mapGisData.uso_suelo;
                        usoSuelo = `${uso.categoria_uso || ''}${uso.subcategoria_uso ? ` - ${uso.subcategoria_uso}` : ''}`;

                        // Añadir porcentaje si está disponible
                        if (uso.porcentaje) {
                            usoSuelo += ` (${uso.porcentaje.toFixed(2)}%)`;
                        }
                    }
                }

                // Crear una descripción con información adicional del lote
                const descripcionAutomatica = `
Clasificación de suelo: ${mapGisData.clasificacion_suelo || 'No disponible'}
${mapGisData.restricciones_ambientales ? `
Restricciones ambientales:
- ${mapGisData.restricciones_ambientales.amenaza_riesgo || 'No especificado'}
- ${mapGisData.restricciones_ambientales.retiros_rios || 'No especificado'}
` : ''}
${mapGisData.aprovechamiento_urbano ? `
Aprovechamiento urbano:
- Tratamiento: ${mapGisData.aprovechamiento_urbano.tratamiento || 'No especificado'}
- Densidad habitacional máxima: ${mapGisData.aprovechamiento_urbano.densidad_habitacional_max || 'No especificada'} viv/ha
- Altura normativa: ${mapGisData.aprovechamiento_urbano.altura_normativa || 'No especificada'}
` : ''}
`.trim();

                // Usar una función de actualización para evitar problemas con state obsoleto
                setFormValues(prevValues => ({
                    // Mantener el nombre que el usuario haya puesto
                    nombre: prevValues.nombre,

                    // Actualizar la descripción con datos detallados del MapGIS
                    // pero mantener cualquier descripción previa que el usuario haya agregado
                    descripcion: prevValues.descripcion
                        ? prevValues.descripcion
                        : descripcionAutomatica,

                    // Actualizar los campos con los datos de MapGIS
                    direccion: mapGisData.direccion || '',
                    area: areaValue,
                    cbml: cbmlValue,
                    matricula: mapGisData.matricula || '',
                    codigo_catastral: mapGisData.codigo_catastral || '',
                    tratamiento_pot: tratamiento,
                    uso_suelo: usoSuelo,
                    estrato: prevValues.estrato, // Mantener el estrato ya que no viene de MapGIS
                    latitud: mapGisData.latitud?.toString() || '',
                    longitud: mapGisData.longitud?.toString() || ''
                }));

                // Si tiene coordenadas, mostrar el checkbox de ubicación
                if (mapGisData.latitud && mapGisData.longitud) {
                    setUsarUbicacion(true);
                }
            }
        }
    }, [mapFetcher.data]);

    // Manejar selección de un resultado de dirección
    const handleSelectDireccion = async (result: DireccionResult) => {
        // Primero actualizar los campos básicos
        setFormValues(prev => ({
            ...prev,
            direccion: result.direccion,
            area: result.area.toString(),
            matricula: result.matricula,
            cbml: result.cbml
        }));

        // Luego buscar los detalles completos usando el CBML
        handleSearch('cbml', result.cbml);
    };

    // Función para manejar cambios en los inputs del formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center">
                <Link
                    to="/owner/mis-lotes"
                    className="mr-4 text-indigo-600 hover:text-indigo-900"
                >
                    ← Volver a mis lotes
                </Link>
                <h1 className="text-2xl font-bold">Registrar Nuevo Lote</h1>
            </div>

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
                    onSelect={handleSelectDireccion}
                />
            )}

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                onChange={handleInputChange}
                            />
                            {actionData?.errors && "nombre" in actionData.errors && actionData.errors.nombre && (
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
                                onChange={handleInputChange}
                            />
                            {actionData?.errors && "direccion" in actionData.errors && actionData.errors.direccion && (
                                <p className="text-xs text-red-600">{actionData.errors.direccion}</p>
                            )}
                        </div>

                        <div className="space-y-1">
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
                                onChange={handleInputChange}
                            />
                            {actionData?.errors && "area" in actionData.errors && actionData.errors.area && (
                                <p className="text-xs text-red-600">{actionData.errors.area}</p>
                            )}
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
                                onChange={handleInputChange}
                            >
                                <option value="">Seleccionar estrato</option>
                                {[1, 2, 3, 4, 5, 6].map(estrato => (
                                    <option key={estrato} value={estrato}>
                                        Estrato {estrato}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                                onChange={handleInputChange}
                            ></textarea>
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="cbml" className="block text-sm font-medium text-gray-700">
                                CBML
                            </label>
                            <input
                                type="text"
                                id="cbml"
                                name="cbml"
                                placeholder="Ej: 04050010105"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formValues.cbml}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="tratamiento_pot" className="block text-sm font-medium text-gray-700">
                                Tratamiento POT
                            </label>
                            <input
                                type="text"
                                id="tratamiento_pot"
                                name="tratamiento_pot"
                                placeholder="Ej: Renovación urbana"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formValues.tratamiento_pot}
                                onChange={handleInputChange}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Define el tipo de intervención urbana permitida en el lote
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
                                onChange={handleInputChange}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Define los tipos de actividades permitidas en este terreno
                            </p>
                        </div>

                        <div className="col-span-2">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="ubicacion"
                                    checked={usarUbicacion}
                                    onChange={() => setUsarUbicacion(!usarUbicacion)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="ubicacion" className="ml-2 block text-sm text-gray-700">
                                    Especificar ubicación geográfica
                                </label>
                            </div>

                            {usarUbicacion && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 border-t border-gray-200 pt-4">
                                    <div className="space-y-1">
                                        <label htmlFor="latitud" className="block text-sm font-medium text-gray-700">
                                            Latitud
                                        </label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            id="latitud"
                                            name="latitud"
                                            placeholder="Ej: 6.244203"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formValues.latitud}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label htmlFor="longitud" className="block text-sm font-medium text-gray-700">
                                            Longitud
                                        </label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            id="longitud"
                                            name="longitud"
                                            placeholder="Ej: -75.573553"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formValues.longitud}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                        <Link
                            to="/owner/mis-lotes"
                            className="mr-4 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isSubmitting ? "Guardando..." : "Registrar Lote"}
                        </button>
                    </div>
                </Form>
            </div>

            {/* Modal de carga para búsqueda MapGIS */}
            {showLoadingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Consultando información en MapGIS</h3>

                        <div className="mb-4">
                            <p className="text-gray-600 mb-2">
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
                            Tiempo transcurrido: {searchStartTime ? Math.round((Date.now() - searchStartTime) / 1000) : 0} segundos
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}