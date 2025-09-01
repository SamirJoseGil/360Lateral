import { createContext, useContext, useEffect } from "react";
import { useLocation, useMatches } from "@remix-run/react";

// Tipo para los eventos de estadísticas
type EventType = 'view' | 'search' | 'action' | 'api' | 'error' | 'other';

// Contexto para el rastreador de estadísticas
type StatsContextType = {
    recordEvent: (type: EventType, name: string, value?: Record<string, any>) => void;
    sessionId: string;
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

// Hook personalizado para usar el contexto de estadísticas
export function useStats() {
    const context = useContext(StatsContext);
    if (context === undefined) {
        throw new Error('useStats debe ser usado dentro de un StatsProvider');
    }
    return context;
}

// Función para enviar el evento al servidor
async function sendEventToServer(data: any) {
    try {
        // Usamos fetch directamente ya que esto se ejecuta en el cliente
        await fetch('/api/stats/record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error('Error al enviar evento estadístico:', error);
    }
}

// Componente proveedor de contexto para estadísticas
export function StatsProvider({
    children,
    sessionId = ''
}: {
    children: React.ReactNode;
    sessionId?: string;
}) {
    const location = useLocation();
    const matches = useMatches();

    // Obtener o generar un sessionId
    const actualSessionId = sessionId || getOrCreateSessionId();

    // Función para registrar un evento
    const recordEvent = (type: EventType, name: string, value: Record<string, any> = {}) => {
        const eventData = {
            type,
            name,
            value,
            session_id: actualSessionId,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        // Enviarlo al servidor
        sendEventToServer(eventData);
    };

    // Registrar automáticamente eventos de visualización de página
    useEffect(() => {
        // Encontrar el ID de la ruta y su handle para obtener información sobre la página
        const routeId = matches[matches.length - 1]?.id || '';
        const routeHandle = matches[matches.length - 1]?.handle || {};

        // Crear un nombre descriptivo para la página
        let pageName = routeId;
        if ((routeHandle as any).pageName) {
            pageName = (routeHandle as any).pageName;
        }

        // Registrar evento de visualización
        recordEvent('view', `page_view_${pageName}`, {
            path: location.pathname,
            search: location.search,
            referrer: document.referrer
        });

    }, [location.pathname, location.search]);

    return (
        <StatsContext.Provider value={{ recordEvent, sessionId: actualSessionId }}>
            {children}
        </StatsContext.Provider>
    );
}

// Función para obtener o crear un sessionId
function getOrCreateSessionId(): string {
    // Buscar sessionId en las cookies
    const cookies = document.cookie.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('l360_session_id='));

    if (sessionCookie) {
        return sessionCookie.split('=')[1];
    }

    // Si no existe, crear uno nuevo
    const newSessionId = `s_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Guardar en cookie (expira en 30 días)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `l360_session_id=${newSessionId};expires=${expires.toUTCString()};path=/;SameSite=Lax`;

    return newSessionId;
}
