import { Form } from "@remix-run/react";
import { SearchTypeSelector } from "~/components/molecules/SearchTypeSelector";
import { TipoBusqueda } from "~/services/mapgis";

interface SearchFormProps {
  tipoBusqueda: TipoBusqueda;
  onTipoBusquedaChange: (tipo: TipoBusqueda) => void;
  isLoading: boolean;
}

export function SearchForm({
  tipoBusqueda,
  onTipoBusquedaChange,
  isLoading,
}: SearchFormProps) {
  const getPlaceholder = () => {
    switch (tipoBusqueda) {
      case "matricula":
        return "Ej: 01N-0123456";
      case "direccion":
        return "Ej: Calle 10 # 20-30, El Poblado";
      case "cbml":
        return "Ej: 14180230004";
      default:
        return "";
    }
  };

  const getLabel = () => {
    switch (tipoBusqueda) {
      case "matricula":
        return "Matrícula Inmobiliaria";
      case "direccion":
        return "Dirección";
      case "cbml":
        return "Código CBML";
      default:
        return "Valor";
    }
  };

  const getHelpText = () => {
    switch (tipoBusqueda) {
      case "matricula":
        return "Formato: números, letras y guiones (ej: 01N-1234567)";
      case "direccion":
        return "Dirección completa con barrio/comuna";
      case "cbml":
        return "Código numérico de al menos 10 dígitos";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <Form method="post" className="space-y-6" replace>
        <SearchTypeSelector
          value={tipoBusqueda}
          onChange={onTipoBusquedaChange}
          disabled={isLoading}
        />

        {/* Campo de Búsqueda */}
        <div>
          <label
            htmlFor="valor"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
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
            "🔍 Buscar en MapGIS"
          )}
        </button>
      </Form>
    </div>
  );
}
