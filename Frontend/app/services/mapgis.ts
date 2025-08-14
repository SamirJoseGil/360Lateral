export interface ScrapResult {
  success?: boolean;
  error?: boolean;
  mensaje: string;
  detalle?: string;
  data?: {
    matricula?: string;
    encontrado: boolean;
    datos: {
      direccion?: string;
      barrio?: string;
      comuna?: string;
      estrato?: number;
      area_terreno?: number;
      area_construida?: number;
      uso_suelo?: string;
      coordenadas_x?: number;
      coordenadas_y?: number;
      zona?: string;
      clasificacion_suelo?: string;
      matricula?: string;
      cbml?: string;
      mapgis_response?: any;
      // Nuevos campos para aprovechamiento
      area_lote_m2?: number;
      aprovechamiento_urbano?: {
        tratamiento?: string;
        densidad_habitacional_max?: number;
        altura_normativa?: string;
      };
    };
    fuente: string;
    timestamp: string;
    raw_html_content?: string;
    raw_response_length?: number;
    html_analysis?: {
      es_pagina_principal?: boolean;
      endpoints_consulta?: string[];
    };
    error_estrategia?: string;
    content_type?: string;
  };
  _debug?: {
    endpoint?: string;
    payload?: any;
    status?: number;
    statusText?: string;
    timestamp?: string;
    error?: string;
    detalle?: string;
    requestTime?: number;
  };
}

export interface ConsultaMapGIS {
  id: string;
  titulo: string;
  descripcion: string;
  endpoint: string;
  datos?: any;
  loading: boolean;
  error?: string;
  timestamp?: string;
  requestTime?: number;
}

export type TipoBusqueda = 'cbml' | 'matricula' | 'direccion';

export class MapGISService {
  private apiUrl: string;

  constructor(apiUrl: string = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
  }

  private getEndpoint(tipoBusqueda: TipoBusqueda): string {
    switch (tipoBusqueda) {
      case 'matricula':
        return `${this.apiUrl}/api/lotes/scrap/matricula/`;
      case 'direccion':
        return `${this.apiUrl}/api/lotes/scrap/direccion/`;
      case 'cbml':
        return `${this.apiUrl}/api/lotes/scrap/cbml/`;
      default:
        throw new Error('Tipo de búsqueda inválido');
    }
  }

  private buildPayload(tipoBusqueda: TipoBusqueda, valor: string) {
    switch (tipoBusqueda) {
      case 'matricula':
        return { matricula: valor.trim() };
      case 'direccion':
        return { direccion: valor.trim() };
      case 'cbml':
        return { cbml: valor.trim() };
      default:
        throw new Error('Tipo de búsqueda inválido');
    }
  }

  validateInput(tipoBusqueda: TipoBusqueda, valor: string): { valid: boolean; error?: string; ejemplo?: string } {
    if (!valor?.trim()) {
      return { 
        valid: false, 
        error: 'El valor de búsqueda es requerido' 
      };
    }

    switch (tipoBusqueda) {
      case 'cbml':
        if (!valor.match(/^\d+$/) || valor.length < 10) {
          return {
            valid: false,
            error: 'El CBML debe ser un código numérico de al menos 10 dígitos',
            ejemplo: '14180230004'
          };
        }
        break;
      case 'matricula':
        if (valor.length < 5) {
          return {
            valid: false,
            error: 'La matrícula debe tener al menos 5 caracteres',
            ejemplo: '01N-1234567'
          };
        }
        break;
      case 'direccion':
        if (valor.length < 10) {
          return {
            valid: false,
            error: 'La dirección debe ser más específica (mínimo 10 caracteres)',
            ejemplo: 'Calle 10 # 20-30, El Poblado'
          };
        }
        break;
    }

    return { valid: true };
  }

  async buscarPredio(tipoBusqueda: TipoBusqueda, valor: string): Promise<ScrapResult> {
    const validation = this.validateInput(tipoBusqueda, valor);
    if (!validation.valid) {
      return {
        error: true,
        mensaje: validation.error!,
        detalle: validation.ejemplo ? `Ejemplo: ${validation.ejemplo}` : undefined,
        _debug: {
          timestamp: new Date().toISOString(),
          error: 'validation_failed'
        }
      };
    }

    try {
      const endpoint = this.getEndpoint(tipoBusqueda);
      const payload = this.buildPayload(tipoBusqueda, valor);

      const fetchStartTime = Date.now();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const fetchEndTime = Date.now();
      const responseText = await response.text();
      
      let result: ScrapResult;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        return {
          error: true,
          mensaje: 'Error en la respuesta del servidor: formato inválido',
          detalle: 'La respuesta no es JSON válido',
          _debug: {
            endpoint,
            payload,
            status: response.status,
            statusText: response.statusText,
            error: parseError instanceof Error ? parseError.message : String(parseError),
            timestamp: new Date().toISOString(),
            requestTime: fetchEndTime - fetchStartTime
          }
        };
      }

      if (!response.ok) {
        return {
          error: true,
          mensaje: `Error del servidor: ${response.status} ${response.statusText}`,
          detalle: result?.mensaje || result?.detalle || 'Error desconocido del servidor',
          _debug: {
            endpoint,
            payload,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            requestTime: fetchEndTime - fetchStartTime
          }
        };
      }
      
      result._debug = {
        endpoint,
        payload,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
        requestTime: fetchEndTime - fetchStartTime
      };

      return result;
      
    } catch (error) {
      let errorMessage = 'Error de conexión con el servidor';
      let errorDetail = '';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Error de red: No se pudo conectar al servidor';
        errorDetail = 'Verifica que el backend esté ejecutándose en http://localhost:8000';
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetail = error.stack || '';
      }
      
      return {
        error: true,
        mensaje: errorMessage,
        detalle: errorDetail,
        _debug: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async probarConexionReal(): Promise<any> {
    const response = await fetch(`${this.apiUrl}/api/lotes/test/real-connection/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }

  async investigarEndpoints(): Promise<any> {
    const response = await fetch(`${this.apiUrl}/api/lotes/investigate/endpoints/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }

  async probarConsultaCompleta(cbml: string = '14180230004'): Promise<any> {
    const response = await fetch(`${this.apiUrl}/api/lotes/test/complete-data/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cbml })
    });
    return await response.json();
  }

  getConsultasMapGISInitial(): ConsultaMapGIS[] {
    return [
      {
        id: 'area_lote',
        titulo: '📐 Área del Lote',
        descripcion: 'Consulta SQL_CONSULTA_LOTE para obtener el área exacta del terreno',
        endpoint: '/site_consulta_pot/consultas.hyg?consulta=SQL_CONSULTA_LOTE',
        loading: false
      },
      {
        id: 'clasificacion_suelo',
        titulo: '🏗️ Clasificación del Suelo',
        descripcion: 'Consulta SQL_CONSULTA_CLASIFICACIONSUELO para determinar si es urbano/rural',
        endpoint: '/site_consulta_pot/consultas.hyg?consulta=SQL_CONSULTA_CLASIFICACIONSUELO',
        loading: false
      },
      {
        id: 'usos_generales',
        titulo: '🏘️ Usos Generales del Suelo',
        descripcion: 'Consulta SQL_CONSULTA_USOSGENERALES para categorías y subcategorías de uso',
        endpoint: '/site_consulta_pot/consultas.hyg?consulta=SQL_CONSULTA_USOSGENERALES',
        loading: false
      },
      {
        id: 'aprovechamiento_urbano',
        titulo: '🏢 Aprovechamiento Urbano',
        descripcion: 'Consulta SQL_CONSULTA_APROVECHAMIENTOSURBANOS para tratamientos y densidades',
        endpoint: '/site_consulta_pot/consultas.hyg?consulta=SQL_CONSULTA_APROVECHAMIENTOSURBANOS',
        loading: false
      },
      {
        id: 'restriccion_amenaza',
        titulo: '⚠️ Restricción por Amenaza y Riesgo',
        descripcion: 'Consulta SQL_CONSULTA_RESTRICCIONAMENAZARIESGO para condiciones de riesgo y RNM',
        endpoint: '/site_consulta_pot/consultas.hyg?consulta=SQL_CONSULTA_RESTRICCIONAMENAZARIESGO',
        loading: false
      },
      {
        id: 'restriccion_rios',
        titulo: '🌊 Restricción por Retiros a Ríos y Quebradas',
        descripcion: 'Consulta SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS para retiros obligatorios',
        endpoint: '/site_consulta_pot/consultas.hyg?consulta=SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS',
        loading: false
      }
    ];
  }
}
