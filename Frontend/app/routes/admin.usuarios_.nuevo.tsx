import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { createUser } from "~/services/users.server";

type ActionData = {
    success: boolean;
    errors?: Record<string, string>;
    values?: any;
    message?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    if (!user) return redirect("/login");
    if (user.role !== "admin") return redirect(`/${user.role}`);
    return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/login");
    }

    const formData = await request.formData();

    const userData = {
        email: formData.get("email")?.toString().trim().toLowerCase() || "",
        username: formData.get("username")?.toString().trim() || "",
        first_name: formData.get("first_name")?.toString().trim() || "",
        last_name: formData.get("last_name")?.toString().trim() || "",
        phone: formData.get("phone")?.toString().trim() || "",
        company: formData.get("company")?.toString().trim() || "",
        role: formData.get("role")?.toString() as "admin" | "owner" | "developer",
        password: formData.get("password")?.toString() || "",
        // ✅ ELIMINADO: Campos específicos por rol (se manejarán después en el perfil)
    };

    // ✅ VALIDACIONES SIMPLIFICADAS
    const errors: Record<string, string> = {};

    if (!userData.email) {
        errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        errors.email = "El formato del email es inválido";
    }

    if (!userData.first_name) errors.first_name = "El nombre es obligatorio";
    if (!userData.last_name) errors.last_name = "El apellido es obligatorio";
    if (!userData.password) {
        errors.password = "La contraseña es obligatoria";
    } else if (userData.password.length < 8) {
        errors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    if (!userData.role) errors.role = "El rol es obligatorio";

    if (Object.keys(errors).length > 0) {
        return json<ActionData>({
            success: false,
            errors,
            values: userData
        }, { status: 400 });
    }

    try {
        const { user: newUser, headers } = await createUser(request, userData);

        return redirect("/admin/usuarios?success=created", { headers });
    } catch (error) {
        console.error("Error creating user:", error);

        const errorMessage = error instanceof Error ? error.message : "Error al crear usuario";

        return json<ActionData>({
            success: false,
            errors: { general: errorMessage },
            values: userData
        }, { status: 500 });
    }
}

export default function NuevoUsuario() {
    const actionData = useActionData<ActionData>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    // ✅ Estado del formulario SIMPLIFICADO
    const [formData, setFormData] = useState({
        email: actionData?.values?.email || "",
        username: actionData?.values?.username || "",
        first_name: actionData?.values?.first_name || "",
        last_name: actionData?.values?.last_name || "",
        phone: actionData?.values?.phone || "",
        company: actionData?.values?.company || "",
        role: actionData?.values?.role || "owner",
        password: "",
    });

    // ✅ NUEVO: Estado para validaciones
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    // ✅ NUEVO: Validar campo individual
    const validateField = (field: string, value: string): string => {
        switch (field) {
            case 'email':
                if (!value.trim()) return 'El email es obligatorio';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Formato de email inválido';
                return '';

            case 'first_name':
                if (!value.trim()) return 'El nombre es obligatorio';
                if (value.trim().length < 2) return 'Mínimo 2 caracteres';
                return '';

            case 'last_name':
                if (!value.trim()) return 'El apellido es obligatorio';
                if (value.trim().length < 2) return 'Mínimo 2 caracteres';
                return '';

            case 'password':
                if (!value) return 'La contraseña es obligatoria';
                if (value.length < 8) return 'Mínimo 8 caracteres';
                if (!/[A-Z]/.test(value)) return 'Incluye una mayúscula';
                if (!/[a-z]/.test(value)) return 'Incluye una minúscula';
                if (!/[0-9]/.test(value)) return 'Incluye un número';
                return '';

            default:
                return '';
        }
    };

    // ✅ NUEVO: Manejar cambios con validación
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (touched[field]) {
            const error = validateField(field, value);
            setClientErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    // ✅ NUEVO: Manejar blur
    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field as keyof typeof formData]);
        setClientErrors(prev => ({ ...prev, [field]: error }));
    };

    // ✅ NUEVO: Obtener error (priorizar servidor)
    const getError = (field: string): string | undefined => {
        return actionData?.errors?.[field] || clientErrors[field];
    };

    // ✅ NUEVO: Verificar si el formulario es válido
    const isFormValid = (): boolean => {
        const requiredFields = ['email', 'first_name', 'last_name', 'password'];

        for (const field of requiredFields) {
            const value = formData[field as keyof typeof formData]?.toString() || "";
            const error = validateField(field, value);
            if (error) return false;
        }

        return true;
    };

    // ✅ NUEVO: Indicador de fortaleza de contraseña
    const getPasswordStrength = (password: string) => {
        if (!password) return { level: 0, text: '', color: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) return { level: 1, text: 'Débil', color: 'bg-red-500' };
        if (strength <= 4) return { level: 2, text: 'Media', color: 'bg-yellow-500' };
        return { level: 3, text: 'Fuerte', color: 'bg-green-500' };
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to="/admin/usuarios"
                    className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a usuarios
                </Link>
                <h1 className="text-4xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
                <p className="text-gray-600 mt-2">Completa el formulario para agregar un usuario al sistema</p>
            </div>

            {/* Error general */}
            {actionData?.errors?.general && (
                <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm animate-shake">
                    <div className="flex items-start">
                        <svg className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-red-800">Error al crear usuario</h3>
                            <p className="text-sm text-red-700 mt-1">{actionData.errors.general}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulario */}
            <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                <Form method="post" className="space-y-8" noValidate>
                    <input type="hidden" name="intent" value="create" />

                    {/* Información Básica */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Tipo de Solicitud *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${getError('email')
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : touched.email && formData.email && !getError('email')
                                                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                            } focus:ring-4 focus:outline-none`}
                                        placeholder="usuario@ejemplo.com"
                                    />
                                    {touched.email && formData.email && !getError('email') && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {getError('email') && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {getError('email')}
                                    </p>
                                )}
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Nombre de usuario <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                    placeholder="Usuario123"
                                />
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Nombre <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                                        onBlur={() => handleBlur('first_name')}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${getError('first_name')
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : touched.first_name && formData.first_name && !getError('first_name')
                                                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                            } focus:ring-4 focus:outline-none`}
                                        placeholder="Juan"
                                    />
                                    {touched.first_name && formData.first_name && !getError('first_name') && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {getError('first_name') && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {getError('first_name')}
                                    </p>
                                )}
                            </div>

                            {/* Apellido */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Apellido <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                                        onBlur={() => handleBlur('last_name')}
                                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${getError('last_name')
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : touched.last_name && formData.last_name && !getError('last_name')
                                                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                            } focus:ring-4 focus:outline-none`}
                                        placeholder="Pérez"
                                    />
                                    {touched.last_name && formData.last_name && !getError('last_name') && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {getError('last_name') && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {getError('last_name')}
                                    </p>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Teléfono <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                    placeholder="+57 300 123 4567"
                                />
                            </div>

                            {/* Empresa */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Empresa <span className="text-gray-400 text-xs">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={(e) => handleInputChange('company', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                    placeholder="Nombre de la empresa"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rol y Contraseña */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Rol y Seguridad
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Rol con SVG en lugar de emoji */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Rol <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all"
                                >
                                    <option value="owner">
                                        👤 Propietario
                                    </option>
                                    <option value="developer">
                                        🏗️ Desarrollador
                                    </option>
                                    <option value="admin">
                                        👑 Administrador
                                    </option>
                                </select>
                                <p className="mt-2 text-xs text-gray-500">
                                    Los campos específicos del rol se pueden completar después en el perfil
                                </p>
                            </div>

                            {/* Contraseña */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Contraseña <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    onBlur={() => handleBlur('password')}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${getError('password')
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        } focus:ring-4 focus:outline-none`}
                                    placeholder="Mínimo 8 caracteres"
                                />

                                {/* Indicador de fortaleza */}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`}
                                                    style={{ width: `${(getPasswordStrength(formData.password).level / 3) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600">
                                                {getPasswordStrength(formData.password).text}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {getError('password') && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {getError('password')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ✅ ELIMINADO: Campos específicos por rol */}

                    {/* Botones */}
                    <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-100">
                        <Link
                            to="/admin/usuarios"
                            className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid()}
                            className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${isFormValid() && !isSubmitting
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:scale-105'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creando...
                                </>
                            ) : (
                                'Crear Usuario'
                            )}
                        </button>
                    </div>

                    {/* Indicador de validez */}
                    {!isFormValid() && !isSubmitting && (
                        <div className="text-center text-sm text-gray-500">
                            ⚠️ Completa todos los campos obligatorios
                        </div>
                    )}
                </Form>
            </div>

            {/* Estilos para animaciones */}
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}