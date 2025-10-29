import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";
import { getCurrentUser, updateCurrentUserProfile } from "~/services/users.server";
import { changePassword, validatePassword } from "~/services/auth.server";

type ActionData = {
    errors?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        current_password?: string;
        new_password?: string;
        confirm_password?: string;
        general?: string;
    };
    success?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    try {
        // Obtener datos completos del usuario
        const { user: fullUserData, headers } = await getCurrentUser(request);

        // Registrar evento de vista del perfil
        await recordEvent(request, {
            type: "view",
            name: "profile_page",
            value: {
                user_id: user.id,
                role: user.role
            }
        });

        return json({ user: fullUserData }, { headers });
    } catch (error) {
        console.error("Error cargando perfil:", error);
        return json({ user });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "updateProfile") {
        try {
            // Extraer datos del formulario según el rol
            const updateData: any = {
                first_name: formData.get("first_name") as string,
                last_name: formData.get("last_name") as string,
                phone: formData.get("phone") as string,
                company: formData.get("company") as string,
            };

            // Campos específicos por rol
            if (user.role === "owner") {
                updateData.document_type = formData.get("document_type") as string;
                updateData.document_number = formData.get("document_number") as string;
                updateData.address = formData.get("address") as string;
            } else if (user.role === "developer") {
                updateData.company_name = formData.get("company_name") as string;
                updateData.company_nit = formData.get("company_nit") as string;
                updateData.position = formData.get("position") as string;
                updateData.experience_years = parseInt(formData.get("experience_years") as string || "0");
                updateData.portfolio_url = formData.get("portfolio_url") as string;
                updateData.focus_area = formData.get("focus_area") as string;
            } else if (user.role === "admin") {
                updateData.department = formData.get("department") as string;
                updateData.permissions_scope = formData.get("permissions_scope") as string;
            }

            // Validaciones básicas
            const errors: ActionData["errors"] = {};

            if (!updateData.first_name || updateData.first_name.trim() === "") {
                errors.first_name = "El nombre es obligatorio";
            }

            if (!updateData.last_name || updateData.last_name.trim() === "") {
                errors.last_name = "El último nombre es obligatorio";
            }

            if (updateData.phone && !/^\+?[\d\s\-\(\)]+$/.test(updateData.phone)) {
                errors.phone = "Formato de teléfono inválido";
            }

            if (Object.keys(errors).length > 0) {
                return json({ errors }, { status: 400 });
            }

            // Actualizar perfil usando el servicio
            const { success, message, user: updatedUser, headers } = await updateCurrentUserProfile(request, updateData);

            if (success) {
                return json({ success: message || "Perfil actualizado correctamente" }, { headers });
            } else {
                return json({ errors: { general: "Error al actualizar perfil" } }, { status: 400 });
            }

        } catch (error) {
            console.error("Error actualizando perfil:", error);
            return json({
                errors: {
                    general: error instanceof Error ? error.message : "Error de conexión al servidor"
                }
            }, { status: 500 });
        }
    }

    if (intent === "changePassword") {
        try {
            const currentPassword = formData.get("current_password") as string;
            const newPassword = formData.get("new_password") as string;
            const confirmPassword = formData.get("confirm_password") as string;

            // Validaciones básicas
            const errors: ActionData["errors"] = {};

            if (!currentPassword) {
                errors.current_password = "La contraseña actual es obligatoria";
            }

            if (!newPassword) {
                errors.new_password = "La nueva contraseña es obligatoria";
            } else {
                // Validar formato de la nueva contraseña
                const passwordErrors = validatePassword(newPassword);
                if (passwordErrors.length > 0) {
                    errors.new_password = passwordErrors[0];
                }
            }

            if (newPassword !== confirmPassword) {
                errors.confirm_password = "Las contraseñas no coinciden";
            }

            if (Object.keys(errors).length > 0) {
                return json({ errors }, { status: 400 });
            }

            // Cambiar contraseña usando el servicio
            const { success, message, headers } = await changePassword(request, {
                current_password: currentPassword,
                new_password: newPassword
            });

            if (success) {
                return json({ success: message || "Contraseña actualizada correctamente" }, { headers });
            } else {
                return json({ errors: { general: "Error al cambiar la contraseña" } }, { status: 400 });
            }

        } catch (error) {
            console.error("Error cambiando contraseña:", error);
            return json({
                errors: {
                    general: error instanceof Error ? error.message : "Error de conexión al servidor"
                }
            }, { status: 500 });
        }
    } return json({ errors: { general: "Operación no válida" } }, { status: 400 });
}

export default function ProfilePage() {
    const { user } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>() as ActionData | undefined;
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState("profile");
    const isSubmitting = navigation.state === "submitting";

    const roleLabels = {
        admin: "Administrador",
        owner: "Propietario",
        developer: "Desarrollador"
    };

    const roleClasses = {
        admin: "bg-purple-100 text-purple-800 border-purple-200",
        owner: "bg-green-100 text-green-800 border-green-200",
        developer: "bg-blue-100 text-blue-800 border-blue-200"
    };

    const departmentOptions = {
        normativa: "Normativa",
        soporte_tecnico: "Soporte Técnico",
        gestion: "Gestión",
        desarrollo: "Desarrollo"
    };

    const focusAreaOptions = {
        residential: "Residencial",
        commercial: "Comercial",
        industrial: "Industrial",
        mixed: "Mixto"
    };

    const permissionScopeOptions = {
        limited: "Limitado",
        full: "Completo"
    };

    return (
        <div className="min-h-screen bg-gray-50 py-32">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                        <p className="mt-2 text-gray-600">Gestiona tu información personal y configuración de cuenta</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver atrás
                    </button>
                </div>

                {/* Main Card */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
                        <div className="flex items-center space-x-6">
                            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-4 border-white border-opacity-30">
                                <span className="text-3xl font-bold text-white">
                                    {user.first_name?.charAt(0)?.toUpperCase() || user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <div className="text-white">
                                <h2 className="text-2xl font-bold">{user.full_name || `${user.first_name} ${user.last_name}` || "Usuario"}</h2>
                                <p className="text-blue-100 mt-1">{user.email}</p>
                                <div className="mt-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleClasses[user.role as keyof typeof roleClasses] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "profile"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Información Personal
                            </button>
                            <button
                                onClick={() => setActiveTab("security")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === "security"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Seguridad
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Alerts */}
                        {actionData?.success && (
                            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg" role="alert">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="ml-3 text-green-700 font-medium">{actionData.success}</p>
                                </div>
                            </div>
                        )}

                        {actionData?.errors?.general && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" role="alert">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="ml-3 text-red-700 font-medium">{actionData.errors.general}</p>
                                </div>
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <Form method="post" className="space-y-6">
                                <input type="hidden" name="intent" value="updateProfile" />

                                {/* Basic Information */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre *
                                            </label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                id="first_name"
                                                defaultValue={user.first_name || ""}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                            {actionData?.errors?.first_name && (
                                                <p className="mt-1 text-sm text-red-600">{actionData.errors.first_name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                Apellidos *
                                            </label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                id="last_name"
                                                defaultValue={user.last_name || ""}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                            {actionData?.errors?.last_name && (
                                                <p className="mt-1 text-sm text-red-600">{actionData.errors.last_name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                id="phone"
                                                defaultValue={user.phone || ""}
                                                placeholder="+57 300 123 4567"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                            {actionData?.errors?.phone && (
                                                <p className="mt-1 text-sm text-red-600">{actionData.errors.phone}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                                                Empresa
                                            </label>
                                            <input
                                                type="text"
                                                name="company"
                                                id="company"
                                                defaultValue={user.company || ""}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Role Specific Fields */}
                                {user.role === "owner" && (
                                    <div className="bg-green-50 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Propietario</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tipo de Documento
                                                </label>
                                                <select
                                                    name="document_type"
                                                    id="document_type"
                                                    defaultValue={user.role_fields?.document_type || ""}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="CC">Cédula de Ciudadanía</option>
                                                    <option value="CE">Cédula de Extranjería</option>
                                                    <option value="NIT">NIT</option>
                                                    <option value="PP">Pasaporte</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Número de Documento
                                                </label>
                                                <input
                                                    type="text"
                                                    name="document_number"
                                                    id="document_number"
                                                    defaultValue={user.role_fields?.document_number || ""}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Dirección
                                                </label>
                                                <textarea
                                                    name="address"
                                                    id="address"
                                                    rows={3}
                                                    defaultValue={user.role_fields?.address || ""}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            {user.role_fields?.lots_count !== undefined && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Lotes Registrados
                                                    </label>
                                                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                                                        {user.role_fields.lots_count} lotes
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {user.role === "developer" && (
                                    <div className="bg-blue-50 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Desarrollador</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nombre de la Empresa
                                                </label>
                                                <input
                                                    type="text"
                                                    name="company_name"
                                                    id="company_name"
                                                    defaultValue={user.role_fields?.company_name || ""}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="company_nit" className="block text-sm font-medium text-gray-700 mb-2">
                                                    NIT de la Empresa
                                                </label>
                                                <input
                                                    type="text"
                                                    name="company_nit"
                                                    id="company_nit"
                                                    defaultValue={user.role_fields?.company_nit || ""}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Cargo
                                                </label>
                                                <input
                                                    type="text"
                                                    name="position"
                                                    id="position"
                                                    defaultValue={user.role_fields?.position || ""}
                                                    placeholder="Ej: Arquitecto, Ingeniero, Gerente"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Años de Experiencia
                                                </label>
                                                <input
                                                    type="number"
                                                    name="experience_years"
                                                    id="experience_years"
                                                    min="0"
                                                    max="50"
                                                    defaultValue={user.role_fields?.experience_years || 0}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="portfolio_url" className="block text-sm font-medium text-gray-700 mb-2">
                                                    URL del Portafolio
                                                </label>
                                                <input
                                                    type="url"
                                                    name="portfolio_url"
                                                    id="portfolio_url"
                                                    defaultValue={user.role_fields?.portfolio_url || ""}
                                                    placeholder="https://miportfolio.com"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="focus_area" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Área de Enfoque
                                                </label>
                                                <select
                                                    name="focus_area"
                                                    id="focus_area"
                                                    defaultValue={user.role_fields?.focus_area || ""}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {Object.entries(focusAreaOptions).map(([value, label]) => (
                                                        <option key={value} value={value}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {user.role === "admin" && (
                                    <div className="bg-purple-50 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Administrador</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Departamento
                                                </label>
                                                <select
                                                    name="department"
                                                    id="department"
                                                    defaultValue={user.role_fields?.department || ""}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {Object.entries(departmentOptions).map(([value, label]) => (
                                                        <option key={value} value={value}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="permissions_scope" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Alcance de Permisos
                                                </label>
                                                <select
                                                    name="permissions_scope"
                                                    id="permissions_scope"
                                                    defaultValue={user.role_fields?.permissions_scope || ""}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {Object.entries(permissionScopeOptions).map(([value, label]) => (
                                                        <option key={value} value={value}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Save Button */}
                                <div className="flex justify-end pt-6 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Form>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <div className="space-y-6">
                                {/* Change Password Form */}
                                <Form method="post" className="space-y-6">
                                    <input type="hidden" name="intent" value="changePassword" />

                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Contraseña Actual *
                                                </label>
                                                <input
                                                    type="password"
                                                    name="current_password"
                                                    id="current_password"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                                {actionData?.errors?.current_password && (
                                                    <p className="mt-1 text-sm text-red-600">{actionData.errors.current_password}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Nueva Contraseña *
                                                </label>
                                                <input
                                                    type="password"
                                                    name="new_password"
                                                    id="new_password"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números
                                                </p>
                                                {actionData?.errors?.new_password && (
                                                    <p className="mt-1 text-sm text-red-600">{actionData.errors.new_password}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirmar Nueva Contraseña *
                                                </label>
                                                <input
                                                    type="password"
                                                    name="confirm_password"
                                                    id="confirm_password"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                                {actionData?.errors?.confirm_password && (
                                                    <p className="mt-1 text-sm text-red-600">{actionData.errors.confirm_password}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Cambiando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        Cambiar Contraseña
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </Form>

                                {/* Security Information */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Seguridad</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Estado de verificación</p>
                                                <p className="text-sm text-gray-500">Tu cuenta está verificada</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.is_verified ? 'Verificada' : 'No verificada'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Estado de la cuenta</p>
                                                <p className="text-sm text-gray-500">Tu cuenta está activa</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.is_active ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Cuenta creada</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Última actualización</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(user.updated_at).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Tips */}
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                    <div className="flex">
                                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="ml-3">
                                            <p className="text-blue-700 font-medium">Consejos de Seguridad</p>
                                            <div className="text-blue-600 text-sm mt-1">
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Cambia tu contraseña regularmente</li>
                                                    <li>No compartas tus credenciales con nadie</li>
                                                    <li>Usa una contraseña única para esta plataforma</li>
                                                    <li>Cierra sesión en dispositivos compartidos</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}