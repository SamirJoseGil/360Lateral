import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    console.log("Admin analisis loader - processing request");

    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user) {
        console.log("Admin analisis loader - no user, redirecting to home");
        return redirect("/");
    }

    if (user.role !== "admin" && user.role !== "owner") {
        console.log(`Admin analisis loader - user is not authorized (${user.role})`);
        return redirect("/");
    }

    // Por ahora datos de ejemplo para mostrar en el dashboard
    const analisisData = {
        estadisticas: {
            totalLotes: 256,
            lotesActivos: 187,
            lotesInactivos: 69,
            documentosAnalizados: 423
        },
        graficoMensual: [
            { mes: "Ene", documentos: 42 },
            { mes: "Feb", documentos: 38 },
            { mes: "Mar", documentos: 45 },
            { mes: "Abr", documentos: 32 },
            { mes: "May", documentos: 48 },
            { mes: "Jun", documentos: 56 },
            { mes: "Jul", documentos: 67 },
            { mes: "Ago", documentos: 95 }
        ],
        distribucionTipo: [
            { tipo: "Escrituras", cantidad: 156, porcentaje: 36.9 },
            { tipo: "Planos", cantidad: 124, porcentaje: 29.3 },
            { tipo: "Certificados", cantidad: 87, porcentaje: 20.6 },
            { tipo: "Contratos", cantidad: 56, porcentaje: 13.2 }
        ],
        recientes: [
            {
                id: "lote-123",
                nombre: "Lote 123 - Sector Norte",
                documentos: 12,
                estado: "completo",
                ultimaActualizacion: "2025-08-21"
            },
            {
                id: "lote-456",
                nombre: "Lote 456 - Sector Oeste",
                documentos: 8,
                estado: "pendiente",
                ultimaActualizacion: "2025-08-20"
            },
            {
                id: "lote-789",
                nombre: "Lote 789 - Sector Este",
                documentos: 15,
                estado: "completo",
                ultimaActualizacion: "2025-08-19"
            },
            {
                id: "lote-321",
                nombre: "Lote 321 - Sector Sur",
                documentos: 5,
                estado: "pendiente",
                ultimaActualizacion: "2025-08-22"
            }
        ]
    };

    return json({ user, analisisData });
}

export default function AdminAnalisis() {
    const { analisisData } = useLoaderData<typeof loader>();

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Análisis y Estadísticas</h1>
                <p className="text-gray-600 mt-2">Dashboard de análisis de documentos y lotes</p>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm font-medium">Total Lotes</h2>
                            <p className="text-2xl font-bold">{analisisData.estadisticas.totalLotes}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm font-medium">Lotes Activos</h2>
                            <p className="text-2xl font-bold">{analisisData.estadisticas.lotesActivos}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 text-red-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm font-medium">Lotes Inactivos</h2>
                            <p className="text-2xl font-bold">{analisisData.estadisticas.lotesInactivos}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-500 text-sm font-medium">Documentos</h2>
                            <p className="text-2xl font-bold">{analisisData.estadisticas.documentosAnalizados}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos y tablas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Gráfico mensual (simulado con divs) */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Documentos Procesados por Mes</h2>
                    <div className="h-64 flex items-end space-x-2">
                        {analisisData.graficoMensual.map((item, index) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                                <div
                                    className="w-full bg-blue-500 rounded-t"
                                    style={{ height: `${(item.documentos / 100) * 200}px` }}
                                ></div>
                                <div className="text-xs mt-2">{item.mes}</div>
                                <div className="text-xs font-medium">{item.documentos}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Distribución por tipo */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Distribución por Tipo de Documento</h2>
                    <div className="space-y-4">
                        {analisisData.distribucionTipo.map((item, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">{item.tipo}</span>
                                    <span className="text-sm text-gray-500">{item.cantidad} ({item.porcentaje}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${item.porcentaje}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lotes recientes */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Lotes Recientes</h2>
                    <p className="text-gray-500 text-sm mt-1">Últimos lotes actualizados en el sistema</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documentos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actualización</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {analisisData.recientes.map((lote) => (
                                <tr key={lote.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lote.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lote.documentos}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${lote.estado === 'completo' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {lote.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lote.ultimaActualizacion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <a href="#" className="text-blue-600 hover:text-blue-900">Ver Detalles</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t">
                    <a href="#" className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                        Ver todos los lotes &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
}