// filepath: c:\Users\samir\Documents\GitHub\360Lateral\Frontend\app\services\common.server.ts
import { fetchWithAuth } from "~/utils/auth.server";

const API_URL = process.env.API_URL || "http://localhost:8000";

// Tipos para el módulo Common
export type HealthCheckResponse = {
  status: "healthy" | "unhealthy" | "warning";
  timestamp: string;
  services?: {
    database: {
      status: "healthy" | "unhealthy";
      message: string;
    };
    cache?: {
      status: "healthy" | "unhealthy";
      message: string;
    };
  };
  system?: {
    memory: {
      total: number;
      available: number;
      percent: number;
      status: "healthy" | "warning" | "unhealthy";
    };
  };
  response_time_ms?: number;
};

export type SimpleHealthCheckResponse = {
  status: "healthy" | "unhealthy";
  service: string;
  message: string;
};

export type DatabaseHealthResponse = {
  database: {
    status: "healthy" | "unhealthy";
    message: string;
  };
  timestamp: string;
};

export type CacheHealthResponse = {
  cache: {
    status: "healthy" | "unhealthy";
    message: string;
  };
  timestamp: string;
};

export type VersionInfoResponse = {
  version: string;
  django_version: string;
  python_version: string;
  apps: string[];
  environment: string;
};

export type SystemStatusResponse = {
  database: string;
  cache: string;
  middleware: string;
  apps_loaded: number;
  debug_mode: boolean;
  environment: string;
};

export type CorsDebugResponse = {
  success: boolean;
  message: string;
  cors_config: {
    CORS_ALLOW_ALL_ORIGINS: boolean;
    CORS_ALLOW_CREDENTIALS: boolean;
    CORS_ALLOWED_ORIGINS: string[];
    REQUEST_ORIGIN: string;
    IS_ORIGIN_ALLOWED: boolean;
    CSRF_COOKIE_SECURE: boolean;
    SESSION_COOKIE_SECURE: boolean;
    CSRF_TRUSTED_ORIGINS: string[];
  };
  auth_header?: string;
  csrf_token?: string;
  cors_headers: {
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Credentials": string;
  };
  cookies: Record<string, string>;
};

/**
 * 🔍 Health Check Completo del Sistema
 */
export async function getSystemHealth(request?: Request): Promise<{ health: HealthCheckResponse; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/common/health/`;
    
    console.log(`[Common] Fetching system health from: ${endpoint}`);
    
    // No usar fetchWithAuth ya que es un endpoint público
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Common] Error fetching system health:`, response.status, response.statusText);
      
      // Si el health check falla, devolver estado unhealthy
      const health: HealthCheckResponse = {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: "unhealthy",
            message: `Health check endpoint returned ${response.status}`
          }
        }
      };
      
      return {
        health,
        headers: new Headers()
      };
    }
    
    const health = await response.json();
    console.log(`[Common] System health status: ${health.status}`);
    
    return { 
      health, 
      headers: new Headers() 
    };
  } catch (error) {
    console.error("[Common] Error in getSystemHealth:", error);
    
    // En caso de error, devolver estado unhealthy
    const health: HealthCheckResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: "unhealthy",
          message: `Network error: ${(error as Error).message}`
        }
      }
    };
    
    return {
      health,
      headers: new Headers()
    };
  }
}

/**
 * 🚀 Health Check Simple para Load Balancers
 */
export async function getSimpleHealth(): Promise<{ health: SimpleHealthCheckResponse; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/common/health/simple/`;
    
    console.log(`[Common] Fetching simple health from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Common] Error fetching simple health:`, response.status, response.statusText);
      
      const health: SimpleHealthCheckResponse = {
        status: "unhealthy",
        service: "lateral360-backend",
        message: `Service unavailable (${response.status})`
      };
      
      return {
        health,
        headers: new Headers()
      };
    }
    
    const health = await response.json();
    console.log(`[Common] Simple health status: ${health.status}`);
    
    return { 
      health, 
      headers: new Headers() 
    };
  } catch (error) {
    console.error("[Common] Error in getSimpleHealth:", error);
    
    const health: SimpleHealthCheckResponse = {
      status: "unhealthy",
      service: "lateral360-backend",
      message: `Network error: ${(error as Error).message}`
    };
    
    return {
      health,
      headers: new Headers()
    };
  }
}

/**
 * 🗃️ Health Check de Base de Datos
 */
export async function getDatabaseHealth(): Promise<{ health: DatabaseHealthResponse; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/common/health/database/`;
    
    console.log(`[Common] Fetching database health from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Common] Error fetching database health:`, response.status, response.statusText);
      
      const health: DatabaseHealthResponse = {
        database: {
          status: "unhealthy",
          message: `Database health check failed (${response.status})`
        },
        timestamp: new Date().toISOString()
      };
      
      return {
        health,
        headers: new Headers()
      };
    }
    
    const health = await response.json();
    console.log(`[Common] Database health status: ${health.database.status}`);
    
    return { 
      health, 
      headers: new Headers() 
    };
  } catch (error) {
    console.error("[Common] Error in getDatabaseHealth:", error);
    
    const health: DatabaseHealthResponse = {
      database: {
        status: "unhealthy",
        message: `Network error: ${(error as Error).message}`
      },
      timestamp: new Date().toISOString()
    };
    
    return {
      health,
      headers: new Headers()
    };
  }
}

/**
 * 🔄 Health Check de Cache
 */
export async function getCacheHealth(): Promise<{ health: CacheHealthResponse; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/common/health/cache/`;
    
    console.log(`[Common] Fetching cache health from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Common] Error fetching cache health:`, response.status, response.statusText);
      
      const health: CacheHealthResponse = {
        cache: {
          status: "unhealthy",
          message: `Cache health check failed (${response.status})`
        },
        timestamp: new Date().toISOString()
      };
      
      return {
        health,
        headers: new Headers()
      };
    }
    
    const health = await response.json();
    console.log(`[Common] Cache health status: ${health.cache.status}`);
    
    return { 
      health, 
      headers: new Headers() 
    };
  } catch (error) {
    console.error("[Common] Error in getCacheHealth:", error);
    
    const health: CacheHealthResponse = {
      cache: {
        status: "unhealthy",
        message: `Network error: ${(error as Error).message}`
      },
      timestamp: new Date().toISOString()
    };
    
    return {
      health,
      headers: new Headers()
    };
  }
}

/**
 * 📋 Información de Versión del Sistema
 */
export async function getVersionInfo(): Promise<{ version: VersionInfoResponse; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/common/version/`;
    
    console.log(`[Common] Fetching version info from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Common] Error fetching version info:`, response.status, response.statusText);
      throw new Error(`Version info unavailable: ${response.status} ${response.statusText}`);
    }
    
    const version = await response.json();
    console.log(`[Common] Version info retrieved: ${version.version}`);
    
    return { 
      version, 
      headers: new Headers() 
    };
  } catch (error) {
    console.error("[Common] Error in getVersionInfo:", error);
    throw error;
  }
}

/**
 * 🔧 Status del Sistema
 */
export async function getSystemStatus(): Promise<{ status: SystemStatusResponse; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/common/status/`;
    
    console.log(`[Common] Fetching system status from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`[Common] Error fetching system status:`, response.status, response.statusText);
      throw new Error(`System status unavailable: ${response.status} ${response.statusText}`);
    }
    
    const status = await response.json();
    console.log(`[Common] System status retrieved: DB ${status.database}, Cache ${status.cache}`);
    
    return { 
      status, 
      headers: new Headers() 
    };
  } catch (error) {
    console.error("[Common] Error in getSystemStatus:", error);
    throw error;
  }
}

/**
 * 🌐 CORS Debug Information
 */
export async function getCorsDebugInfo(request: Request): Promise<{ debug: CorsDebugResponse; headers: Headers }> {
  try {
    const endpoint = `${API_URL}/api/common/cors-debug/`;
    
    console.log(`[Common] Fetching CORS debug info from: ${endpoint}`);
    
    // Enviar headers del request original para debug
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Añadir Origin header si está presente
    const origin = request.headers.get('Origin');
    if (origin) {
      headers['Origin'] = origin;
    }
    
    // Añadir Authorization header si está presente
    const auth = request.headers.get('Authorization');
    if (auth) {
      headers['Authorization'] = auth;
    }
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      console.error(`[Common] Error fetching CORS debug:`, response.status, response.statusText);
      throw new Error(`CORS debug unavailable: ${response.status} ${response.statusText}`);
    }
    
    const debug = await response.json();
    console.log(`[Common] CORS debug info retrieved`);
    
    return { 
      debug, 
      headers: new Headers() 
    };
  } catch (error) {
    console.error("[Common] Error in getCorsDebugInfo:", error);
    throw error;
  }
}

/**
 * 🔍 Health Check Comprehensivo para Dashboard
 */
export async function getComprehensiveHealth(request?: Request): Promise<{
  systemHealth: HealthCheckResponse;
  databaseHealth: DatabaseHealthResponse;
  cacheHealth: CacheHealthResponse;
  versionInfo: VersionInfoResponse;
  systemStatus: SystemStatusResponse;
  headers: Headers;
}> {
  try {
    console.log(`[Common] Fetching comprehensive health check`);
    
    // Ejecutar todos los health checks en paralelo
    const [
      systemResponse,
      databaseResponse,
      cacheResponse,
      versionResponse,
      statusResponse
    ] = await Promise.allSettled([
      getSystemHealth(request),
      getDatabaseHealth(),
      getCacheHealth(),
      getVersionInfo(),
      getSystemStatus()
    ]);
    
    // Extraer resultados, usando valores por defecto en caso de error
    const systemHealth = systemResponse.status === 'fulfilled' 
      ? systemResponse.value.health 
      : {
          status: "unhealthy" as const,
          timestamp: new Date().toISOString(),
          services: {
            database: {
              status: "unhealthy" as const,
              message: "System health check failed"
            }
          }
        };
    
    const databaseHealth = databaseResponse.status === 'fulfilled'
      ? databaseResponse.value.health
      : {
          database: {
            status: "unhealthy" as const,
            message: "Database health check failed"
          },
          timestamp: new Date().toISOString()
        };
    
    const cacheHealth = cacheResponse.status === 'fulfilled'
      ? cacheResponse.value.health
      : {
          cache: {
            status: "unhealthy" as const,
            message: "Cache health check failed"
          },
          timestamp: new Date().toISOString()
        };
    
    const versionInfo = versionResponse.status === 'fulfilled'
      ? versionResponse.value.version
      : {
          version: "unknown",
          django_version: "unknown",
          python_version: "unknown",
          apps: [],
          environment: "unknown"
        };
    
    const systemStatus = statusResponse.status === 'fulfilled'
      ? statusResponse.value.status
      : {
          database: "unknown",
          cache: "unknown",
          middleware: "unknown",
          apps_loaded: 0,
          debug_mode: false,
          environment: "unknown"
        };
    
    console.log(`[Common] Comprehensive health check completed`);
    
    return {
      systemHealth,
      databaseHealth,
      cacheHealth,
      versionInfo,
      systemStatus,
      headers: new Headers()
    };
  } catch (error) {
    console.error("[Common] Error in getComprehensiveHealth:", error);
    throw error;
  }
}