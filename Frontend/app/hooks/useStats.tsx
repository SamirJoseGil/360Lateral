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