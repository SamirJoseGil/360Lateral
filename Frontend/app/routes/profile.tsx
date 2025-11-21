import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { requireUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

type ActionData = {
    errors?: {
        [key: string]: string;
    };
    success?: string;
    intent?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);

    try {
        // ✅ Obtener datos completos del usuario desde /api/auth/me/
        const { res: meRes, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/auth/me/`
        );

        if (!meRes.ok) {
            console.error(`Error loading user data: ${meRes.status}`);
            return json({ user });
        }

        const meData = await meRes.json();
        const fullUserData = meData.data || meData;

        return json({ user: fullUserData }, { headers: setCookieHeaders });
    } catch (error) {
        console.error("Error loading profile:", error);
        return json({ user });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "updateProfile") {
        try {
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
                const experienceYears = formData.get("experience_years") as string;
                if (experienceYears) {
                    updateData.experience_years = parseInt(experienceYears);
                }
                updateData.portfolio_url = formData.get("portfolio_url") as string;
                updateData.focus_area = formData.get("focus_area") as string;
            } else if (user.role === "admin") {
                updateData.department = formData.get("department") as string;
                updateData.permissions_scope = formData.get("permissions_scope") as string;
            }

            const { res: updateRes, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/users/me/update/`,
                {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                }
            );

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                return json({
                    intent: 'updateProfile',
                    errors: errorData.errors || { general: errorData.error || "Error al actualizar perfil" }
                }, { status: updateRes.status });
            }

            return json({
                intent: 'updateProfile',
                success: "Perfil actualizado correctamente"
            }, { headers: setCookieHeaders });

        } catch (error) {
            console.error("Error updating profile:", error);
            return json({
                intent: 'updateProfile',
                errors: { general: "Error de conexión al servidor" }
            }, { status: 500 });
        }
    }

    if (intent === "changePassword") {
        try {
            // ✅ NUEVO: Usar flujo de recuperación por email
            const { res: resetRes, setCookieHeaders } = await fetchWithAuth(
                request,
                `${API_URL}/api/users/password-reset/request/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.email
                    })
                }
            );

            if (!resetRes.ok) {
                const errorData = await resetRes.json();
                return json({
                    intent: 'changePassword',
                    errors: { general: errorData.error || 'Error al solicitar cambio de contraseña' }
                }, { status: resetRes.status });
            }

            const data = await resetRes.json();
            
            // ✅ El backend retorna el token directamente (temporal)
            if (data.success && data.data && data.data.token) {
                // Guardar token en sesión temporal para usarlo en reset-password
                return json({
                    intent: 'changePassword',
                    success: true,
                    resetToken: data.data.token,
                    message: 'Se ha generado un código de recuperación. Ahora puedes cambiar tu contraseña.'
                }, { headers: setCookieHeaders });
            }

            return json({
                intent: 'changePassword',
                errors: { general: 'No se pudo generar el código de recuperación' }
            }, { status: 500 });

        } catch (error) {
            console.error("Error requesting password reset:", error);
            return json({
                intent: 'changePassword',
                errors: { general: "Error de conexión al servidor" }
            }, { status: 500 });
        }
    }

    return json({ errors: { general: "Operación no válida" } }, { status: 400 });
}

export default function ProfilePage() {
    const { user } = useLoaderData<typeof loader>();
    const actionData = useActionData<ActionData>();
    const navigation = useNavigation();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState("profile");
    const [hasChanges, setHasChanges] = useState(false);
    
    const isSubmitting = navigation.state === "submitting";

    // ✅ NUEVO: Redirigir a reset-password si se recibió token
    useEffect(() => {
        if (actionData?.intent === 'changePassword' && 
            actionData?.success && 
            actionData?.resetToken) {
            // Redirigir a la página de reset con el token
            navigate(`/reset-password?token=${actionData.resetToken}`);
        }
    }, [actionData, navigate]);

    // ✅ Estado del formulario de perfil
    const [profileData, setProfileData] = useState({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        company: user.company || "",
        // Owner
        document_type: user.role_fields?.document_type || "",
        document_number: user.role_fields?.document_number || "",
        address: user.role_fields?.address || "",
        // Developer
        company_name: user.role_fields?.company_name || "",
        company_nit: user.role_fields?.company_nit || "",
        position: user.role_fields?.position || "",
        experience_years: user.role_fields?.experience_years || "",
        portfolio_url: user.role_fields?.portfolio_url || "",
        focus_area: user.role_fields?.focus_area || "",
        // Admin
        department: user.role_fields?.department || "",
        permissions_scope: user.role_fields?.permissions_scope || "",
    });

    // ✅ Detectar cambios
    useEffect(() => {
        const hasChanged = 
            profileData.first_name !== (user.first_name || "") ||
            profileData.last_name !== (user.last_name || "") ||
            profileData.phone !== (user.phone || "") ||
            profileData.company !== (user.company || "") ||
            (user.role === 'owner' && (
                profileData.document_type !== (user.role_fields?.document_type || "") ||
                profileData.document_number !== (user.role_fields?.document_number || "") ||
                profileData.address !== (user.role_fields?.address || "")
            )) ||
            (user.role === 'developer' && (
                profileData.company_name !== (user.role_fields?.company_name || "") ||
                profileData.company_nit !== (user.role_fields?.company_nit || "") ||
                profileData.position !== (user.role_fields?.position || "") ||
                profileData.experience_years !== (user.role_fields?.experience_years || "") ||
                profileData.portfolio_url !== (user.role_fields?.portfolio_url || "") ||
                profileData.focus_area !== (user.role_fields?.focus_area || "")
            )) ||
            (user.role === 'admin' && (
                profileData.department !== (user.role_fields?.department || "") ||
                profileData.permissions_scope !== (user.role_fields?.permissions_scope || "")
            ));
        
        setHasChanges(hasChanged);
    }, [profileData, user]);

    const handleInputChange = (field: string, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const roleLabels = {
        admin: "Administrador",
        owner: "Propietario",
        developer: "Desarrollador"
    };

    const roleColors = {
        admin: "from-purple-500 to-purple-700",
        owner: "from-green-500 to-green-700",
        developer: "from-blue-500 to-blue-700"
    };

    return (
        <div className="min-h-screen bg-gray-50 py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header con botón volver */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-lateral-600 transition-colors group"
                    >
                        <svg 
                            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">Volver</span>
                    </button>

                    <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                    <p className="text-gray-600 mt-2">Gestiona tu información personal y configuración</p>
                </div>

                {/* Card Principal */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header del perfil con gradiente */}
                    <div className={`bg-gradient-to-r ${roleColors[user.role as keyof typeof roleColors]} px-6 py-8 text-white`}>
                        <div className="flex items-center gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white border-opacity-30 shadow-xl">
                                <span className="text-4xl font-bold">
                                    {user.first_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            {/* Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold">
                                    {user.first_name && user.last_name 
                                        ? `${user.first_name} ${user.last_name}`
                                        : user.email
                                    }
                                </h2>
                                <p className="text-white text-opacity-90 mt-1">{user.email}</p>
                                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-sm">
                                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium">
                                        {roleLabels[user.role as keyof typeof roleLabels]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 bg-gray-50">
                        <nav className="flex px-6">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === "profile"
                                        ? "border-lateral-600 text-lateral-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Información Personal
                            </button>
                            <button
                                onClick={() => setActiveTab("security")}
                                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === "security"
                                        ? "border-lateral-600 text-lateral-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Seguridad
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* ✅ Alertas mejoradas */}
                        {actionData?.success && (
                            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-fade-in">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-green-800 font-medium">{actionData.success}</p>
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

                        {/* Tab Perfil */}
                        {activeTab === "profile" && (
                            <Form method="post" className="space-y-6">
                                <input type="hidden" name="intent" value="updateProfile" />

                                {/* Información Básica */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        Información Básica
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Nombre */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={profileData.first_name}
                                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                                placeholder={user.first_name || "Tu nombre"}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-lateral-500 focus:ring-4 focus:ring-lateral-200 focus:outline-none transition-all"
                                            />
                                        </div>

                                        {/* Apellido */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Apellido <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={profileData.last_name}
                                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                                placeholder={user.last_name || "Tu apellido"}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-lateral-500 focus:ring-4 focus:ring-lateral-200 focus:outline-none transition-all"
                                            />
                                        </div>

                                        {/* Email (solo lectura) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Correo electrónico
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={user.email}
                                                    disabled
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">El correo no puede ser modificado</p>
                                        </div>

                                        {/* Teléfono */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={profileData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                placeholder={user.phone || "+57 300 123 4567"}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-lateral-500 focus:ring-4 focus:ring-lateral-200 focus:outline-none transition-all"
                                            />
                                        </div>

                                        {/* Empresa */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Empresa
                                            </label>
                                            <input
                                                type="text"
                                                name="company"
                                                value={profileData.company}
                                                onChange={(e) => handleInputChange('company', e.target.value)}
                                                placeholder={user.company || "Nombre de tu empresa"}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-lateral-500 focus:ring-4 focus:ring-lateral-200 focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Botón de actualizar (solo si hay cambios) */}
                                {hasChanges && (
                                    <div className="flex justify-end pt-6 border-t border-gray-200">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-lateral-600 to-lateral-700 text-white rounded-lg hover:from-lateral-700 hover:to-lateral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lateral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
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
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Actualizar Perfil
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </Form>
                        )}

                        {/* Tab Seguridad */}
                        {activeTab === "security" && (
                            <div className="space-y-6">
                                {/* ✅ NUEVO: Card de cambio de contraseña simplificado */}
                                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 border-2 border-red-200">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                Cambiar Contraseña
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Para cambiar tu contraseña, te enviaremos un código de recuperación a tu email: <strong>{user.email}</strong>
                                            </p>
                                            
                                            <Form method="post">
                                                <input type="hidden" name="intent" value="changePassword" />
                                                
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                                >
                                                    {isSubmitting && actionData?.intent === 'changePassword' ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                            Generando código...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                            </svg>
                                                            Solicitar cambio de contraseña
                                                        </>
                                                    )}
                                                </button>
                                            </Form>

                                            {/* ✅ NUEVO: Explicación del proceso */}
                                            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                                                <div className="flex">
                                                    <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-blue-700 font-medium text-sm">¿Cómo funciona?</p>
                                                        <ul className="text-blue-600 text-sm mt-2 space-y-1">
                                                            <li>1. Hacemos clic en "Solicitar cambio de contraseña"</li>
                                                            <li>2. Se genera un código de seguridad único</li>
                                                            <li>3. Te redirigimos a una página segura</li>
                                                            <li>4. Ingresas tu nueva contraseña</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Información de Seguridad */}
                                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Seguridad</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Estado de verificación</p>
                                                <p className="text-xs text-gray-500">Tu cuenta está verificada</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                user.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.is_verified ? 'Verificada' : 'No verificada'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Estado de la cuenta</p>
                                                <p className="text-xs text-gray-500">Tu cuenta está activa</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.is_active ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Cuenta creada</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Consejos de Seguridad */}
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                    <div className="flex">
                                        <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-blue-700 font-medium">Consejos de Seguridad</p>
                                            <div className="text-blue-600 text-sm mt-2 space-y-1">
                                                <p>• Cambia tu contraseña regularmente</p>
                                                <p>• No compartas tus credenciales con nadie</p>
                                                <p>• Usa una contraseña única para esta plataforma</p>
                                                <p>• Cierra sesión en dispositivos compartidos</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Estilos para animaciones */}
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}