import { Form, useActionData, useLoaderData, Link } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useState, useEffect } from "react";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";
import React from "react";

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

    // Registrar vista de página de registro para estadísticas (sin fallar si hay error)
    try {
        await recordEvent(request, {
            type: "view",
            name: "register_page",
            value: {
                timestamp: new Date().toISOString(),
                user_agent: request.headers.get('user-agent') || 'unknown'
            }
        });
    } catch (error) {
        // No fallar el loader por errores de estadísticas
        console.warn("Error registrando vista de registro:", error);
    }

    return json({});
}

// Acción de registro CORREGIDA
export async function action({ request }: ActionFunctionArgs) {
    console.log("=== REGISTER ACTION START ===");
    const formData = await request.formData();

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const username = (formData.get("username") as string)?.trim() || "";
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;
    const first_name = (formData.get("first_name") as string)?.trim();
    const last_name = (formData.get("last_name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || "";
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
            role,
            ...(username && { username }),
            ...(phone && { phone }),
            ...(company && { company })
        };

        console.log("Sending registration payload (password hidden)");

        const registerResponse = await fetch("http://localhost:8000/api/auth/register/", {
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

        if (!refresh || !access || !user) {
            console.error("Missing required data:", { refresh: !!refresh, access: !!access, user: !!user });
            return json({
                success: false,
                errors: { general: "Datos incompletos en la respuesta" },
                values: { email, username, first_name, last_name, phone, company, role }
            }, { status: 500 });
        }

        console.log(`Registration complete for: ${user.email} (role: ${user.role})`);

        // Determinar ruta de redirección
        const finalRedirectTo = getDashboardRoute(user.role);

        // Crear cookies
        const headers = new Headers();
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = `Path=/; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}; Max-Age=604800`;

        headers.append("Set-Cookie", `l360_access=${encodeURIComponent(access)}; ${cookieOptions}`);
        headers.append("Set-Cookie", `l360_refresh=${encodeURIComponent(refresh)}; ${cookieOptions}`);
        headers.append("Set-Cookie", `l360_user=${encodeURIComponent(JSON.stringify(user))}; ${cookieOptions}`);

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

type RegisterActionErrors = {
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
    password?: string;
    passwordConfirm?: string;
    role?: string;
    general?: string;
    [key: string]: string | undefined;
};

type RegisterActionData = {
    success?: boolean;
    errors?: RegisterActionErrors;
    values?: {
        email?: string;
        username?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        company?: string;
        role?: string;
    };
};

export default function Register() {
    const actionData = useActionData<RegisterActionData>();
    const [selectedRole, setSelectedRole] = useState("owner");
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // Estado para almacenar todos los datos del formulario
    const [formData, setFormData] = useState({
        first_name: actionData?.values?.first_name || "",
        last_name: actionData?.values?.last_name || "",
        email: actionData?.values?.email || "",
        username: actionData?.values?.username || "",
        phone: actionData?.values?.phone || "",
        company: actionData?.values?.company || "",
        role: actionData?.values?.role || selectedRole
    });

    // Verificar si las contraseñas coinciden
    const handlePasswordChange = (value: string, isConfirm: boolean = false) => {
        if (isConfirm) {
            setPasswordConfirm(value);
            setPasswordsMatch(password === value);
        } else {
            setPassword(value);
            setPasswordsMatch(value === passwordConfirm);
        }
    };

    // Actualizar datos del formulario
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Actualizar role cuando cambie selectedRole
    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            role: selectedRole
        }));
    }, [selectedRole]);

    // Resetear isLoading cuando hay respuesta de la acción
    React.useEffect(() => {
        if (actionData) {
            setIsLoading(false);
        }
    }, [actionData]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        console.log("Form submit started");
        console.log("Current form data:", formData);
        console.log("Passwords:", { password: password.substring(0, 3) + "...", passwordConfirm: passwordConfirm.substring(0, 3) + "..." });

        // Validación adicional del lado del cliente antes del envío
        if (!passwordsMatch) {
            event.preventDefault();
            return;
        }

        if (password.length < 8) {
            event.preventDefault();
            return;
        }

        setIsLoading(true);
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // Función para mostrar errores de manera más clara
    const getErrorMessage = (field: string) => {
        if (actionData?.errors?.[field]) {
            return actionData.errors[field];
        }
        return null;
    };

    return (
        <div className="min-h-screen flex">
            {/* Panel izquierdo - Información */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-lateral relative overflow-hidden">
                {/* Elementos decorativos animados */}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-20 left-20 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-24 h-24 bg-naranja-500 bg-opacity-20 rounded-full animate-bounce"></div>
                    <div className="absolute top-1/3 right-10 w-16 h-16 bg-white bg-opacity-5 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-1/3 left-10 w-20 h-20 bg-naranja-500 bg-opacity-10 rounded-full animate-pulse"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
                    <div className="max-w-md">
                        <h1 className="text-4xl font-display font-bold mb-6">
                            Únete a 360<span className="text-naranja-500">Lateral</span>
                        </h1>
                        <p className="text-xl text-lateral-100 mb-8">
                            Únete a miles de profesionales que confían en nuestra plataforma para sus proyectos urbanísticos
                        </p>

                        {/* Progreso visual */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-4">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${step <= currentStep
                                            ? 'bg-naranja-500 text-white'
                                            : 'bg-white bg-opacity-20 text-lateral-100'
                                            }`}>
                                            {step}
                                        </div>
                                        {step < 3 && (
                                            <div className={`w-8 h-1 mx-2 transition-all duration-300 ${step < currentStep ? 'bg-naranja-500' : 'bg-white bg-opacity-20'
                                                }`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className={`text-sm transition-all duration-300 ${currentStep === 1 ? 'text-white font-medium' : 'text-lateral-200'}`}>
                                    1. Información personal
                                </div>
                                <div className={`text-sm transition-all duration-300 ${currentStep === 2 ? 'text-white font-medium' : 'text-lateral-200'}`}>
                                    2. Tipo de cuenta
                                </div>
                                <div className={`text-sm transition-all duration-300 ${currentStep === 3 ? 'text-white font-medium' : 'text-lateral-200'}`}>
                                    3. Finalizar registro
                                </div>
                            </div>
                        </div>

                        {/* Beneficios */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-naranja-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-lateral-100">Acceso completo sin restricciones</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-naranja-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-lateral-100">Herramientas avanzadas de análisis</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-naranja-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <span className="text-lateral-100">Soporte técnico especializado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel derecho - Formulario */}
            <div className="w-full lg:w-3/5 flex items-center justify-center p-8 bg-gray-50">
                <div className="max-w-lg w-full">
                    {/* Logo y encabezado */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block">
                            <span className="text-3xl font-display font-bold text-lateral-600">
                                360<span className="text-naranja-500">Lateral</span>
                            </span>
                        </Link>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            Crear cuenta nueva
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Únete a la plataforma de gestión urbanística más completa
                        </p>
                    </div>

                    {/* Formulario */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {/* Error general mejorado */}
                        {actionData?.errors?.general && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Error en el registro</h3>
                                        <p className="text-sm text-red-700 mt-1">{actionData.errors.general}</p>
                                        {actionData.success === false && (
                                            <p className="text-xs text-red-600 mt-2">
                                                Si el problema persiste, por favor contacta al soporte técnico.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Form method="post" className="space-y-6" onSubmit={handleSubmit}>
                            {/* Hidden inputs para mantener todos los datos del formulario */}
                            <input type="hidden" name="first_name" value={formData.first_name} />
                            <input type="hidden" name="last_name" value={formData.last_name} />
                            <input type="hidden" name="email" value={formData.email} />
                            <input type="hidden" name="username" value={formData.username} />
                            <input type="hidden" name="phone" value={formData.phone} />
                            <input type="hidden" name="company" value={formData.company} />
                            <input type="hidden" name="role" value={formData.role} />
                            <input type="hidden" name="password" value={password} />
                            <input type="hidden" name="passwordConfirm" value={passwordConfirm} />

                            {/* Paso 1: Información Personal */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                                        <p className="text-sm text-gray-600 mb-6">Cuéntanos un poco sobre ti para personalizar tu experiencia</p>
                                    </div>

                                    {/* Nombres */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="display_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="display_first_name"
                                                type="text"
                                                required
                                                value={formData.first_name}
                                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200 ${getErrorMessage('first_name') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                placeholder="Tu nombre"
                                            />
                                            {getErrorMessage('first_name') && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {getErrorMessage('first_name')}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="display_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                                Apellido <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="display_last_name"
                                                type="text"
                                                required
                                                value={formData.last_name}
                                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200 ${getErrorMessage('last_name') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                placeholder="Tu apellido"
                                            />
                                            {getErrorMessage('last_name') && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {getErrorMessage('last_name')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="display_email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Correo electrónico <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                            </div>
                                            <input
                                                id="display_email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200 ${getErrorMessage('email') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                placeholder="tu@email.com"
                                            />
                                        </div>
                                        {getErrorMessage('email') && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {getErrorMessage('email')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Información adicional */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="display_phone" className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                id="display_phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200"
                                                placeholder="+57 123 456 7890"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="display_company" className="block text-sm font-medium text-gray-700 mb-2">
                                                Empresa
                                            </label>
                                            <input
                                                id="display_company"
                                                type="text"
                                                value={formData.company}
                                                onChange={(e) => handleInputChange('company', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200"
                                                placeholder="Nombre de tu empresa"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="bg-lateral-600 text-white px-6 py-3 rounded-lg hover:bg-lateral-700 focus:outline-none focus:ring-2 focus:ring-lateral-500 transition-all duration-200 flex items-center"
                                        >
                                            Continuar
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Paso 2: Tipo de Cuenta */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Cuenta</h3>
                                        <p className="text-sm text-gray-600 mb-6">Selecciona el tipo de cuenta que mejor se adapte a tus necesidades</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div
                                            className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${selectedRole === "owner"
                                                ? 'border-lateral-500 bg-lateral-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            onClick={() => setSelectedRole("owner")}
                                        >
                                            <div className="flex items-start">
                                                <input
                                                    id="role-owner"
                                                    type="radio"
                                                    value="owner"
                                                    checked={selectedRole === "owner"}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="mt-1 h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <label htmlFor="role-owner" className="block text-sm font-medium text-gray-900 cursor-pointer">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                </svg>
                                                            </div>
                                                            Propietario / Comisionista
                                                        </div>
                                                    </label>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Registro y gestión de lotes, solicitudes de análisis urbanístico
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${selectedRole === "developer"
                                                ? 'border-lateral-500 bg-lateral-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            onClick={() => setSelectedRole("developer")}
                                        >
                                            <div className="flex items-start">
                                                <input
                                                    id="role-developer"
                                                    type="radio"
                                                    value="developer"
                                                    checked={selectedRole === "developer"}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="mt-1 h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <label htmlFor="role-developer" className="block text-sm font-medium text-gray-900 cursor-pointer">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                </svg>
                                                            </div>
                                                            Desarrollador
                                                        </div>
                                                    </label>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Búsqueda de lotes, análisis de oportunidades de inversión
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 flex items-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Atrás
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="bg-lateral-600 text-white px-6 py-3 rounded-lg hover:bg-lateral-700 focus:outline-none focus:ring-2 focus:ring-lateral-500 transition-all duration-200 flex items-center"
                                        >
                                            Continuar
                                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Paso 3: Contraseñas y Finalizar */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Finalizar Registro</h3>
                                        <p className="text-sm text-gray-600 mb-6">Crea una contraseña segura para proteger tu cuenta</p>
                                    </div>

                                    {/* Username */}
                                    <div>
                                        <label htmlFor="display_username" className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre de usuario
                                        </label>
                                        <input
                                            id="display_username"
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200 ${getErrorMessage('username') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="usuario123"
                                        />
                                        {getErrorMessage('username') && (
                                            <p className="mt-1 text-sm text-red-600">{getErrorMessage('username')}</p>
                                        )}
                                    </div>

                                    {/* Contraseñas con validación mejorada */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="display_password" className="block text-sm font-medium text-gray-700 mb-2">
                                                Contraseña <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="display_password"
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    value={password}
                                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                                    className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200 ${getErrorMessage('password') || (password && password.length < 8) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    placeholder="Min. 8 caracteres"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? (
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            {getErrorMessage('password') && (
                                                <p className="mt-1 text-sm text-red-600">{getErrorMessage('password')}</p>
                                            )}
                                            {password && password.length < 8 && !getErrorMessage('password') && (
                                                <p className="mt-1 text-sm text-yellow-600">La contraseña debe tener al menos 8 caracteres</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="display_passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirmar contraseña <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="display_passwordConfirm"
                                                    type={showPasswordConfirm ? "text" : "password"}
                                                    required
                                                    value={passwordConfirm}
                                                    onChange={(e) => handlePasswordChange(e.target.value, true)}
                                                    className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 transition-colors duration-200 ${!passwordsMatch || getErrorMessage('passwordConfirm') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                    placeholder="Repite tu contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPasswordConfirm ? (
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            {!passwordsMatch && passwordConfirm && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Las contraseñas no coinciden
                                                </p>
                                            )}
                                            {getErrorMessage('passwordConfirm') && (
                                                <p className="mt-1 text-sm text-red-600">{getErrorMessage('passwordConfirm')}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Términos y condiciones */}
                                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                        <input
                                            id="terms"
                                            name="terms"
                                            type="checkbox"
                                            required
                                            className="mt-1 h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300 rounded"
                                        />
                                        <div className="text-sm">
                                            <label htmlFor="terms" className="text-gray-700">
                                                Acepto los{" "}
                                                <Link to="/terminos" className="text-lateral-600 hover:text-lateral-500 font-medium">
                                                    términos y condiciones
                                                </Link>{" "}
                                                y la{" "}
                                                <Link to="/privacidad" className="text-lateral-600 hover:text-lateral-500 font-medium">
                                                    política de privacidad
                                                </Link>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex justify-between">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            disabled={isLoading}
                                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 flex items-center disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Atrás
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={!passwordsMatch || !password || !passwordConfirm || password.length < 8 || isLoading}
                                            className="bg-lateral-600 text-white px-8 py-3 rounded-lg hover:bg-lateral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lateral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Creando cuenta...
                                                </div>
                                            ) : (
                                                <span className="flex items-center">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Crear cuenta
                                                </span>
                                            )}
                                        </button>
                                    </div>
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
            </div >
        </div >
    );
}