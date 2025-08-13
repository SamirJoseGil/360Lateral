import { useState } from 'react';
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useNavigation, useLoaderData } from '@remix-run/react';

// Tipos para los datos
interface ScrapResult {
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
      mapgis_response?: any; // Agregado para permitir mostrar la respuesta raw
      // Puedes agregar otros campos dinámicos aquí si es necesario
    };
    fuente: string;
    timestamp: string;
    raw_html_content?: string; // Agregado para mostrar el HTML raw
    raw_response_length?: number; // Agregado para mostrar la longitud del HTML
    html_analysis?: {
      es_pagina_principal?: boolean;
      endpoints_consulta?: string[];
    }; // Agregado para permitir mostrar el análisis HTML
    error_estrategia?: string; // Agregado para mostrar error de estrategia si existe
    content_type?: string; // Agregado para mostrar el tipo de contenido si existe
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

// Loader para datos iniciales
export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    apiUrl: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
  });
}

// Action para manejar el scraping
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Clonar el request para evitar el error "body stream already read"
    const formData = await request.formData();
    const tipoBusqueda = formData.get('tipoBusqueda') as string;
    const valor = formData.get('valor') as string;
    
    console.log('Action called with:', { tipoBusqueda, valor });
    
    if (!valor?.trim()) {
      return json({ 
        error: true, 
        mensaje: 'El valor de búsqueda es requerido',
        _debug: {
          timestamp: new Date().toISOString(),
          tipoBusqueda,
          valor
        }
      });
    }

    // Validaciones específicas por tipo
    if (tipoBusqueda === 'cbml' && (!valor.match(/^\d+$/) || valor.length < 10)) {
      return json({
        error: true,
        mensaje: 'El CBML debe ser un código numérico de al menos 10 dígitos',
        ejemplo: '14180230004',
        _debug: {
          timestamp: new Date().toISOString(),
          tipoBusqueda,
          valor,
          validacion: 'cbml_format_invalid'
        }
      });
    }

    if (tipoBusqueda === 'matricula' && valor.length < 5) {
      return json({
        error: true,
        mensaje: 'La matrícula debe tener al menos 5 caracteres',
        ejemplo: '01N-1234567',
        _debug: {
          timestamp: new Date().toISOString(),
          tipoBusqueda,
          valor,
          validacion: 'matricula_too_short'
        }
      });
    }

    if (tipoBusqueda === 'direccion' && valor.length < 10) {
      return json({
        error: true,
        mensaje: 'La dirección debe ser más específica (mínimo 10 caracteres)',
        ejemplo: 'Calle 10 # 20-30, El Poblado',
        _debug: {
          timestamp: new Date().toISOString(),
          tipoBusqueda,
          valor,
          validacion: 'direccion_too_short'
        }
      });
    }

    const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
    let endpoint = '';
    let payload = {};

    switch (tipoBusqueda) {
      case 'matricula':
        endpoint = `${apiUrl}/api/lotes/scrap/matricula/`;
        payload = { matricula: valor.trim() };
        break;
      case 'direccion':
        endpoint = `${apiUrl}/api/lotes/scrap/direccion/`;
        payload = { direccion: valor.trim() };
        break;
      case 'cbml':
        endpoint = `${apiUrl}/api/lotes/scrap/cbml/`;
        payload = { cbml: valor.trim() };
        break;
      default:
        return json({ 
          error: true, 
          mensaje: 'Tipo de búsqueda inválido',
          _debug: {
            timestamp: new Date().toISOString(),
            tipoBusqueda,
            valor,
            validacion: 'invalid_search_type'
          }
        });
    }

    console.log(`Llamando endpoint: ${endpoint}`, payload);

    // Hacer la petición al backend
    const fetchStartTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Sin autenticación temporalmente para testing
      },
      body: JSON.stringify(payload),
    });

    const fetchEndTime = Date.now();
    const responseText = await response.text();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return json({
        error: true,
        mensaje: 'Error en la respuesta del servidor: formato inválido',
        detalle: 'La respuesta no es JSON válido',
        _debug: {
          endpoint,
          payload,
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 500), // Primeros 500 caracteres
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          timestamp: new Date().toISOString(),
          requestTime: fetchEndTime - fetchStartTime
        }
      });
    }

    // Verificar si el response tiene error HTTP
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return json({
        error: true,
        mensaje: `Error del servidor: ${response.status} ${response.statusText}`,
        detalle: result?.mensaje || result?.detalle || 'Error desconocido del servidor',
        _debug: {
          endpoint,
          payload,
          status: response.status,
          statusText: response.statusText,
          serverResponse: result,
          timestamp: new Date().toISOString(),
          requestTime: fetchEndTime - fetchStartTime
        }
      });
    }
    
    // Agregar información de debug a la respuesta exitosa
    result._debug = {
      endpoint,
      payload,
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString(),
      requestTime: fetchEndTime - fetchStartTime
    };

    console.log('Resultado exitoso:', result);
    return json(result);
    
  } catch (error) {
    console.error('Error en acción de scraping:', error);
    
    // Distinguir entre diferentes tipos de errores
    let errorMessage = 'Error de conexión con el servidor';
    let errorDetail = '';
    
    if (error instanceof TypeError) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Error de red: No se pudo conectar al servidor';
        errorDetail = 'Verifica que el backend esté ejecutándose en http://localhost:8000';
      } else {
        errorMessage = 'Error de tipo: ' + error.message;
        errorDetail = error.stack || '';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorDetail = error.stack || '';
    }
    
    return json({
      error: true,
      mensaje: errorMessage,
      detalle: errorDetail,
      _debug: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Agregar nuevos tipos para las consultas específicas
interface ConsultaMapGIS {
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

export default function ScrapInfo() {
  const { apiUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<ScrapResult>();
  const navigation = useNavigation();
  const [tipoBusqueda, setTipoBusqueda] = useState('cbml');
  
  // Estado para las consultas específicas de MapGIS
  const [consultasMapGIS, setConsultasMapGIS] = useState<ConsultaMapGIS[]>([
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
  ]);

  const isLoading = navigation.state === 'submitting';
  const isIdle = navigation.state === 'idle';

  const getPlaceholder = () => {
    switch (tipoBusqueda) {
      case 'matricula':
        return 'Ej: 01N-0123456';
      case 'direccion':
        return 'Ej: Calle 10 # 20-30, El Poblado';
      case 'cbml':
        return 'Ej: 14180230004'; // Usar el ejemplo real
      default:
        return '';
    }
  };

  const getLabel = () => {
    switch (tipoBusqueda) {
      case 'matricula':
        return 'Matrícula Inmobiliaria';
      case 'direccion':
        return 'Dirección';
      case 'cbml':
        return 'Código CBML';
      default:
        return 'Valor';
    }
  };

  const getHelpText = () => {
    switch (tipoBusqueda) {
      case 'matricula':
        return 'Formato: números, letras y guiones (ej: 01N-1234567)';
      case 'direccion':
        return 'Dirección completa con barrio/comuna';
      case 'cbml':
        return 'Código numérico de al menos 10 dígitos';
      default:
        return '';
    }
  };

  // Función para probar consulta completa y actualizar todas las cards
  const probarConsultaCompleta = async (cbml = '14180230004') => {
    try {
      // Activar loading en todas las cards
      setConsultasMapGIS(prev => prev.map(consulta => ({
        ...consulta,
        loading: true,
        error: undefined
      })));

      const startTime = Date.now();
      const response = await fetch(`${apiUrl}/api/lotes/test/complete-data/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cbml })
      });
      
      const result = await response.json();
      const endTime = Date.now();
      
      console.log('🧪 Resultado consulta completa:', result);
      
      // Actualizar cada card con los datos correspondientes
      setConsultasMapGIS(prev => prev.map(consulta => {
        const timestamp = new Date().toLocaleString();
        const requestTime = endTime - startTime;
        
        let datos = null;
        let error = undefined;
        
        if (result.test_successful && result.datos_extraidos) {
          // Declarar restriccionesAmbientales fuera del switch para evitar el error
          const restriccionesAmbientales = result.resultado_completo?.datos?.restricciones_ambientales;
          
          switch (consulta.id) {
            case 'area_lote':
              datos = {
                area_lote: result.datos_extraidos.area_lote,
                area_lote_m2: result.datos_extraidos.area_lote_m2,
                raw_data: result.resultado_completo?.datos?.area_lote
              };
              break;
            case 'clasificacion_suelo':
              datos = {
                clasificacion: result.datos_extraidos.clasificacion_suelo,
                raw_data: result.resultado_completo?.datos?.clasificacion_suelo
              };
              break;
            case 'usos_generales':
              datos = {
                uso_suelo: result.datos_extraidos.uso_suelo,
                raw_data: result.resultado_completo?.datos?.uso_suelo
              };
              break;
            case 'aprovechamiento_urbano':
              datos = {
                aprovechamiento: result.datos_extraidos.aprovechamiento_urbano,
                raw_data: result.resultado_completo?.datos?.aprovechamiento_urbano
              };
              break;
            case 'restriccion_amenaza':
              // Buscar datos de restricción por amenaza en la respuesta completa
              const amenazaData = restriccionesAmbientales?.amenaza_riesgo || result.datos_extraidos.restriccion_amenaza_riesgo;
              
              if (amenazaData) {
                datos = {
                  valor: amenazaData,
                  condiciones_riesgo: amenazaData,
                  nivel_amenaza: amenazaData.includes('Baja') ? 'Baja' : 
                                amenazaData.includes('Media') ? 'Media' : 
                                amenazaData.includes('Alta') ? 'Alta' : 'No determinado',
                  tiene_restriccion: !amenazaData.includes('Sin restricciones'),
                  raw_data: {
                    amenaza_riesgo: amenazaData,
                    fuente: 'MapGIS Medellín',
                    endpoint: 'SQL_CONSULTA_RESTRICCIONAMENAZARIESGO'
                  }
                };
              } else {
                datos = {
                  valor: 'No disponible',
                  condiciones_riesgo: 'No disponible',
                  nivel_amenaza: 'No determinado',
                  tiene_restriccion: false,
                  raw_data: result.resultado_completo
                };
              }
              break;
            case 'restriccion_rios':
              // Buscar datos de restricción por retiros en la respuesta completa
              const retirosData = restriccionesAmbientales?.retiros_rios || result.datos_extraidos.restriccion_rios_quebradas;
              
              if (retirosData) {
                datos = {
                  valor: retirosData,
                  restriccion_retiro: retirosData,
                  aplica_restriccion: !retirosData.includes('Sin restricciones'),
                  distancia_retiro_m: retirosData.includes('metros') ? 
                    parseInt(retirosData.match(/\d+/)?.[0] || '0') : null,
                  raw_data: {
                    retiros_rios: retirosData,
                    estructura_ecologica: restriccionesAmbientales?.estructura_ecologica,
                    fuente: 'MapGIS Medellín',
                    endpoint: 'SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS'
                  }
                };
              } else {
                datos = {
                  valor: 'No disponible',
                  restriccion_retiro: 'No disponible',
                  aplica_restriccion: false,
                  distancia_retiro_m: null,
                  raw_data: result.resultado_completo
                };
              }
              break;
          }
        } else {
          error = result.mensaje || 'Error en la consulta';
        }
        
        return {
          ...consulta,
          loading: false,
          datos,
          error,
          timestamp,
          requestTime
        };
      }));
      
    } catch (error) {
      console.error('Error en consulta completa:', error);
      
      // Marcar todas las cards con error
      setConsultasMapGIS(prev => prev.map(consulta => ({
        ...consulta,
        loading: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      })));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Scraping MapGIS Medellín
          </h1>
          <p className="text-gray-600">
            Extrae información completa de predios desde MapGIS usando múltiples consultas especializadas
          </p>
          
          {/* Indicador de estado de conexión */}
          <div className="mt-4 flex justify-center">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              isLoading 
                ? 'bg-yellow-100 text-yellow-800' 
                : isIdle && actionData 
                  ? actionData.error 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isLoading 
                  ? 'bg-yellow-500 animate-pulse' 
                  : isIdle && actionData 
                    ? actionData.error 
                      ? 'bg-red-500'
                      : 'bg-green-500'
                    : 'bg-blue-500'
              }`}></div>
              {isLoading 
                ? 'Procesando...' 
                : isIdle && actionData 
                  ? actionData.error 
                    ? 'Error en la consulta'
                    : 'Consulta exitosa'
                  : 'Listo para consultar'
              }
            </div>
          </div>
        </div>

        {/* Formulario de Búsqueda Original */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <Form method="post" className="space-y-6" replace>
            {/* Tipo de Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Búsqueda
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: 'cbml',
                    label: '🔢 CBML',
                    recommended: true
                  },
                  {
                    value: 'matricula',
                    label: '📄 Matrícula'
                  },
                  {
                    value: 'direccion',
                    label: '📍 Dirección'
                  }
                ].map((option) => (
                  <label key={option.value} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    tipoBusqueda === option.value 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="tipoBusqueda"
                      value={option.value}
                      checked={tipoBusqueda === option.value}
                      onChange={(e) => setTipoBusqueda(e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center w-full">
                      <div className="text-sm font-medium">{option.label}</div>
                      {option.recommended && (
                        <div className="text-xs text-blue-600 mt-1">Recomendado</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Campo de Búsqueda */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                {getLabel()}
              </label>
              <input
                type="text"
                name="valor"
                id="valor"
                placeholder={getPlaceholder()}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">{getHelpText()}</p>
            </div>

            {/* Botón de Búsqueda */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Extrayendo datos de MapGIS...
                </div>
              ) : (
                '🔍 Buscar en MapGIS'
              )}
            </button>
          </Form>
        </div>

        {/* Sección de Consultas Específicas de MapGIS */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              🧪 Consultas Específicas de MapGIS
            </h2>
            <button
              onClick={() => probarConsultaCompleta()}
              disabled={consultasMapGIS.some(c => c.loading)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {consultasMapGIS.some(c => c.loading) ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Consultando...
                </div>
              ) : (
                '🚀 Probar Todas las Consultas'
              )}
            </button>
          </div>

          {/* Grid de Cards de Consultas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {consultasMapGIS.map((consulta) => (
              <ConsultaCard key={consulta.id} consulta={consulta} />
            ))}
          </div>
        </div>

        {/* Resultados del formulario original */}
        {actionData && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Resultados de la Búsqueda Principal
            </h2>

            {/* Mensaje de Estado */}
            <div className={`p-4 rounded-lg mb-6 ${
              actionData.error 
                ? 'bg-red-50 border border-red-200' 
                : actionData.data?.encontrado 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-start">
                <div className={`flex-shrink-0 ${
                  actionData.error 
                    ? 'text-red-400' 
                    : actionData.data?.encontrado 
                      ? 'text-green-400'
                      : 'text-yellow-400'
                }`}>
                  {actionData.error ? '❌' : actionData.data?.encontrado ? '✅' : '⚠️'}
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${
                    actionData.error 
                      ? 'text-red-800' 
                      : actionData.data?.encontrado 
                        ? 'text-green-800'
                        : 'text-yellow-800'
                  }`}>
                    {actionData.mensaje}
                  </p>
                  {actionData.detalle && (
                    <p className={`text-sm mt-1 ${
                      actionData.error 
                        ? 'text-red-600' 
                        : actionData.data?.encontrado 
                          ? 'text-green-600'
                          : 'text-yellow-600'
                    }`}>
                      {actionData.detalle}
                    </p>
                  )}
                  {(actionData as any).ejemplo && (
                    <p className="text-sm mt-2 text-gray-600">
                      <strong>Ejemplo:</strong> {(actionData as any).ejemplo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Datos del Predio */}
            {actionData.data?.encontrado && actionData.data.datos && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    🏠 Información General
                  </h3>
                  
                  {actionData.data.datos.direccion && (
                    <InfoField label="Dirección" value={actionData.data.datos.direccion} />
                  )}
                  
                  {actionData.data.datos.barrio && (
                    <InfoField label="Barrio" value={actionData.data.datos.barrio} />
                  )}
                  
                  {actionData.data.datos.comuna && (
                    <InfoField label="Comuna" value={actionData.data.datos.comuna} />
                  )}
                  
                  {actionData.data.datos.estrato && (
                    <InfoField label="Estrato" value={actionData.data.datos.estrato.toString()} />
                  )}
                  
                  {actionData.data.datos.clasificacion_suelo && (
                    <InfoField label="Clasificación del Suelo" value={actionData.data.datos.clasificacion_suelo} />
                  )}
                  
                  {actionData.data.datos.matricula && (
                    <InfoField label="Matrícula" value={actionData.data.datos.matricula} />
                  )}
                  
                  {actionData.data.datos.cbml && (
                    <InfoField label="CBML" value={actionData.data.datos.cbml} />
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    📐 Información Técnica
                  </h3>
                  
                  {actionData.data.datos.area_terreno && (
                    <InfoField 
                      label="Área del Terreno" 
                      value={`${actionData.data.datos.area_terreno.toLocaleString()} m²`} 
                    />
                  )}
                  
                  {actionData.data.datos.area_construida && (
                    <InfoField 
                      label="Área Construida" 
                      value={`${actionData.data.datos.area_construida.toLocaleString()} m²`} 
                    />
                  )}
                  
                  {actionData.data.datos.uso_suelo && (
                    <InfoField label="Uso del Suelo" value={actionData.data.datos.uso_suelo} />
                  )}
                  
                  {actionData.data.datos.coordenadas_x && actionData.data.datos.coordenadas_y && (
                    <InfoField 
                      label="Coordenadas" 
                      value={`X: ${actionData.data.datos.coordenadas_x}, Y: ${actionData.data.datos.coordenadas_y}`} 
                    />
                  )}
                  
                  {/* Mostrar otros campos dinámicos de MapGIS */}
                  {Object.entries(actionData.data.datos).map(([key, value]) => {
                    // Excluir campos ya mostrados
                    const excludedFields = ['direccion', 'barrio', 'comuna', 'estrato', 'clasificacion_suelo', 'matricula', 'cbml', 'area_terreno', 'area_construida', 'uso_suelo', 'coordenadas_x', 'coordenadas_y'];
                    
                    if (!excludedFields.includes(key) && value) {
                      return (
                        <InfoField 
                          key={key}
                          label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                          value={String(value)} 
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Análisis de estructura MapGIS */}
            {actionData.data?.html_analysis && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  🔍 Análisis de Estructura MapGIS
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong>Tipo de página:</strong> {actionData.data.html_analysis.es_pagina_principal ? 'Página Principal' : 'Página de Datos'}
                  </div>
                  <div>
                    <strong>Endpoints encontrados:</strong> {actionData.data.html_analysis.endpoints_consulta?.length || 0}
                  </div>
                </div>
                
                {Array.isArray(actionData.data.html_analysis.endpoints_consulta) && actionData.data.html_analysis.endpoints_consulta.length > 0 && (
                  <div className="mt-2">
                    <strong className="text-yellow-700">Endpoints de consulta:</strong>
                    <ul className="list-disc list-inside text-xs text-yellow-600 mt-1">
                      {actionData.data.html_analysis.endpoints_consulta.map((endpoint: string, index: number) => (
                        <li key={index}>{endpoint}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {actionData.data.error_estrategia && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                    <strong>Error de estrategia:</strong> {actionData.data.error_estrategia}
                  </div>
                )}
              </div>
            )}

            {/* HTML Raw de MapGIS para análisis */}
            {actionData.data?.raw_html_content && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  🔍 HTML de MapGIS (Primeros 5000 caracteres)
                </h4>
                <div className="text-xs text-blue-700 mb-2">
                  Longitud total: {actionData.data.raw_response_length} caracteres | 
                  Tipo: {actionData.data.content_type} |
                  Página principal: {actionData.data.html_analysis?.es_pagina_principal ? 'Sí' : 'No'}
                </div>
                <textarea 
                  className="w-full h-64 p-2 text-xs font-mono bg-white border rounded"
                  readOnly
                  value={actionData.data.raw_html_content}
                />
                <div className="mt-2 text-xs text-blue-600">
                  💡 Este HTML nos ayuda a identificar que estamos recibiendo la página principal de MapGIS en lugar de los datos del predio.
                  Necesitamos encontrar el endpoint específico que devuelve JSON con los datos.
                </div>
              </div>
            )}

            {/* Respuesta Raw de MapGIS para análisis */}
            {actionData.data?.datos?.mapgis_response && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  🎯 Respuesta Original de MapGIS Medellín
                </h4>
                <pre className="text-xs overflow-auto max-h-40 text-black">
                  {JSON.stringify(actionData.data.datos.mapgis_response, null, 2)}
                </pre>
              </div>
            )}

            {/* Metadatos */}
            {actionData.data && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Fuente: {actionData.data.fuente}</span>
                  <span>Consultado: {new Date(actionData.data.timestamp).toLocaleString()}</span>
                </div>
                {actionData._debug?.requestTime && (
                  <div className="text-xs text-gray-400 mt-1">
                    Tiempo de respuesta: {actionData._debug.requestTime}ms
                  </div>
                )}
              </div>
            )}

            {/* JSON Raw (para debugging) */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                🔧 Ver datos raw (JSON)
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-96 text-black">
                {JSON.stringify(actionData, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Información de Debug */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Información de Debug</h3>
          <div className="text-xs text-blue-600 space-y-1">
            <p>API URL: {apiUrl}</p>
            <p>Estado de navegación: {navigation.state}</p>
            <p>CBML de prueba: 14180230004</p>
            
            {/* Mostrar información del tipo de datos */}
            {actionData && (actionData as any).real_data !== undefined && (
              <div className={`mt-2 p-3 rounded-lg border ${
                (actionData as any).real_data 
                  ? 'bg-green-100 border-green-300 text-green-800' 
                  : 'bg-yellow-100 border-yellow-300 text-yellow-800'
              }`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-2">
                    {(actionData as any).real_data ? '🎯' : '⚠️'}
                  </div>
                  <div>
                    <p className="font-medium">
                      {(actionData as any).real_data 
                        ? '✅ DATOS REALES extraídos de MapGIS Medellín' 
                        : '⚠️ Datos simulados (MapGIS no disponible o error)'
                      }
                    </p>
                    {(actionData as any).session_info && (
                      <p className="text-xs mt-1">
                        Sesión MapGIS: {(actionData as any).session_info.initialized ? 'Inicializada ✓' : 'No inicializada ✗'} | 
                        Cookies: {(actionData as any).session_info.cookies_count}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <p>Endpoints disponibles:</p>
            <ul className="ml-4 list-disc">
              <li>/api/lotes/scrap/matricula/</li>
              <li>/api/lotes/scrap/direccion/</li>
              <li>/api/lotes/scrap/cbml/</li>
              <li>/api/lotes/test/session/ (testing)</li>
              <li>/api/lotes/test/real-connection/ (test conexión real)</li>
              <li>/api/lotes/health/mapgis/ (health check)</li>
            </ul>
            
            {/* Botón para probar conexión real - Mejorado */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    const startTime = Date.now();
                    try {
                      const response = await fetch(`${apiUrl}/api/lotes/test/real-connection/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const result = await response.json();
                      const endTime = Date.now();
                      
                      const successMessage = result.test_successful 
                        ? `✅ CONEXIÓN EXITOSA con MapGIS!\n\n- Datos encontrados: ${result.found_data ? 'Sí' : 'No'}\n- Endpoint: ${result.working_endpoint || 'N/A'}\n- Tiempo: ${endTime - startTime}ms\n- Cookies: ${result.session_info?.cookies_count || 0}\n\nVer consola para detalles completos.`
                        : `❌ CONEXIÓN FALLÓ\n\n- Error: ${result.data?.mensaje || 'Desconocido'}\n- Tiempo: ${endTime - startTime}ms\n\nVer consola para detalles.`;
                      
                      alert(successMessage);
                      console.log('🧪 Test de conexión real completo:', result);
                    } catch (error) {
                      alert('💥 Error crítico al probar conexión real\nVer consola para detalles.');
                      console.error('💥 Error crítico:', error);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium"
                >
                  🧪 PROBAR CONEXIÓN MAPGIS
                </button>
                
                <button
                  onClick={async () => {
                    const startTime = Date.now();
                    try {
                      const response = await fetch(`${apiUrl}/api/lotes/investigate/endpoints/`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const result = await response.json();
                      const endTime = Date.now();
                      
                      const investigationMessage = result.investigation_complete 
                        ? `🔍 INVESTIGACIÓN COMPLETA\n\n- Sesión inicializada: ${result.session_initialized ? 'Sí' : 'No'}\n- Endpoint funcional: ${result.working_endpoint || 'Ninguno encontrado'}\n- Cookies: ${result.cookies_obtained || 0}\n- Tiempo: ${endTime - startTime}ms\n\nVer consola para detalles.`
                        : `❌ INVESTIGACIÓN FALLÓ\n\nVer consola para detalles.`;
                      
                      alert(investigationMessage);
                      console.log('🔍 Investigación de endpoints completa:', result);
                    } catch (error) {
                      alert('💥 Error en investigación de endpoints\nVer consola para detalles.');
                      console.error('💥 Error investigación:', error);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 font-medium"
                >
                  🔍 INVESTIGAR ENDPOINTS
                </button>
              </div>
              
              <p className="text-xs text-gray-500">
                Estos botones fuerzan conexiones reales con MapGIS para debugging y investigación
              </p>
            </div>

            {/* Debug de la última solicitud */}
            {actionData?._debug && (
              <details className="mt-4">
                <summary className="cursor-pointer text-blue-700 font-medium">🔧 Debug de la solicitud</summary>
                <pre className="mt-2 p-2 bg-blue-100 rounded text-xs overflow-auto">
                  {JSON.stringify(actionData._debug, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para mostrar información
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

// Componente Card para cada consulta específica
function ConsultaCard({ consulta }: { consulta: ConsultaMapGIS }) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header de la card */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {consulta.titulo}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {consulta.descripcion}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            consulta.loading
              ? 'bg-yellow-100 text-yellow-800'
              : consulta.error
                ? 'bg-red-100 text-red-800'
                : consulta.datos
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
          }`}>
            {consulta.loading ? '🔄 Cargando...' : 
             consulta.error ? '❌ Error' :
             consulta.datos ? '✅ Datos' : '⏳ Pendiente'}
          </div>
        </div>
      </div>

      {/* Contenido de la card */}
      <div className="px-6 py-4">
        {consulta.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Consultando MapGIS...</span>
          </div>
        ) : consulta.error ? (
          <div className="text-red-600 text-sm">
            <p className="font-medium">Error en la consulta:</p>
            <p className="mt-1">{consulta.error}</p>
          </div>
        ) : consulta.datos ? (
          <div className="space-y-3">
            {/* Mostrar datos específicos según el tipo de consulta */}
            {consulta.id === 'area_lote' && (
              <div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Área del Lote:</span>
                  <span className="text-sm text-gray-900">{consulta.datos.area_lote || 'N/A'}</span>
                </div>
                {consulta.datos.area_lote_m2 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Área (m²):</span>
                    <span className="text-sm text-gray-900">{consulta.datos.area_lote_m2.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {consulta.id === 'clasificacion_suelo' && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Clasificación:</span>
                <span className="text-sm text-gray-900">{consulta.datos.clasificacion || 'N/A'}</span>
              </div>
            )}

            {consulta.id === 'usos_generales' && consulta.datos.uso_suelo && (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Categoría:</span>
                  <span className="text-sm text-gray-900">{consulta.datos.uso_suelo.categoria_uso || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Subcategoría:</span>
                  <span className="text-sm text-gray-900">{consulta.datos.uso_suelo.subcategoria_uso || 'N/A'}</span>
                </div>
                {consulta.datos.uso_suelo.porcentaje && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Porcentaje:</span>
                    <span className="text-sm text-gray-900">{consulta.datos.uso_suelo.porcentaje}%</span>
                  </div>
                )}
              </div>
            )}

            {consulta.id === 'aprovechamiento_urbano' && consulta.datos.aprovechamiento && (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Tratamiento:</span>
                  <span className="text-sm text-gray-900">{consulta.datos.aprovechamiento.tratamiento || 'N/A'}</span>
                </div>
                {consulta.datos.aprovechamiento.densidad_habitacional_max && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Densidad Máx:</span>
                    <span className="text-sm text-gray-900">{consulta.datos.aprovechamiento.densidad_habitacional_max} Viv/ha</span>
                  </div>
                )}
                {consulta.datos.aprovechamiento.altura_normativa && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Altura Normativa:</span>
                    <span className="text-sm text-gray-900">{consulta.datos.aprovechamiento.altura_normativa}</span>
                  </div>
                )}
              </div>
            )}

            {consulta.id === 'restriccion_amenaza' && consulta.datos && (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Valor:</span>
                  <span className="text-sm text-gray-900">{consulta.datos.valor || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Condiciones de Riesgo:</span>
                  <span className="text-sm text-gray-900">{consulta.datos.condiciones_riesgo || 'N/A'}</span>
                </div>
                {consulta.datos.nivel_amenaza && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Nivel de Amenaza:</span>
                    <span className={`text-sm font-medium ${
                      consulta.datos.nivel_amenaza === 'Alta' ? 'text-red-600' :
                      consulta.datos.nivel_amenaza === 'Media' ? 'text-yellow-600' :
                      consulta.datos.nivel_amenaza === 'Baja' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {consulta.datos.nivel_amenaza}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Tiene Restricción:</span>
                  <span className={`text-sm font-medium ${
                    consulta.datos.tiene_restriccion ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {consulta.datos.tiene_restriccion ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            )}

            {consulta.id === 'restriccion_rios' && consulta.datos && (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Valor:</span>
                  <span className="text-sm text-gray-900">{consulta.datos.valor || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Restricción de Retiro:</span>
                  <span className="text-sm text-gray-900">{consulta.datos.restriccion_retiro || 'Sin restricción'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Aplica Restricción:</span>
                  <span className={`text-sm font-medium ${
                    consulta.datos.aplica_restriccion ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {consulta.datos.aplica_restriccion ? 'Sí' : 'No'}
                  </span>
                </div>
                {consulta.datos.distancia_retiro_m && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Distancia de Retiro:</span>
                    <span className="text-sm text-gray-900">{consulta.datos.distancia_retiro_m} metros</span>
                  </div>
                )}
                {consulta.datos.raw_data?.estructura_ecologica && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Estructura Ecológica:</span>
                    <span className="text-sm text-gray-900">{consulta.datos.raw_data.estructura_ecologica}</span>
                  </div>
                )}
              </div>
            )}

            {/* Datos raw para debugging */}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                🔧 Ver datos raw
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32 text-black">
                {JSON.stringify(consulta.datos, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center py-4">
            Haz clic en "Probar Todas las Consultas" para obtener datos
          </div>
        )}

        {/* Información de timing */}
        {consulta.timestamp && (
          <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Consultado: {consulta.timestamp}</span>
              {consulta.requestTime && (
                <span>Tiempo: {consulta.requestTime}ms</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}