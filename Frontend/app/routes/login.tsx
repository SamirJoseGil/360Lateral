import { Form, useActionData, Link, useNavigation, useSearchParams } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useState } from "react";
import { getUser, commitAuthCookies } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

// Importar componentes reutilizables
import FormInput from "~/components/FormInput";
import PasswordInput from "~/components/PasswordInput";

// Loader para redirigir si ya está autenticado
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);

    // Si viene de logout, no verificar usuario
    if (url.searchParams.has('logout')) {
        return json({});
    }

    const user = await getUser(request);

    // Si el usuario ya está autenticado, redirigir según su rol
    if (user) {
        const dashboardRoute = getDashboardRoute(user.role);
        return redirect(dashboardRoute);
    }

    return json({});
}

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

// Acción de login - USAR commitAuthCookies
export async function action({ request }: ActionFunctionArgs) {
    console.log("=== LOGIN ACTION START ===");
    
    const formData = await request.formData();

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on"; // ✅ NUEVO: Leer checkbox

    console.log(`Login attempt for: ${email} (remember: ${remember})`);

    if (!email || !password) {
        return json(
            { errors: { general: "Email y contraseña son requeridos" } },
            { status: 400 }
        );
    }

    try {
        const loginUrl = `${API_URL}/api/auth/login/`;
        console.log(`📡 Fetching: ${loginUrl}`);

        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password }),
        });

        console.log(`✅ API response status: ${response.status}`);

        const responseText = await response.text();
        let data;
        
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return json(
                { errors: { general: "Error en la respuesta del servidor" } },
                { status: 500 }
            );
        }

        if (!response.ok) {
            console.error("Login failed:", data);
            const errorMessage = data.message || data.detail || "Error de autenticación";
            return json(
                { errors: { general: errorMessage } },
                { status: response.status }
            );
        }

        if (!data.success || !data.data) {
            console.error("Invalid response structure:", data);
            return json(
                { errors: { general: "Respuesta inválida del servidor" } },
                { status: 500 }
            );
        }

        const { refresh, access, user } = data.data;

        if (!refresh || !access || !user) {
            console.error("Missing required data");
            return json(
                { errors: { general: "Datos incompletos en la respuesta" } },
                { status: 500 }
            );
        }

        console.log(`✅ Login successful for: ${user.email} (remember: ${remember})`);

        const dashboardRoute = getDashboardRoute(user.role);

        // ✅ CRÍTICO: Pasar remember a commitAuthCookies
        console.log(`🍪 Creating auth cookies (remember: ${remember})...`);
        const headers = await commitAuthCookies(
            { access, refresh },
            remember // ✅ Pasar el valor del checkbox
        );

        console.log(`➡️  Redirecting to: ${dashboardRoute}`);
        console.log("=== LOGIN ACTION END (SUCCESS) ===");

        return redirect(dashboardRoute, { headers });

    } catch (error) {
        console.error("❌ Login error:", error);
        console.log("=== LOGIN ACTION END (ERROR) ===");

        let errorMessage = "Error de conexión al servidor";

        if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMessage = `No se pudo conectar al servidor (${API_URL}). Verifica tu conexión.`;
        }

        return json(
            { errors: { general: errorMessage } },
            { status: 500 }
        );
    }
}

export default function Login() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const [searchParams] = useSearchParams();
    
    // ✅ NUEVO: Detectar si viene de reset exitoso
    const resetSuccess = searchParams.get("reset") === "success";
    
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const isSubmitting = navigation.state === "submitting";

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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

            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-4">
                        <span className="text-4xl font-display font-bold text-white">
                            360<span className="text-naranja-300">Lateral</span>
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Iniciar sesión</h1>
                    <p className="text-lateral-100">Accede a tu cuenta para continuar</p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* ✅ NUEVO: Mensaje de éxito de reset */}
                    {resetSuccess && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                            <div className="flex">
                                <svg className="h-5 w-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-green-800">¡Contraseña actualizada!</h3>
                                    <p className="text-sm text-green-700 mt-1">
                                        Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error general */}
                    {actionData?.errors?.general && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Error de autenticación</h3>
                                    <p className="text-sm text-red-700 mt-1">{actionData.errors.general}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Form method="post" className="space-y-6">
                        {/* Email */}
                        <FormInput
                            id="email"
                            name="email"
                            label="Correo electrónico"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                            placeholder="tu@email.com"
                            autoComplete="email"
                            icon={emailIcon}
                        />

                        {/* Contraseña */}
                        <PasswordInput
                            id="password"
                            name="password"
                            label="Contraseña"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            required
                            placeholder="Tu contraseña"
                        />

                        {/* Opciones adicionales */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    className="h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                                    Recordarme
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link 
                                    to="/forgot-password" 
                                    className="font-medium text-lateral-600 hover:text-lateral-500 transition-colors duration-200"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>

                        {/* Botón Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-lateral-600 text-white px-8 py-4 rounded-lg hover:bg-lateral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lateral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center font-semibold text-lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Iniciar sesión
                                </>
                            )}
                        </button>
                    </Form>

                    {/* Link de registro */}
                    <div className="text-center mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            ¿No tienes una cuenta?{" "}
                            <Link to="/register" className="font-medium text-lateral-600 hover:text-lateral-500 transition-colors duration-200">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Features adicionales */}
                <div className="mt-8 text-center">
                    <div className="grid grid-cols-3 gap-4 text-white">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs">Seguro</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-xs">Rápido</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <span className="text-xs">Confiable</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}