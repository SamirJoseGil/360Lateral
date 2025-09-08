// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.tsx
import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser, isRedirectLoop } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // Si detectamos un bucle de redirección, enviamos al usuario al inicio
    if (isRedirectLoop(request)) {
        console.warn("Detected redirect loop in owner dashboard. Breaking loop.");
        return redirect("/");
    }

    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);
    if (!user) {
        console.log("Owner dashboard: No user found, redirecting to homepage");
        return redirect("/");
    }

    // Solo redirigimos si el usuario no es propietario
    if (user.role !== "owner") {
        console.log(`Non-owner user trying to access owner dashboard: ${user.role}`);
        // Usar redirección simple
        const url = new URL(request.url);
        url.searchParams.set("_rc", "1"); // Añadir contador de redirecciones manualmente
        return redirect(`/${user.role}`);
    }

    // Si el usuario es propietario, devolvemos sus datos
    return json({ user });
}

export default function OwnerLayout() {
    const { user } = useLoaderData<typeof loader>();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar / Menú lateral */}
            <div className="w-64 bg-white shadow-md">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Panel Propietario</h2>
                    <p className="text-sm text-gray-500 mt-1">Bienvenido, {user.name}</p>
                </div>

                <nav className="p-4">
                    <ul className="space-y-1">
                        <li>
                            <Link
                                to="/owner"
                                className="block px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/owner/lotes"
                                className="block px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                Mis Lotes
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/owner/documentos"
                                className="block px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                Documentos
                            </Link>
                        </li>
                        {/*
                        <li>
                            <Link
                                to="/owner/solicitudes"
                                className="block px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                Solicitudes
                            </Link>
                        </li>
                        */}
                        <li>
                            <Link
                                to="/owner/analisis/solicitar"
                                className="block px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                Análisis Urbanístico
                            </Link>
                        </li>
                        <li className="pt-4 mt-4 border-t border-gray-200">
                            <Link
                                to="/profile"
                                className="block px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                Mi Perfil
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/api/auth/logout"
                                className="block px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                Cerrar Sesión
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Contenido principal */}
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
}