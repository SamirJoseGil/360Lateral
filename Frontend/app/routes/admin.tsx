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

        // Solo registrar si no es una recarga o navegación secundaria
        const isInitialLoad = !request.headers.get('purpose')?.includes('prefetch');

        if (isInitialLoad) {
            try {
                await recordEvent(request, {
                    type: "view",
                    name: "admin_layout",
                    value: {
                        pathname: url.pathname,
                        search: url.search,
                        timestamp: new Date().toISOString(),
                        user_id: user.id,
                        role: user.role
                    }
                });
            } catch (statsError) {
                console.warn("[Admin Layout] Error recording stats:", statsError);
            }
        }

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
        { to: "/admin", label: "Dashboard", icon: "dashboard" },
        { to: "/admin/usuarios", label: "Gestión de Usuarios", icon: "users" },
        { to: "/admin/lotes", label: "Gestión de Lotes", icon: "map" },
        { to: "/admin/validacion", label: "Validación de Documentos", icon: "check-circle" },
        // { to: "/admin/pot", label: "Gestión POT", icon: "document-text" },
        // { to: "/admin/system", label: "Monitoreo del Sistema", icon: "chart-bar" },
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
