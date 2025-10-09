import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getLoteById, verifyLote, rejectLote, archiveLote, reactivateLote } from "~/services/lotes.server";
import { getUserById } from "~/services/users.server";
import LoteStatusManager from "~/components/admin/LoteStatusManager";

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea admin
    const currentUser = await getUser(request);
    if (!currentUser) {
        return redirect("/login");
    }

    if (currentUser.role !== "admin") {
        return redirect("/" + currentUser.role);
    }

    const loteId = params.id;
    if (!loteId) {
        return redirect("/admin/lotes");
    }

    try {
        const { lote, headers } = await getLoteById(request, loteId);

        // Intentar obtener información del propietario si existe
        let owner = null;
        if (lote.owner) {
            try {
                const ownerResponse = await getUserById(request, lote.owner.toString());
                owner = ownerResponse.user;
            } catch (error) {
                console.error("Error obteniendo información del propietario:", error);
            }
        }

        return json({ lote, owner, currentUser }, { headers });
    } catch (error) {
        console.error("Error cargando detalles del lote:", error);
        return redirect("/admin/lotes");
    }
}

// ✅ NUEVO: Action para manejar cambios de estado
export async function action({ request, params }: ActionFunctionArgs) {
    const user = await getUser(request);
    if (!user || user.role !== "admin") {
        return json({ success: false, message: "No autorizado" }, { status: 401 });
    }

    const loteId = params.id;
    if (!loteId) {
        return json({ success: false, message: "ID de lote inválido" }, { status: 400 });
    }

    const formData = await request.formData();
    const action = formData.get("action");

    try {
        switch (action) {
            case "verify":
                const verifyResult = await verifyLote(request, loteId);
                return json({
                    success: true,
                    message: verifyResult.data.message || "Lote verificado exitosamente"
                }, { headers: verifyResult.headers });

            case "reject":
                const reason = formData.get("reason") as string || "Sin razón especificada";
                const rejectResult = await rejectLote(request, loteId, reason);
                return json({
                    success: true,
                    message: rejectResult.data.message || "Lote rechazado"
                }, { headers: rejectResult.headers });

            case "archive":
                const archiveResult = await archiveLote(request, loteId);
                return json({
                    success: true,
                    message: archiveResult.data.message || "Lote archivado"
                }, { headers: archiveResult.headers });

            case "reactivate":
                const reactivateResult = await reactivateLote(request, loteId);
                return json({
                    success: true,
                    message: reactivateResult.data.message || "Lote reactivado"
                }, { headers: reactivateResult.headers });

            default:
                return json({ success: false, message: "Acción no válida" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in lote action:", error);
        return json({
            success: false,
            message: error instanceof Error ? error.message : "Error al procesar la acción"
        }, { status: 500 });
    }
}

export default function LoteDetailsPage() {
    const { lote, owner } = useLoaderData<typeof loader>();
    const navigate = useNavigate();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active':
                return 'Activo';
            case 'pending':
                return 'Pendiente';
            case 'archived':
                return 'Archivado';
            default:
                return status || 'Desconocido';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/admin/lotes" className="text-blue-600 hover:text-blue-800">
                    ← Volver a Lotes
                </Link>
                <h1 className="text-2xl font-bold">Detalles del Lote</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información principal */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Información Básica</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <div className="mt-1 text-lg">{lote.nombre}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CBML</label>
                                <div className="mt-1 text-lg font-mono">{lote.cbml}</div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                                <div className="mt-1 text-lg">{lote.direccion}</div>
                            </div>
                            {lote.area && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Área (m²)</label>
                                    <div className="mt-1 text-lg">{lote.area.toLocaleString()}</div>
                                </div>
                            )}
                            {lote.matricula && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Matrícula</label>
                                    <div className="mt-1 text-lg">{lote.matricula}</div>
                                </div>
                            )}
                            {lote.codigo_catastral && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Código Catastral</label>
                                    <div className="mt-1 text-lg font-mono">{lote.codigo_catastral}</div>
                                </div>
                            )}
                            {lote.barrio && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Barrio</label>
                                    <div className="mt-1 text-lg">{lote.barrio}</div>
                                </div>
                            )}
                            {lote.estrato && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Estrato</label>
                                    <div className="mt-1 text-lg">{lote.estrato}</div>
                                </div>
                            )}
                            {lote.descripcion && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                    <div className="mt-1 text-lg">{lote.descripcion}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Información POT */}
                    {(lote.tratamiento_pot || lote.uso_suelo || lote.clasificacion_suelo) && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Información POT</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {lote.tratamiento_pot && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tratamiento POT</label>
                                        <div className="mt-1 text-lg">{lote.tratamiento_pot}</div>
                                    </div>
                                )}
                                {lote.uso_suelo && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Uso de Suelo</label>
                                        <div className="mt-1 text-lg">{lote.uso_suelo}</div>
                                    </div>
                                )}
                                {lote.clasificacion_suelo && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Clasificación de Suelo</label>
                                        <div className="mt-1 text-lg">{lote.clasificacion_suelo}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Coordenadas */}
                    {(lote.latitud || lote.longitud) && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Ubicación</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {lote.latitud && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Latitud</label>
                                        <div className="mt-1 text-lg font-mono">{lote.latitud}</div>
                                    </div>
                                )}
                                {lote.longitud && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Longitud</label>
                                        <div className="mt-1 text-lg font-mono">{lote.longitud}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel lateral */}
                <div className="space-y-6">
                    {/* ✅ NUEVO: Componente de gestión de estado */}
                    <LoteStatusManager
                        lote={lote}
                        onSuccess={() => {
                            // Recargar la página para ver los cambios
                            navigate(".", { replace: true });
                        }}
                    />

                    {/* Estado y acciones */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Estado y Acciones</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Estado</label>
                                <div className="mt-1">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lote.status || 'pending')}`}>
                                        {getStatusLabel(lote.status || 'pending')}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-4 space-y-2">
                                <Link
                                    to={`/admin/lotes/${lote.id}/editar`}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 block text-center"
                                >
                                    Editar Lote
                                </Link>
                                <Link
                                    to="/admin/lotes"
                                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 block text-center"
                                >
                                    Volver a Lista
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Información del propietario */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Propietario</h2>
                        {owner ? (
                            <div className="space-y-4">
                                {/* Avatar y nombre */}
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0 h-12 w-12">
                                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                            <span className="text-lg font-medium text-gray-700">
                                                {(owner.full_name || owner.first_name || owner.email)?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {owner.full_name || `${owner.first_name} ${owner.last_name}` || owner.email}
                                        </h3>
                                        <p className="text-sm text-gray-500">{owner.role === 'owner' ? 'Propietario' : 'Usuario'}</p>
                                    </div>
                                </div>

                                {/* Información de contacto */}
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <div className="mt-1 text-sm text-gray-900">{owner.email}</div>
                                    </div>

                                    {owner.phone && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                            <div className="mt-1 text-sm text-gray-900">{owner.phone}</div>
                                        </div>
                                    )}

                                    {owner.company && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Empresa</label>
                                            <div className="mt-1 text-sm text-gray-900">{owner.company}</div>
                                        </div>
                                    )}

                                    {owner.username && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Username</label>
                                            <div className="mt-1 text-sm text-gray-900">{owner.username}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Estados del usuario */}
                                <div className="flex space-x-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${owner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {owner.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${owner.is_verified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {owner.is_verified ? 'Verificado' : 'Sin verificar'}
                                    </span>
                                </div>

                                {/* Botones de acción */}
                                <div className="pt-4 space-y-2">
                                    <Link
                                        to={`/admin/usuario/${owner.id}`}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center block text-sm"
                                    >
                                        Ver perfil completo
                                    </Link>
                                    <Link
                                        to={`/admin/usuarios/${owner.id}/editar`}
                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-center block text-sm"
                                    >
                                        Editar usuario
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="flex justify-center mb-3">
                                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm">Sin propietario asignado</p>
                                <p className="text-gray-400 text-xs mt-1">Este lote no tiene un propietario asignado</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
