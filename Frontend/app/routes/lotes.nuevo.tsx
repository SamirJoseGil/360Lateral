import { useState } from 'react';
import { ActionFunction, LoaderFunction, json, redirect } from '@remix-run/node';
import { useActionData, useLoaderData } from '@remix-run/react';
import { getUser } from '~/utils/auth.server';
import { recordEvent } from '~/services/stats.server';
import EnhancedMapGisSearch from '~/components/EnhancedMapGisSearch';
import LoteForm from '~/components/LoteForm';
import type { MapGisLoteDetalle } from '~/services/mapgis.server';

// Loader para verificar autenticación y permisos
export const loader: LoaderFunction = async ({ request }) => {
    // Verificar autenticación
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    // Solo propietarios y administradores pueden crear lotes
    if (user.role !== "owner" && user.role !== "admin") {
        return redirect(`/${user.role}`);
    }

    // Registrar evento de acceso a la creación de lotes
    try {
        await recordEvent(request, {
            type: "view",
            name: "create_lote_page",
            value: {
                user_id: user.id,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error registrando evento:", error);
    }

    return json({ user });
};

// Action para procesar la creación del lote
export const action: ActionFunction = async ({ request }) => {
    try {
        const formData = await request.formData();

        // Aquí procesaríamos los datos del formulario y crearíamos el lote en la base de datos
        // Por ejemplo, convertir formData a un objeto y hacer una llamada a la API
        const loteData = Object.fromEntries(formData);

        // Llamada a API para crear el lote
        // const response = await createLote(request, loteData);

        // Redirigir a la lista de lotes o a la vista del lote creado
        return redirect('/lotes');

    } catch (error) {
        console.error('Error al crear lote:', error);
        return json({
            error: error instanceof Error ? error.message : 'Error desconocido al crear el lote'
        }, { status: 500 });
    }
};

export default function NuevoLote() {
    const loaderData = useLoaderData();
    const actionData = useActionData();

    // Estado para almacenar los datos obtenidos de MapGIS
    const [mapGisData, setMapGisData] = useState<MapGisLoteDetalle | null>(null);

    // Manejar los resultados de la búsqueda de MapGIS
    const handleMapGisResult = (data: MapGisLoteDetalle) => {
        setMapGisData(data);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Crear Nuevo Lote</h1>

            {!mapGisData ? (
                <EnhancedMapGisSearch onResult={handleMapGisResult} />
            ) : (
                <div className="space-y-4">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <p className="font-bold">Datos de lote encontrados</p>
                        <p>Se ha encontrado información para el lote con CBML: {mapGisData.cbml}</p>
                        <button
                            onClick={() => setMapGisData(null)}
                            className="text-sm underline mt-2"
                        >
                            Realizar otra búsqueda
                        </button>
                    </div>

                    <LoteForm mapGisData={mapGisData} />
                </div>
            )}
        </div>
    );
}