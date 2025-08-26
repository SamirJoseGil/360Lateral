import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser, getAccessTokenFromCookies } from "~/utils/auth.server";
import { useState } from "react";

// Tipos para los datos de la API
type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type ActionData = {
    errors?: {
        name?: string;
        email?: string;
        role?: string;
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

    try {
        const token = await getAccessTokenFromCookies(request);
        const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Error al cargar datos del usuario");
        }

        const user = await response.json();

        return json({ user, currentUser });
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
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;

    // Validaciones básicas
    const errors: ActionData["errors"] = {};

    if (!name || name.trim() === "") {
        errors.name = "El nombre es obligatorio";
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
        const token = await getAccessTokenFromCookies(request);
        const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name,
                email,
                role,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return json({
                errors: {
                    general: errorData.message || "Error al actualizar usuario"
                }
            }, { status: response.status });
        }

        return json({ success: true });
    } catch (error) {
        console.error("Error actualizando usuario:", error);
        return json({ errors: { general: "Error de conexión al servidor" } }, { status: 500 });
    }
}

export default function EditUserPage() {
    const { user } = useLoaderData<typeof loader>();
    // Hacer una aserción de tipo para resolver los errores de TS
    const actionData = useActionData<typeof action>() as ActionData | undefined;
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        role: user.role,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
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
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Nombre
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {actionData?.errors?.name && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            {actionData?.errors?.email && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Rol
                            </label>
                            <select
                                name="role"
                                id="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="admin">Administrador</option>
                                <option value="owner">Propietario</option>
                                <option value="developer">Desarrollador</option>
                            </select>
                            {actionData?.errors?.role && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.role}</p>
                            )}
                        </div>

                        <div className="mt-4">
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}