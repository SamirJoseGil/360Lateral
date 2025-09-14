import { Form, useActionData, useLoaderData, Link } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";

// Loader para redirigir si ya está autenticado
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);

    // Si el usuario ya está autenticado, redirigir según su rol
    if (user) {
        const dashboardRoute = getDashboardRoute(user.role);
        return redirect(dashboardRoute);
    }

    // Registrar vista de página de login para estadísticas
    try {
        await recordEvent(request, {
            type: "view",
            name: "login_page",
            value: {}
        });
    } catch (error) {
        console.error("Error registrando vista de login:", error);
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

// Acción de login usando el nuevo sistema de sesiones
export async function action({ request }: ActionFunctionArgs) {
    console.log("loginAction - starting");
    const formData = await request.formData();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = formData.get("redirectTo") as string;

    console.log(`loginAction - attempting login for: ${email}`);

    if (!email || !password) {
        return json(
            { errors: { email: "Email is required", password: "Password is required" } },
            { status: 400 }
        );
    }

    try {
        const response = await fetch("http://localhost:8000/api/auth/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        console.log("loginAction - API response status:", response.status);
        const data = await response.json();
        console.log("loginAction - received data:", data);

        if (!response.ok) {
            return json(
                { errors: { general: data.message || "Error de autenticación" } },
                { status: response.status }
            );
        }

        // Si llegamos aquí, el login fue exitoso
        const { refresh, access, user } = data.data;

        // Determinar la ruta de redirección basada en el rol del usuario
        let finalRedirectTo = redirectTo;
        if (!finalRedirectTo || finalRedirectTo === "/") {
            finalRedirectTo = getDashboardRoute(user.role);
        }

        // Crear cookies de sesión y redirigir
        console.log(`loginAction - creating user session and redirecting to: ${finalRedirectTo}`);

        const headers = new Headers();
        headers.append("Set-Cookie", `l360_access=${encodeURIComponent(access)}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`);
        headers.append("Set-Cookie", `l360_refresh=${encodeURIComponent(refresh)}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`);
        headers.append("Set-Cookie", `l360_user=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`);

        return redirect(finalRedirectTo, { headers });
    } catch (error) {
        console.error("loginAction - error:", error);
        return json(
            { errors: { general: "Error de conexión al servidor" } },
            { status: 500 }
        );
    }
}

export default function Login() {
    const actionData = useActionData<typeof action>();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = () => {
        setIsLoading(true);
    };

    return (
        <div className="min-h-screen flex">
            {/* Panel izquierdo - Información */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-lateral relative overflow-hidden">
                {/* Elementos decorativos */}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-20 left-20 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
                    <div className="absolute bottom-20 right-20 w-24 h-24 bg-naranja-500 bg-opacity-20 rounded-full"></div>
                    <div className="absolute top-1/2 right-10 w-16 h-16 bg-white bg-opacity-5 rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
                    <div className="max-w-md">
                        <h1 className="text-4xl font-display font-bold mb-6">
                            Bienvenido de vuelta a 360<span className="text-naranja-500">Lateral</span>
                        </h1>
                        <p className="text-xl text-lateral-100 mb-8">
                            Accede a la plataforma de gestión urbanística más completa de Colombia
                        </p>

                        {/* Features destacados */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-lateral-100">Gestión integral de lotes urbanos</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <span className="text-lateral-100">Análisis urbanístico automatizado</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <span className="text-lateral-100">Búsqueda avanzada de oportunidades</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel derecho - Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full space-y-8">
                    {/* Logo y encabezado */}
                    <div className="text-center">
                        <Link to="/" className="inline-block">
                            <span className="text-3xl font-display font-bold text-lateral-600">
                                360<span className="text-naranja-500">Lateral</span>
                            </span>
                        </Link>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            Iniciar sesión
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Accede a tu cuenta para continuar
                        </p>
                    </div>

                    {/* Formulario */}
                    <Form method="post" className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {/* Error general */}
                        {actionData?.errors && 'general' in actionData.errors && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{actionData.errors.general}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Correo electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 text-sm"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lateral-500 focus:border-lateral-500 text-sm"
                                        placeholder="Tu contraseña"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
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
                                </div>
                            </div>
                        </div>

                        {/* Enlaces adicionales */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-lateral-600 focus:ring-lateral-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Recordarme
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-lateral-600 hover:text-lateral-500">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        </div>

                        {/* Botón de envío */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-lateral-600 hover:bg-lateral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lateral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Iniciando sesión...
                                    </div>
                                ) : (
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Iniciar sesión
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Link de registro */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                ¿No tienes una cuenta?{" "}
                                <Link to="/register" className="font-medium text-lateral-600 hover:text-lateral-500 transition-colors duration-200">
                                    Regístrate aquí
                                </Link>
                            </p>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}
