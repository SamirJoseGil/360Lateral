import { useEffect } from "react";

/**
 * Tipos de eventos soportados
 */
export type EventType = 'view' | 'search' | 'action' | 'api' | 'error' | 'other';

/**
 * Interfaz para datos del evento
 */
interface EventData {
    type: EventType;
    name: string;
    value?: Record<string, any>;
}

/**
 * Hook para registrar un evento estadístico
 * @param eventData Datos del evento a registrar
 */
export function useRecordEvent(eventData: EventData, dependencies: any[] = []) {
    useEffect(() => {
        // Registrar evento cuando el componente se monte o las dependencias cambien
        console.log(`[useRecordEvent] Registrando evento ${eventData.type} - ${eventData.name}`);

        fetch('/api/stats/record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...eventData,
                value: {
                    ...eventData.value,
                    timestamp: new Date().toISOString(),
                    client_time: Date.now()
                }
            }),
        }).catch(error => console.error(`[useRecordEvent] Error registrando evento ${eventData.name}:`, error));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}

/** 
 * Hook para registrar una vista de página
 * @param pageName Nombre de la página
 * @param additionalData Datos adicionales a incluir
 * @param dependencies Dependencias adicionales del useEffect (opcional)
 */
export function usePageView(pageName: string, additionalData?: Record<string, any>, dependencies: any[] = []) {
    useRecordEvent({
        type: 'view',
        name: pageName,
        value: typeof window !== "undefined"
            ? {
                pathname: window.location.pathname,
                search: window.location.search,
                ...additionalData
            }
            : {
                ...additionalData
            }
    }, dependencies);
}

/**
 * Función para registrar un evento de acción
 * @param actionName Nombre de la acción
 * @param data Datos adicionales
 */
export function recordAction(actionName: string, data: Record<string, any> = {}) {
    console.log(`[recordAction] Registrando acción ${actionName}`);

    return fetch('/api/stats/record', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'action',
            name: actionName,
            value: {
                timestamp: new Date().toISOString(),
                ...data
            }
        }),
    }).catch(error => {
        console.error(`[recordAction] Error registrando acción ${actionName}:`, error);
        return { ok: false, error };
    });
}