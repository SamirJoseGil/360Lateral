import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser, getAccessTokenFromCookies } from "~/utils/auth.server";

type ActionData = {
    errors?: {
        name?: string;
        email?: string;
        currentPassword?: string;
        newPassword?: string;
        general?: string;
    };
    success?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "updateProfile") {
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;

        // Validaciones básicas
        const errors: ActionData["errors"] = {};

        if (!name || name.trim() === "") {
            errors.name = "El nombre es obligatorio";
        }

        if (!email || !email.includes("@")) {
            errors.email = "Email inválido";
        }

        if (Object.keys(errors).length > 0) {
            return json({ errors }, { status: 400 });
        }

        try {
            const token = await getAccessTokenFromCookies(request);
            const response = await fetch("http://localhost:8000/api/users/me/", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    email,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return json({
                    errors: {
                        general: errorData.message || "Error al actualizar perfil"
                    }
                }, { status: response.status });
            }

            return json({ success: "Perfil actualizado correctamente" });
        } catch (error) {
            console.error("Error actualizando perfil:", error);
            return json({ errors: { general: "Error de conexión al servidor" } }, { status: 500 });
        }
    }

    if (intent === "changePassword") {
        const currentPassword = formData.get("currentPassword") as string;
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        // Validaciones básicas
        const errors: ActionData["errors"] = {};

        if (!currentPassword) {
            errors.currentPassword = "La contraseña actual es obligatoria";
        }

        if (!newPassword || newPassword.length < 8) {
            errors.newPassword = "La nueva contraseña debe tener al menos 8 caracteres";
        }

        if (newPassword !== confirmPassword) {
            errors.newPassword = "Las contraseñas no coinciden";
        }

        if (Object.keys(errors).length > 0) {
            return json({ errors }, { status: 400 });
        }

        try {
            const token = await getAccessTokenFromCookies(request);
            const response = await fetch("http://localhost:8000/api/auth/change-password/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return json({
                    errors: {
                        general: errorData.message || "Error al cambiar la contraseña"
                    }
                }, { status: response.status });
            }

            return json({ success: "Contraseña actualizada correctamente" });
        } catch (error) {
            console.error("Error cambiando contraseña:", error);
            return json({ errors: { general: "Error de conexión al servidor" } }, { status: 500 });
        }
    }

    return json({ errors: { general: "Operación no válida" } }, { status: 400 });
}

// Ya estamos usando la función getAccessTokenFromCookies importada

export default function ProfilePage() {
    const { user } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>() as ActionData | undefined;
    const [activeTab, setActiveTab] = useState("profile"); // "profile" o "security"
    const [profileFormData, setProfileFormData] = useState({
        name: user.name || "",
        email: user.email || "",
    });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const roleLabels = {
        admin: "Administrador",
        owner: "Propietario",
        developer: "Desarrollador"
    };

    const roleClasses = {
        admin: "bg-purple-100 text-purple-800",
        owner: "bg-green-100 text-green-800",
        developer: "bg-blue-100 text-blue-800"
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="flex border-b">
                    <button
                        className={`flex-1 py-4 px-6 text-center ${activeTab === "profile"
                            ? "border-b-2 border-blue-500 font-medium text-blue-600"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                        onClick={() => setActiveTab("profile")}
                    >
                        Perfil
                    </button>
                    <button
                        className={`flex-1 py-4 px-6 text-center ${activeTab === "security"
                            ? "border-b-2 border-blue-500 font-medium text-blue-600"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                        onClick={() => setActiveTab("security")}
                    >
                        Seguridad
                    </button>
                </div>

                <div className="p-6">
                    {actionData?.success && (
                        <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
                            <p>{actionData.success}</p>
                        </div>
                    )}

                    {actionData?.errors?.general && (
                        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                            <p>{actionData.errors.general}</p>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <>
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-4">Información Personal</h2>

                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                        <span className="text-2xl text-gray-600">
                                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-medium">{user.name || "Usuario"}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                        <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${roleClasses[user.role as keyof typeof roleClasses] || "bg-gray-100 text-gray-800"}`}>
                                            {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                                        </span>
                                    </div>
                                </div>

                                <Form method="post">
                                    <input type="hidden" name="intent" value="updateProfile" />
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={profileFormData.name}
                                                onChange={handleProfileChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                id="email"
                                                value={profileFormData.email}
                                                onChange={handleProfileChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
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
                        </>
                    )}

                    {activeTab === "security" && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-4">Cambiar Contraseña</h2>

                            <Form method="post">
                                <input type="hidden" name="intent" value="changePassword" />
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                                            Contraseña Actual
                                        </label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            id="currentPassword"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                            Nueva Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            id="newPassword"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                            Confirmar Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            id="confirmPassword"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                                        >
                                            Cambiar Contraseña
                                        </button>
                                    </div>
                                </div>
                            </Form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}