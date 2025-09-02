import React, { createContext, useContext, useEffect } from 'react';
import { useLocation, useMatches } from '@remix-run/react';

// Context for stats tracking
type StatsContextType = {
    trackEvent: (eventType: string, eventName: string, eventValue?: any) => void;
    sessionId: string;
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

// Provider component
export function StatsProvider({
    children,
    sessionId = 'unknown-session'
}: {
    children: React.ReactNode;
    sessionId: string;
}) {
    const location = useLocation();
    const matches = useMatches();

    // Track page view when location changes
    useEffect(() => {
        trackPageView(location.pathname);
    }, [location]);

    // Function to track events
    const trackEvent = async (eventType: string, eventName: string, eventValue?: any) => {
        try {
            // Map event type to our standard types
            const mappedType = mapEventType(eventType);

            // Send to server endpoint
            await fetch('/api/stats/record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: mappedType,
                    name: eventName,
                    value: eventValue || {},
                    session_id: sessionId
                }),
            });
        } catch (error) {
            // Fail silently in production, log in development
            if (process.env.NODE_ENV !== 'production') {
                console.error('Error tracking event:', error);
            }
        }
    };

    // Track page view
    const trackPageView = (path: string) => {
        trackEvent('view', `page_view`, { path });
    };

    // Map event types to standard types
    const mapEventType = (type: string): string => {
        const typeMap: Record<string, string> = {
            'view': 'view',
            'click': 'action',
            'search': 'search',
            'error': 'error',
            'submit': 'action',
            'success': 'action',
            'failure': 'error'
        };

        return typeMap[type.toLowerCase()] || 'other';
    };

    return (
        <StatsContext.Provider value={{ trackEvent, sessionId }}>
            {children}
        </StatsContext.Provider>
    );
}

// Hook for using stats
export function useStats() {
    const context = useContext(StatsContext);
    if (context === undefined) {
        throw new Error('useStats must be used within a StatsProvider');
    }
    return context;
}
// (Removed duplicate and erroneous return/provider code)

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
