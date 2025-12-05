import { json, redirect, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";   
import { useLoaderData, useActionData, Form, Link, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import React, { useState } from "react";
import { requireUser, getUser } from "~/utils/auth.server";
import { getLoteById, updateLote, verifyLote, rejectLote, archiveLote, reactivateLote, deleteLote } from "~/services/lotes.server";
import LoteStatusManager from "~/components/admin/LoteStatusManager";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    if (user.role !== "admin") {
        throw redirect("/login");
    }

    const loteId = params.id;
    if (!loteId) {
        throw redirect("/admin/lotes");
    }

    try {
        console.log(`Obteniendo detalles del lote ${loteId}`);
        const { lote, headers } = await getLoteById(request, loteId);
        
        console.log("[admin.lotes.$id.editar] Lote data:", {
            id: lote.id,
            nombre: lote.nombre,
            direccion: lote.direccion,
            area: lote.area,
            ciudad: lote.ciudad,
            cbml: lote.cbml
        });

        return json({ user, lote }, { headers });
    } catch (error) {
        console.error(`[admin.lotes.$id.editar] Error loading lote ${loteId}:`, error);
        throw new Response("Lote no encontrado", { status: 404 });
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    const currentUser = await getUser(request);
    if (!currentUser || currentUser.role !== "admin") {
        return json({ errors: { general: "No autorizado" } }, { status: 401 });
    }

    const loteId = params.id;
    if (!loteId) {
        return redirect("/admin/lotes");
    }

    const formData = await request.formData();
    const action = formData.get("_action") as string;

    console.log(`[Admin Edit Lote] Action received: ${action} for lote ${loteId}`);

    // ✅ ACCIONES DE ESTADO (verify, reject, archive, etc.)
    if (action && action !== "update") {
        try {
            switch (action) {
                case "verify": {
                    console.log(`[Admin Edit Lote] Verifying lote ${loteId}`);
                    const verifyResult = await verifyLote(request, loteId);
                    console.log(`[Admin Edit Lote] Verify result:`, verifyResult);
                    
                    return json({
                        success: true,
                        message: verifyResult.data.message || "Lote verificado exitosamente",
                        statusChanged: true
                    }, { headers: verifyResult.headers });
                }

                case "reject": {
                    const reason = formData.get("reason") as string || "Sin razón especificada";
                    console.log(`[Admin Edit Lote] Rejecting lote ${loteId}: ${reason}`);
                    
                    const rejectResult = await rejectLote(request, loteId, reason);
                    console.log(`[Admin Edit Lote] Reject result:`, rejectResult);
                    
                    return json({
                        success: true,
                        message: rejectResult.data.message || "Lote rechazado",
                        statusChanged: true
                    }, { headers: rejectResult.headers });
                }

                case "archive": {
                    console.log(`[Admin Edit Lote] Archiving lote ${loteId}`);
                    
                    const archiveResult = await archiveLote(request, loteId);
                    console.log(`[Admin Edit Lote] Archive result:`, archiveResult);
                    
                    return json({
                        success: true,
                        message: archiveResult.data.message || "Lote archivado",
                        statusChanged: true
                    }, { headers: archiveResult.headers });
                }

                case "reactivate": {
                    console.log(`[Admin Edit Lote] Reactivating lote ${loteId}`);
                    
                    const reactivateResult = await reactivateLote(request, loteId);
                    console.log(`[Admin Edit Lote] Reactivate result:`, reactivateResult);
                    
                    return json({
                        success: true,
                        message: reactivateResult.data.message || "Lote reactivado",
                        statusChanged: true
                    }, { headers: reactivateResult.headers });
                }

                case "delete": {
                    console.log(`[Admin Edit Lote] Deleting lote ${loteId}`);
                    await deleteLote(request, loteId);
                    return redirect("/admin/lotes");
                }
            }
        } catch (error) {
            console.error(`[Admin Edit Lote] Error in action ${action}:`, error);
            return json({
                success: false,
                errors: { general: error instanceof Error ? error.message : "Error al procesar la acción" }
            }, { status: 500 });
        }
    }

    // ✅ ACCIÓN DE ACTUALIZAR (formulario normal)
    console.log("[Admin Edit Lote] Processing update action");
    
    // ✅ CORRECCIÓN: Extraer datos correctamente
    const nombre = formData.get("nombre") as string;
    const cbml = formData.get("cbml") as string || undefined;
    const direccion = formData.get("direccion") as string;
    const ciudad = formData.get("ciudad") as string || undefined;
    const areaString = formData.get("area") as string;
    const descripcion = formData.get("descripcion") as string || undefined;
    const matricula = formData.get("matricula") as string || undefined;
    const codigo_catastral = formData.get("codigo_catastral") as string || undefined;
    const barrio = formData.get("barrio") as string || undefined;
    const estratoString = formData.get("estrato") as string;
    const tratamiento_pot = formData.get("tratamiento_pot") as string || undefined;
    const uso_suelo = formData.get("uso_suelo") as string || undefined;
    const clasificacion_suelo = formData.get("clasificacion_suelo") as string || undefined;
    const valorString = formData.get("valor") as string;
    const forma_pago = formData.get("forma_pago") as string || undefined;
    const es_comisionista = formData.get("es_comisionista") === "on";

    // ✅ Validaciones
    const errors: Record<string, string> = {};

    if (!nombre || nombre.trim() === "") {
        errors.nombre = "El nombre es requerido";
    }
    
    if (!direccion || direccion.trim() === "") {
        errors.direccion = "La dirección es requerida";
    }
    
    if (!ciudad || ciudad.trim() === "") {
        errors.ciudad = "La ciudad es requerida";
    }

    // ✅ Validar área
    let area: number | undefined;
    if (areaString && areaString.trim() !== "") {
        area = parseFloat(areaString);
        if (isNaN(area) || area <= 0) {
            errors.area = "El área debe ser un número positivo";
        }
    }

    // ✅ Validar estrato
    let estrato: number | undefined;
    if (estratoString && estratoString.trim() !== "") {
        estrato = parseInt(estratoString);
        if (isNaN(estrato) || estrato < 1 || estrato > 6) {
            errors.estrato = "El estrato debe estar entre 1 y 6";
        }
    }

    // ✅ Validar valor
    let valor: number | undefined;
    if (valorString && valorString.trim() !== "") {
        valor = parseFloat(valorString);
        if (isNaN(valor) || valor <= 0) {
            errors.valor = "El valor debe ser un número positivo";
        }
    }

    if (Object.keys(errors).length > 0) {
        return json({ 
            success: false,
            errors 
        }, { status: 400 });
    }

    // ✅ Construir objeto de actualización
    const updateData: any = {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
    };

    // ✅ Agregar campos opcionales solo si tienen valor
    if (ciudad && ciudad.trim()) updateData.ciudad = ciudad.trim();
    if (cbml && cbml.trim()) updateData.cbml = cbml.trim();
    if (matricula && matricula.trim()) updateData.matricula = matricula.trim();
    if (codigo_catastral && codigo_catastral.trim()) updateData.codigo_catastral = codigo_catastral.trim();
    if (barrio && barrio.trim()) updateData.barrio = barrio.trim();
    if (descripcion && descripcion.trim()) updateData.descripcion = descripcion.trim();
    if (tratamiento_pot && tratamiento_pot.trim()) updateData.tratamiento_pot = tratamiento_pot.trim();
    if (uso_suelo && uso_suelo.trim()) updateData.uso_suelo = uso_suelo.trim();
    if (clasificacion_suelo && clasificacion_suelo.trim()) updateData.clasificacion_suelo = clasificacion_suelo.trim();
    if (forma_pago && forma_pago.trim()) updateData.forma_pago = forma_pago.trim();
    if (area !== undefined) updateData.area = area;
    if (estrato !== undefined) updateData.estrato = estrato;
    if (valor !== undefined) updateData.valor = valor;
    updateData.es_comisionista = es_comisionista;

    try {
        console.log("[Admin Edit Lote] Sending update data:", updateData);
        
        const { lote, headers } = await updateLote(request, loteId, updateData);
        
        console.log("[Admin Edit Lote] Update successful");
        
        return json({ 
            success: true, 
            message: "Lote actualizado exitosamente",
            lote 
        }, { headers });
        
    } catch (error) {
        console.error("[Admin Edit Lote] Error updating lote:", error);
        return json({
            success: false,
            errors: { 
                general: error instanceof Error ? error.message : "Error al actualizar lote" 
            }
        }, { status: 500 });
    }
}

type ActionData = {
    success?: boolean;
    message?: string;
    statusChanged?: boolean;
    errors?: Record<string, string>;
    lote?: any;
};

export default function EditLotePage() {
    const { lote } = useLoaderData<typeof loader>();
    const actionData = useActionData<ActionData>();
    const submit = useSubmit();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isSubmitting = navigation.state === "submitting";
    const isLoading = navigation.state === "loading";

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        const deleteFormData = new FormData();
        deleteFormData.append("_action", "delete");
        submit(deleteFormData, { method: "post" });
    };

    // ✅ NUEVO: Scroll to top en errores
    React.useEffect(() => {
        if (actionData?.errors) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [actionData?.errors]);

    // ✅ CRÍTICO: Log para debug
    console.log("[EditLotePage] Rendering with lote:", {
        id: lote?.id,
        nombre: lote?.nombre,
        direccion: lote?.direccion,
        area: lote?.area
    });

    return (
        <div className="container mx-auto px-4 py-8">
            {/* ✅ MEJORADO: Alertas de éxito/error */}
            {actionData?.success && !actionData?.statusChanged && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-fade-in">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-green-800 font-medium">
                            {actionData.message || "Lote actualizado exitosamente"}
                        </p>
                    </div>
                </div>
            )}

            {actionData?.errors?.general && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-fade-in">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-800 font-medium">{actionData.errors.general}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Lote</h1>
                    <p className="text-gray-600 mt-1">
                        Modifica la información del lote {lote?.nombre || 'sin nombre'}
                    </p>
                </div>
                <Link
                    to={`/admin/lote/${lote?.id}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al detalle
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-6 pb-4 border-b">Editar Información del Lote</h2>
                        
                        <Form method="post">
                            {/* Información Básica */}
                            <div className="space-y-6">
                                {/* Nombre */}
                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del Lote <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        id="nombre"
                                        defaultValue={lote?.nombre || ""}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        required
                                    />
                                    {actionData?.errors?.nombre && (
                                        <p className="mt-1 text-sm text-red-600">{actionData.errors.nombre}</p>
                                    )}
                                </div>

                                {/* Dirección */}
                                <div>
                                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                                        Dirección <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        id="direccion"
                                        defaultValue={lote?.direccion || ""}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        required
                                    />
                                    {actionData?.errors?.direccion && (
                                        <p className="mt-1 text-sm text-red-600">{actionData.errors.direccion}</p>
                                    )}
                                </div>

                                {/* Ciudad y Barrio */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-2">
                                            Ciudad <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="ciudad"
                                            id="ciudad"
                                            defaultValue={lote?.ciudad || "Medellín"}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                            required
                                        />
                                        {actionData?.errors?.ciudad && (
                                            <p className="mt-1 text-sm text-red-600">{actionData.errors.ciudad}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="barrio" className="block text-sm font-medium text-gray-700 mb-2">
                                            Barrio
                                        </label>
                                        <input
                                            type="text"
                                            name="barrio"
                                            id="barrio"
                                            defaultValue={lote?.barrio || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Área y Estrato */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                                            Área (m²)
                                        </label>
                                        <input
                                            type="number"
                                            name="area"
                                            id="area"
                                            step="0.01"
                                            defaultValue={lote?.area || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        />
                                        {actionData?.errors?.area && (
                                            <p className="mt-1 text-sm text-red-600">{actionData.errors.area}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="estrato" className="block text-sm font-medium text-gray-700 mb-2">
                                            Estrato
                                        </label>
                                        <select
                                            name="estrato"
                                            id="estrato"
                                            defaultValue={lote?.estrato?.toString() || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        >
                                            <option value="">Seleccionar</option>
                                            {[1, 2, 3, 4, 5, 6].map(num => (
                                                <option key={num} value={num}>Estrato {num}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* CBML, Matrícula, Código Catastral */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="cbml" className="block text-sm font-medium text-gray-700 mb-2">
                                            CBML
                                        </label>
                                        <input
                                            type="text"
                                            name="cbml"
                                            id="cbml"
                                            maxLength={14}
                                            defaultValue={lote?.cbml || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="matricula" className="block text-sm font-medium text-gray-700 mb-2">
                                            Matrícula
                                        </label>
                                        <input
                                            type="text"
                                            name="matricula"
                                            id="matricula"
                                            defaultValue={lote?.matricula || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="codigo_catastral" className="block text-sm font-medium text-gray-700 mb-2">
                                            Código Catastral
                                        </label>
                                        <input
                                            type="text"
                                            name="codigo_catastral"
                                            id="codigo_catastral"
                                            defaultValue={lote?.codigo_catastral || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* POT y Uso del Suelo */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="tratamiento_pot" className="block text-sm font-medium text-gray-700 mb-2">
                                            Tratamiento POT
                                        </label>
                                        <input
                                            type="text"
                                            name="tratamiento_pot"
                                            id="tratamiento_pot"
                                            defaultValue={lote?.tratamiento_pot || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="uso_suelo" className="block text-sm font-medium text-gray-700 mb-2">
                                            Uso del Suelo
                                        </label>
                                        <input
                                            type="text"
                                            name="uso_suelo"
                                            id="uso_suelo"
                                            defaultValue={lote?.uso_suelo || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="clasificacion_suelo" className="block text-sm font-medium text-gray-700 mb-2">
                                            Clasificación Suelo
                                        </label>
                                        <input
                                            type="text"
                                            name="clasificacion_suelo"
                                            id="clasificacion_suelo"
                                            defaultValue={lote?.clasificacion_suelo || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Valor y Forma de Pago */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                                            Valor (COP)
                                        </label>
                                        <input
                                            type="number"
                                            name="valor"
                                            id="valor"
                                            step="1000"
                                            defaultValue={lote?.valor || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="forma_pago" className="block text-sm font-medium text-gray-700 mb-2">
                                            Forma de Pago
                                        </label>
                                        <select
                                            name="forma_pago"
                                            id="forma_pago"
                                            defaultValue={lote?.forma_pago || ""}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="contado">De Contado</option>
                                            <option value="financiado">Financiado</option>
                                            <option value="permuta">Permuta</option>
                                            <option value="mixto">Mixto</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Comisionista */}
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        name="es_comisionista"
                                        id="es_comisionista"
                                        defaultChecked={lote?.es_comisionista || false}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="es_comisionista" className="text-sm font-medium text-gray-700">
                                        Registro por comisionista
                                    </label>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        name="descripcion"
                                        id="descripcion"
                                        rows={4}
                                        defaultValue={lote?.descripcion || ""}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all resize-none"
                                        placeholder="Describe las características del lote..."
                                    />
                                </div>
                            </div>

                            {/* Botones de formulario */}
                            <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
                                <Link
                                    to={`/admin/lote/${lote?.id}`}
                                    className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                                            💾 Guardar Cambios
                                        </>
                                    )}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>

                {/* Sidebar con acciones de estado */}
                <div className="space-y-6">
                    {/* Componente de gestión de estado */}
                    <LoteStatusManager
                        lote={lote}
                        onSuccess={() => {
                            // Recargar la página para ver los cambios
                            window.location.reload();
                        }}
                    />

                    {/* Panel de información adicional */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Información del Sistema</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-gray-600">ID:</span>
                                <p className="font-mono text-xs mt-1 break-all">{lote.id}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Creado:</span>
                                <p className="mt-1" suppressHydrationWarning>
                                    {new Date(lote.created_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600">Última actualización:</span>
                                <p className="mt-1" suppressHydrationWarning>
                                    {new Date(lote.updated_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ✅ Panel de acciones peligrosas */}
                    <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
                        <h3 className="text-lg font-semibold mb-4 text-red-700">Zona de Peligro</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Esta acción no se puede deshacer. Todos los datos asociados serán eliminados permanentemente.
                        </p>
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar Lote Permanentemente
                        </button>
                    </div>

                    {/* Link al detalle */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <Link
                            to={`/admin/lote/${lote.id}`}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver Detalle Completo
                        </Link>
                    </div>
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Confirmar Eliminación
                                </h3>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-600 mb-3">
                                ¿Estás seguro de que quieres eliminar el lote{' '}
                                <span className="font-medium text-gray-900">
                                    {lote.nombre} ({lote.cbml})
                                </span>?
                            </p>
                            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                <p className="text-red-700 text-sm font-medium">
                                    ⚠️ Esta acción no se puede deshacer
                                </p>
                                <ul className="text-red-600 text-xs mt-2 list-disc list-inside space-y-1">
                                    <li>Se eliminarán todos los documentos asociados</li>
                                    <li>Se perderá el historial del lote</li>
                                    <li>Los datos no podrán ser recuperados</li>
                                </ul>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Sí, Eliminar Permanentemente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ NUEVO: Estilos para animaciones */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
