import { Form, useActionData, Link, useNavigation } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useState, useEffect } from "react";
import { getUser, commitAuthCookies } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

// Componentes reutilizables
import FormInput from "~/components/FormInput";
import PasswordInput from "~/components/PasswordInput";
import RoleSelector from "~/components/RoleSelector";

// Función helper para obtener la ruta del dashboard según el rol
function getDashboardRoute(role: string): string {
    switch (role) {
        case "admin":
            return "/admin";
        case "owner":
            return "/owner";
        case "developer":
            return "/developer";
        default:
            return "/";
    }
}

// Loader para redirigir si ya está autenticado
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);

    // Si el usuario ya está autenticado, redirigir según su rol
    if (user) {
        const dashboardRoute = getDashboardRoute(user.role);
        return redirect(dashboardRoute);
    }

    return json({});
}

// Acción de registro CORREGIDA para usar sesión del servidor
export async function action({ request }: ActionFunctionArgs) {
    console.log("=== REGISTER ACTION START ===");
    const formData = await request.formData();

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const username = (formData.get("username") as string)?.trim() || "";
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;
    const first_name = (formData.get("first_name") as string)?.trim();
    const last_name = (formData.get("last_name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const company = (formData.get("company") as string)?.trim() || "";
    const role = (formData.get("role") as string)?.trim();

    console.log(`Registration attempt for: ${email}`);

    // Validaciones del lado del cliente
    const errors: Record<string, string> = {};

    if (!email) {
        errors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "El formato del email es inválido";
    }

    if (!first_name) errors.first_name = "El nombre es obligatorio";
    if (!last_name) errors.last_name = "El apellido es obligatorio";
    if (!password) errors.password = "La contraseña es obligatoria";
    if (!role) errors.role = "El rol es obligatorio";
    if (!phone) {
        errors.phone = "El teléfono es obligatorio";
    } else if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(phone)) {
        errors.phone = "El formato del teléfono es inválido";
    }

    if (password !== passwordConfirm) {
        errors.passwordConfirm = "Las contraseñas no coinciden";
    }

    if (password && password.length < 8) {
        errors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    if (Object.keys(errors).length > 0) {
        console.log("Validation errors:", errors);
        return json({
            success: false,
            errors,
            values: { email, username, first_name, last_name, phone, company, role }
        }, { status: 400 });
    }

    try {
        const registerPayload = {
            email,
            password,
            password_confirm: passwordConfirm,
            first_name,
            last_name,
            phone,
            role,
            ...(username && { username }),
            ...(company && { company })
        };

        console.log("Sending registration to:", `${API_URL}/api/auth/register/`);

        const registerResponse = await fetch(`${API_URL}/api/auth/register/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(registerPayload),
        });

        console.log(`API response status: ${registerResponse.status}`);

        const responseText = await registerResponse.text();
        console.log("API raw response:", responseText);

        let registerData;
        try {
            registerData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return json({
                success: false,
                errors: { general: "Error en la respuesta del servidor" },
                values: { email, username, first_name, last_name, phone, company, role }
            }, { status: 500 });
        }

        if (!registerResponse.ok) {
            console.error("Registration failed:", registerData);

            const backendErrors: Record<string, string> = {};

            // Procesar errores del backend
            if (registerData.errors) {
                Object.keys(registerData.errors).forEach(field => {
                    const fieldError = registerData.errors[field];
                    backendErrors[field] = Array.isArray(fieldError)
                        ? fieldError[0]
                        : fieldError;
                });
            }

            if (registerData.message && !backendErrors.general) {
                backendErrors.general = registerData.message;
            }

            if (Object.keys(backendErrors).length === 0) {
                backendErrors.general = "Error en el registro. Por favor, verifica los datos.";
            }

            return json({
                success: false,
                errors: backendErrors,
                values: { email, username, first_name, last_name, phone, company, role }
            }, { status: registerResponse.status });
        }

        // Registro exitoso
        console.log("Registration successful");

        if (!registerData.success || !registerData.data) {
            console.error("Invalid response structure:", registerData);
            return json({
                success: false,
                errors: { general: "Respuesta inválida del servidor" },
                values: { email, username, first_name, last_name, phone, company, role }
            }, { status: 500 });
        }

        const { refresh, access, user } = registerData.data;

        console.log(`Registration complete for: ${user.email} (role: ${user.role})`);

        // ✅ En registro, siempre recordar por 7 días
        const headers = await commitAuthCookies(
            { access, refresh },
            true // ✅ Siempre recordar en registro
        );

        const finalRedirectTo = getDashboardRoute(user.role);

        console.log(`Redirecting to: ${finalRedirectTo}`);
        console.log("=== REGISTER ACTION END (SUCCESS) ===");

        return redirect(finalRedirectTo, { headers });

    } catch (error) {
        console.error("Registration error:", error);
        console.log("=== REGISTER ACTION END (ERROR) ===");

        let errorMessage = "Error de conexión al servidor";

        if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMessage = "No se pudo conectar al servidor. Verifica tu conexión.";
        }

        return json({
            success: false,
            errors: { general: errorMessage },
            values: { email, username, first_name, last_name, phone, company, role }
        }, { status: 500 });
    }
}

type RegisterActionData = {
    success?: boolean;
    errors?: Record<string, string>;
    values?: Record<string, string>;
};

export default function Register() {
    const actionData = useActionData<RegisterActionData>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [formData, setFormData] = useState({
        first_name: actionData?.values?.first_name || "",
        last_name: actionData?.values?.last_name || "",
        email: actionData?.values?.email || "",
        username: actionData?.values?.username || "",
        phone: actionData?.values?.phone || "",
        company: actionData?.values?.company || "",
        role: actionData?.values?.role || "owner",
        password: "",
        passwordConfirm: ""
    });

    // ✅ NUEVO: Estado para validaciones en tiempo real
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    // ✅ NUEVO: Validar campo individual
    const validateField = (field: string, value: string): string => {
        switch (field) {
            case 'first_name':
                if (!value.trim()) return 'El nombre es obligatorio';
                if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
                return '';

            case 'last_name':
                if (!value.trim()) return 'El apellido es obligatorio';
                if (value.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres';
                return '';

            case 'email':
                if (!value.trim()) return 'El email es obligatorio';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'El formato del email es inválido';
                return '';

            case 'phone':
                if (!value.trim()) return 'El teléfono es obligatorio';
                if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(value)) return 'Ingresa un teléfono válido (mín. 10 dígitos)';
                return '';

            case 'password':
                if (!value) return 'La contraseña es obligatoria';
                if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
                if (!/[A-Z]/.test(value)) return 'Debe incluir al menos una mayúscula';
                if (!/[a-z]/.test(value)) return 'Debe incluir al menos una minúscula';
                if (!/[0-9]/.test(value)) return 'Debe incluir al menos un número';
                return '';

            case 'passwordConfirm':
                if (!value) return 'Confirma tu contraseña';
                if (value !== formData.password) return 'Las contraseñas no coinciden';
                return '';

            default:
                return '';
        }
    };

    // ✅ NUEVO: Manejar cambio con validación
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Validar si el campo ya fue tocado
        if (touched[field]) {
            const error = validateField(field, value);
            setClientErrors(prev => ({
                ...prev,
                [field]: error
            }));
        }
    };

    // ✅ NUEVO: Manejar blur (cuando el usuario sale del campo)
    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field as keyof typeof formData]);
        setClientErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    // ✅ NUEVO: Obtener error (priorizar errores del servidor)
    const getError = (field: string): string | undefined => {
        return actionData?.errors?.[field] || clientErrors[field];
    };

    // ✅ NUEVO: Verificar si el formulario es válido
    const isFormValid = (): boolean => {
        const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'password', 'passwordConfirm'];

        for (const field of requiredFields) {
            const value = formData[field as keyof typeof formData];
            const error = validateField(field, value);
            if (error) return false;
        }

        return true;
    };

    // ✅ NUEVO: Calcular fortaleza de contraseña
    const getPasswordStrength = (password: string): { level: number; text: string; color: string } => {
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

    const emailIcon = (
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-lateral-600 via-lateral-500 to-naranja-500 flex items-center justify-center p-4">
            {/* Botón de regresar */}
            <Link
                to="/"
                className="absolute top-8 left-8 text-white hover:text-naranja-300 transition-colors duration-200 flex items-center gap-2 group"
            >
                <svg
                    className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Volver al inicio</span>
            </Link>

            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-4">
                        <span className="text-4xl font-display font-bold text-white">
                            360<span className="text-naranja-300">Lateral</span>
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Crear cuenta nueva</h1>
                    <p className="text-lateral-100">Únete a la plataforma de gestión urbanística</p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* ✅ MEJORADO: Error general más atractivo */}
                    {actionData?.errors?.general && (
                        <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm animate-shake">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="text-sm font-semibold text-red-800">Error en el registro</h3>
                                    <p className="text-sm text-red-700 mt-1">{actionData.errors.general}</p>
                                </div>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-shrink-0 ml-4 text-red-500 hover:text-red-700"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <Form method="post" className="space-y-6" noValidate>
                        {/* Información Personal */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                                <svg className="w-5 h-5 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Información Personal
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ✅ MEJORADO: Input con validación visual */}
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="first_name"
                                            name="first_name"
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                                            onBlur={() => handleBlur('first_name')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('first_name')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.first_name && formData.first_name
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="Tu nombre"
                                            required
                                        />
                                        {/* ✅ NUEVO: Icono de validación */}
                                        {touched.first_name && formData.first_name && !getError('first_name') && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {/* ✅ MEJORADO: Mensaje de error más atractivo */}
                                    {getError('first_name') && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('first_name')}
                                        </p>
                                    )}
                                </div>

                                {/* Apellido con validación */}
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Apellido <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="last_name"
                                            name="last_name"
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                                            onBlur={() => handleBlur('last_name')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('last_name')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.last_name && formData.last_name
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="Tu apellido"
                                            required
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
                            </div>

                            {/* Email con validación */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo electrónico <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {emailIcon}
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                        className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200 ${getError('email')
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                : touched.email && formData.email && !getError('email')
                                                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                    : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                            } focus:ring-4 focus:outline-none`}
                                        placeholder="tu@email.com"
                                        required
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

                            {/* Teléfono y Empresa */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Teléfono */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            onBlur={() => handleBlur('phone')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('phone')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.phone && formData.phone && !getError('phone')
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="+57 300 123 4567"
                                            required
                                        />
                                        {touched.phone && formData.phone && !getError('phone') && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {getError('phone') && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('phone')}
                                        </p>
                                    )}
                                </div>

                                {/* Empresa */}
                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                                        Empresa <span className="text-gray-400 text-xs">(opcional)</span>
                                    </label>
                                    <input
                                        id="company"
                                        name="company"
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => handleInputChange('company', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-lateral-500 focus:ring-4 focus:ring-lateral-200 focus:outline-none transition-all duration-200"
                                        placeholder="Nombre de tu empresa"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tipo de Cuenta */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                                <svg className="w-5 h-5 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Tipo de Cuenta
                            </h3>
                            <RoleSelector
                                selectedRole={formData.role}
                                onChange={(role) => handleInputChange('role', role)}
                            />
                            <input type="hidden" name="role" value={formData.role} />
                        </div>

                        {/* Seguridad */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b flex items-center gap-2">
                                <svg className="w-5 h-5 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Seguridad de la Cuenta
                            </h3>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de usuario <span className="text-gray-400 text-xs">(opcional)</span>
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-lateral-500 focus:ring-4 focus:ring-lateral-200 focus:outline-none transition-all duration-200"
                                    placeholder="usuario123"
                                />
                            </div>

                            {/* Contraseñas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Password con indicador de fortaleza */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            onBlur={() => handleBlur('password')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('password')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="Min. 8 caracteres"
                                            required
                                        />
                                    </div>

                                    {/* ✅ NUEVO: Indicador de fortaleza */}
                                    {formData.password && (
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2 mb-1">
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

                                {/* Confirmar Password */}
                                <div>
                                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmar contraseña <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="passwordConfirm"
                                            name="passwordConfirm"
                                            type="password"
                                            value={formData.passwordConfirm}
                                            onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                                            onBlur={() => handleBlur('passwordConfirm')}
                                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${getError('passwordConfirm')
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                    : touched.passwordConfirm && formData.passwordConfirm && !getError('passwordConfirm')
                                                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                        : 'border-gray-300 focus:border-lateral-500 focus:ring-lateral-200'
                                                } focus:ring-4 focus:outline-none`}
                                            placeholder="Repite tu contraseña"
                                            required
                                        />
                                        {touched.passwordConfirm && formData.passwordConfirm && !getError('passwordConfirm') && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {getError('passwordConfirm') && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {getError('passwordConfirm')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Términos */}
                        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="mt-1 h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300 rounded"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-700">
                                Acepto los{" "}
                                <a href="https://360lateral.com/wp-content/uploads/2024/12/Politica-de-tratamiento-de-datos-I-V3-2024-I-360Lateral.pdf" className="text-lateral-600 hover:text-lateral-500 font-medium" target="_blank" rel="noopener noreferrer">
                                    términos y condiciones
                                </a>{" "}y la{" "}
                                <a href="https://360lateral.com/wp-content/uploads/2024/12/Politica-de-tratamiento-de-datos-I-V3-2024-I-360Lateral.pdf" className="text-lateral-600 hover:text-lateral-500 font-medium" target="_blank" rel="noopener noreferrer">
                                    política de privacidad
                                </a>
                            </label>
                        </div>

                        {/* Botón Submit con validación visual */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid()}
                            className={`w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg flex items-center justify-center ${isFormValid() && !isSubmitting
                                    ? 'bg-gradient-to-r from-lateral-600 to-lateral-700 hover:from-lateral-700 hover:to-lateral-800 text-white hover:shadow-xl transform hover:scale-[1.02]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creando cuenta...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Crear cuenta
                                </>
                            )}
                        </button>

                        {/* ✅ NUEVO: Indicador de progreso del formulario */}
                        {!isFormValid() && (
                            <div className="text-center">
                                <p className="text-sm text-gray-500">
                                    Completa todos los campos obligatorios para continuar
                                </p>
                            </div>
                        )}
                    </Form>

                    {/* Link de login */}
                    <div className="text-center mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes una cuenta?{" "}
                            <Link to="/login" className="font-medium text-lateral-600 hover:text-lateral-500 transition-colors duration-200">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* ✅ NUEVO: Estilos para animaciones */}
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