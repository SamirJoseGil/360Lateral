import { ActionFunction, json } from '@remix-run/node';
import { consultarPorCBML, consultarPorMatricula, consultarPorDireccion, MapGisResponseDetalle, MapGisResponseSearch } from '~/services/mapgis.server';

// Helper function to handle timeouts
const withTimeout = <T extends unknown>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return new Promise((resolve, reject) => {
        // Set up timeout
        const timeoutId = setTimeout(() => {
            reject(new Error(`La operación excedió el tiempo límite de ${timeoutMs / 1000} segundos`));
        }, timeoutMs);

        // Execute the original promise
        promise
            .then(result => {
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
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

        // Configurar timeout de 50 segundos
        const timeoutMs = 50000;

        // Ejecutar la consulta correspondiente según el tipo de búsqueda
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
        const result = await withTimeout<
            { resultado: MapGisResponseDetalle; headers: Headers; } | { resultado: MapGisResponseSearch; headers: Headers; }
        >(resultPromise, timeoutMs);
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