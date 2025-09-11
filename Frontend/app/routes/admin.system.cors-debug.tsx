// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\routes\admin.system.cors-debug.tsx
import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getCorsDebugInfo } from "~/services/common.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return redirect("/");
    }

    try {
        const { debug, headers } = await getCorsDebugInfo(request);

        return json(debug, {
            headers
        });
    } catch (error) {
        console.error("Error obteniendo información de CORS debug:", error);
        return json({
            success: false,
            message: "Error obteniendo información de CORS debug",
            error: (error as Error).message
        }, {
            status: 500
        });
    }
}