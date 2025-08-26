// app/routes/auth.login.tsx
import { Form, useActionData } from "@remix-run/react";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { loginAction } from "~/utils/auth.server";
import { getSession, sessionStorage } from "~/utils/session.server";
import cookie from "cookie";

// Importamos la función de creación de sesión del nuevo archivo
import { createUserSession } from "~/utils/session.server";

// Acción de login usando el nuevo sistema de sesiones
export async function action({ request }: ActionFunctionArgs) {
    console.log("loginAction - starting");
    const formData = await request.formData();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = formData.get("redirectTo") as string || "/";

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

        // Crear la sesión de usuario y establecer las cookies
        console.log(`loginAction - creating user session and redirecting to: ${redirectTo}`);

        // Esta función se encarga de crear las cookies y redireccionar
        return createUserSession(user, redirectTo, access, refresh);
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

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Form method="post" className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-xl font-bold mb-6">Iniciar Sesión</h1>

                {actionData?.errors && 'general' in actionData.errors && (
                    <p className="text-red-500 mb-4">{actionData.errors.general}</p>
                )}

                <label className="block mb-2">
                    <span>Email</span>
                    <input
                        type="email"
                        name="email"
                        className="w-full border p-2 rounded"
                        required
                    />
                </label>

                <label className="block mb-4">
                    <span>Contraseña</span>
                    <input
                        type="password"
                        name="password"
                        className="w-full border p-2 rounded"
                        required
                    />
                </label>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                    Entrar
                </button>
            </Form>
        </div>
    );
}
