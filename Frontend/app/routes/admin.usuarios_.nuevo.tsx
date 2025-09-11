import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useState, useEffect } from "react";
import { getUser } from "~/utils/auth.server";
import { createUser, handleApiError } from "~/services/users.server";

export async function loader({ request }: LoaderFunctionArgs) {
    console.log("Admin new user loader - processing request");

    // Verificar que el usuario esté autenticado y sea admin
    const currentUser = await getUser(request);
    if (!currentUser) {
        console.log("Admin new user loader - no user, redirecting to home");
        return redirect("/");
    }

    if (currentUser.role !== "admin") {
        console.log(`Admin new user loader - user is not admin (${currentUser.role})`);
        return redirect("/");
    }

    return json({ currentUser });
}

// Definir interfaces para tipado
interface UserFormValues {
    first_name: string;
    last_name: string;
    email: string;
    username?: string;
    phone?: string;
    company?: string;
    role: "admin" | "owner" | "developer";
}

interface UserActionDataWithErrors {
    success: false;
    errors: Record<string, string>;
    values: UserFormValues;
}

interface UserActionDataWithMessage {
    success: false;
    message: string;
    errors?: Record<string, string>;
    values?: UserFormValues;
}

interface UserActionDataSuccess {
    success: true;
    user: any;
}

type UserActionData = UserActionDataWithErrors | UserActionDataWithMessage | UserActionDataSuccess;

export async function action({ request }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const currentUser = await getUser(request);
    if (!currentUser || currentUser.role !== "admin") {
        return json<UserActionData>({ success: false, message: "No autorizado" }, { status: 403 });
    }

    // Procesar los datos del formulario
    const formData = await request.formData();
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;
    const role = formData.get("role") as "admin" | "owner" | "developer";
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validaciones básicas
    const errors: Record<string, string> = {};

    if (!first_name || first_name.trim() === "") {
        errors.first_name = "El nombre es obligatorio";
    }

    if (!last_name || last_name.trim() === "") {
        errors.last_name = "El apellido es obligatorio";
    }

    if (!email || email.trim() === "") {
        errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "El formato del email es inválido";
    }

    if (!role) {
        errors.role = "El rol es obligatorio";
    }

    if (!password) {
        errors.password = "La contraseña es obligatoria";
    }

    if (password !== confirmPassword) {
        errors.confirmPassword = "Las contraseñas no coinciden";
    }

    // Si hay errores, devolver el formulario con los errores
    if (Object.keys(errors).length > 0) {
        return json<UserActionDataWithErrors>({
            success: false,
            errors,
            values: { first_name, last_name, email, username, phone, company, role }
        });
    }

    try {
        // Crear el usuario
        const { user, headers } = await createUser(request, {
            first_name,
            last_name,
            email,
            username,
            phone,
            company,
            role,
            password
        });

        // Redirigir a la página de detalles del nuevo usuario
        return redirect(`/admin/usuario/${user.id}`, {
            headers
        });
    } catch (error) {
        console.error("Error creating user:", error);
        const { error: errorMessage } = handleApiError(error, "Error al crear usuario");

        // Si el error es de email duplicado, mostrar un mensaje específico
        const message = errorMessage.toLowerCase().includes("email")
            ? "El email ya está en uso por otro usuario"
            : errorMessage;

        return json<UserActionDataWithMessage>({
            success: false,
            message,
            errors: errorMessage.toLowerCase().includes("email") ? { email: message } : {},
            values: { first_name, last_name, email, username, phone, company, role }
        });
    }
}

// Funciones de ayuda para verificar tipos
function hasErrors(data: UserActionData | undefined): data is UserActionDataWithErrors {
    return data !== undefined && !data.success && 'errors' in data;
}

function hasMessage(data: UserActionData | undefined): data is UserActionDataWithMessage {
    return data !== undefined && !data.success && 'message' in data;
}

function hasValues(data: UserActionData | undefined): data is UserActionDataWithErrors | UserActionDataWithMessage {
    return (
        data !== undefined &&
        !data.success &&
        typeof (data as any).values !== "undefined"
    );
}

export default function AdminNewUser() {
    const actionData = useActionData<typeof action>() as (UserActionData | undefined);
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    // Estados locales para contraseñas
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    // Verificar si las contraseñas coinciden
    useEffect(() => {
        if (password || confirmPassword) {
            setPasswordsMatch(password === confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [password, confirmPassword]); return (
        <div className="p-6">
            {/* Encabezado y botones de navegación */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                <h1 className="text-3xl font-bold mb-4 md:mb-0">Crear Nuevo Usuario</h1>
                <div>
                    <Link
                        to="/admin/usuarios"
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Cancelar
                    </Link>
                </div>
            </div>

            {/* Mensaje de error general */}
            {hasMessage(actionData) && actionData.message && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    <p>{actionData.message}</p>
                </div>
            )}

            {/* Formulario de creación */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Form method="post" className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                id="first_name"
                                defaultValue={(hasValues(actionData) && actionData.values?.first_name) || ""}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasErrors(actionData) && actionData.errors?.first_name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {hasErrors(actionData) && actionData.errors?.first_name && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.first_name}</p>
                            )}
                        </div>

                        {/* Apellido */}
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                id="last_name"
                                defaultValue={(hasValues(actionData) && actionData.values?.last_name) || ""}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasErrors(actionData) && actionData.errors?.last_name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {hasErrors(actionData) && actionData.errors?.last_name && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.last_name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                defaultValue={(hasValues(actionData) && actionData.values?.email) || ""}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasErrors(actionData) && actionData.errors?.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {hasErrors(actionData) && actionData.errors?.email && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.email}</p>
                            )}
                        </div>

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                defaultValue={(hasValues(actionData) && actionData.values?.username) || ""}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasErrors(actionData) && actionData.errors?.username ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {hasErrors(actionData) && actionData.errors?.username && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.username}</p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                defaultValue={(hasValues(actionData) && actionData.values?.phone) || ""}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasErrors(actionData) && actionData.errors?.phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {hasErrors(actionData) && actionData.errors?.phone && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.phone}</p>
                            )}
                        </div>

                        {/* Empresa */}
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                                Empresa
                            </label>
                            <input
                                type="text"
                                name="company"
                                id="company"
                                defaultValue={(hasValues(actionData) && actionData.values?.company) || ""}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasErrors(actionData) && actionData.errors?.company ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {hasErrors(actionData) && actionData.errors?.company && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.company}</p>
                            )}
                        </div>

                        {/* Rol */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                Rol <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="role"
                                id="role"
                                defaultValue={(hasValues(actionData) && actionData.values?.role) || "developer"}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasErrors(actionData) && actionData.errors?.role ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            >
                                <option value="admin">Administrador</option>
                                <option value="owner">Propietario</option>
                                <option value="developer">Desarrollador</option>
                            </select>
                            {hasErrors(actionData) && actionData.errors?.role && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.role}</p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasErrors(actionData) && actionData.errors?.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {hasErrors(actionData) && actionData.errors?.password && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.password}</p>
                            )}
                        </div>

                        {/* Confirmar Contraseña */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Contraseña <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(!passwordsMatch || (hasErrors(actionData) && actionData.errors?.confirmPassword)) ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {!passwordsMatch && (
                                <p className="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
                            )}
                            {hasErrors(actionData) && actionData.errors?.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{actionData.errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-8 flex justify-end">
                        <Link
                            to="/admin/usuarios"
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mr-4"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting || !passwordsMatch}
                            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${(isSubmitting || !passwordsMatch) ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? 'Creando usuario...' : 'Crear Usuario'}
                        </button>
                    </div>
                </Form>
            </div>
        </div>
    );
}