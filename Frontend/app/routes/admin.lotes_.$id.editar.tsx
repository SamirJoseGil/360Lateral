import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useSubmit } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { getLoteById, updateLote, deleteLote } from "~/services/lotes.server";

type ActionData = {
    errors?: {
        nombre?: string;
        cbml?: string;
        direccion?: string;
        area?: string;
        estrato?: string;
        general?: string;
    };
    success?: boolean;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const currentUser = await getUser(request);
    if (!currentUser) {
        return redirect("/login");
    }

    if (currentUser.role !== "admin") {
        return redirect("/" + currentUser.role);
    }

    const loteId = params.id;
    if (!loteId) {
        return redirect("/admin/lotes");
    }

    try {
        const { lote, headers } = await getLoteById(request, loteId);
        return json({ lote, currentUser }, { headers });
    } catch (error) {
        console.error("Error cargando datos del lote:", error);
        return redirect("/admin/lotes");
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
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

    // Si la acción es eliminar
    if (action === "delete") {
        try {
            await deleteLote(request, loteId);
            return redirect("/admin/lotes");
        } catch (error) {
            console.error("Error eliminando lote:", error);
            return json({
                errors: { general: "Error al eliminar lote" }
            }, { status: 500 });
        }
    }

    // Si es actualizar
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
    const status = formData.get("status") as string;

    // Validaciones básicas
    const errors: ActionData["errors"] = {};

    if (!nombre || nombre.trim() === "") {
        errors.nombre = "El nombre es obligatorio";
    }

    if (!cbml || cbml.trim() === "") {
        errors.cbml = "El CBML es obligatorio";
    }

    if (!direccion || direccion.trim() === "") {
        errors.direccion = "La dirección es obligatoria";
    }

    let area: number | undefined;
    if (areaString && areaString.trim() !== "") {
        area = parseFloat(areaString);
        if (isNaN(area) || area <= 0) {
            errors.area = "El área debe ser un número positivo";
        }
    }

    let estrato: number | undefined;
    if (estratoString && estratoString.trim() !== "") {
        estrato = parseInt(estratoString);
        if (isNaN(estrato) || estrato < 1 || estrato > 6) {
            errors.estrato = "El estrato debe ser un número entre 1 y 6";
        }
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
            status: status || undefined,
        });

        return json({ success: true, lote }, { headers });
    } catch (error) {
        console.error("Error actualizando lote:", error);
        return json({
            errors: { general: "Error al actualizar lote" }
        }, { status: 500 });
    }
}

export default function EditLotePage() {
    const { lote } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>() as ActionData | undefined;
    const submit = useSubmit();
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

            {actionData?.success && (
                <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                    <p>Lote actualizado correctamente</p>
                </div>
            )}

            {actionData?.errors?.general && (
                <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p>{actionData.errors.general}</p>
                </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
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
                                CBML *
                            </label>
                            <input
                                type="text"
                                name="cbml"
                                id="cbml"
                                defaultValue={lote.cbml}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
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
                            {actionData?.errors?.direccion && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.direccion}</p>
                            )}
                        </div>

                        {/* Área */}
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
                            {actionData?.errors?.area && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.area}</p>
                            )}
                        </div>

                        {/* Matrícula */}
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

                        {/* Código Catastral */}
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

                        {/* Barrio */}
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

                        {/* Estrato */}
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

                        {/* Estado */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Estado
                            </label>
                            <select
                                name="status"
                                id="status"
                                defaultValue={lote.status || 'pending'}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="active">Activo</option>
                                <option value="pending">Pendiente</option>
                                <option value="archived">Archivado</option>
                            </select>
                        </div>

                        {/* Descripción */}
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

                        {/* Tratamiento POT */}
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

                        {/* Uso de Suelo */}
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

                        {/* Clasificación de Suelo */}
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

                    {/* Botones de acción */}
                    <div className="mt-8 flex justify-between">
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Eliminar Lote
                        </button>

                        <div className="flex space-x-4">
                            <Link
                                to="/admin/lotes"
                                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </Form>
            </div>

            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                Confirmar Eliminación
                            </h3>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-600">
                                ¿Estás seguro de que quieres eliminar el lote{' '}
                                <span className="font-medium">
                                    {lote.nombre} ({lote.cbml})
                                </span>?
                            </p>
                            <p className="text-red-600 text-sm mt-2">
                                Esta acción no se puede deshacer.
                            </p>
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
