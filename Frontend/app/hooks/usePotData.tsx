import { useState, useEffect } from 'react';
import { extractPotDataFromText } from '~/utils/pot-analysis';
import { mockPotData } from '~/services/mock-data';

/**
 * Hook para obtener datos POT de un lote
 * @param cbml CBML del lote
 * @returns Datos del POT y estado de la carga
 */
export function usePotData(cbml: string) {
    const [potData, setPotData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Función para obtener los datos
        async function fetchPotData() {
            try {
                setLoading(true);

                // En desarrollo, usar datos mock
                if (process.env.NODE_ENV === "development") {
                    // Simular latencia
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Usar los datos mock si están disponibles
                    const mockData = mockPotData[cbml as keyof typeof mockPotData];

                    if (mockData) {
                        const extractedData = extractPotDataFromText(mockData);
                        setPotData({
                            rawText: mockData,
                            ...extractedData
                        });
                    } else {
                        // Si no hay datos mock para este CBML, generar datos aleatorios
                        const treatments = ["Renovación Urbana", "Desarrollo", "Consolidación", "Conservación", "Mejoramiento Integral"];
                        const usos = ["Residencial", "Comercial", "Industrial", "Dotacional", "Mixto"];
                        const clasificaciones = ["Urbano", "Rural", "Expansión"];

                        setPotData({
                            area: Math.floor(Math.random() * 10000) + 1000,
                            clasificacion: clasificaciones[Math.floor(Math.random() * clasificaciones.length)],
                            uso_suelo: `Uso ${usos[Math.floor(Math.random() * usos.length)]}`,
                            tratamiento: treatments[Math.floor(Math.random() * treatments.length)],
                            densidad: Math.floor(Math.random() * 300) + 50,
                            restricciones: Math.floor(Math.random() * 3),
                            rawText: `Datos POT simulados para ${cbml}`
                        });
                    }

                    setLoading(false);
                    return;
                }

                // En producción, hacer llamada real al API
                const apiUrl = process.env.API_URL || "http://localhost:8000";
                const response = await fetch(`${apiUrl}/api/lotes/${cbml}/pot`);

                if (!response.ok) {
                    throw new Error(`Error al obtener datos POT: ${response.status}`);
                }

                const data = await response.json();
                setPotData(data);
                setLoading(false);

            } catch (err: any) {
                console.error("Error obteniendo datos POT:", err);
                setError(err.message || "Error obteniendo datos POT");
                setLoading(false);
            }
        }

        // Llamar a la función si hay un CBML
        if (cbml) {
            fetchPotData();
        } else {
            setLoading(false);
            setError("No se proporcionó CBML");
        }
    }, [cbml]);

    return { potData, loading, error };
}