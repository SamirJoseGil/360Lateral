# Análisis POT y Vendibilidad de Lotes

Este módulo permite analizar los datos del Plan de Ordenamiento Territorial (POT) para un lote y determinar su vendibilidad basado en diferentes criterios urbanísticos.

## Componentes Disponibles

### 1. `PotAnalysis`

Componente principal que muestra el análisis completo del POT y la vendibilidad de un lote.

```tsx
import PotAnalysis from "~/components/PotAnalysis";

<PotAnalysis potData={potData} />
```

**Props:**
- `potData`: Objeto con datos del POT o string con texto descriptivo del POT.

### 2. `LotePotSection`

Componente de alto nivel que integra automáticamente la carga de datos POT y muestra el análisis. Solo necesita el CBML del lote.

```tsx
import LotePotSection from "~/components/LotePotSection";

<LotePotSection cbml="14220250008" compact={false} />
```

**Props:**
- `cbml`: CBML del lote para buscar sus datos POT.
- `compact`: (opcional) Si es `true`, muestra una versión resumida. Por defecto es `false`.

### 3. Hook `usePotData`

Hook personalizado para obtener datos POT para un lote.

```tsx
import { usePotData } from "~/hooks/usePotData";

function MiComponente({ cbml }) {
  const { potData, loading, error } = usePotData(cbml);
  
  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;
  
  return (
    <div>
      <h2>Datos POT</h2>
      <p>Tratamiento: {potData?.tratamiento}</p>
      {/* Más datos... */}
    </div>
  );
}
```

## Utilidades

### Análisis de Vendibilidad

```tsx
import { analyzeSellability } from "~/utils/pot-analysis";

const potData = {
  area: 13220.27,
  clasificacion: "Urbano",
  uso_suelo: "Uso Dotacional - No Aplica",
  tratamiento: "Renovación Urbana",
  densidad: 250.0,
  restricciones: 2
};

const resultado = analyzeSellability(potData);
console.log(`¿Se puede vender? ${resultado.canSell}`);
console.log(`Puntaje: ${resultado.score}/100`);
console.log("Razones:", resultado.reasons);
console.log("Recomendaciones:", resultado.recommendations);
```

### Extracción de Datos POT de Texto

```tsx
import { extractPotDataFromText } from "~/utils/pot-analysis";

const textoDelPot = `INFO 📊 Datos encontrados para CBML 14220250008:
INFO    - Área: 13220.27 m²
INFO    - Clasificación: Urbano
INFO    - Uso del suelo: Uso Dotacional - No Aplica
INFO    - Tratamiento: Renovación Urbana
INFO    - Densidad: 250.0 viv/ha
INFO    - Restricciones: 2 tipos identificados`;

const datosExtraidos = extractPotDataFromText(textoDelPot);
console.log(datosExtraidos);
```

## Integración en Detalle de Lote

Para integrar el análisis POT en una vista de detalle de lote, simplemente añade el componente `LotePotSection` y pásale el CBML del lote:

```tsx
export default function DetalleLote() {
  const { lote } = useLoaderData<typeof loader>();
  
  return (
    <div>
      {/* Información básica del lote */}
      <h1>Lote {lote.cbml}</h1>
      <p>Dirección: {lote.direccion}</p>
      
      {/* Otras secciones... */}
      
      {/* Análisis POT */}
      <LotePotSection cbml={lote.cbml} />
      
      {/* Más secciones... */}
    </div>
  );
}
```

## Datos de Tratamientos Implementados

El sistema incluye información detallada sobre los siguientes tratamientos urbanísticos:

1. **Renovación Urbana**
2. **Desarrollo**
3. **Consolidación**
4. **Conservación**
5. **Mejoramiento Integral**

Para cada tratamiento se incluye:
- Descripción
- Implicaciones
- Requisitos
- Oportunidades

## Cálculo de Vendibilidad

El algoritmo calcula un puntaje de 0 a 100 considerando:

- Tipo de tratamiento urbanístico
- Uso del suelo
- Clasificación (urbano, rural, expansión)
- Densidad permitida
- Restricciones existentes

Un lote se considera "vendible" si:
1. No tiene restricciones críticas (como zonas de protección ambiental)
2. Tiene un puntaje superior a 30