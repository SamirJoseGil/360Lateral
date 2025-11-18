import { Form, useActionData, useSearchParams, Link, useNavigation, useLoaderData } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useState } from "react";
import { API_URL } from "~/utils/env.server";
import PasswordInput from "~/components/PasswordInput";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
        return redirect("/forgot-password");
    }

    // Verificar validez del token
    try {
        const response = await fetch(`${API_URL}/api/users/password-reset/verify-token/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!data.valid) {
            return json({
                tokenValid: false,
                error: data.message || "Token inválido o expirado"
            });
        }

        return json({
            tokenValid: true,
            userEmail: data.user_email
        });

    } catch (error) {
        return json({
            tokenValid: false,
            error: "Error al verificar el token"
        });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const token = formData.get("token") as string;
    const new_password = formData.get("new_password") as string;
    const confirm_password = formData.get("confirm_password") as string;

    const errors: Record<string, string> = {};

    if (!token) errors.token = "Token es requerido";
    if (!new_password) errors.new_password = "La nueva contraseña es requerida";
    if (!confirm_password) errors.confirm_password = "Confirmar contraseña es requerido";
    
    if (new_password && new_password.length < 8) {
        errors.new_password = "La contraseña debe tener al menos 8 caracteres";
    }

    if (new_password !== confirm_password) {
        errors.confirm_password = "Las contraseñas no coinciden";
    }

    if (Object.keys(errors).length > 0) {
        return json({ success: false, errors }, { status: 400 });
    }

    try {
        const response = await fetch(`${API_URL}/api/users/password-reset/confirm/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                new_password,
                confirm_password
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return json({
                success: false,
                errors: data.errors || { general: data.error || "Error al resetear contraseña" }
            }, { status: response.status });
        }

        // ✅ CORREGIDO: Redirigir a login en lugar de mostrar mensaje
        // Esto evita que el loader vuelva a verificar el token usado
        return redirect("/login?reset=success");

    } catch (error) {
        console.error("Error resetting password:", error);
        return json({
            success: false,
            errors: { general: "Error de conexión al servidor" }
        }, { status: 500 });
    }
}

export default function ResetPassword() {
    const loaderData = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const [searchParams] = useSearchParams();
    
    const isSubmitting = navigation.state === "submitting";
    const token = searchParams.get("token") || "";

    const [formData, setFormData] = useState({
        new_password: "",
        confirm_password: ""
    });

    // Si el token es inválido, mostrar error
    if (!loaderData.tokenValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-lateral-600 via-lateral-500 to-naranja-500 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="mt-4 text-2xl font-bold text-gray-900">Token Inválido</h2>
                            <p className="mt-2 text-gray-600">{loaderData.error}</p>
                            <Link 
                                to="/forgot-password"
                                className="mt-6 inline-block bg-lateral-600 text-white px-6 py-3 rounded-lg hover:bg-lateral-700 transition-colors"
                            >
                                Solicitar nuevo token
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Si ya se reseteo exitosamente
    if (actionData?.success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-lateral-600 via-lateral-500 to-naranja-500 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="mt-4 text-2xl font-bold text-gray-900">¡Contraseña Actualizada!</h2>
                            <p className="mt-2 text-gray-600">{actionData.message}</p>
                            <Link 
                                to="/login"
                                className="mt-6 inline-block bg-lateral-600 text-white px-6 py-3 rounded-lg hover:bg-lateral-700 transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-lateral-600 via-lateral-500 to-naranja-500 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-4">
                        <span className="text-4xl font-display font-bold text-white">
                            360<span className="text-naranja-300">Lateral</span>
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Cambiar Contraseña</h1>
                    {loaderData.userEmail && (
                        <p className="text-lateral-100">
                            Para: {loaderData.userEmail}
                        </p>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {actionData?.errors?.general && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                            <p className="text-sm text-red-700">{actionData.errors.general}</p>
                        </div>
                    )}

                    <Form method="post" className="space-y-6">
                        <input type="hidden" name="token" value={token} />

                        <PasswordInput
                            id="new_password"
                            name="new_password"
                            label="Nueva contraseña"
                            value={formData.new_password}
                            onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                            error={actionData?.errors?.new_password}
                            required
                            placeholder="Mínimo 8 caracteres"
                            showStrength
                        />

                        <PasswordInput
                            id="confirm_password"
                            name="confirm_password"
                            label="Confirmar contraseña"
                            value={formData.confirm_password}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                            error={actionData?.errors?.confirm_password}
                            required
                            placeholder="Repite tu contraseña"
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
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Cambiar contraseña
                                </>
                            )}
                        </button>
                    </Form>
                </div>
            </div>
        </div>
    );
}
