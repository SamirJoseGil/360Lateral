// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.lote.nuevo.tsx
import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { createLote } from "~/services/lotes.server";
import type { CreateLoteData } from "~/services/lotes.server";
import { LocationPicker } from "~/components/LocationPicker";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  if (!user || user.role !== "owner") {
    return redirect("/login");
  }
  
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  
  if (!user || user.role !== "owner") {
    return redirect("/login");
  }
  
  const formData = await request.formData();
  
  // ✅ Obtener todos los campos del formulario
  const nombre = formData.get("nombre")?.toString() || "";
  const direccion = formData.get("direccion")?.toString() || "";
  const ciudad = formData.get("ciudad")?.toString() || "";
  const barrio = formData.get("barrio")?.toString() || "";
  const area = parseFloat(formData.get("area")?.toString() || "0");
  const cbml = formData.get("cbml")?.toString() || "";
  const matricula = formData.get("matricula")?.toString() || "";
  const codigo_catastral = formData.get("codigo_catastral")?.toString() || "";
  const estrato = parseInt(formData.get("estrato")?.toString() || "0") || undefined;
  const descripcion = formData.get("descripcion")?.toString() || "";
  const uso_suelo = formData.get("uso_suelo")?.toString() || "";
  const clasificacion_suelo = formData.get("clasificacion_suelo")?.toString() || "";
  
  // ✅ NUEVO: Campos comerciales
  const valor = parseFloat(formData.get("valor")?.toString() || "0") || undefined;
  const forma_pago = formData.get("forma_pago")?.toString() || "";
  const es_comisionista = formData.get("es_comisionista") === "on";
  
  // ✅ CRÍTICO: Coordenadas del mapa
  const latitud = parseFloat(formData.get("latitud")?.toString() || "0");
  const longitud = parseFloat(formData.get("longitud")?.toString() || "0");
  
  // ✅ Archivo de carta de autorización
  const cartaFile = formData.get("carta_autorizacion") as File | null;
  
  // Validaciones
  const errors: Record<string, string> = {};
  
  if (!nombre) errors.nombre = "El nombre es obligatorio";
  if (!direccion) errors.direccion = "La dirección es obligatoria";
  if (!ciudad) errors.ciudad = "La ciudad es obligatoria";
  if (!matricula) errors.matricula = "La matrícula inmobiliaria es obligatoria";
  if (!area || area <= 0) errors.area = "El área debe ser mayor a 0";
  if (!valor || valor <= 0) errors.valor = "El valor debe ser mayor a 0";
  if (!forma_pago) errors.forma_pago = "La forma de pago es obligatoria";
  
  // ✅ NUEVO: Validar ubicación
  if (!latitud || !longitud) {
    errors.ubicacion = "Debes seleccionar la ubicación del lote en el mapa";
  }
  
  // ✅ NUEVO: Validar carta para comisionistas
  if (es_comisionista && (!cartaFile || cartaFile.size === 0)) {
    errors.carta_autorizacion = "La carta de autorización es obligatoria para comisionistas";
  }
  
  if (Object.keys(errors).length > 0) {
    return json({ errors, values: Object.fromEntries(formData) });
  }
  
  try {
    const loteData: CreateLoteData = {
      nombre,
      direccion,
      ciudad,
      barrio,
      area,
      cbml,
      matricula,
      codigo_catastral,
      estrato,
      descripcion,
      uso_suelo,
      clasificacion_suelo,
      latitud,
      longitud,
      valor,
      forma_pago,
      es_comisionista,
      carta_autorizacion: cartaFile && cartaFile.size > 0 ? cartaFile : null,
    };
    
    const resultado = await createLote(request, loteData);
    
    return redirect(`/owner/lote/${resultado.lote.id}`);
  } catch (error) {
    console.error("[Nuevo Lote] Error:", error);
    return json({
      errors: {
        general: error instanceof Error ? error.message : "Error al crear el lote"
      },
      values: Object.fromEntries(formData)
    });
  }
}

export default function NuevoLote() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Estado para coordenadas del mapa
  const [latitud, setLatitud] = useState<number>(
    actionData?.values?.latitud ? parseFloat(actionData.values.latitud) : 0
  );
  const [longitud, setLongitud] = useState<number>(
    actionData?.values?.longitud ? parseFloat(actionData.values.longitud) : 0
  );

  // Handler para actualizar coordenadas desde LocationPicker
  function handleLocationSelect(lat: number, lng: number) {
    setLatitud(lat);
    setLongitud(lng);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Lote</h1>
        <p className="text-gray-600 mt-2">
          Completa la información de tu propiedad
        </p>
      </div>
      
      {/* Alertas de error general */}
      {actionData?.errors?.general && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium">{actionData.errors.general}</p>
          </div>
        </div>
      )}
      
      <Form method="post" encType="multipart/form-data" className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Lote <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                defaultValue={actionData?.values?.nombre}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Ej: Lote Comercial Centro"
                required
              />
              {actionData?.errors?.nombre && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.nombre}</p>
              )}
            </div>
            
            {/* Matrícula */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matrícula Inmobiliaria <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="matricula"
                defaultValue={actionData?.values?.matricula}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Ej: 001-123456"
                required
              />
              {actionData?.errors?.matricula && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.matricula}</p>
              )}
            </div>
            
            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ciudad"
                defaultValue={actionData?.values?.ciudad || "Medellín"}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Ej: Medellín"
                required
              />
              {actionData?.errors?.ciudad && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.ciudad}</p>
              )}
            </div>
            
            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="direccion"
                defaultValue={actionData?.values?.direccion}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Ej: Carrera 43A #1-50"
                required
              />
              {actionData?.errors?.direccion && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.direccion}</p>
              )}
            </div>
            
            {/* Barrio y Estrato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barrio
              </label>
              <input
                type="text"
                name="barrio"
                defaultValue={actionData?.values?.barrio}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Ej: El Poblado"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estrato
              </label>
              <select
                name="estrato"
                defaultValue={actionData?.values?.estrato}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Seleccionar</option>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>Estrato {num}</option>
                ))}
              </select>
            </div>
            
            {/* Área */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área (m²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="area"
                step="0.01"
                defaultValue={actionData?.values?.area}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Ej: 500.00"
                required
              />
              {actionData?.errors?.area && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.area}</p>
              )}
            </div>
            
            {/* CBML */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              CBML (11 dígitos) {/* ✅ CORREGIDO: Indicar 11 dígitos */}
              </label>
              <input
              type="text"
              name="cbml"
              maxLength={11} // ✅ CORREGIDO: 11 caracteres máximo (antes era 14)
              defaultValue={actionData?.values?.cbml}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Ej: 05001000000" // ✅ CORREGIDO: Ejemplo de 11 dígitos
              />
              {actionData?.errors?.cbml && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.cbml}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
              Código de identificación catastral de MapGIS Medellín (11 dígitos numéricos)
              </p>
            </div>
            
            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                rows={3}
                defaultValue={actionData?.values?.descripcion}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Describe las características del lote..."
              />
            </div>
          </div>
        </div>
        
        {/* ✅ SECCIÓN 2: Ubicación en el Mapa */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ubicación en el Mapa <span className="text-red-500">*</span>
          </h3>

          {/* Valor fijo para latitud y longitud */}
          <input type="hidden" name="latitud" value={6.244203} />
          <input type="hidden" name="longitud" value={-75.5812119} />

          <div className="text-gray-700 text-sm mt-2">
            Ubicación fija: Medellín, Colombia (lat: 6.244203, lng: -75.5812119)
          </div>

          {actionData?.errors?.ubicacion && (
            <p className="mt-2 text-sm text-red-600">{actionData.errors.ubicacion}</p>
          )}
        </div>
        
        {/* ✅ SECCIÓN 3: Información Comercial */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-green-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Información Comercial
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor del Lote (COP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="valor"
                step="1000"
                defaultValue={actionData?.values?.valor}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                placeholder="Ej: 500000000"
                required
              />
              {actionData?.errors?.valor && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.valor}</p>
              )}
            </div>
            
            {/* Forma de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pago <span className="text-red-500">*</span>
              </label>
              <select
                name="forma_pago"
                defaultValue={actionData?.values?.forma_pago}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                required
              >
                <option value="">Seleccionar</option>
                <option value="contado">De Contado</option>
                <option value="financiado">Financiado</option>
                <option value="permuta">Permuta</option>
                <option value="mixto">Mixto</option>
              </select>
              {actionData?.errors?.forma_pago && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.forma_pago}</p>
              )}
            </div>
            
            {/* Comisionista */}
            <div className="md:col-span-2 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="es_comisionista"
                  defaultChecked={actionData?.values?.es_comisionista === "on"}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">
                    Registro por comisionista
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Marca esta opción si registras el lote en representación del propietario
                  </p>
                </div>
              </label>
              
              {/* Carta de Autorización */}
              <div className="mt-4 pt-4 border-t border-yellow-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carta de Autorización
                </label>
                <input
                  type="file"
                  name="carta_autorizacion"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                />
                {actionData?.errors?.carta_autorizacion && (
                  <p className="mt-1 text-sm text-red-600">{actionData.errors.carta_autorizacion}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Requerida si eres comisionista. Formatos: PDF, JPG, PNG (máx. 10MB)
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Botones */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Registrar Lote
              </>
            )}
          </button>
        </div>
      </Form>
    </div>
  );
}
