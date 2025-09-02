/**
 * Utilidad para enviar eventos de estadísticas desde el lado del cliente
 */

/**
 * Tipos de eventos soportados
 */
type EventType = 'view' | 'search' | 'action' | 'api' | 'error' | 'other';

/**
 * Interfaz para datos del evento
 */
interface EventData {
  type: EventType;
  name: string;
  value?: Record<string, any>;
  session_id?: string;
}

/**
 * Envía un evento de estadísticas al servidor
 * @param eventData Datos del evento a registrar
 */
export async function trackEvent(eventData: EventData): Promise<boolean> {
  try {
    console.log(`[Stats Client] Enviando evento: ${eventData.type} - ${eventData.name}`);
    
    const response = await fetch('/api/stats/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      console.error(`[Stats Client] Error al enviar evento: ${response.status}`);
      return false;
    }
    
    console.log('[Stats Client] Evento registrado correctamente');
    return true;
  } catch (error) {
    console.error('[Stats Client] Error inesperado:', error);
    return false;
  }
}

/**
 * Registra un evento de vista de página
 * @param pageName Nombre de la página
 * @param data Datos adicionales
 */
export function trackPageView(pageName: string, data: Record<string, any> = {}): void {
  trackEvent({
    type: 'view',
    name: pageName,
    value: {
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      ...data
    }
  }).catch(err => console.error('Error tracking page view:', err));
}

/**
 * Registra un evento de acción del usuario
 * @param actionName Nombre de la acción
 * @param data Datos adicionales
 */
export function trackAction(actionName: string, data: Record<string, any> = {}): void {
  trackEvent({
    type: 'action',
    name: actionName,
    value: {
      timestamp: new Date().toISOString(),
      ...data
    }
  }).catch(err => console.error('Error tracking action:', err));
}

/**
 * Registra un evento de error
 * @param errorName Nombre del error
 * @param data Datos adicionales
 */
export function trackError(errorName: string, data: Record<string, any> = {}): void {
  trackEvent({
    type: 'error',
    name: errorName,
    value: {
      timestamp: new Date().toISOString(),
      ...data
    }
  }).catch(err => console.error('Error tracking error event:', err));
}