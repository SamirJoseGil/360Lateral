/**
 * Utilidad para analizar datos POT y determinar si un lote puede venderse
 */

/**
 * Estructura de datos POT
 */
export interface PotData {
  area?: number;
  clasificacion?: string;
  uso_suelo?: string;
  tratamiento?: string;
  densidad?: number;
  restricciones?: number;
  detalles_restricciones?: string[];
}

/**
 * Resultado del análisis de vendibilidad
 */
export interface SellabilityResult {
  canSell: boolean;
  reasons: string[];
  score: number; // 0-100, donde 100 es perfectamente vendible
  recommendations: string[];
  treatmentDetails?: TreatmentDetails;
}

/**
 * Detalles específicos del tratamiento
 */
export interface TreatmentDetails {
  name: string;
  description: string;
  implications: string[];
  requirements: string[];
  opportunities: string[];
}

/**
 * Información de tratamientos POT
 */
const TREATMENTS_INFO: Record<string, TreatmentDetails> = {
  "Renovación Urbana": {
    name: "Renovación Urbana",
    description: "Busca la transformación de zonas desarrolladas que tienen condiciones de subutilización o deterioro.",
    implications: [
      "Permite mayor edificabilidad y cambios de uso",
      "Requiere plan parcial o plan de renovación",
      "Puede requerir integración inmobiliaria"
    ],
    requirements: [
      "Estudio de impacto urbano",
      "Plan parcial aprobado",
      "Gestión asociada de propietarios"
    ],
    opportunities: [
      "Mayor edificabilidad",
      "Posibilidad de usos mixtos",
      "Incentivos fiscales posibles"
    ]
  },
  "Desarrollo": {
    name: "Desarrollo",
    description: "Orienta y regula la urbanización de terrenos o conjunto de terrenos urbanizables no urbanizados.",
    implications: [
      "Requiere plan parcial",
      "Necesita licencia de urbanización",
      "Cesiones obligatorias para espacio público"
    ],
    requirements: [
      "Plan parcial aprobado",
      "Estudios técnicos (suelos, ambiental)",
      "Licencia de urbanización"
    ],
    opportunities: [
      "Desarrollo completo según normativa vigente",
      "Posibilidad de etapas de desarrollo",
      "Flexibilidad en diseño urbano"
    ]
  },
  "Consolidación": {
    name: "Consolidación",
    description: "Busca mantener las condiciones urbanas existentes con posibilidades de densificación moderada.",
    implications: [
      "Permite densificación controlada",
      "Mantiene estructura urbana existente",
      "Limita cambios drásticos de uso"
    ],
    requirements: [
      "Licencia de construcción",
      "Respetar índices de edificabilidad",
      "Mantener usos principales establecidos"
    ],
    opportunities: [
      "Desarrollo predial individual",
      "Posibilidad de subdivisión en algunos casos",
      "Mejora de edificaciones existentes"
    ]
  },
  "Conservación": {
    name: "Conservación",
    description: "Orientado a proteger el patrimonio construido, ambiental o paisajístico.",
    implications: [
      "Restricciones significativas a modificaciones",
      "Protección de elementos patrimoniales",
      "Control estricto de intervenciones"
    ],
    requirements: [
      "Estudios patrimoniales",
      "Aprobación de entidades de patrimonio",
      "Licencias especiales de intervención"
    ],
    opportunities: [
      "Incentivos para conservación",
      "Potencial turístico y cultural",
      "Valor agregado por carácter patrimonial"
    ]
  },
  "Mejoramiento Integral": {
    name: "Mejoramiento Integral",
    description: "Busca superar condiciones de marginalidad con integración a la estructura de la ciudad.",
    implications: [
      "Orientado a barrios informales o marginales",
      "Prioriza infraestructura y equipamientos",
      "Busca regularización urbanística"
    ],
    requirements: [
      "Programas de mejoramiento barrial",
      "Estudios sociales y técnicos",
      "Participación comunitaria"
    ],
    opportunities: [
      "Mejora de condiciones habitacionales",
      "Legalización de asentamientos",
      "Integración a servicios urbanos"
    ]
  }
};

/**
 * Criterios de restricción que impiden la venta
 */
const RESTRICTING_CRITERIA = [
  "Zona de protección ambiental",
  "Reserva forestal",
  "Riesgo no mitigable",
  "Zona de ronda hídrica",
  "Humedal",
  "Área protegida"
];

/**
 * Analiza los datos POT para determinar si un lote puede venderse
 * @param potData Datos del POT del lote
 * @returns Resultado del análisis de vendibilidad
 */
export function analyzeSellability(potData: PotData): SellabilityResult {
  const result: SellabilityResult = {
    canSell: true,
    reasons: [],
    score: 100,
    recommendations: [],
  };

  // Si no hay datos POT, asumimos que se puede vender pero con advertencias
  if (!potData || Object.keys(potData).length === 0) {
    result.canSell = true;
    result.score = 50;
    result.reasons.push("No hay datos POT disponibles para evaluar");
    result.recommendations.push("Solicitar un estudio POT detallado antes de proceder");
    return result;
  }

  // 1. Verificar restricciones graves que impiden la venta
  if (potData.restricciones && potData.restricciones > 0) {
    result.score -= potData.restricciones * 20; // Cada restricción reduce el puntaje
    
    // Si hay restricciones específicas, verificarlas
    if (potData.detalles_restricciones && potData.detalles_restricciones.length > 0) {
      for (const restriccion of potData.detalles_restricciones) {
        if (RESTRICTING_CRITERIA.some(criteria => restriccion.includes(criteria))) {
          result.canSell = false;
          result.reasons.push(`Restricción crítica: ${restriccion}`);
          result.score -= 50;
        } else {
          result.reasons.push(`Restricción: ${restriccion}`);
        }
      }
    } else {
      result.reasons.push(`Tiene ${potData.restricciones} restricciones no detalladas`);
      result.recommendations.push("Solicitar detalles específicos de las restricciones");
    }
  }

  // 2. Analizar por tratamiento
  if (potData.tratamiento) {
    const treatmentInfo = TREATMENTS_INFO[potData.tratamiento] || {
      name: potData.tratamiento,
      description: "Tratamiento sin información detallada",
      implications: ["Consultar normativa específica"],
      requirements: ["Verificar con planeación municipal"],
      opportunities: ["Consultar con expertos urbanísticos"]
    };
    
    result.treatmentDetails = treatmentInfo;
    
    // Ajustar score según el tratamiento
    switch (potData.tratamiento) {
      case "Renovación Urbana":
        result.score += 10;
        result.recommendations.push("Ideal para proyectos de redesarrollo con alta edificabilidad");
        break;
      case "Desarrollo":
        result.score += 15;
        result.recommendations.push("Apto para nuevos desarrollos urbanísticos completos");
        break;
      case "Conservación":
        result.score -= 20;
        result.recommendations.push("Limitaciones significativas por conservación patrimonial");
        break;
      case "Mejoramiento Integral":
        result.score -= 10;
        result.recommendations.push("Puede requerir inversiones adicionales en infraestructura");
        break;
    }
  } else {
    result.recommendations.push("Verificar el tipo de tratamiento urbanístico aplicable");
  }

  // 3. Verificar uso del suelo
  if (potData.uso_suelo) {
    if (potData.uso_suelo.includes("Dotacional") || potData.uso_suelo.includes("Institucional")) {
      result.score -= 15;
      result.recommendations.push("Uso dotacional puede limitar opciones comerciales");
    } else if (potData.uso_suelo.includes("Residencial")) {
      result.score += 10;
      result.recommendations.push("Uso residencial favorable para desarrollo inmobiliario");
    } else if (potData.uso_suelo.includes("Comercial")) {
      result.score += 5;
      result.recommendations.push("Uso comercial con buen potencial de valorización");
    } else if (potData.uso_suelo.includes("Industrial")) {
      // Neutro para uso industrial
      result.recommendations.push("Verificar compatibilidad de usos industriales con la zona");
    }
  }

  // 4. Evaluar por clasificación
  if (potData.clasificacion) {
    if (potData.clasificacion === "Urbano") {
      result.score += 5;
    } else if (potData.clasificacion === "Rural") {
      result.score -= 10;
      result.recommendations.push("Suelo rural tiene mayores limitaciones para desarrollo");
    } else if (potData.clasificacion === "Expansión") {
      result.recommendations.push("Suelo de expansión requiere plan parcial para desarrollo");
    }
  }

  // 5. Analizar densidad
  if (potData.densidad) {
    if (potData.densidad > 200) {
      result.score += 10;
      result.recommendations.push("Alta densidad permite mejor aprovechamiento");
    } else if (potData.densidad < 50) {
      result.score -= 5;
      result.recommendations.push("Baja densidad limita aprovechamiento constructivo");
    }
  }

  // Ajustar el score final dentro del rango 0-100
  result.score = Math.max(0, Math.min(100, result.score));
  
  // Determinar si se puede vender basado en el score
  if (result.score < 30 && result.canSell) {
    result.canSell = false;
    result.reasons.push("Puntaje de viabilidad demasiado bajo");
  }
  
  // Si no hay razones específicas pero no es vendible
  if (!result.canSell && result.reasons.length === 0) {
    result.reasons.push("Combinación de factores desfavorables");
  }

  // Si es vendible pero con score bajo, agregar recomendación
  if (result.canSell && result.score < 50) {
    result.recommendations.push("Vendible pero con condiciones significativas a considerar");
  }

  return result;
}

/**
 * Extrae datos POT de un texto descriptivo (para uso con respuestas de la API)
 * @param text Texto con información POT
 * @returns Datos estructurados del POT
 */
export function extractPotDataFromText(text: string): PotData {
  const potData: PotData = {};
  
  // Extraer área
  const areaMatch = text.match(/Área: ([\d,.]+) m²/);
  if (areaMatch && areaMatch[1]) {
    potData.area = parseFloat(areaMatch[1].replace(/,/g, ''));
  }
  
  // Extraer clasificación
  const clasificacionMatch = text.match(/Clasificación: (.+?)(?:\n|$)/);
  if (clasificacionMatch && clasificacionMatch[1]) {
    potData.clasificacion = clasificacionMatch[1].trim();
  }
  
  // Extraer uso del suelo
  const usoMatch = text.match(/Uso del suelo: (.+?)(?:\n|$)/);
  if (usoMatch && usoMatch[1]) {
    potData.uso_suelo = usoMatch[1].trim();
  }
  
  // Extraer tratamiento
  const tratamientoMatch = text.match(/Tratamiento: (.+?)(?:\n|$)/);
  if (tratamientoMatch && tratamientoMatch[1]) {
    potData.tratamiento = tratamientoMatch[1].trim();
  }
  
  // Extraer densidad
  const densidadMatch = text.match(/Densidad: ([\d,.]+) viv\/ha/);
  if (densidadMatch && densidadMatch[1]) {
    potData.densidad = parseFloat(densidadMatch[1].replace(/,/g, ''));
  }
  
  // Extraer restricciones
  const restriccionesMatch = text.match(/Restricciones: (\d+) tipos identificados/);
  if (restriccionesMatch && restriccionesMatch[1]) {
    potData.restricciones = parseInt(restriccionesMatch[1]);
  }
  
  return potData;
}