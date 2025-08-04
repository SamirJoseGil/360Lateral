import { HealthCheckResponse, SimpleHealthResponse } from "~/types/healthCheck";


const API_BASE_URL = 'http://127.0.0.1:8000/api';

export class HealthCheckService {
  static async getHealthStatus(): Promise<HealthCheckResponse> {
    const response = await fetch(`${API_BASE_URL}/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }

  static async getSimpleHealthStatus(): Promise<SimpleHealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health/simple/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Simple health check failed: ${response.status}`);
    }

    return response.json();
  }

  static async checkBackendConnection(): Promise<boolean> {
    try {
      await this.getSimpleHealthStatus();
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }
}