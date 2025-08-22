import React from 'react';
import { useAuthContext } from './AuthProvider';
import { AuditEvent } from '~/types/index'; // Añadido el import correcto

export default function AuditDebug() {
    const { lastAuditEvent, user } = useAuthContext();
    const [showDebug, setShowDebug] = React.useState(false);

    // Solo mostrar en desarrollo y para administradores
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={() => setShowDebug(!showDebug)}
                className="bg-gray-800 text-white px-3 py-1 rounded-md text-xs"
            >
                {showDebug ? 'Ocultar' : 'Mostrar'} Audit
            </button>

            {showDebug && lastAuditEvent && (
                <div className="mt-2 p-3 bg-gray-800 text-white rounded-md text-xs max-w-md overflow-auto">
                    <h4 className="font-bold mb-1">Último Evento de Auditoría:</h4>
                    <pre>{JSON.stringify(lastAuditEvent, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
