import { useState, useEffect } from "react";
import {
  TratamientosService,
  type AprovechamientoResponse,
  type TratamientosResponse,
} from "~/services/tratamientos";
import { InfoField } from "~/components/atoms/InfoField";

interface AprovechamientoCalculatorProps {
  tratamiento?: string;
  areaLote?: number;
  apiUrl: string;
}

export function AprovechamientoCalculator({
  tratamiento: tratamientoInicial,
  areaLote: areaLoteInicial,
  apiUrl,
}: AprovechamientoCalculatorProps) {
  const [tratamientos, setTratamientos] = useState<TratamientosResponse | null>(
    null
  );
  const [tratamientoSeleccionado, setTratamientoSeleccionado] = useState(
    tratamientoInicial || ""
  );
  const [areaLote, setAreaLote] = useState(areaLoteInicial?.toString() || "");
  const [tipologia, setTipologia] = useState("multifamiliar");
  const [resultado, setResultado] = useState<AprovechamientoResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingTratamientos, setLoadingTratamientos] = useState(true);

  const tratamientosService = new TratamientosService(apiUrl);

  // Cargar tratamientos disponibles
  useEffect(() => {
    const cargarTratamientos = async () => {
      setLoadingTratamientos(true);
      const data = await tratamientosService.listarTratamientos();
      setTratamientos(data);
      setLoadingTratamientos(false);
    };

    cargarTratamientos();
  }, [apiUrl]);

  // Auto-calcular cuando cambian los valores principales
  useEffect(() => {
    if (
      tratamientoSeleccionado &&
      areaLote &&
      tratamientos &&
      !tratamientos.error
    ) {
      calcularAprovechamiento();
    }
  }, [tratamientoSeleccionado, areaLote, tipologia, tratamientos]);

  const calcularAprovechamiento = async () => {
    if (!tratamientoSeleccionado || !areaLote) {
      return; // No mostrar alert, solo no calcular
    }

    const areaNumero = parseFloat(areaLote);
    if (isNaN(areaNumero) || areaNumero <= 0) {
      return; // Área inválida
    }

    setLoading(true);
    try {
      const respuesta = await tratamientosService.calcularAprovechamiento({
        tratamiento: tratamientoSeleccionado,
        area_lote: areaNumero,
        tipologia,
      });

      setResultado(respuesta);
    } catch (error) {
      console.error("Error en cálculo:", error);
      setResultado({
        tratamiento_nombre: tratamientoSeleccionado,
        tratamiento_valido: false,
        area_lote: areaNumero,
        tipologia,
        parametros_normativos: {
          indice_ocupacion: 0,
          indice_construccion: 0,
          altura_maxima: 0,
          area_minima_lote: 0,
        },
        calculos_aprovechamiento: {
          area_ocupacion_maxima: 0,
          area_construccion_maxima: 0,
          numero_pisos_maximo: 0,
          unidades_estimadas: 0,
          cumple_area_minima: false,
        },
        retiros: {
          frontal: 0,
          lateral: 0,
          posterior: 0,
        },
        error: error instanceof Error ? error.message : "Error de conexión",
      });
    } finally {
      setLoading(false);
    }
  };

  const tipologias = [
    { value: "unifamiliar", label: "Unifamiliar" },
    {
      value: "bifamiliar_pisos_diferentes",
      label: "Bifamiliar (Pisos Diferentes)",
    },
    { value: "bifamiliar_mismo_piso", label: "Bifamiliar (Mismo Piso)" },
    { value: "trifamiliar", label: "Trifamiliar" },
    { value: "multifamiliar", label: "Multifamiliar" },
  ];

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        🏗️ Calculadora de Aprovechamiento Urbanístico
      </h2>

      {/* Estado de conexión */}
      {loadingTratamientos && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-700">
              Cargando tratamientos del POT...
            </span>
          </div>
        </div>
      )}

      {tratamientos?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">❌</div>
            <div>
              <p className="font-medium text-red-800">
                Error al cargar tratamientos
              </p>
              <p className="text-sm text-red-600 mt-1">{tratamientos.error}</p>
              <p className="text-xs text-red-500 mt-2">
                Verificar que el backend esté funcionando en {apiUrl}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de entrada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Selector de tratamiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tratamiento Urbanístico
          </label>
          {loadingTratamientos ? (
            <div className="text-sm text-gray-500">
              Cargando tratamientos...
            </div>
          ) : tratamientos?.error ? (
            <div className="text-sm text-red-500">Error de conexión</div>
          ) : (
            <select
              value={tratamientoSeleccionado}
              onChange={(e) => setTratamientoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar tratamiento</option>
              {tratamientos &&
                Object.keys(tratamientos.tratamientos).map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* Área del lote */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Área del Lote (m²)
          </label>
          <input
            type="number"
            value={areaLote}
            onChange={(e) => setAreaLote(e.target.value)}
            placeholder="Ej: 200"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tipología */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipología de Vivienda
          </label>
          <select
            value={tipologia}
            onChange={(e) => setTipologia(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {tipologias.map((tip) => (
              <option key={tip.value} value={tip.value}>
                {tip.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicador de cálculo automático */}
      {loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-700">
              Calculando aprovechamiento...
            </span>
          </div>
        </div>
      )}

      {/* Información del tratamiento seleccionado */}
      {tratamientoSeleccionado &&
        tratamientos?.tratamientos[tratamientoSeleccionado] && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">
              📋 Información del Tratamiento: {tratamientoSeleccionado}
            </h3>
            <p className="text-sm text-blue-700">
              {tratamientos.tratamientos[tratamientoSeleccionado].descripcion}
            </p>
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <span className="font-medium">Índice Ocupación:</span>{" "}
                {
                  tratamientos.tratamientos[tratamientoSeleccionado]
                    .indice_ocupacion
                }
              </div>
              <div>
                <span className="font-medium">Índice Construcción:</span>{" "}
                {
                  tratamientos.tratamientos[tratamientoSeleccionado]
                    .indice_construccion
                }
              </div>
              <div>
                <span className="font-medium">Altura Máxima:</span>{" "}
                {
                  tratamientos.tratamientos[tratamientoSeleccionado]
                    .altura_maxima
                }{" "}
                pisos
              </div>
            </div>
          </div>
        )}

      {/* Resultados */}
      {resultado && (
        <div className="border-t border-gray-200 pt-6">
          {resultado.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-400 mr-2">❌</div>
                <div>
                  <p className="font-medium text-red-800">
                    Error en el cálculo
                  </p>
                  <p className="text-sm text-red-600 mt-1">{resultado.error}</p>
                </div>
              </div>
            </div>
          ) : resultado.tratamiento_valido ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parámetros normativos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  📐 Parámetros Normativos
                </h3>
                <InfoField
                  label="Índice de Ocupación"
                  value={resultado.parametros_normativos.indice_ocupacion.toString()}
                />
                <InfoField
                  label="Índice de Construcción"
                  value={resultado.parametros_normativos.indice_construccion.toString()}
                />
                <InfoField
                  label="Altura Máxima"
                  value={`${resultado.parametros_normativos.altura_maxima} pisos`}
                />
                <InfoField
                  label="Área Mínima de Lote"
                  value={`${resultado.parametros_normativos.area_minima_lote} m²`}
                />
              </div>

              {/* Cálculos de aprovechamiento */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  🏗️ Cálculos de Aprovechamiento
                </h3>
                <InfoField
                  label="Área de Ocupación Máxima"
                  value={`${resultado.calculos_aprovechamiento.area_ocupacion_maxima.toLocaleString()} m²`}
                />
                <InfoField
                  label="Área de Construcción Máxima"
                  value={`${resultado.calculos_aprovechamiento.area_construccion_maxima.toLocaleString()} m²`}
                />
                <InfoField
                  label="Número de Pisos Máximo"
                  value={resultado.calculos_aprovechamiento.numero_pisos_maximo.toString()}
                />
                <InfoField
                  label="Unidades Estimadas"
                  value={resultado.calculos_aprovechamiento.unidades_estimadas.toString()}
                />
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">
                    Cumple Área Mínima:
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      resultado.calculos_aprovechamiento.cumple_area_minima
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {resultado.calculos_aprovechamiento.cumple_area_minima
                      ? "Sí ✅"
                      : "No ❌"}
                  </span>
                </div>
              </div>

              {/* Retiros */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  📏 Retiros Obligatorios
                </h3>
                <InfoField
                  label="Retiro Frontal"
                  value={`${resultado.retiros.frontal} m`}
                />
                <InfoField
                  label="Retiro Lateral"
                  value={`${resultado.retiros.lateral} m`}
                />
                <InfoField
                  label="Retiro Posterior"
                  value={`${resultado.retiros.posterior} m`}
                />
              </div>

              {/* Resumen */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">
                  📊 Resumen del Proyecto
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>Tratamiento:</strong> {resultado.tratamiento_nombre}
                  </p>
                  <p>
                    <strong>Tipología:</strong> {resultado.tipologia}
                  </p>
                  <p>
                    <strong>Área del Lote:</strong>{" "}
                    {resultado.area_lote.toLocaleString()} m²
                  </p>
                  <p>
                    <strong>Máximo Construible:</strong>{" "}
                    {resultado.calculos_aprovechamiento.area_construccion_maxima.toLocaleString()}{" "}
                    m²
                  </p>
                  <p>
                    <strong>Unidades Viables:</strong>{" "}
                    {resultado.calculos_aprovechamiento.unidades_estimadas}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-400 mr-2">⚠️</div>
                <div>
                  <p className="font-medium text-yellow-800">
                    Tratamiento no válido
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    El tratamiento seleccionado no es válido para este lote
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ayuda para usuarios */}
      {!tratamientos?.error &&
        !loading &&
        (!tratamientoSeleccionado || !areaLote) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">💡 Instrucciones</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Selecciona un tratamiento urbanístico del POT</p>
              <p>• Ingresa el área del lote en metros cuadrados</p>
              <p>• Elige la tipología de vivienda que deseas desarrollar</p>
              <p>• Los cálculos se actualizarán automáticamente</p>
            </div>
          </div>
        )}
    </div>
  );
}
