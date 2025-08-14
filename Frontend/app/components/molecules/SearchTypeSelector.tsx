import { TipoBusqueda } from "~/services/mapgis";

interface SearchOption {
  value: TipoBusqueda;
  label: string;
  recommended?: boolean;
}

interface SearchTypeSelectorProps {
  value: TipoBusqueda;
  onChange: (value: TipoBusqueda) => void;
  disabled?: boolean;
}

export function SearchTypeSelector({
  value,
  onChange,
  disabled = false,
}: SearchTypeSelectorProps) {
  const options: SearchOption[] = [
    {
      value: "cbml",
      label: "🔢 CBML",
      recommended: true,
    },
    {
      value: "matricula",
      label: "📄 Matrícula",
    },
    {
      value: "direccion",
      label: "📍 Dirección",
    },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Búsqueda
      </label>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              value === option.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:bg-gray-50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="tipoBusqueda"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value as TipoBusqueda)}
              disabled={disabled}
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
  );
}
