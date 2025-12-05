// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.lotes.tsx
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getMisLotes } from "~/services/lotes.server";
import LoteCard from "~/components/lotes/LoteCard";

// Loader para cargar los datos usando el servicio actualizado
export async function loader({ request }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);

    if (!user) {
        return json({ hasResults: false, error: "Usuario no autenticado" });
    }

    if (user.role !== "owner") {
        return json({ hasResults: false, error: "No autorizado" });
    }

    try {
        // Obtener parámetros de búsqueda si existen
        const url = new URL(request.url);
        const searchQuery = url.searchParams.get("search");

        // Usar el servicio optimizado para obtener lotes
        const resultado = await getMisLotes(request, searchQuery || undefined);

        // Verificar si hay lotes en la respuesta y loggear información relevante
        console.log("[MisLotes Loader] Datos recibidos:", {
            hasResults: resultado.lotes && resultado.lotes.length > 0,
            count: resultado.count || 0,
            firstLote: resultado.lotes?.[0]?.id || 'No hay lotes'
        });

        return json({
            hasResults: resultado.lotes && resultado.lotes.length > 0,
            lotes: resultado.lotes || [],
            count: resultado.count || 0,
            searchQuery: searchQuery || ""
        }, {
            headers: resultado.headers
        });
    } catch (error) {
        console.error("[MisLotes Loader] Error obteniendo lotes:", error);
        return json({
            hasResults: false,
            error: "Error al cargar los lotes. Por favor, intente de nuevo.",
            lotes: [],
            count: 0,
            searchQuery: ""
        });
    }
}

// Componente principal
export default function MisLotes() {
    const loaderData = useLoaderData<typeof loader>();
    const [lotes, setLotes] = useState<any[]>([]);

    useEffect(() => {
        console.log("[MisLotes Component] Datos del loader:", loaderData);
        if ('lotes' in loaderData && Array.isArray(loaderData.lotes)) {
            setLotes(loaderData.lotes);
        }
    }, [loaderData]);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mis Lotes</h1>
                <Link
                    to="/owner/lotes/nuevo"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Registrar Nuevo Lote
                </Link>
            </div>

            {'error' in loaderData && loaderData.error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{loaderData.error}</p>
                        </div>
                    </div>
                </div>
            )}

            {loaderData.hasResults && lotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lotes.map(lote => (
                        <LoteCard
                            key={lote.id}
                            lote={lote}
                            userRole="owner"
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-600 mb-4">No tienes lotes registrados en este momento.</p>
                    <Link to="/owner/lotes/nuevo" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Registrar mi primer lote
                    </Link>
                </div>
            )}
        </div>
    );
}
