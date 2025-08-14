import { useState } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { AprovechamientoCalculator } from "~/components/organisms/AprovechamientoCalculator";
import { TipologiasViables } from "~/components/organisms/TipologiasViables";
import { SearchForm } from "~/components/organisms/SearchForm";
import { MapGISService, type TipoBusqueda } from "~/services/mapgis";

// Loader para datos iniciales
export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    apiUrl: process.env.VITE_API_BASE_URL || "http://localhost:8000",
  });
}

export default function AnalisisLote() {
  const { apiUrl } = useLoaderData<typeof loader>();
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>("cbml");

  // Estado para datos del lote consultado
  const [datosLote, setDatosLote] = useState<{
    tratamiento?: string;
    area_lote?: number;
    frente_lote?: number;
    direccion?: string;
    cbml?: string;
  } | null>(null);

  const [consultando, setConsultando] = useState(false);

  const mapgisService = new MapGISService(apiUrl);

  const consultarLote = async (valor: string, tipo: TipoBusqueda) => {
    setConsultando(true);
    try {
      const resultado = await mapgisService.buscarPredio(tipo, valor);

      if (resultado.data?.encontrado && resultado.data.datos) {
        const datos = resultado.data.datos;

        // Extraer datos relevantes para el análisis
        const nuevoDatosLote = {
          tratamiento:
            datos.aprovechamiento_urbano?.tratamiento ||
            datos.clasificacion_suelo === "Urbano"
              ? "Consolidación Nivel 4"
              : undefined,
          area_lote: datos.area_terreno || datos.area_lote_m2,
          frente_lote: undefined, // Por ahora no extraemos esto de MapGIS
          direccion: datos.direccion,
          cbml: datos.cbml,
        };

        setDatosLote(nuevoDatosLote);
      } else {
        alert(
          "No se encontraron datos del lote o no se pudo extraer la información necesaria"
        );
      }
    } catch (error) {
      console.error("Error consultando lote:", error);
      alert("Error al consultar el lote");
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏗️ Análisis Urbanístico de Lotes
          </h1>
          <p className="text-gray-600">
            Consulta un lote desde MapGIS y analiza su potencial de desarrollo
            según el POT de Medellín
          </p>
        </div>

        {/* Buscador de lotes */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔍 Consultar Lote desde MapGIS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Tipo de búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Consulta
              </label>
              <select
                value={tipoBusqueda}
                onChange={(e) =>
                  setTipoBusqueda(e.target.value as TipoBusqueda)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cbml">CBML</option>
                <option value="matricula">Matrícula</option>
                <option value="direccion">Dirección</option>
              </select>
            </div>

            {/* Campo de búsqueda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor a Consultar
              </label>
              <input
                type="text"
                placeholder={
                  tipoBusqueda === "cbml"
                    ? "Ej: 14180230004"
                    : tipoBusqueda === "matricula"
                    ? "Ej: 01N-1234567"
                    : "Ej: Calle 10 # 20-30, El Poblado"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={async (e) => {
                  if (e.key === "Enter") {
                    const valor = e.currentTarget.value.trim();
                    if (valor) {
                      await consultarLote(valor, tipoBusqueda);
                    }
                  }
                }}
              />
            </div>

            {/* Botón de búsqueda */}
            <div>
              <button
                onClick={async () => {
                  const input = document.querySelector(
                    'input[type="text"]'
                  ) as HTMLInputElement;
                  const valor = input?.value.trim();
                  if (valor) {
                    await consultarLote(valor, tipoBusqueda);
                  }
                }}
                disabled={consultando}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {consultando ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Consultando...
                  </div>
                ) : (
                  "🔍 Consultar"
                )}
              </button>
            </div>
          </div>

          {/* Información del lote consultado */}
          {datosLote && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">
                ✅ Lote Consultado
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700">
                {datosLote.direccion && (
                  <div>
                    <span className="font-medium">Dirección:</span>
                    <div>{datosLote.direccion}</div>
                  </div>
                )}
                {datosLote.cbml && (
                  <div>
                    <span className="font-medium">CBML:</span>
                    <div>{datosLote.cbml}</div>
                  </div>
                )}
                {datosLote.area_lote && (
                  <div>
                    <span className="font-medium">Área:</span>
                    <div>{datosLote.area_lote.toLocaleString()} m²</div>
                  </div>
                )}
                {datosLote.tratamiento && (
                  <div>
                    <span className="font-medium">Tratamiento:</span>
                    <div>{datosLote.tratamiento}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Calculadora de aprovechamiento */}
        <div className="mb-8">
          <AprovechamientoCalculator
            tratamiento={datosLote?.tratamiento}
            areaLote={datosLote?.area_lote}
            apiUrl={apiUrl}
          />
        </div>

        {/* Tipologías viables */}
        {datosLote?.tratamiento && datosLote?.area_lote && (
          <div className="mb-8">
            <TipologiasViables
              tratamiento={datosLote.tratamiento}
              areaLote={datosLote.area_lote}
              frenteLote={datosLote.frente_lote}
              apiUrl={apiUrl}
            />
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">ℹ️ Información</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• La información se extrae directamente desde MapGIS Medellín</p>
            <p>• Los cálculos se basan en el POT vigente de Medellín</p>
            <p>• Los resultados son estimaciones preliminares</p>
            <p>
              • Para análisis definitivos consulte con un profesional en
              urbanismo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
