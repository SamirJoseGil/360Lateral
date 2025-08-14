import { InfoField } from "~/components/atoms/InfoField";
import { ConsultaMapGIS } from "~/services/mapgis";

interface ConsultaCardProps {
  consulta: ConsultaMapGIS;
}

export function ConsultaCard({ consulta }: ConsultaCardProps) {
  const renderConsultaData = () => {
    if (!consulta.datos) return null;

    switch (consulta.id) {
      case "area_lote":
        return (
          <div>
            <InfoField
              label="Área del Lote"
              value={consulta.datos.area_lote || "N/A"}
            />
            {consulta.datos.area_lote_m2 && (
              <InfoField
                label="Área (m²)"
                value={consulta.datos.area_lote_m2.toLocaleString()}
              />
            )}
          </div>
        );

      case "clasificacion_suelo":
        return (
          <InfoField
            label="Clasificación"
            value={consulta.datos.clasificacion || "N/A"}
          />
        );

      case "usos_generales":
        if (!consulta.datos.uso_suelo) return null;
        return (
          <div className="space-y-2">
            <InfoField
              label="Categoría"
              value={consulta.datos.uso_suelo.categoria_uso || "N/A"}
            />
            <InfoField
              label="Subcategoría"
              value={consulta.datos.uso_suelo.subcategoria_uso || "N/A"}
            />
            {consulta.datos.uso_suelo.porcentaje && (
              <InfoField
                label="Porcentaje"
                value={`${consulta.datos.uso_suelo.porcentaje}%`}
              />
            )}
          </div>
        );

      case "aprovechamiento_urbano":
        if (!consulta.datos.aprovechamiento) return null;
        return (
          <div className="space-y-2">
            <InfoField
              label="Tratamiento"
              value={consulta.datos.aprovechamiento.tratamiento || "N/A"}
            />
            {consulta.datos.aprovechamiento.densidad_habitacional_max && (
              <InfoField
                label="Densidad Máx"
                value={`${consulta.datos.aprovechamiento.densidad_habitacional_max} Viv/ha`}
              />
            )}
            {consulta.datos.aprovechamiento.altura_normativa && (
              <InfoField
                label="Altura Normativa"
                value={consulta.datos.aprovechamiento.altura_normativa}
              />
            )}
          </div>
        );

      case "restriccion_amenaza":
        return (
          <div className="space-y-2">
            <InfoField label="Valor" value={consulta.datos.valor || "N/A"} />
            <InfoField
              label="Condiciones de Riesgo"
              value={consulta.datos.condiciones_riesgo || "N/A"}
            />
            {consulta.datos.nivel_amenaza && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  Nivel de Amenaza:
                </span>
                <span
                  className={`text-sm font-medium ${
                    consulta.datos.nivel_amenaza === "Alta"
                      ? "text-red-600"
                      : consulta.datos.nivel_amenaza === "Media"
                      ? "text-yellow-600"
                      : consulta.datos.nivel_amenaza === "Baja"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {consulta.datos.nivel_amenaza}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">
                Tiene Restricción:
              </span>
              <span
                className={`text-sm font-medium ${
                  consulta.datos.tiene_restriccion
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {consulta.datos.tiene_restriccion ? "Sí" : "No"}
              </span>
            </div>
          </div>
        );

      case "restriccion_rios":
        return (
          <div className="space-y-2">
            <InfoField label="Valor" value={consulta.datos.valor || "N/A"} />
            <InfoField
              label="Restricción de Retiro"
              value={consulta.datos.restriccion_retiro || "Sin restricción"}
            />
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">
                Aplica Restricción:
              </span>
              <span
                className={`text-sm font-medium ${
                  consulta.datos.aplica_restriccion
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {consulta.datos.aplica_restriccion ? "Sí" : "No"}
              </span>
            </div>
            {consulta.datos.distancia_retiro_m && (
              <InfoField
                label="Distancia de Retiro"
                value={`${consulta.datos.distancia_retiro_m} metros`}
              />
            )}
            {consulta.datos.raw_data?.estructura_ecologica && (
              <InfoField
                label="Estructura Ecológica"
                value={consulta.datos.raw_data.estructura_ecologica}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header de la card */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {consulta.titulo}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{consulta.descripcion}</p>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              consulta.loading
                ? "bg-yellow-100 text-yellow-800"
                : consulta.error
                ? "bg-red-100 text-red-800"
                : consulta.datos
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {consulta.loading
              ? "🔄 Cargando..."
              : consulta.error
              ? "❌ Error"
              : consulta.datos
              ? "✅ Datos"
              : "⏳ Pendiente"}
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
            {renderConsultaData()}

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
