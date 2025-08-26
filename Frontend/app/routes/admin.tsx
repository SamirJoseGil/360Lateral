import { json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import Sidebar from "~/components/sidebar";

// Loader para verificar autenticación y rol de administrador
export async function loader({ request }: LoaderFunctionArgs) {
    console.log("Admin layout loader - processing request");

    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user) {
        console.log("Admin layout loader - no user, redirecting to home");
        return redirect("/");
    }

    if (user.role !== "admin") {
        console.log(`Admin layout loader - user is not admin (${user.role}), redirecting`);
        // Redirigir a la ruta apropiada según el rol
        const roleMappings: Record<string, string> = {
            "owner": "/propietario",
            "developer": "/desarrollador",
            "admin": "/admin"
        };
        return redirect(roleMappings[user.role] || "/");
    }

    return json({ user });
}

// Componente para el layout de administrador
export default function AdminLayout() {
    const { user } = useLoaderData<typeof loader>();

    // Opciones del sidebar para el administrador
    const sidebarOptions = [
        { to: "/admin", label: "Dashboard", icon: "dashboard" },
        { to: "/admin/usuarios", label: "Usuarios", icon: "users" },
        { to: "/admin/validacion", label: "Validación", icon: "check-circle" },
        { to: "/admin/analisis", label: "Análisis", icon: "chart-bar" },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar
                options={sidebarOptions}
                user={user}
            />

            {/* Contenido principal */}
            <div className="flex-1 overflow-auto">
                <div className="container mx-auto p-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
