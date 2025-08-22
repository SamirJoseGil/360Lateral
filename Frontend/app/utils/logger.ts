/**
 * Sistema de logging centralizado para depuración
 * Muestra registros en la consola con colores y timestamp
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace';

interface LogOptions {
  component?: string;
  data?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private debugEnabled = true;
  private readonly PREFIX = '🔍 [360Lateral]';
  
  // Colores para los diferentes niveles de log
  private readonly COLORS = {
    debug: '#7986cb', // azul claro
    info: '#4caf50',  // verde
    warn: '#ff9800',  // naranja
    error: '#f44336', // rojo
    trace: '#9c27b0', // morado
  };

  private constructor() {
    // Siempre habilitar logs en desarrollo
    this.debugEnabled = process.env.NODE_ENV !== 'production';
    
    // También podemos permitir que se habilite manualmente en producción
    if (typeof window !== 'undefined' && window.localStorage) {
      if (window.localStorage.getItem('debug_enabled') === 'true') {
        this.debugEnabled = true;
      }
    }
    
    this.info('Logger', 'Sistema de logging inicializado', { debugEnabled: this.debugEnabled });
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Método para generar el timestamp
  private getTimestamp(): string {
    return new Date().toISOString().substring(11, 23);
  }
  
  // Método base para todos los tipos de log
  private log(level: LogLevel, component: string, message: string, options?: LogOptions): void {
    if (!this.debugEnabled && level === 'debug') return;
    
    const timestamp = this.getTimestamp();
    const color = this.COLORS[level];
    const componentStr = component ? `[${component}]` : '';
    const prefix = `%c${this.PREFIX} ${timestamp} ${level.toUpperCase()} ${componentStr}`;
    
    // Formatear datos adicionales si existen
    let dataStr = '';
    if (options?.data) {
      try {
        dataStr = JSON.stringify(options.data);
      } catch (e) {
        dataStr = '[Datos no serializables]';
      }
    }
    
    // Imprimir el log con estilo
    console[level === 'trace' ? 'debug' : level](
      `${prefix}: ${message} ${dataStr}`,
      `color: ${color}; font-weight: bold;`,
    );

    // Para errores también mostrar stack trace
    if (level === 'error' && options?.data?.error instanceof Error) {
      console.error(options.data.error);
    }
  }

  debug(component: string, message: string, data?: Record<string, any>): void {
    this.log('debug', component, message, { data });
  }

  info(component: string, message: string, data?: Record<string, any>): void {
    this.log('info', component, message, { data });
  }

  warn(component: string, message: string, data?: Record<string, any>): void {
    this.log('warn', component, message, { data });
  }

  error(component: string, message: string, data?: Record<string, any>): void {
    this.log('error', component, message, { data });
  }

  trace(component: string, message: string, data?: Record<string, any>): void {
    this.log('trace', component, message, { data });
  }
  
  // Logs específicos para navegación y ciclo de vida
  navigation(from: string, to: string, data?: Record<string, any>): void {
    this.info('Navigation', `${from} → ${to}`, data);
  }
  
  lifecycle(component: string, stage: string, data?: Record<string, any>): void {
    this.debug('Lifecycle', `${component} [${stage}]`, data);
  }
  
  auth(action: string, status: string, data?: Record<string, any>): void {
    this.info('Auth', `${action} ${status}`, data);
  }
  
  // Método para habilitar o deshabilitar logging
  setDebugEnabled(enabled: boolean): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('debug_enabled', String(enabled));
    }
    this.debugEnabled = enabled;
    this.info('Logger', `Logging ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  // Generar un grupo con timestamp para logs relacionados
  group(name: string): void {
    if (!this.debugEnabled) return;
    console.group(`%c${this.PREFIX} ${this.getTimestamp()} GROUP: ${name}`, 'color: #2196f3; font-weight: bold;');
  }
  
  groupEnd(): void {
    if (!this.debugEnabled) return;
    console.groupEnd();
  }
}

// Exportar singleton
export const logger = Logger.getInstance();

// Función para ayudar a depurar redirecciones
export function traceNavigation(): void {
  if (typeof window !== 'undefined') {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(state, title, url) {
      logger.navigation('pushState', url?.toString() || 'unknown', { state });
      return originalPushState.apply(this, [state, title, url]);
    };
    
    window.history.replaceState = function(state, title, url) {
      logger.navigation('replaceState', url?.toString() || 'unknown', { state });
      return originalReplaceState.apply(this, [state, title, url]);
    };
    
    logger.info('Navigation', 'Navigation tracing enabled');
  }
}
