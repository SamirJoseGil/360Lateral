import { json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser, isRedirectLoop } from "~/utils/auth.server";
import Sidebar from "~/components/sidebar";
import { recordEvent } from "~/services/stats.server";

// Loader para verificar autenticación y rol de desarrollador
export async function loader({ request }: LoaderFunctionArgs) {
    // Si detectamos un bucle de redirección, enviamos al usuario al inicio
    if (isRedirectLoop(request)) {
        console.warn("Detected redirect loop in developer layout. Breaking loop.");
        return redirect("/");
    }

    // Verificar que el usuario esté autenticado y sea desarrollador
    const user = await getUser(request);
    if (!user) {
        console.log("Developer layout loader - no user, redirecting to home");
        return redirect("/");
    }

    if (user.role !== "developer") {
        console.log(`Non-developer user trying to access developer layout: ${user.role}`);
        // Redirigir a la ruta apropiada según el rol
        return redirect(`/${user.role}`);
    }

    // Registrar evento de acceso al panel de desarrollador
    try {
        await recordEvent(request, {
            type: "view",
            name: "developer_panel_access",
            value: {
                user_id: user.id,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error al registrar evento de acceso a developer:", error);
        // No interrumpimos el flujo por un error de registro de evento
    }

    return json({ user });
}

// Componente para el layout de desarrollador
export default function DeveloperLayout() {
    const { user } = useLoaderData<typeof loader>();

    // Opciones del sidebar para el desarrollador
    const sidebarOptions = [
        { to: "/developer", label: "Dashboard", icon: "dashboard" },
        { to: "/developer/search", label: "Buscar Lotes", icon: "search" },
        { to: "/developer/favorites", label: "Favoritos", icon: "heart" },
        // { to: "/developer/analysis", label: "Análisis Urbanístico", icon: "chart-bar" }, // commented out option
        { to: "/developer/investment", label: "Criterios de Inversión", icon: "document-text" },
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
