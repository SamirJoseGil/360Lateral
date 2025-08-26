// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.lote.$id.tsx
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";

// Formateador de moneda para COP
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
    }).format(value);
};

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    // Solo propietarios pueden ver detalles de lotes
    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    const loteId = params.id;

    // En un caso real, aquí haríamos una petición a la API para obtener los datos del lote
    // por ejemplo a /api/lotes/{loteId}/
    // Por ahora usaremos datos de ejemplo

    // Simulamos la obtención del lote por ID
    const lotes = [
        {
            id: 1,
            nombre: "Lote Centro Medellín",
            descripcion: "Lote comercial en zona céntrica, con gran potencial para desarrollo comercial o mixto. Ubicado en una zona de alta valorización.",
            direccion: "Calle 50 #45-67",
            area: 320.5,
            estrato: 4,
            codigo_catastral: "050010105678900000",
            matricula: "01234567",
            cbml: "04050010105",
            tratamiento_pot: "Renovación urbana",
            uso_suelo: "Mixto - comercial/residencial",
            valorEstimado: 450000000,
            status: "active",
            documentosCompletos: true,
            latitud: 6.244203,
            longitud: -75.573553,
            created_at: "2023-08-15T14:30:45Z",
            updated_at: "2023-09-20T09:12:33Z"
        },
        {
            id: 2,
            nombre: "Lote Residencial Sur",
            descripcion: "Lote en zona exclusiva residencial, ideal para desarrollo de vivienda multifamiliar de alto valor.",
            direccion: "Carrera 80 #25-30",
            area: 520.25,
            estrato: 5,
            codigo_catastral: "050010108765432100",
            matricula: "76543210",
            cbml: "04050010110",
            tratamiento_pot: "Desarrollo",
            uso_suelo: "Residencial",
            valorEstimado: 680000000,
            status: "active",
            documentosCompletos: true,
            latitud: 6.224103,
            longitud: -75.583553,
            created_at: "2023-09-05T10:15:20Z",
            updated_at: "2023-10-12T11:30:15Z"
        },
        {
            id: 3,
            nombre: "Lote Comercial Norte",
            descripcion: "Lote con ubicación estratégica para desarrollo comercial. Acceso a vías principales.",
            direccion: "Avenida 33 #65-43",
            area: 850.0,
            estrato: 4,
            codigo_catastral: "050010106789054321",
            matricula: "98765432",
            cbml: "04050010115",
            tratamiento_pot: "Consolidación",
            uso_suelo: "Comercial",
            valorEstimado: 720000000,
            status: "pending",
            documentosCompletos: false,
            latitud: 6.264303,
            longitud: -75.563553,
            created_at: "2023-10-10T09:30:15Z",
            updated_at: "2023-10-15T16:45:22Z"
        }
    ];

    const lote = lotes.find(l => l.id === parseInt(loteId || '0'));

    if (!lote) {
        // Si no se encuentra el lote, redirigir a la lista de lotes
        return redirect("/owner/mis-lotes");
    }

    // Documentos asociados al lote
    const documentos = [
        {
            id: 12,
            nombre: "Escritura.pdf",
            tipo: "escritura",
            fechaSubida: "2023-08-16",
            tamano: "2.4 MB",
            validado: true
        },
        {
            id: 13,
            nombre: "Plano.pdf",
            tipo: "plano",
            fechaSubida: "2023-08-17",
            tamano: "4.1 MB",
            validado: true
        },
        {
            id: 14,
            nombre: "CertificadoLibertad.pdf",
            tipo: "certificado_libertad",
            fechaSubida: "2023-08-18",
            tamano: "1.2 MB",
            validado: false
        }
    ];

    // Restricciones del lote
    const restricciones = [
        {
            tipo: "Ambiental",
            descripcion: "Zona de protección hídrica"
        },
        {
            tipo: "Normativa",
            descripcion: "Altura máxima permitida: 8 pisos"
        }
    ];

    // Análisis realizados
    const analisis = [
        {
            id: 1,
            tipo: "aprovechamiento",
            fecha: "2023-09-10",
            resultado: "Favorable",
            detalles: "Potencial de desarrollo alto"
        },
        {
            id: 2,
            tipo: "factibilidad",
            fecha: "2023-09-15",
            resultado: "En revisión",
            detalles: "Pendiente aprobación final"
        }
    ];

    return json({
        user,
        lote,
        documentos,
        restricciones,
        analisis
    });
}

export default function DetalleLote() {
    const { user, lote, documentos, restricciones, analisis } = useLoaderData<typeof loader>();

    // Convertir fechas ISO a formato legible
    const formatDate = (isoDate: string) => {
        return new Date(isoDate).toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center">
                    <Link
                        to="/owner/mis-lotes"
                        className="mr-4 text-indigo-600 hover:text-indigo-900"
                    >
                        ← Volver a mis lotes
                    </Link>
                    <h1 className="text-2xl font-bold">{lote.nombre}</h1>
                    <span
                        className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lote.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                    >
                        {lote.status === "active" ? "Activo" : "Pendiente"}
                    </span>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2">
                    <Link
                        to={`/owner/lote/${lote.id}/editar`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                        Editar
                    </Link>
                    <Link
                        to={`/owner/lote/${lote.id}/documentos`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Documentos
                    </Link>
                    <Link
                        to={`/owner/lote/${lote.id}/analisis`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        Análisis
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Datos básicos */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Información del Lote</h2>
                        </div>
                        <div className="px-6 py-4">
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                                <p className="mt-1 text-sm text-gray-900">{lote.descripcion}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Dirección</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.direccion}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Área</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.area.toLocaleString("es-CO")} m²</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Estrato</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.estrato}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Valor estimado</h3>
                                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(lote.valorEstimado)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">CBML</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.cbml}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Matrícula inmobiliaria</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.matricula}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Código catastral</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.codigo_catastral}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Fecha registro</h3>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(lote.created_at)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Tratamiento POT</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.tratamiento_pot}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Uso de suelo</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.uso_suelo}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documentos del lote */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Documentos</h2>
                            <Link
                                to={`/owner/lote/${lote.id}/documentos/subir`}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                            >
                                + Añadir documento
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Documento
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Tipo
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Fecha
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Tamaño
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Estado
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {documentos.map((doc) => (
                                        <tr key={doc.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {doc.nombre}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.tipo === "escritura" ? "Escritura" :
                                                    doc.tipo === "plano" ? "Plano" :
                                                        doc.tipo === "certificado_libertad" ? "Cert. Libertad" :
                                                            "Otro"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.fechaSubida}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.tamano}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.validado
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                >
                                                    {doc.validado ? "Validado" : "Pendiente"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <a
                                                    href="#"
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        // Aquí iría la lógica para descargar el archivo
                                                        alert(`Descargando ${doc.nombre}...`);
                                                    }}
                                                >
                                                    Descargar
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {documentos.length === 0 && (
                                <div className="py-8 text-center">
                                    <p className="text-gray-500">No hay documentos registrados para este lote</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Restricciones */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Restricciones</h2>
                        </div>
                        <div className="px-6 py-4">
                            {restricciones.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {restricciones.map((restriccion, index) => (
                                        <li key={index} className="py-3 flex">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-red-500 mr-2"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">{restriccion.tipo}</h3>
                                                <p className="text-sm text-gray-500">{restriccion.descripcion}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-3 text-center">
                                    <p className="text-gray-500">No hay restricciones registradas para este lote</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Análisis realizados */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Análisis Realizados</h2>
                            <Link
                                to={`/owner/analisis/solicitar?lote=${lote.id}`}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                            >
                                + Solicitar análisis
                            </Link>
                        </div>
                        <div className="px-6 py-4">
                            {analisis.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {analisis.map((analisis) => (
                                        <li key={analisis.id} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    Análisis de {
                                                        analisis.tipo === "aprovechamiento" ? "Aprovechamiento Urbanístico" :
                                                            analisis.tipo === "factibilidad" ? "Factibilidad" : analisis.tipo
                                                    }
                                                </h3>
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${analisis.resultado === "Favorable"
                                                            ? "bg-green-100 text-green-800"
                                                            : analisis.resultado === "En revisión"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {analisis.resultado}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">Fecha: {analisis.fecha}</p>
                                            <p className="mt-1 text-sm text-gray-600">{analisis.detalles}</p>
                                            <Link
                                                to={`/owner/analisis/${analisis.id}`}
                                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-900 inline-block"
                                            >
                                                Ver detalles →
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-3 text-center">
                                    <p className="text-gray-500">No hay análisis realizados para este lote</p>
                                    <Link
                                        to={`/owner/analisis/solicitar?lote=${lote.id}`}
                                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-900 inline-block"
                                    >
                                        Solicitar un análisis
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna lateral */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Mapa */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Ubicación</h2>
                        </div>
                        <div className="px-6 py-4">
                            <div className="aspect-w-16 aspect-h-9 mb-4">
                                <div className="w-full h-64 bg-gray-200 rounded relative">
                                    {/* Aquí iría el mapa real */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-gray-500">Mapa no disponible en versión de prueba</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Latitud</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.latitud}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Longitud</h3>
                                    <p className="mt-1 text-sm text-gray-900">{lote.longitud}</p>
                                </div>
                            </div>
                            <a
                                href={`https://maps.google.com/?q=${lote.latitud},${lote.longitud}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Ver en Google Maps
                            </a>
                        </div>
                    </div>

                    {/* Estado Documentación */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Estado de Documentación</h2>
                        </div>
                        <div className="px-6 py-4">
                            <ul className="space-y-3">
                                <li className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Escritura</span>
                                    {documentos.some(d => d.tipo === "escritura") ? (
                                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Plano</span>
                                    {documentos.some(d => d.tipo === "plano") ? (
                                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Certificado de Libertad</span>
                                    {documentos.some(d => d.tipo === "certificado_libertad") ? (
                                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">Estado General</span>
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lote.documentosCompletos
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {lote.documentosCompletos ? "Completo" : "Incompleto"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Acciones</h2>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                            <Link
                                to={`/owner/lote/${lote.id}/editar`}
                                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                </svg>
                                Editar información
                            </Link>
                            <Link
                                to={`/owner/lote/${lote.id}/documentos/subir`}
                                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                Subir documentos
                            </Link>
                            <Link
                                to={`/owner/analisis/solicitar?lote=${lote.id}`}
                                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                Solicitar análisis
                            </Link>
                            <Link
                                to={`/owner/lote/${lote.id}/compartir`}
                                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                    />
                                </svg>
                                Compartir
                            </Link>
                            <button
                                className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                onClick={() => {
                                    if (confirm("¿Está seguro de que desea archivar este lote? Esto lo ocultará de su vista principal.")) {
                                        // Aquí iría la lógica para archivar
                                        alert("Funcionalidad de archivar no implementada en esta versión");
                                    }
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                    />
                                </svg>
                                Archivar lote
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}