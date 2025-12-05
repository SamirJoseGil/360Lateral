import { json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { usePageView } from "~/hooks/useStats";
import { getUser } from "~/utils/auth.server";
import Sidebar from "~/components/layout/sidebar";

// Loader para verificar autenticación y rol de administrador
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const user = await getUser(request);

        if (!user) {
            console.log("Admin layout loader - no user, redirecting to home");
            return redirect("/");
        }

        if (user.role !== "admin") {
            console.log(`Admin layout loader - user is not admin (${user.role}), redirecting`);
            // Redirigir a la ruta apropiada según el rol
            const roleMappings: Record<string, string> = {
                "owner": "/owner",
                "developer": "/developer",
                "admin": "/admin"
            };
            return redirect(roleMappings[user.role] || "/");
        }

        // ✅ SOLO registrar evento una vez por carga del layout
        const url = new URL(request.url);

        return json({ user });
    } catch (error) {
        console.error("[Admin Layout] Loader error:", error);

        if (error instanceof Response) {
            throw error;
        }

        throw redirect('/login?message=Sesión expirada');
    }
}

// Componente para el layout de administrador
export default function AdminLayout() {
    const { user } = useLoaderData<typeof loader>();

    // Opciones del sidebar para el administrador
    const sidebarOptions = [
        { to: "/admin", label: "Menú Principal", icon: "dashboard" },
        { to: "/admin/usuarios", label: "Gestión de Usuarios", icon: "users" },
        { to: "/admin/lotes", label: "Gestión de Lotes", icon: "map" },
        { to: "/admin/validacion", label: "Gestión de Documentos", icon: "check-circle" },
        { to: "/admin/solicitudes", label: "Gestión de Solicitudes", icon: "clipboard-list" },
        { to: "/admin/investments", label: "Gestión de Investigaciónes", icon: "chart-bar" },
        { to: "/admin/analisis", label: "Gestión de Análisis Urbanístico", icon: "bell" },
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
