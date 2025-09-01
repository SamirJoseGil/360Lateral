/**
 * Utilidades para el tracking de eventos en el cliente
 */

// Función para enviar eventos al endpoint de estadísticas
export async function trackEvent(
  type: 'view' | 'search' | 'action' | 'api' | 'error' | 'other',
  name: string,
  value: Record<string, any> = {}
) {
  try {
    // No interrumpimos el flujo de la aplicación si falla el tracking
    await fetch('/api/stats/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        name,
        value,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer
      }),
    });
    return true;
  } catch (error) {
    console.error('Error tracking event:', error);
    return false;
  }
}

// Función para registrar vistas de página
export function trackPageView(pageName: string, additionalData: Record<string, any> = {}) {
  return trackEvent('view', pageName, {
    ...additionalData,
    path: window.location.pathname,
    search: window.location.search
  });
}

// Función para registrar búsquedas
export function trackSearch(searchTerm: string, filters: Record<string, any> = {}, resultsCount?: number) {
  return trackEvent('search', 'user_search', {
    query: searchTerm,
    filters,
    results_count: resultsCount
  });
}

// Función para registrar acciones de usuario
export function trackAction(actionName: string, data: Record<string, any> = {}) {
  return trackEvent('action', actionName, data);
}

// Función para registrar errores
export function trackError(errorName: string, errorDetails: Record<string, any> = {}) {
  return trackEvent('error', errorName, {
    ...errorDetails,
    user_agent: navigator.userAgent
  });
}
