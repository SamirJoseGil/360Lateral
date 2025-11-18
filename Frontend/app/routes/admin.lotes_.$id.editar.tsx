import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useSubmit, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { getLoteById, updateLote, deleteLote, verifyLote, rejectLote, archiveLote, reactivateLote } from "~/services/lotes.server";
import LoteStatusManager from "~/components/admin/LoteStatusManager";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    const loteId = params.id;
    if (!loteId) {
        return redirect("/admin/lotes");
    }

    try {
        const { lote, headers } = await getLoteById(request, loteId);
        return json({ user, lote }, { headers });
    } catch (error) {
        console.error("Error loading lote:", error);
        return redirect("/admin/lotes");
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

    // ✅ ACCIONES DE ESTADO
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

    // ✅ ACCIÓN DE ACTUALIZAR (formulario normal)
    console.log("[Admin Edit Lote] Processing update action");
    
    const nombre = formData.get("nombre") as string;
    const cbml = formData.get("cbml") as string;
    const direccion = formData.get("direccion") as string;
    const areaString = formData.get("area") as string;
    const descripcion = formData.get("descripcion") as string;
    const matricula = formData.get("matricula") as string;
    const codigo_catastral = formData.get("codigo_catastral") as string;
    const barrio = formData.get("barrio") as string;
    const estratoString = formData.get("estrato") as string;
    const tratamiento_pot = formData.get("tratamiento_pot") as string;
    const uso_suelo = formData.get("uso_suelo") as string;
    const clasificacion_suelo = formData.get("clasificacion_suelo") as string;

    // Validaciones
    const errors: Record<string, string> = {};

    if (!nombre) errors.nombre = "El nombre es requerido";
    if (!direccion) errors.direccion = "La dirección es requerida";

    const area = areaString ? parseFloat(areaString) : undefined;
    if (areaString && (isNaN(area!) || area! <= 0)) {
        errors.area = "El área debe ser un número positivo";
    }

    const estrato = estratoString ? parseInt(estratoString) : undefined;
    if (estratoString && (isNaN(estrato!) || estrato! < 1 || estrato! > 6)) {
        errors.estrato = "El estrato debe estar entre 1 y 6";
    }

    if (Object.keys(errors).length > 0) {
        return json({ errors }, { status: 400 });
    }

    try {
        const { lote, headers } = await updateLote(request, loteId, {
            nombre,
            cbml,
            direccion,
            area,
            descripcion: descripcion || undefined,
            matricula: matricula || undefined,
            codigo_catastral: codigo_catastral || undefined,
            barrio: barrio || undefined,
            estrato,
            tratamiento_pot: tratamiento_pot || undefined,
            uso_suelo: uso_suelo || undefined,
            clasificacion_suelo: clasificacion_suelo || undefined,
        });

        console.log("[Admin Edit Lote] Update successful");
        return json({ success: true, lote }, { headers });
    } catch (error) {
        console.error("[Admin Edit Lote] Error updating lote:", error);
        return json({
            errors: { general: "Error al actualizar lote" }
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        const deleteFormData = new FormData();
        deleteFormData.append("_action", "delete");
        submit(deleteFormData, { method: "post" });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/admin/lotes" className="text-blue-600 hover:text-blue-800">
                    ← Volver a Lotes
                </Link>
                <h1 className="text-2xl font-bold">Editar Lote</h1>
            </div>

            {/* ✅ Mensajes de éxito/error */}
            {actionData?.success && (
                <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                    <p>{actionData.message || 'Lote actualizado correctamente'}</p>
                </div>
            )}

            {actionData?.errors?.general && (
                <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p>{actionData.errors.general}</p>
                </div>
            )}

            {/* ✅ Grid con formulario y panel de estado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulario de edición - Ocupa 2 columnas */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-6 pb-4 border-b">Información del Lote</h2>
                        
                        <Form method="post">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Información básica */}
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
                                </div>

                                {/* Nombre */}
                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        id="nombre"
                                        defaultValue={lote.nombre}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {actionData?.errors?.nombre && (
                                        <p className="mt-1 text-sm text-red-600">{actionData.errors.nombre}</p>
                                    )}
                                </div>

                                {/* CBML */}
                                <div>
                                    <label htmlFor="cbml" className="block text-sm font-medium text-gray-700">
                                        CBML
                                    </label>
                                    <input
                                        type="text"
                                        name="cbml"
                                        id="cbml"
                                        defaultValue={lote.cbml}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {actionData?.errors?.cbml && (
                                        <p className="mt-1 text-sm text-red-600">{actionData.errors.cbml}</p>
                                    )}
                                </div>

                                {/* Dirección */}
                                <div className="md:col-span-2">
                                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                                        Dirección *
                                    </label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        id="direccion"
                                        defaultValue={lote.direccion}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                                        Área (m²)
                                    </label>
                                    <input
                                        type="number"
                                        name="area"
                                        id="area"
                                        step="0.01"
                                        defaultValue={lote.area || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="matricula" className="block text-sm font-medium text-gray-700">
                                        Matrícula
                                    </label>
                                    <input
                                        type="text"
                                        name="matricula"
                                        id="matricula"
                                        defaultValue={lote.matricula || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="codigo_catastral" className="block text-sm font-medium text-gray-700">
                                        Código Catastral
                                    </label>
                                    <input
                                        type="text"
                                        name="codigo_catastral"
                                        id="codigo_catastral"
                                        defaultValue={lote.codigo_catastral || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="barrio" className="block text-sm font-medium text-gray-700">
                                        Barrio
                                    </label>
                                    <input
                                        type="text"
                                        name="barrio"
                                        id="barrio"
                                        defaultValue={lote.barrio || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="estrato" className="block text-sm font-medium text-gray-700">
                                        Estrato
                                    </label>
                                    <select
                                        name="estrato"
                                        id="estrato"
                                        defaultValue={lote.estrato || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

                                <div className="md:col-span-2">
                                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                                        Descripción
                                    </label>
                                    <textarea
                                        name="descripcion"
                                        id="descripcion"
                                        rows={3}
                                        defaultValue={lote.descripcion || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Información POT */}
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold mb-4 mt-6">Información POT</h3>
                                </div>

                                <div>
                                    <label htmlFor="tratamiento_pot" className="block text-sm font-medium text-gray-700">
                                        Tratamiento POT
                                    </label>
                                    <input
                                        type="text"
                                        name="tratamiento_pot"
                                        id="tratamiento_pot"
                                        defaultValue={lote.tratamiento_pot || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="uso_suelo" className="block text-sm font-medium text-gray-700">
                                        Uso de Suelo
                                    </label>
                                    <input
                                        type="text"
                                        name="uso_suelo"
                                        id="uso_suelo"
                                        defaultValue={lote.uso_suelo || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="clasificacion_suelo" className="block text-sm font-medium text-gray-700">
                                        Clasificación de Suelo
                                    </label>
                                    <input
                                        type="text"
                                        name="clasificacion_suelo"
                                        id="clasificacion_suelo"
                                        defaultValue={lote.clasificacion_suelo || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* ✅ Botones de formulario */}
                            <div className="mt-8 flex justify-end space-x-4">
                                <Link
                                    to={`/admin/lote/${lote.id}`}
                                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>

                {/* ✅ Panel lateral - Gestión de estado */}
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
        </div>
    );
}
