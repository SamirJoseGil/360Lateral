import { Form, useActionData, Link, useNavigation } from "@remix-run/react";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { useState } from "react";
import { API_URL } from "~/utils/env.server";
import FormInput from "~/components/FormInput";

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const email = formData.get("email") as string;

    if (!email) {
        return json({
            success: false,
            error: "El email es requerido"
        }, { status: 400 });
    }

    try {
        const response = await fetch(`${API_URL}/api/users/password-reset/request/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            return json({
                success: false,
                error: data.error || "Error al solicitar recuperación de contraseña"
            }, { status: response.status });
        }

        return json({
            success: true,
            message: "Se ha generado un token de recuperación",
            token: data.data?.token,
            reset_url: data.data?.reset_url,
            warning: data.warning
        });

    } catch (error) {
        console.error("Error requesting password reset:", error);
        return json({
            success: false,
            error: "Error de conexión al servidor"
        }, { status: 500 });
    }
}

export default function ForgotPassword() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [email, setEmail] = useState("");

    return (
        <div className="min-h-screen bg-gradient-to-br from-lateral-600 via-lateral-500 to-naranja-500 flex items-center justify-center p-4">
            <Link 
                to="/login" 
                className="absolute top-8 left-8 text-white hover:text-naranja-300 transition-colors duration-200 flex items-center gap-2 group"
            >
                <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Volver al login</span>
            </Link>

            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-4">
                        <span className="text-4xl font-display font-bold text-white">
                            360<span className="text-naranja-300">Lateral</span>
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Recuperar Contraseña</h1>
                    <p className="text-lateral-100">
                        Ingresa tu email para recibir instrucciones de recuperación
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Success Message */}
                    {actionData?.success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                            <div className="flex">
                                <svg className="h-5 w-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-green-800">Token generado exitosamente</h3>
                                    <p className="text-sm text-green-700 mt-1">{actionData.message}</p>
                                    
                                    {actionData.token && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                            <p className="text-xs text-yellow-800 font-semibold mb-2">
                                                ⚠️ MODO DESARROLLO - Token visible:
                                            </p>
                                            <p className="text-xs text-gray-700 break-all mb-2">
                                                <strong>Token:</strong> {actionData.token}
                                            </p>
                                            <Link 
                                                to={`/reset-password?token=${actionData.token}`}
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Click aquí para resetear tu contraseña →
                                            </Link>
                                        </div>
                                    )}
                                    
                                    {actionData.warning && (
                                        <p className="text-xs text-yellow-700 mt-2 italic">
                                            {actionData.warning}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {actionData?.error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{actionData.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Form method="post" className="space-y-6">
                        <FormInput
                            id="email"
                            name="email"
                            label="Correo electrónico"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@email.com"
                            autoComplete="email"
                            icon={
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            }
                        />

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
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Solicitar recuperación
                                </>
                            )}
                        </button>
                    </Form>

                    <div className="text-center mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            ¿Recordaste tu contraseña?{" "}
                            <Link to="/login" className="font-medium text-lateral-600 hover:text-lateral-500 transition-colors duration-200">
                                Volver al login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
