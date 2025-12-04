import { json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import Sidebar from "~/components/sidebar";

// Loader para verificar autenticación y rol de desarrollador
export async function loader({ request }: LoaderFunctionArgs) {
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

    return json({ user });
}

// Componente para el layout de desarrollador
export default function DeveloperLayout() {
    const { user } = useLoaderData<typeof loader>();

    // Opciones del sidebar para el desarrollador
    const sidebarOptions = [
        { to: "/developer", label: "Menú Principal", icon: "dashboard" },
        { to: "/developer/search", label: "Buscar Lotes", icon: "search" },
        { to: "/developer/favorites", label: "Favoritos", icon: "heart" },
        { to: "/developer/analisis", label: "Análisis MapGIS", icon: "chart-bar" }, // ✅ NUEVO
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
                <div className="container mx-auto py-16">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
