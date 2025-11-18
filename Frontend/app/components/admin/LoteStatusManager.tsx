import { useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";

interface Lote {
    id: string;
    nombre: string;
    status: string;
    is_verified: boolean;
    rejection_reason?: string;
    rejected_at?: string;
    rejected_by?: string;
}

interface LoteStatusManagerProps {
    lote: Lote;
    onSuccess?: () => void;
}

export default function LoteStatusManager({ lote, onSuccess }: LoteStatusManagerProps) {
    const fetcher = useFetcher();
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [pendingAction, setPendingAction] = useState<{
        type: 'verify' | 'archive' | 'reactivate';
        label: string;
    } | null>(null);

    const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

    // ✅ CRÍTICO: Detectar cuando la acción se completó exitosamente
    useEffect(() => {
        if (fetcher.data?.success && !isSubmitting) {
            console.log("✅ Action completed successfully:", fetcher.data.message);
            
            // Cerrar modales
            setShowRejectModal(false);
            setShowConfirmModal(false);
            setPendingAction(null);
            setRejectReason("");
            
            // Callback de éxito
            if (onSuccess) {
                // Pequeño delay para que el servidor actualice
                setTimeout(() => {
                    onSuccess();
                }, 500);
            }
        }
    }, [fetcher.data, isSubmitting, onSuccess]);

    const handleAction = (action: 'verify' | 'reject' | 'archive' | 'reactivate', label: string) => {
        if (action === 'reject') {
            setShowRejectModal(true);
        } else {
            setPendingAction({ type: action, label });
            setShowConfirmModal(true);
        }
    };

    const confirmAction = () => {
        if (pendingAction) {
            console.log(`🔄 Submitting ${pendingAction.type} action for lote ${lote.id}`);
            
            const formData = new FormData();
            formData.append("_action", pendingAction.type);
            formData.append("loteId", lote.id);
            
            // ✅ CRÍTICO: Usar fetcher.submit con method POST
            fetcher.submit(formData, {
                method: "post"
            });
        }
    };

    const confirmReject = () => {
        if (!rejectReason.trim()) {
            alert("Debes proporcionar una razón para el rechazo");
            return;
        }

        console.log(`🔄 Submitting reject action for lote ${lote.id}: ${rejectReason}`);
        
        const formData = new FormData();
        formData.append("_action", "reject");
        formData.append("loteId", lote.id);
        formData.append("reason", rejectReason.trim());
        
        // ✅ CRÍTICO: Usar fetcher.submit con method POST
        fetcher.submit(formData, {
            method: "post"
        });
    };

    // ✅ Determinar qué botones mostrar según el estado actual
    const getAvailableActions = () => {
        const actions: Array<{
            type: 'verify' | 'reject' | 'archive' | 'reactivate';
            label: string;
            color: string;
            icon: JSX.Element;
        }> = [];

        // Estado: PENDING
        if (lote.status === 'pending') {
            actions.push({
                type: 'verify',
                label: 'Verificar y Activar',
                color: 'bg-green-600 hover:bg-green-700',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )
            });

            actions.push({
                type: 'reject',
                label: 'Rechazar',
                color: 'bg-red-600 hover:bg-red-700',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                )
            });
        }

        // Estado: ACTIVE y VERIFICADO
        if (lote.status === 'active' && lote.is_verified) {
            actions.push({
                type: 'reject',
                label: 'Rechazar',
                color: 'bg-red-600 hover:bg-red-700',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                )
            });

            actions.push({
                type: 'archive',
                label: 'Archivar',
                color: 'bg-yellow-600 hover:bg-yellow-700',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                        <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                )
            });
        }

        // Estado: REJECTED o ARCHIVED
        if (lote.status === 'rejected' || lote.status === 'archived') {
            actions.push({
                type: 'reactivate',
                label: 'Reactivar',
                color: 'bg-blue-600 hover:bg-blue-700',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                )
            });
        }

        return actions;
    };

    const availableActions = getAvailableActions();

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Gestión de Estado
            </h3>

            {/* Estado actual */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Estado Actual:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lote.status === 'active' && lote.is_verified
                            ? 'bg-green-100 text-green-800'
                            : lote.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : lote.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}>
                        {lote.status === 'active' && lote.is_verified ? 'Verificado' :
                         lote.status === 'pending' ? 'Pendiente' :
                         lote.status === 'rejected' ? 'Rechazado' :
                         lote.status === 'archived' ? 'Archivado' : lote.status}
                    </span>
                </div>

                {/* Mostrar razón de rechazo si existe */}
                {lote.status === 'rejected' && lote.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                        <p className="text-xs font-medium text-red-800 mb-1">Razón del rechazo:</p>
                        <p className="text-sm text-red-700">{lote.rejection_reason}</p>
                        {lote.rejected_at && (
                            <p className="text-xs text-red-600 mt-2">
                                {new Date(lote.rejected_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Mensaje de éxito/error */}
            {fetcher.data?.success && (
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                    <p className="text-sm text-green-700">{fetcher.data.message}</p>
                </div>
            )}

            {fetcher.data?.success === false && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                    <p className="text-sm text-red-700">{fetcher.data.error || 'Error al procesar la acción'}</p>
                </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
                {availableActions.length > 0 ? (
                    availableActions.map((action) => (
                        <button
                            key={action.type}
                            onClick={() => handleAction(action.type, action.label)}
                            disabled={isSubmitting}
                            className={`w-full ${action.color} text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors`}
                        >
                            {action.icon}
                            <span>{isSubmitting ? 'Procesando...' : action.label}</span>
                        </button>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No hay acciones disponibles para este estado
                    </p>
                )}
            </div>

            {/* Modal de confirmación general */}
            {showConfirmModal && pendingAction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                Confirmar {pendingAction.label}
                            </h3>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-600">
                                ¿Estás seguro de que quieres{' '}
                                <span className="font-medium">
                                    {pendingAction.label.toLowerCase()}
                                </span>{' '}
                                el lote <span className="font-medium">{lote.nombre}</span>?
                            </p>
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setPendingAction(null);
                                }}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Procesando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de rechazo */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Rechazar Lote</h3>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-gray-600 mb-4">
                                ¿Estás seguro de que quieres rechazar el lote{' '}
                                <span className="font-medium">{lote.nombre}</span>?
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Razón del rechazo: *
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    rows={3}
                                    placeholder="Especifica por qué se rechaza este lote..."
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason("");
                                }}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={isSubmitting || !rejectReason.trim()}
                                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Procesando...' : 'Confirmar Rechazo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
