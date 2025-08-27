import { ActionFunction, json } from '@remix-run/node';
import { consultarPorCBML, consultarPorMatricula, consultarPorDireccion } from '~/services/mapgis.server';

// Función auxiliar para manejar el timeout
const withTimeout = async (promise: Promise<any>, timeoutMs = 50000): Promise<any> => {
    let timeoutId: NodeJS.Timeout | undefined = undefined;

    // Crear una promesa que se rechaza después de cierto tiempo
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`La operación excedió el tiempo límite de ${timeoutMs / 1000} segundos`));
        }, timeoutMs);
    });

    try {
        // Race entre la promesa original y el timeout
        const result = await Promise.race([promise, timeoutPromise]);
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        return result;
    } catch (error) {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        throw error;
    }
};

export const action: ActionFunction = async ({ request }) => {
    try {
        const formData = await request.formData();
        const searchType = formData.get('searchType')?.toString();
        const searchValue = formData.get('searchValue')?.toString();

        if (!searchType || !searchValue) {
            return json({
                success: false,
                error: 'Tipo de búsqueda o valor no proporcionados'
            }, { status: 400 });
        }

        // Configurar el timeout para la consulta (50 segundos)
        const timeoutMs = 50000;
        let resultPromise;

        switch (searchType) {
            case 'cbml':
                resultPromise = consultarPorCBML(request, searchValue);
                break;
            case 'matricula':
                resultPromise = consultarPorMatricula(request, searchValue);
                break;
            case 'direccion':
                resultPromise = consultarPorDireccion(request, searchValue);
                break;
            default:
                return json({
                    success: false,
                    error: `Tipo de búsqueda inválido: ${searchType}`
                }, { status: 400 });
        }

        // Ejecutar la consulta con timeout
        const result = await withTimeout(resultPromise, timeoutMs);

        return json({
            success: true,
            data: result.resultado
        }, {
            headers: result.headers
        });

    } catch (error) {
        console.error('Error en API de búsqueda MapGIS:', error);

        // Determinar si el error es un timeout
        const isTimeout = error instanceof Error &&
            error.message.includes('excedió el tiempo límite');

        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido al buscar en MapGIS',
            isTimeout: isTimeout
        }, { status: isTimeout ? 504 : 500 });
    }
};