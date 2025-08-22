import React, { useState, useEffect } from 'react';
import { AuditEvent } from '~/types/index'; // Actualizado para importar desde types/index
import { useAuthContext } from './AuthProvider';

export default function AuditLog() {
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
    const { isAuthenticated, user } = useAuthContext();
    const [showLog, setShowLog] = useState(false);

    // Solo cargar eventos si el usuario es admin
    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin' && showLog) {
            try {
                const storedEvents = localStorage.getItem('audit_events');
                if (storedEvents) {
                    setAuditEvents(JSON.parse(storedEvents));
                }
            } catch (error) {
                console.error('Error loading audit events', error);
            }
        }
    }, [isAuthenticated, user, showLog]);

    // Si no es admin, no mostrar nada
    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="mt-8">
            <button
                onClick={() => setShowLog(!showLog)}
                className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
                {showLog ? 'Ocultar' : 'Mostrar'} Log de Auditoría
            </button>

            {showLog && (
                <div className="overflow-x-auto">
                    <h3 className="text-lg font-semibold mb-2">Eventos de Auditoría</h3>

                    {auditEvents.length === 0 ? (
                        <p className="text-gray-500">No hay eventos registrados.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acción
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Detalles
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {auditEvents.map((event, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {event.action}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {event.user_email || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {event.details ? JSON.stringify(event.details) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
