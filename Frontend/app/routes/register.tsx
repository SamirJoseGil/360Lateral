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

        if (!refresh || !access || !user) {
            console.error("Missing required data:", { refresh: !!refresh, access: !!access, user: !!user });
            return json({
                success: false,
                errors: { general: "Datos incompletos en la respuesta" },
                values: { email, username, first_name, last_name, phone, company, role }
            }, { status: 500 });
        }

        console.log(`Registration complete for: ${user.email} (role: ${user.role})`);

        // ✅ CORRECCIÓN: Usar commitAuthCookies en lugar de sesión de Remix
        const headers = await commitAuthCookies({
            access,
            refresh
        });

        // Determinar ruta de redirección
        const finalRedirectTo = getDashboardRoute(user.role);

        console.log(`Redirecting to: ${finalRedirectTo}`);
        console.log("=== REGISTER ACTION END (SUCCESS) ===");

        // Retornar con las cookies correctas
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

    const [passwordsMatch, setPasswordsMatch] = useState(true);

    useEffect(() => {
        if (formData.password && formData.passwordConfirm) {
            setPasswordsMatch(formData.password === formData.passwordConfirm);
        }
    }, [formData.password, formData.passwordConfirm]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getError = (field: string) => actionData?.errors?.[field];

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
                    {/* Error general */}
                    {actionData?.errors?.general && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Error en el registro</h3>
                                    <p className="text-sm text-red-700 mt-1">{actionData.errors.general}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Form method="post" className="space-y-6">
                        {/* Información Personal */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b">
                                Información Personal
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    id="first_name"
                                    name="first_name"
                                    label="Nombre"
                                    value={formData.first_name}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    error={getError('first_name')}
                                    required
                                    placeholder="Tu nombre"
                                />

                                <FormInput
                                    id="last_name"
                                    name="last_name"
                                    label="Apellido"
                                    value={formData.last_name}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    error={getError('last_name')}
                                    required
                                    placeholder="Tu apellido"
                                />
                            </div>

                            <FormInput
                                id="email"
                                name="email"
                                label="Correo electrónico"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                error={getError('email')}
                                required
                                placeholder="tu@email.com"
                                autoComplete="email"
                                icon={emailIcon}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    id="phone"
                                    name="phone"
                                    label="Teléfono"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    error={getError('phone')}
                                    required
                                    placeholder="+57 300 123 4567"
                                />

                                <FormInput
                                    id="company"
                                    name="company"
                                    label="Empresa"
                                    value={formData.company}
                                    onChange={(e) => handleInputChange('company', e.target.value)}
                                    placeholder="Nombre de tu empresa (opcional)"
                                />
                            </div>
                        </div>

                        {/* Tipo de Cuenta */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b">
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
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b">
                                Seguridad de la Cuenta
                            </h3>

                            <FormInput
                                id="username"
                                name="username"
                                label="Nombre de usuario"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                error={getError('username')}
                                placeholder="usuario123 (opcional)"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    label="Contraseña"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    error={getError('password')}
                                    required
                                    placeholder="Min. 8 caracteres"
                                    showStrength
                                />

                                <PasswordInput
                                    id="passwordConfirm"
                                    name="passwordConfirm"
                                    label="Confirmar contraseña"
                                    value={formData.passwordConfirm}
                                    onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                                    error={!passwordsMatch && formData.passwordConfirm ? "Las contraseñas no coinciden" : getError('passwordConfirm')}
                                    required
                                    placeholder="Repite tu contraseña"
                                />
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

                        {/* Botón Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !passwordsMatch || !formData.password || formData.password.length < 8}
                            className="w-full bg-lateral-600 text-white px-8 py-4 rounded-lg hover:bg-lateral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lateral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center font-semibold text-lg"
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
        </div>
    );
}