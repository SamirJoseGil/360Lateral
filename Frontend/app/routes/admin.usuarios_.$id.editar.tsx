import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useSubmit } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { useState } from "react";
import { getUserById, updateUser, deleteUser } from "~/services/users.server";

// Tipos para los datos de la API
type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type ActionData = {
    errors?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        role?: string;
        username?: string;
        phone?: string;
        company?: string;
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

    const userId = params.id;
    if (!userId) {
        return redirect("/admin/usuarios");
    }

    try {
        const { user, headers } = await getUserById(request, userId);
        return json({ user, currentUser }, { headers });
    } catch (error) {
        console.error("Error cargando datos del usuario:", error);
        return redirect("/admin/usuarios");
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const currentUser = await getUser(request);
    if (!currentUser || currentUser.role !== "admin") {
        return json({ errors: { general: "No autorizado" } }, { status: 401 });
    }

    const userId = params.id;
    if (!userId) {
        return redirect("/admin/usuarios");
    }

    const formData = await request.formData();
    const action = formData.get("_action") as string;

    // Si la acción es eliminar
    if (action === "delete") {
        try {
            await deleteUser(request, userId);
            return redirect("/admin/usuarios");
        } catch (error) {
            console.error("Error eliminando usuario:", error);
            return json({
                errors: { general: "Error al eliminar usuario" }
            }, { status: 500 });
        }
    }

    // Si es actualizar
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const username = formData.get("username") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;

    // Validaciones básicas
    const errors: ActionData["errors"] = {};

    if (!first_name || first_name.trim() === "") {
        errors.first_name = "El nombre es obligatorio";
    }

    if (!last_name || last_name.trim() === "") {
        errors.last_name = "El apellido es obligatorio";
    }

    if (!email || !email.includes("@")) {
        errors.email = "Email inválido";
    }

    if (!role || !["admin", "owner", "developer"].includes(role)) {
        errors.role = "Rol inválido";
    }

    if (Object.keys(errors).length > 0) {
        return json({ errors }, { status: 400 });
    }

    try {
        const { user, headers } = await updateUser(request, userId, {
            first_name,
            last_name,
            email,
            role: role as "admin" | "owner" | "developer",
            username,
            phone,
            company
        });

        return json({ success: true, user }, { headers });
    } catch (error) {
        console.error("Error actualizando usuario:", error);
        return json({
            errors: { general: "Error al actualizar usuario" }
        }, { status: 500 });
    }
}

export default function EditUserPage() {
    const { user } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>() as ActionData | undefined;
    const submit = useSubmit();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        role: user.role,
        username: user.username || '',
        phone: user.phone || '',
        company: user.company || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

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
                <Link to="/admin/usuarios" className="text-blue-600 hover:text-blue-800">
                    ← Volver a Usuarios
                </Link>
                <h1 className="text-2xl font-bold">Editar Usuario</h1>
            </div>

            {actionData?.success && (
                <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                    <p>Usuario actualizado correctamente</p>
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
                        {/* Nombre */}
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                id="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {actionData?.errors?.first_name && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.first_name}</p>
                            )}
                        </div>

                        {/* Apellido */}
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                                Apellido *
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                id="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {actionData?.errors?.last_name && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.last_name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {actionData?.errors?.email && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.email}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {actionData?.errors?.username && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.username}</p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {actionData?.errors?.phone && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.phone}</p>
                            )}
                        </div>

                        {/* Empresa */}
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                                Empresa
                            </label>
                            <input
                                type="text"
                                name="company"
                                id="company"
                                value={formData.company}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {actionData?.errors?.company && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.company}</p>
                            )}
                        </div>

                        {/* Rol */}
                        <div className="md:col-span-2">
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Rol *
                            </label>
                            <select
                                name="role"
                                id="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="admin">Administrador</option>
                                <option value="owner">Propietario</option>
                                <option value="developer">Desarrollador</option>
                            </select>
                            {actionData?.errors?.role && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.role}</p>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-8 flex justify-between">
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Eliminar Usuario
                        </button>

                        <div className="flex space-x-4">
                            <Link
                                to="/admin/usuarios"
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
                                ¿Estás seguro de que quieres eliminar al usuario{' '}
                                <span className="font-medium">
                                    {formData.first_name} {formData.last_name} ({formData.email})
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