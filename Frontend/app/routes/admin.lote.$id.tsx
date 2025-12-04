import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getLoteById, verifyLote, rejectLote, archiveLote, reactivateLote } from "~/services/lotes.server";
import { getUserById } from "~/services/users.server";
import LoteStatusManager from "~/components/admin/LoteStatusManager";
import { MapView } from "~/components/MapView";

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
                    {/* ✅ SECCIÓN 1: Información Básica */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Información Básica
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Lote</label>
                                <div className="mt-1 text-lg font-semibold">{lote.nombre}</div>
                            </div>

                            {/* ✅ Matrícula Inmobiliaria */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula Inmobiliaria</label>
                                <div className="mt-1 text-lg font-mono">
                                    {lote.matricula ? (
                                        <span className="text-gray-900">{lote.matricula}</span>
                                    ) : (
                                        <span className="text-gray-400 italic">No especificada</span>
                                    )}
                                </div>
                            </div>

                            {/* ✅ Ciudad */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                <div className="mt-1 text-lg">
                                    {lote.ciudad ? (
                                        <span className="text-gray-900">{lote.ciudad}</span>
                                    ) : (
                                        <span className="text-gray-400 italic">No especificada</span>
                                    )}
                                </div>
                            </div>

                            {/* ✅ Dirección */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección de Ubicación
                                </label>
                                <div className="mt-1 text-lg flex items-start gap-2">
                                    <svg className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-gray-900">{lote.direccion}</span>
                                </div>
                            </div>

                            {/* ✅ Área */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Área del Lote</label>
                                <div className="mt-1 text-lg">
                                    {lote.area ? (
                                        <span className="font-semibold text-blue-600">
                                            {lote.area.toLocaleString('es-CO')} m²
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic">No especificada</span>
                                    )}
                                </div>
                            </div>

                            {/* CBML */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CBML</label>
                                <div className="mt-1 text-lg font-mono">
                                    {lote.cbml || <span className="text-gray-400 italic">No especificado</span>}
                                </div>
                            </div>

                            {/* Código Catastral */}
                            {lote.codigo_catastral && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Catastral</label>
                                    <div className="mt-1 text-lg font-mono">{lote.codigo_catastral}</div>
                                </div>
                            )}

                            {/* Barrio */}
                            {lote.barrio && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                                    <div className="mt-1 text-lg">{lote.barrio}</div>
                                </div>
                            )}

                            {/* Estrato */}
                            {lote.estrato && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estrato</label>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                            Estrato {lote.estrato}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Descripción */}
                            {lote.descripcion && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <div className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {lote.descripcion}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ SECCIÓN 2: Información Comercial */}
                    {(lote.valor || lote.forma_pago || lote.es_comisionista) && (
                        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Información Comercial
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ✅ Valor del Lote */}
                                {lote.valor && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Valor del Lote
                                        </label>
                                        <div className="mt-1 text-2xl font-bold text-green-600">
                                            {new Intl.NumberFormat('es-CO', {
                                                style: 'currency',
                                                currency: 'COP',
                                                minimumFractionDigits: 0
                                            }).format(lote.valor)}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ Forma de Pago */}
                                {lote.forma_pago && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Forma de Pago
                                        </label>
                                        <div className="mt-1 text-lg font-semibold text-blue-900">
                                            {lote.forma_pago === 'contado' ? '💵 De Contado' :
                                             lote.forma_pago === 'financiado' ? '🏦 Financiado' :
                                             lote.forma_pago === 'permuta' ? '🔄 Permuta' :
                                             lote.forma_pago === 'mixto' ? '🔀 Mixto' : lote.forma_pago}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ Comisionista y Carta de Autorización */}
                                {lote.es_comisionista && (
                                    <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-yellow-900 mb-2">
                                                    Tipo de Registro
                                                </label>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                                                        👤 Registrado por Comisionista
                                                    </span>
                                                </div>
                                                
                                                {/* ✅ Carta de Autorización */}
                                                <div className="mt-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Carta de Autorización
                                                    </label>
                                                    {lote.carta_autorizacion ? (
                                                        <a
                                                            href={lote.carta_autorizacion}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-50 transition-colors duration-200 font-medium"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span>Descargar Carta de Autorización</span>
                                                        </a>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            <span className="font-medium">⚠️ No se ha adjuntado carta de autorización</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ✅ SECCIÓN 3: Información POT */}
                    {(lote.tratamiento_pot || lote.uso_suelo || lote.clasificacion_suelo) && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Plan de Ordenamiento Territorial (POT)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {lote.tratamiento_pot && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento POT</label>
                                        <div className="mt-1 text-lg">{lote.tratamiento_pot}</div>
                                    </div>
                                )}
                                {lote.uso_suelo && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Uso de Suelo</label>
                                        <div className="mt-1 text-lg">{lote.uso_suelo}</div>
                                    </div>
                                )}
                                {lote.clasificacion_suelo && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Clasificación de Suelo</label>
                                        <div className="mt-1 text-lg">{lote.clasificacion_suelo}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ✅ NUEVA SECCIÓN: Ubicación */}
                    {(lote.latitud && lote.longitud) && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Ubicación
                            </h2>
                            <MapView
                                latitud={lote.latitud}
                                longitud={lote.longitud}
                                direccion={lote.direccion}
                                nombre={lote.nombre}
                                height="300px"
                            />
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
