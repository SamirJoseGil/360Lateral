// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\routes\health.tsx
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getSimpleHealth } from "~/services/common.server";

// Health check público para el frontend (para load balancers, etc.)
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { health, headers } = await getSimpleHealth();

        // Si el backend está unhealthy, devolver 503
        if (health.status === "unhealthy") {
            return json(health, {
                status: 503,
                headers
            });
        }

        return json({
            status: "healthy",
            service: "lateral360-frontend",
            message: "Frontend service is running",
            backend: health,
            timestamp: new Date().toISOString()
        }, {
            headers
        });
    } catch (error) {
        console.error("Error in frontend health check:", error);
        return json({
            status: "unhealthy",
            service: "lateral360-frontend",
            message: "Frontend service error",
            error: (error as Error).message,
            timestamp: new Date().toISOString()
        }, {
            status: 503
        });
    }
}