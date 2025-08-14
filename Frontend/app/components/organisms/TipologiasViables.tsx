import { useState, useEffect } from "react";
import {
  TratamientosService,
  type TipologiasViablesResponse,
} from "~/services/tratamientos";
import { InfoField } from "~/components/atoms/InfoField";

interface TipologiasViablesProps {
  tratamiento?: string;
  areaLote?: number;
  frenteLote?: number;
  apiUrl: string;
}

export function TipologiasViables({
  tratamiento: tratamientoInicial,
  areaLote: areaLoteInicial,
  frenteLote: frenteLoteInicial,
  apiUrl,
}: TipologiasViablesProps) {
  const [resultado, setResultado] = useState<TipologiasViablesResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const tratamientosService = new TratamientosService(apiUrl);

  // Auto-calcular cuando se reciben props
  useEffect(() => {
    if (tratamientoInicial && areaLoteInicial) {
      calcularTipologias();
    }
  }, [tratamientoInicial, areaLoteInicial, frenteLoteInicial]);

  const calcularTipologias = async () => {
    if (!tratamientoInicial || !areaLoteInicial) return;

    setLoading(true);
    try {
      const respuesta = await tratamientosService.obtenerTipologiasViables({
        tratamiento: tratamientoInicial,
        area_lote: areaLoteInicial,
        frente_lote: frenteLoteInicial,
      });

      setResultado(respuesta);
    } catch (error) {
      console.error("Error obteniendo tipologías:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">
            Calculando tipologías viables...
          </span>
        </div>
      </div>
    );
  }

  if (!resultado) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        🏘️ Tipologías de Vivienda Viables
      </h2>

      {/* Información del lote */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Tratamiento:</span>
            <div className="text-blue-700">{resultado.tratamiento_nombre}</div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Área del Lote:</span>
            <div className="text-blue-700">
              {resultado.area_lote.toLocaleString()} m²
            </div>
          </div>
          {resultado.frente_lote && (
            <div>
              <span className="font-medium text-blue-800">
                Frente del Lote:
              </span>
              <div className="text-blue-700">{resultado.frente_lote} m</div>
            </div>
          )}
        </div>
      </div>

      {resultado.error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">❌</div>
            <div>
              <p className="font-medium text-red-800">Error en el cálculo</p>
              <p className="text-sm text-red-600 mt-1">{resultado.error}</p>
            </div>
          </div>
        </div>
      ) : resultado.tipologias_viables.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-400 mr-2">⚠️</div>
            <div>
              <p className="font-medium text-yellow-800">
                Sin tipologías viables
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                El lote no cumple con los requisitos mínimos para ninguna
                tipología de vivienda
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-green-600 font-medium">
              ✅ {resultado.total_tipologias_viables} tipología(s) viable(s)
              encontrada(s)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resultado.tipologias_viables.map((tipologia, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                  🏠 {tipologia.tipologia.replace(/_/g, " ")}
                </h3>

                {/* Requisitos */}
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-gray-700">
                    📋 Requisitos Mínimos
                  </h4>
                  <InfoField
                    label="Área Mínima Requerida"
                    value={`${tipologia.area_minima_requerida} m²`}
                  />
                  <InfoField
                    label="Frente Mínimo Requerido"
                    value={`${tipologia.frente_minimo_requerido} m`}
                  />
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      Cumple Requisitos:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        tipologia.cumple_requisitos
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tipologia.cumple_requisitos ? "Sí ✅" : "No ❌"}
                    </span>
                  </div>
                </div>

                {/* Aprovechamiento */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">
                    🏗️ Aprovechamiento
                  </h4>
                  <InfoField
                    label="Área Ocupación Máxima"
                    value={`${
                      tipologia.aprovechamiento.area_ocupacion_maxima?.toLocaleString() ||
                      "N/A"
                    } m²`}
                  />
                  <InfoField
                    label="Área Construcción Máxima"
                    value={`${
                      tipologia.aprovechamiento.area_construccion_maxima?.toLocaleString() ||
                      "N/A"
                    } m²`}
                  />
                  <InfoField
                    label="Pisos Máximos"
                    value={
                      tipologia.aprovechamiento.numero_pisos_maximo?.toString() ||
                      "N/A"
                    }
                  />
                  <InfoField
                    label="Unidades Estimadas"
                    value={
                      tipologia.aprovechamiento.unidades_estimadas?.toString() ||
                      "N/A"
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Resumen comparativo */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">
              📊 Resumen Comparativo
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-green-700">
                    <th className="text-left py-1">Tipología</th>
                    <th className="text-right py-1">Área Máx.</th>
                    <th className="text-right py-1">Unidades</th>
                    <th className="text-right py-1">Pisos</th>
                  </tr>
                </thead>
                <tbody className="text-green-600">
                  {resultado.tipologias_viables.map((tip, index) => (
                    <tr key={index}>
                      <td className="py-1 capitalize">
                        {tip.tipologia.replace(/_/g, " ")}
                      </td>
                      <td className="text-right py-1">
                        {tip.aprovechamiento.area_construccion_maxima?.toLocaleString() ||
                          "-"}{" "}
                        m²
                      </td>
                      <td className="text-right py-1">
                        {tip.aprovechamiento.unidades_estimadas || "-"}
                      </td>
                      <td className="text-right py-1">
                        {tip.aprovechamiento.numero_pisos_maximo || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
