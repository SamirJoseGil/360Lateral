import { json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import Sidebar from "~/components/sidebar";
import { PageViewTracker } from "~/components/StatsTracker";

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);
    if (!user) {
        console.log("Owner dashboard: No user found, redirecting to homepage");
        return redirect("/");
    }

    // Solo redirigimos si el usuario no es propietario
    if (user.role !== "owner") {
        console.log(`Non-owner user trying to access owner dashboard: ${user.role}`);
        return redirect(`/${user.role}`);
    }

    // Si el usuario es propietario, devolvemos sus datos
    return json({ user });
}

export default function OwnerLayout() {
    const { user } = useLoaderData<typeof loader>();

    // Opciones del sidebar para el propietario
    const sidebarOptions = [
        { to: "/owner", label: "Menú Principal", icon: "dashboard" },
        { to: "/owner/lotes", label: "Mis Lotes", icon: "map" },
        { to: "/owner/documentos", label: "Documentos", icon: "check-circle" },
        { to: "/owner/solicitudes", label: "Solicitudes", icon: "users" },
        { to: "/owner/analisis/solicitar", label: "Análisis Urbanístico", icon: "chart-bar" },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Tracking de estadísticas para el panel owner */}
            <PageViewTracker pageName="owner_layout" additionalData={{ user_id: user.id, role: user.role }} />

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