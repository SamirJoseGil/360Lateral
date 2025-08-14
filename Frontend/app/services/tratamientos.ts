export interface TratamientoInfo {
  descripcion: string;
  indice_ocupacion: number;
  indice_construccion: number;
  altura_maxima: number;
}

export interface TratamientosResponse {
  tratamientos: Record<string, TratamientoInfo>;
  total: number;
  error?: string;
}

export interface AprovechamientoRequest {
  tratamiento: string;
  area_lote: number;
  tipologia?: string;
}

export interface AprovechamientoResponse {
  tratamiento_nombre: string;
  tratamiento_valido: boolean;
  area_lote: number;
  tipologia: string;
  parametros_normativos: {
    indice_ocupacion: number;
    indice_construccion: number;
    altura_maxima: number;
    area_minima_lote: number;
  };
  calculos_aprovechamiento: {
    area_ocupacion_maxima: number;
    area_construccion_maxima: number;
    numero_pisos_maximo: number;
    unidades_estimadas: number;
    cumple_area_minima: boolean;
  };
  retiros: {
    frontal: number;
    lateral: number;
    posterior: number;
  };
  error?: string;
}

export interface TipologiaViable {
  tipologia: string;
  area_minima_requerida: number;
  frente_minimo_requerido: number;
  cumple_requisitos: boolean;
  aprovechamiento: {
    area_ocupacion_maxima: number;
    area_construccion_maxima: number;
    numero_pisos_maximo: number;
    unidades_estimadas: number;
  };
}

export interface TipologiasViablesRequest {
  tratamiento: string;
  area_lote: number;
  frente_lote?: number;
}

export interface TipologiasViablesResponse {
  tratamiento_nombre: string;
  area_lote: number;
  frente_lote?: number;
  tipologias_viables: TipologiaViable[];
  total_tipologias_viables: number;
  error?: string;
}

export class TratamientosService {
  private apiUrl: string;

  constructor(apiUrl: string = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
  }

  async listarTratamientos(): Promise<TratamientosResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/lotes/tratamientos/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error listando tratamientos:', error);
      return {
        tratamientos: {},
        total: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async calcularAprovechamiento(request: AprovechamientoRequest): Promise<AprovechamientoResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/lotes/calcular-aprovechamiento/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calculando aprovechamiento:', error);
      return {
        tratamiento_nombre: request.tratamiento,
        tratamiento_valido: false,
        area_lote: request.area_lote,
        tipologia: request.tipologia || 'multifamiliar',
        parametros_normativos: {
          indice_ocupacion: 0,
          indice_construccion: 0,
          altura_maxima: 0,
          area_minima_lote: 0
        },
        calculos_aprovechamiento: {
          area_ocupacion_maxima: 0,
          area_construccion_maxima: 0,
          numero_pisos_maximo: 0,
          unidades_estimadas: 0,
          cumple_area_minima: false
        },
        retiros: {
          frontal: 0,
          lateral: 0,
          posterior: 0
        },
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async obtenerTipologiasViables(request: TipologiasViablesRequest): Promise<TipologiasViablesResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/lotes/tipologias-viables/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo tipologías viables:', error);
      return {
        tratamiento_nombre: request.tratamiento,
        area_lote: request.area_lote,
        frente_lote: request.frente_lote,
        tipologias_viables: [],
        total_tipologias_viables: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
