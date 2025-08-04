export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    database: {
      status: string;
      message: string;
    };
    redis: {
      status: string;
      message: string;
    };
  };
  system: {
    memory: {
      total: number;
      available: number;
      percent: number;
      status: string;
    };
    disk: {
      total: number;
      free: number;
      percent: number;
      status: string;
    };
  };
  response_time_ms: number;
}

export interface SimpleHealthResponse {
  status: string;
  message: string;
}