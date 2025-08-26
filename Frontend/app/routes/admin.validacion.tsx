import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    console.log("Admin validacion loader - processing request");

    // Verificar que el usuario esté autenticado y sea admin
    const user = await getUser(request);
    if (!user) {
        console.log("Admin validacion loader - no user, redirecting to home");
        return redirect("/");
    }

    if (user.role !== "admin" && user.role !== "owner") {
        console.log(`Admin validacion loader - user is not authorized (${user.role})`);
        return redirect("/");
    }

    // Por ahora datos de ejemplo
    const validacionData = {
        pendientes: 15,
        completadas: 78,
        rechazadas: 7,
        documentos: [
            {
                id: "doc-1",
                nombre: "Escritura Lote 123",
                tipo: "Escritura",
                estado: "pendiente",
                fechaSubida: "2025-08-20",
                solicitante: "Juan Pérez"
            },
            {
                id: "doc-2",
                nombre: "Plano Topográfico Sector Norte",
                tipo: "Plano",
                estado: "completado",
                fechaSubida: "2025-08-18",
                solicitante: "María Gómez"
            },
            {
                id: "doc-3",
                nombre: "Certificado Tradición Lote 456",
                tipo: "Certificado",
                estado: "pendiente",
                fechaSubida: "2025-08-22",
                solicitante: "Carlos Ruiz"
            }
        ]
    };

    return json({ user, validacionData });
}

export default function AdminValidacion() {
    const { validacionData } = useLoaderData<typeof loader>();
    const [expandedDocuments, setExpandedDocuments] = useState<string[]>([]);

    // Función para expandir/colapsar documentos
    const toggleExpand = (id: string) => {
        setExpandedDocuments(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Función para obtener el color según tipo de documento
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'document':
                return 'blue';
            case 'identity':
                return 'green';
            case 'property':
                return 'purple';
            default:
                return 'gray';
        }
    };

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Validación de Documentos</h1>
                <p className="text-gray-600 mt-2">Gestión y validación de documentos subidos al sistema</p>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-gray-500 text-sm font-medium">Pendientes</h2>
                    <p className="text-3xl font-bold text-amber-500">{validacionData.pendientes}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-gray-500 text-sm font-medium">Validados</h2>
                    <p className="text-3xl font-bold text-green-500">{validacionData.completadas}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-gray-500 text-sm font-medium">Rechazados</h2>
                    <p className="text-3xl font-bold text-red-500">{validacionData.rechazadas}</p>
                </div>
            </div>

            {/* Tabla de documentos */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Documentos Recientes</h2>
                    <p className="text-gray-500 text-sm mt-1">Documentos que requieren validación</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {validacionData.documentos.map((doc) => (
                                <tr key={doc.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.tipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${doc.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                                                doc.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                            {doc.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.fechaSubida}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.solicitante}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <a href="#" className="text-blue-600 hover:text-blue-900 mr-3">Ver</a>
                                        {doc.estado === 'pendiente' && (
                                            <>
                                                <a href="#" className="text-green-600 hover:text-green-900 mr-3">Validar</a>
                                                <a href="#" className="text-red-600 hover:text-red-900">Rechazar</a>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-medium">3</span> de <span className="font-medium">25</span> documentos
                    </div>
                    <div className="flex-1 flex justify-end">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <span className="sr-only">Anterior</span>
                                &lt;
                            </a>
                            <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                1
                            </a>
                            <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600 hover:bg-blue-100">
                                2
                            </a>
                            <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                3
                            </a>
                            <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <span className="sr-only">Siguiente</span>
                                &gt;
                            </a>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}