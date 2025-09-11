// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\routes\admin.pot.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";
import {
    getTratamientosPOT,
    getTratamientoPOTById,
    createTratamientoPOT,
    updateTratamientoPOT,
    deleteTratamientoPOT,
    getTiposVivienda
} from "~/services/pot.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    try {
        // Registrar vista de la página POT
        await recordEvent(request, {
            type: "view",
            name: "admin_pot_page",
            value: {
                user_id: user.id,
                role: user.role,
                section: "pot"
            }
        });

        // Obtener tratamientos POT con paginación
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const pageSize = parseInt(url.searchParams.get("page_size") || "10");

        const [tratamientosResponse, tiposViviendaResponse] = await Promise.all([
            getTratamientosPOT(request, { page, page_size: pageSize }),
            getTiposVivienda(request)
        ]);

        return json({
            user,
            tratamientos: tratamientosResponse.tratamientos,
            count: tratamientosResponse.count,
            tiposVivienda: tiposViviendaResponse.tipos,
            pagination: {
                page,
                pageSize,
                totalPages: Math.ceil(tratamientosResponse.count / pageSize),
                next: tratamientosResponse.next,
                previous: tratamientosResponse.previous
            },
            error: undefined as string | undefined
        }, {
            headers: {
                ...tratamientosResponse.headers,
                ...tiposViviendaResponse.headers
            }
        });
    } catch (error) {
        console.error("Error cargando datos POT:", error);
        return json({
            user,
            tratamientos: [],
            count: 0,
            tiposVivienda: { tipos_frente_minimo: [], tipos_area_lote: [], tipos_area_vivienda: [] },
            pagination: { page: 1, pageSize: 10, totalPages: 0, next: null, previous: null },
            error: "Error al cargar datos POT"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;

    try {
        switch (action) {
            case "create": {
                const tratamientoData = {
                    codigo: formData.get("codigo") as string,
                    nombre: formData.get("nombre") as string,
                    descripcion: formData.get("descripcion") as string,
                    indice_ocupacion: formData.get("indice_ocupacion") as string,
                    indice_construccion: formData.get("indice_construccion") as string,
                    altura_maxima: parseInt(formData.get("altura_maxima") as string),
                    retiro_frontal: formData.get("retiro_frontal") as string,
                    retiro_lateral: formData.get("retiro_lateral") as string,
                    retiro_posterior: formData.get("retiro_posterior") as string,
                    activo: formData.get("activo") === "true"
                };

                await recordEvent(request, {
                    type: "action",
                    name: "pot_tratamiento_created",
                    value: {
                        user_id: user.id,
                        codigo: tratamientoData.codigo,
                        nombre: tratamientoData.nombre
                    }
                });

                const result = await createTratamientoPOT(request, tratamientoData);

                return json({
                    success: true,
                    message: `Tratamiento ${tratamientoData.codigo} creado exitosamente`,
                    tratamiento: result.tratamiento
                }, {
                    headers: result.headers
                });
            }

            case "update": {
                const id = formData.get("id") as string;
                const tratamientoData = {
                    codigo: formData.get("codigo") as string,
                    nombre: formData.get("nombre") as string,
                    descripcion: formData.get("descripcion") as string,
                    indice_ocupacion: formData.get("indice_ocupacion") as string,
                    indice_construccion: formData.get("indice_construccion") as string,
                    altura_maxima: parseInt(formData.get("altura_maxima") as string),
                    retiro_frontal: formData.get("retiro_frontal") as string,
                    retiro_lateral: formData.get("retiro_lateral") as string,
                    retiro_posterior: formData.get("retiro_posterior") as string,
                    activo: formData.get("activo") === "true"
                };

                await recordEvent(request, {
                    type: "action",
                    name: "pot_tratamiento_updated",
                    value: {
                        user_id: user.id,
                        tratamiento_id: id,
                        codigo: tratamientoData.codigo
                    }
                });

                const result = await updateTratamientoPOT(request, id, tratamientoData);

                return json({
                    success: true,
                    message: `Tratamiento ${tratamientoData.codigo} actualizado exitosamente`,
                    tratamiento: result.tratamiento
                }, {
                    headers: result.headers
                });
            }

            case "delete": {
                const id = formData.get("id") as string;

                await recordEvent(request, {
                    type: "action",
                    name: "pot_tratamiento_deleted",
                    value: {
                        user_id: user.id,
                        tratamiento_id: id
                    }
                });

                const result = await deleteTratamientoPOT(request, id);

                return json({
                    success: true,
                    message: "Tratamiento eliminado exitosamente"
                }, {
                    headers: result.headers
                });
            }

            default:
                return json({
                    success: false,
                    message: "Acción no válida"
                });
        }
    } catch (error) {
        console.error(`Error en acción POT ${action}:`, error);
        return json({
            success: false,
            message: `Error al ${action === "create" ? "crear" : action === "update" ? "actualizar" : "eliminar"} tratamiento: ${(error as Error).message}`
        });
    }
}

export default function AdminPOT() {
    const { tratamientos, count, tiposVivienda, pagination, error } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTratamiento, setEditingTratamiento] = useState<any>(null);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");

    // Función para abrir modal de creación
    const openCreateModal = () => {
        setEditingTratamiento(null);
        setModalMode("create");
        setModalOpen(true);
    };

    // Función para abrir modal de edición
    const openEditModal = (tratamiento: any) => {
        setEditingTratamiento(tratamiento);
        setModalMode("edit");
        setModalOpen(true);
    };

    // Función para eliminar tratamiento
    const deleteTratamiento = (id: number) => {
        if (confirm("¿Está seguro de eliminar este tratamiento?")) {
            const form = document.createElement("form");
            form.method = "post";
            form.innerHTML = `
        <input type="hidden" name="action" value="delete" />
        <input type="hidden" name="id" value="${id}" />
      `;
            document.body.appendChild(form);
            form.submit();
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Gestión de Tratamientos POT</h1>
                <p className="text-gray-600 mt-2">
                    Administrar tratamientos del Plan de Ordenamiento Territorial
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Action result message */}
            {actionData?.message && (
                <div className={`mb-6 p-4 rounded-md ${actionData.success
                    ? "bg-green-50 border-l-4 border-green-400 text-green-700"
                    : "bg-red-50 border-l-4 border-red-400 text-red-700"
                    }`}>
                    {actionData.message}
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Total Tratamientos</h3>
                    <p className="text-3xl font-bold text-blue-600">{count}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Tratamientos Activos</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {tratamientos.filter((t: any) => t.activo).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Tipos de Vivienda</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        {tiposVivienda.tipos_area_vivienda?.length || 0}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="mb-6 flex justify-between items-center">
                <div className="flex space-x-3">
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Nuevo Tratamiento
                    </button>
                </div>
                <div className="text-sm text-gray-500">
                    Mostrando {tratamientos.length} de {count} tratamientos
                </div>
            </div>

            {/* Treatments table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Índices</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tratamientos.map((tratamiento: any) => (
                                <tr key={tratamiento.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {tratamiento.codigo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {tratamiento.nombre}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {tratamiento.descripcion}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="text-xs">
                                            <div>IO: {(parseFloat(tratamiento.indice_ocupacion) * 100).toFixed(0)}%</div>
                                            <div>IC: {tratamiento.indice_construccion}</div>
                                            <div>Alt: {tratamiento.altura_maxima}p</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tratamiento.activo
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                            }`}>
                                            {tratamiento.activo ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(tratamiento)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => deleteTratamiento(tratamiento.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Página {pagination.page} de {pagination.totalPages}
                        </div>
                        <div className="flex space-x-2">
                            {pagination.previous && (
                                <a
                                    href={`?page=${pagination.page - 1}`}
                                    className="px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Anterior
                                </a>
                            )}
                            {pagination.next && (
                                <a
                                    href={`?page=${pagination.page + 1}`}
                                    className="px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Siguiente
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for create/edit */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {modalMode === "create" ? "Crear Nuevo Tratamiento" : "Editar Tratamiento"}
                            </h3>
                        </div>

                        <Form method="post" className="p-6">
                            <input type="hidden" name="action" value={modalMode} />
                            {modalMode === "edit" && editingTratamiento && (
                                <input type="hidden" name="id" value={editingTratamiento.id} />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código *
                                    </label>
                                    <input
                                        type="text"
                                        name="codigo"
                                        required
                                        defaultValue={editingTratamiento?.codigo || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="CN1, CN2, etc."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        required
                                        defaultValue={editingTratamiento?.nombre || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="Consolidación Nivel 1"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        name="descripcion"
                                        rows={3}
                                        defaultValue={editingTratamiento?.descripcion || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="Descripción del tratamiento..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Índice de Ocupación *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="1"
                                        name="indice_ocupacion"
                                        required
                                        defaultValue={editingTratamiento?.indice_ocupacion || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="0.70"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Índice de Construcción *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        name="indice_construccion"
                                        required
                                        defaultValue={editingTratamiento?.indice_construccion || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="1.0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Altura Máxima (pisos) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        name="altura_maxima"
                                        required
                                        defaultValue={editingTratamiento?.altura_maxima || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Retiro Frontal (m)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        name="retiro_frontal"
                                        defaultValue={editingTratamiento?.retiro_frontal || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="3.0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Retiro Lateral (m)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        name="retiro_lateral"
                                        defaultValue={editingTratamiento?.retiro_lateral || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="1.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Retiro Posterior (m)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        name="retiro_posterior"
                                        defaultValue={editingTratamiento?.retiro_posterior || ""}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                        placeholder="3.0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        name="activo"
                                        defaultValue={editingTratamiento?.activo ? "true" : "false"}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                    >
                                        <option value="true">Activo</option>
                                        <option value="false">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Guardando..." : modalMode === "create" ? "Crear" : "Actualizar"}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    );
}