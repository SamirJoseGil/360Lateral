import { useFetcher } from "@remix-run/react";
import { useState } from "react";
import type { Lote } from "~/services/lotes.server";

type LoteStatusManagerProps = {
    lote: Lote;
    onSuccess?: () => void;
};

export default function LoteStatusManager({ lote, onSuccess }: LoteStatusManagerProps) {
    const fetcher = useFetcher();
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        type: 'verify' | 'archive' | 'reactivate';
        label: string;
    } | null>(null);

    const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

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
            const formData = new FormData();
            formData.append("action", pendingAction.type);
            formData.append("loteId", lote.id?.toString() || "");

            fetcher.submit(formData, { method: "post" });

            setShowConfirmModal(false);
            setPendingAction(null);

            if (onSuccess) {
                setTimeout(onSuccess, 1000);
            }
        }
    };

    const confirmReject = () => {
        if (!rejectReason.trim()) {
            alert("Por favor, proporciona una razón para el rechazo");
            return;
        }

        const formData = new FormData();
        formData.append("action", "reject");
        formData.append("loteId", lote.id?.toString() || "");
        formData.append("reason", rejectReason);

        fetcher.submit(formData, { method: "post" });

        setShowRejectModal(false);
        setRejectReason("");

        if (onSuccess) {
            setTimeout(onSuccess, 1000);
        }
    };

    const getStatusInfo = () => {
        if (lote.is_verified) {
            return {
                color: 'green',
                icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                ),
                label: 'Verificado',
                description: lote.verified_at ? `Verificado el ${new Date(lote.verified_at).toLocaleDateString()}` : 'Verificado'
            };
        }

        switch (lote.status || lote.estado) {
            case 'active':
                return {
                    color: 'blue',
                    icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                    ),
                    label: 'Activo',
                    description: 'Lote activo sin verificar'
                };
            case 'pending':
                return {
                    color: 'yellow',
                    icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    ),
                    label: 'Pendiente de Revisión',
                    description: 'Requiere verificación administrativa'
                };
            case 'rejected':
                return {
                    color: 'red',
                    icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    ),
                    label: 'Rechazado',
                    description: lote.rejection_reason || 'Lote rechazado'
                };
            case 'archived':
                return {
                    color: 'gray',
                    icon: (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    ),
                    label: 'Archivado',
                    description: 'Lote archivado'
                };
            default:
                return {
                    color: 'gray',
                    icon: null,
                    label: 'Estado Desconocido',
                    description: ''
                };
        }
    };

    const statusInfo = getStatusInfo();

    const getAvailableActions = () => {
        const actions = [];

        if (lote.status === 'pending' || (!lote.is_verified && lote.status !== 'rejected')) {
            actions.push({
                type: 'verify' as const,
                label: 'Verificar',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                color: 'green'
            });

            actions.push({
                type: 'reject' as const,
                label: 'Rechazar',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                color: 'red'
            });
        }

        if (lote.status === 'active' || lote.is_verified) {
            actions.push({
                type: 'archive' as const,
                label: 'Archivar',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                ),
                color: 'yellow'
            });
        }

        if (lote.status === 'archived' || lote.status === 'rejected') {
            actions.push({
                type: 'reactivate' as const,
                label: 'Reactivar',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                ),
                color: 'blue'
            });
        }

        return actions;
    };

    const actions = getAvailableActions();

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Estado y Verificación</h3>

            {/* Estado actual */}
            <div className={`flex items-start space-x-3 p-4 rounded-lg bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 mb-4`}>
                <div className={`flex-shrink-0 text-${statusInfo.color}-600`}>
                    {statusInfo.icon}
                </div>
                <div className="flex-1">
                    <h4 className={`font-medium text-${statusInfo.color}-900`}>
                        {statusInfo.label}
                    </h4>
                    <p className={`text-sm text-${statusInfo.color}-700 mt-1`}>
                        {statusInfo.description}
                    </p>
                </div>
            </div>

            {/* Información de verificación */}
            {lote.verified_by && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                        Verificado por: <span className="font-medium">Admin #{lote.verified_by}</span>
                    </p>
                    {lote.verified_at && (
                        <p className="text-xs text-gray-500 mt-1">
                            {new Date(lote.verified_at).toLocaleString()}
                        </p>
                    )}
                </div>
            )}

            {/* Razón de rechazo */}
            {lote.rejection_reason && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900 mb-1">Razón del rechazo:</p>
                    <p className="text-sm text-red-700">{lote.rejection_reason}</p>
                </div>
            )}

            {/* Mensaje de éxito */}
            {fetcher.data && typeof fetcher.data === "object" && "success" in fetcher.data && (fetcher.data as any).success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">{(fetcher.data as any).message}</p>
                </div>
            )}

            {/* Acciones disponibles */}
            {actions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-3">Acciones disponibles:</p>
                    {actions.map((action) => (
                        <button
                            key={action.type}
                            onClick={() => handleAction(action.type, action.label)}
                            disabled={isSubmitting}
                            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                ${action.color === 'green' ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' : ''}
                                ${action.color === 'red' ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' : ''}
                                ${action.color === 'yellow' ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100' : ''}
                                ${action.color === 'blue' ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' : ''}
                            `}
                        >
                            {action.icon}
                            <span className="font-medium">{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

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
                                ¿Estás seguro de que quieres {pendingAction.label.toLowerCase()} el lote{' '}
                                <span className="font-medium">{lote.nombre}</span>?
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setPendingAction(null);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                            <h3 className="text-lg font-medium text-gray-900">
                                Rechazar Lote
                            </h3>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-gray-600 mb-4">
                                Por favor, proporciona una razón para rechazar el lote{' '}
                                <span className="font-medium">{lote.nombre}</span>:
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                rows={4}
                                placeholder="Especifica el motivo del rechazo..."
                            />
                        </div>
                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason("");
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={isSubmitting || !rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Procesando...' : 'Rechazar Lote'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
