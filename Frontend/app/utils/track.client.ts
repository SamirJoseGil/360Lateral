import { useCallback } from 'react';
import { useNavigate, useSubmit } from '@remix-run/react';

/**
 * Hook personalizado para rastrear eventos en el cliente
 * Permite enviar eventos de estadísticas a la API fácilmente desde componentes React
 */
export function useTrackEvent() {
  const submit = useSubmit();
  const navigate = useNavigate();
  
  /**
   * Registra un evento de estadísticas
   * @param type Tipo de evento (view, search, action, api, error, other)
   * @param name Nombre descriptivo del evento
   * @param value Datos adicionales relacionados con el evento (opcional)
   */
  const trackEvent = useCallback(
    async (
      type: 'view' | 'search' | 'action' | 'api' | 'error' | 'other',
      name: string,
      value?: Record<string, any>
    ) => {
      if (typeof window === 'undefined') return;
      
      try {
        // Enviar evento a la API
        const response = await fetch('/api/stats/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, name, value }),
        });
        
        // Manejar cualquier cookie de sesión devuelta
        if (response.ok) {
          const result = await response.json();
          return result;
        }
      } catch (error) {
        // Fallos silenciosos para evitar interrumpir la experiencia del usuario
        console.error(`Error tracking ${type} event:`, error);
      }
    },
    [submit, navigate]
  );
  
  /**
   * Rastreadores para tipos específicos de eventos
   */
  const trackView = useCallback(
    (name: string, value?: Record<string, any>) => trackEvent('view', name, value),
    [trackEvent]
  );
  
  const trackSearch = useCallback(
    (name: string, value?: Record<string, any>) => trackEvent('search', name, value),
    [trackEvent]
  );
  
  const trackAction = useCallback(
    (name: string, value?: Record<string, any>) => trackEvent('action', name, value),
    [trackEvent]
  );
  
  const trackError = useCallback(
    (name: string, value?: Record<string, any>) => trackEvent('error', name, value),
    [trackEvent]
  );
  
  return {
    trackEvent,
    trackView,
    trackSearch,
    trackAction,
    trackError,
  };
}
