import { json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { usePageView } from "~/hooks/useStats";
import { getUser } from "~/utils/auth.server";
import Sidebar from "~/components/sidebar";
import { recordEvent } from "~/services/stats.server";
import { PageViewTracker } from "~/components/StatsTracker";

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
            "owner": "/owner",
            "developer": "/developer",
            "admin": "/admin"
        };
        return redirect(roleMappings[user.role] || "/");
    }

    // Registrar evento de acceso al panel de administrador
    try {
        await recordEvent(request, {
            type: "view",
            name: "admin_panel_access",
            value: {
                user_id: user.id,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error al registrar evento de acceso a admin:", error);
        // No interrumpimos el flujo por un error de registro de evento
    }

    return json({ user });
}

// Componente para el layout de administrador
export default function AdminLayout() {
    const { user } = useLoaderData<typeof loader>();

    // Opciones del sidebar para el administrador
    const sidebarOptions = [
        { to: "/admin", label: "Dashboard", icon: "dashboard" },
        { to: "/admin/usuarios", label: "Gestión de Usuarios", icon: "users" },
        { to: "/admin/lotes", label: "Gestión de Lotes", icon: "map" },
        { to: "/admin/validacion", label: "Validación de Documentos", icon: "check-circle" },
        { to: "/admin/pot", label: "Gestión POT", icon: "document-text" },
        { to: "/admin/system", label: "Monitoreo del Sistema", icon: "chart-bar" },
    ];

    // Registrar vista de página cuando el componente se monta
    usePageView('admin_panel_view', {
        user_id: user.id,
        role: user.role
    }, [user.id, user.role]);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Tracking de estadísticas para el panel admin */}
            <PageViewTracker pageName="admin_layout" additionalData={{ user_id: user.id, role: user.role }} />

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
