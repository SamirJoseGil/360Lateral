import { useState } from "react";
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useActionData, useNavigation, useLoaderData } from "@remix-run/react";
import {
  MapGISService,
  type ScrapResult,
  type ConsultaMapGIS,
  type TipoBusqueda,
} from "~/services/mapgis";
import { SearchForm } from "~/components/organisms/SearchForm";
import { ConsultaCard } from "~/components/organisms/ConsultaCard";
import { InfoField } from "~/components/atoms/InfoField";
import { Link } from "@remix-run/react";
import { useAuth } from "~/hooks/useAuth";

// Loader para datos iniciales
export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    apiUrl: process.env.VITE_API_BASE_URL || "http://localhost:8000",
  });
}

// Action para manejar el scraping
export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const tipoBusqueda = formData.get("tipoBusqueda") as TipoBusqueda;
    const valor = formData.get("valor") as string;

    console.log("Action called with:", { tipoBusqueda, valor });

    const apiUrl = process.env.VITE_API_BASE_URL || "http://localhost:8000";
    const mapgisService = new MapGISService(apiUrl);

    const result = await mapgisService.buscarPredio(tipoBusqueda, valor);
    return json(result);
  } catch (error) {
    console.error("Error en acción de scraping:", error);

    return json({
      error: true,
      mensaje: "Error inesperado del servidor",
      detalle: error instanceof Error ? error.message : String(error),
      _debug: {
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default function ScrapInfo() {
  const { apiUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<ScrapResult>();
  const navigation = useNavigation();
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>("cbml");

  // ✅ Verificar que el usuario tenga permisos de admin
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // ✅ Solo admins pueden acceder a esta página
  if (!user || !hasRole("admin")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            Esta página es solo para administradores del sistema.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Estado para las consultas específicas de MapGIS
  const mapgisService = new MapGISService(apiUrl);
  const [consultasMapGIS, setConsultasMapGIS] = useState<ConsultaMapGIS[]>(
    mapgisService.getConsultasMapGISInitial()
  );

  const isLoading = navigation.state === "submitting";
  const isIdle = navigation.state === "idle";

  // Función para probar consulta completa y actualizar todas las cards
  const probarConsultaCompleta = async (cbml = "14180230004") => {
    try {
      // Activar loading en todas las cards
      setConsultasMapGIS((prev) =>
        prev.map((consulta) => ({
          ...consulta,
          loading: true,
          error: undefined,
        }))
      );

      const startTime = Date.now();
      const result = await mapgisService.probarConsultaCompleta(cbml);
      const endTime = Date.now();

      console.log("🧪 Resultado consulta completa:", result);

      // Actualizar cada card con los datos correspondientes
      setConsultasMapGIS((prev) =>
        prev.map((consulta) => {
          const timestamp = new Date().toLocaleString();
          const requestTime = endTime - startTime;

          let datos = null;
          let error = undefined;

          if (result.test_successful && result.datos_extraidos) {
            const restriccionesAmbientales =
              result.resultado_completo?.datos?.restricciones_ambientales;

            switch (consulta.id) {
              case "area_lote":
                datos = {
                  area_lote: result.datos_extraidos.area_lote,
                  area_lote_m2: result.datos_extraidos.area_lote_m2,
                  raw_data: result.resultado_completo?.datos?.area_lote,
                };
                break;
              case "clasificacion_suelo":
                datos = {
                  clasificacion: result.datos_extraidos.clasificacion_suelo,
                  raw_data:
                    result.resultado_completo?.datos?.clasificacion_suelo,
                };
                break;
              case "usos_generales":
                datos = {
                  uso_suelo: result.datos_extraidos.uso_suelo,
                  raw_data: result.resultado_completo?.datos?.uso_suelo,
                };
                break;
              case "aprovechamiento_urbano":
                datos = {
                  aprovechamiento:
                    result.datos_extraidos.aprovechamiento_urbano,
                  raw_data:
                    result.resultado_completo?.datos?.aprovechamiento_urbano,
                };
                break;
              case "restriccion_amenaza":
                const amenazaData =
                  restriccionesAmbientales?.amenaza_riesgo ||
                  result.datos_extraidos.restriccion_amenaza_riesgo;

                if (amenazaData) {
                  datos = {
                    valor: amenazaData,
                    condiciones_riesgo: amenazaData,
                    nivel_amenaza: amenazaData.includes("Baja")
                      ? "Baja"
                      : amenazaData.includes("Media")
                      ? "Media"
                      : amenazaData.includes("Alta")
                      ? "Alta"
                      : "No determinado",
                    tiene_restriccion:
                      !amenazaData.includes("Sin restricciones"),
                    raw_data: {
                      amenaza_riesgo: amenazaData,
                      fuente: "MapGIS Medellín",
                      endpoint: "SQL_CONSULTA_RESTRICCIONAMENAZARIESGO",
                    },
                  };
                } else {
                  datos = {
                    valor: "No disponible",
                    condiciones_riesgo: "No disponible",
                    nivel_amenaza: "No determinado",
                    tiene_restriccion: false,
                    raw_data: result.resultado_completo,
                  };
                }
                break;
              case "restriccion_rios":
                const retirosData =
                  restriccionesAmbientales?.retiros_rios ||
                  result.datos_extraidos.restriccion_rios_quebradas;

                if (retirosData) {
                  datos = {
                    valor: retirosData,
                    restriccion_retiro: retirosData,
                    aplica_restriccion:
                      !retirosData.includes("Sin restricciones"),
                    distancia_retiro_m: retirosData.includes("metros")
                      ? parseInt(retirosData.match(/\d+/)?.[0] || "0")
                      : null,
                    raw_data: {
                      retiros_rios: retirosData,
                      estructura_ecologica:
                        restriccionesAmbientales?.estructura_ecologica,
                      fuente: "MapGIS Medellín",
                      endpoint: "SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS",
                    },
                  };
                } else {
                  datos = {
                    valor: "No disponible",
                    restriccion_retiro: "No disponible",
                    aplica_restriccion: false,
                    distancia_retiro_m: null,
                    raw_data: result.resultado_completo,
                  };
                }
                break;
            }
          } else {
            error = result.mensaje || "Error en la consulta";
          }

          return {
            ...consulta,
            loading: false,
            datos,
            error,
            timestamp,
            requestTime,
          };
        })
      );
    } catch (error) {
      console.error("Error en consulta completa:", error);

      // Marcar todas las cards con error
      setConsultasMapGIS((prev) =>
        prev.map((consulta) => ({
          ...consulta,
          loading: false,
          error: error instanceof Error ? error.message : "Error de conexión",
        }))
      );
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
            Extrae información completa de predios desde MapGIS usando múltiples
            consultas especializadas
          </p>

          {/* Indicador de estado de conexión */}
          <div className="mt-4 flex justify-center">
            <div
              className={`flex items-center px-3 py-1 rounded-full text-sm ${
                isLoading
                  ? "bg-yellow-100 text-yellow-800"
                  : isIdle && actionData
                  ? actionData.error
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isLoading
                    ? "bg-yellow-500 animate-pulse"
                    : isIdle && actionData
                    ? actionData.error
                      ? "bg-red-500"
                      : "bg-green-500"
                    : "bg-blue-500"
                }`}
              ></div>
              {isLoading
                ? "Procesando..."
                : isIdle && actionData
                ? actionData.error
                  ? "Error en la consulta"
                  : "Consulta exitosa"
                : "Listo para consultar"}
            </div>
          </div>
        </div>

        {/* Formulario de Búsqueda */}
        <SearchForm
          tipoBusqueda={tipoBusqueda}
          onTipoBusquedaChange={setTipoBusqueda}
          isLoading={isLoading}
        />

        {/* Sección de Consultas Específicas de MapGIS */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              🧪 Consultas Específicas de MapGIS
            </h2>
            <button
              onClick={() => probarConsultaCompleta()}
              disabled={consultasMapGIS.some((c) => c.loading)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {consultasMapGIS.some((c) => c.loading) ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Consultando...
                </div>
              ) : (
                "🚀 Probar Todas las Consultas"
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
            <div
              className={`p-4 rounded-lg mb-6 ${
                actionData.error
                  ? "bg-red-50 border border-red-200"
                  : actionData.data?.encontrado
                  ? "bg-green-50 border border-green-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <div className="flex items-start">
                <div
                  className={`flex-shrink-0 ${
                    actionData.error
                      ? "text-red-400"
                      : actionData.data?.encontrado
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {actionData.error
                    ? "❌"
                    : actionData.data?.encontrado
                    ? "✅"
                    : "⚠️"}
                </div>
                <div className="ml-3">
                  <p
                    className={`font-medium ${
                      actionData.error
                        ? "text-red-800"
                        : actionData.data?.encontrado
                        ? "text-green-800"
                        : "text-yellow-800"
                    }`}
                  >
                    {actionData.mensaje}
                  </p>
                  {actionData.detalle && (
                    <p
                      className={`text-sm mt-1 ${
                        actionData.error
                          ? "text-red-600"
                          : actionData.data?.encontrado
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {actionData.detalle}
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
                    <InfoField
                      label="Dirección"
                      value={actionData.data.datos.direccion}
                    />
                  )}

                  {actionData.data.datos.barrio && (
                    <InfoField
                      label="Barrio"
                      value={actionData.data.datos.barrio}
                    />
                  )}

                  {actionData.data.datos.comuna && (
                    <InfoField
                      label="Comuna"
                      value={actionData.data.datos.comuna}
                    />
                  )}

                  {actionData.data.datos.estrato && (
                    <InfoField
                      label="Estrato"
                      value={actionData.data.datos.estrato.toString()}
                    />
                  )}

                  {actionData.data.datos.clasificacion_suelo && (
                    <InfoField
                      label="Clasificación del Suelo"
                      value={actionData.data.datos.clasificacion_suelo}
                    />
                  )}

                  {actionData.data.datos.matricula && (
                    <InfoField
                      label="Matrícula"
                      value={actionData.data.datos.matricula}
                    />
                  )}

                  {actionData.data.datos.cbml && (
                    <InfoField
                      label="CBML"
                      value={actionData.data.datos.cbml}
                    />
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
                    <InfoField
                      label="Uso del Suelo"
                      value={actionData.data.datos.uso_suelo}
                    />
                  )}

                  {actionData.data.datos.coordenadas_x &&
                    actionData.data.datos.coordenadas_y && (
                      <InfoField
                        label="Coordenadas"
                        value={`X: ${actionData.data.datos.coordenadas_x}, Y: ${actionData.data.datos.coordenadas_y}`}
                      />
                    )}
                </div>
              </div>
            )}

            {/* Metadatos */}
            {actionData.data && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Fuente: {actionData.data.fuente}</span>
                  <span>
                    Consultado:{" "}
                    {new Date(actionData.data.timestamp).toLocaleString()}
                  </span>
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
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            ℹ️ Información de Debug
          </h3>
          <div className="text-xs text-blue-600 space-y-1">
            <p>API URL: {apiUrl}</p>
            <p>Estado de navegación: {navigation.state}</p>
            <p>CBML de prueba: 14180230004</p>

            {/* Botones de debug */}
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    const startTime = Date.now();
                    try {
                      const result = await mapgisService.probarConexionReal();
                      const endTime = Date.now();

                      const successMessage = result.test_successful
                        ? `✅ CONEXIÓN EXITOSA con MapGIS!\n\nTiempo: ${
                            endTime - startTime
                          }ms\nVer consola para detalles.`
                        : `❌ CONEXIÓN FALLÓ\n\nError: ${
                            result.data?.mensaje || "Desconocido"
                          }\nVer consola.`;

                      alert(successMessage);
                      console.log("🧪 Test de conexión real:", result);
                    } catch (error) {
                      alert("💥 Error crítico\nVer consola.");
                      console.error("💥 Error:", error);
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
                      const result = await mapgisService.investigarEndpoints();
                      const endTime = Date.now();

                      alert(
                        `🔍 INVESTIGACIÓN COMPLETA\nTiempo: ${
                          endTime - startTime
                        }ms\nVer consola.`
                      );
                      console.log("🔍 Investigación:", result);
                    } catch (error) {
                      alert("💥 Error en investigación\nVer consola.");
                      console.error("💥 Error:", error);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 font-medium"
                >
                  🔍 INVESTIGAR ENDPOINTS
                </button>
              </div>
            </div>

            {/* Debug de la última solicitud */}
            {actionData?._debug && (
              <details className="mt-4">
                <summary className="cursor-pointer text-blue-700 font-medium">
                  🔧 Debug de la solicitud
                </summary>
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
