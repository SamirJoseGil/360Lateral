import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";

// Loader para redirigir si ya está autenticado
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);

    // Si el usuario ya está autenticado, redirigir según su rol
    if (user) {
        return redirect(`/${user.role}`);
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

        // Crear cookies de sesión y redirigir
        console.log(`loginAction - creating user session and redirecting to: ${redirectTo}`);

        const headers = new Headers();
        headers.append("Set-Cookie", `l360_access=${encodeURIComponent(access)}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`);
        headers.append("Set-Cookie", `l360_refresh=${encodeURIComponent(refresh)}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`);
        headers.append("Set-Cookie", `l360_user=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`);

        return redirect(redirectTo, { headers });
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
