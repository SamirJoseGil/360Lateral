import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getUser, fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await getUser(request);
    
    if (!user) {
        return json({ error: 'No autenticado' }, { status: 401 });
    }

    const cbml = params.cbml;
    
    // ✅ CORREGIDO: Sin validaciones de longitud o formato
    if (!cbml) {
        return json({ 
            error: 'CBML no proporcionado',
            cbml 
        }, { status: 400 });
    }

    try {
        console.log(`[API MapGIS] Consultando CBML: ${cbml} para usuario ${user.email}`);
        
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/mapgis/consulta/cbml/${cbml}/`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[API MapGIS] Error ${res.status}: ${errorText}`);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText || 'Error al consultar MapGIS' };
            }
            
            return json({
                ...errorData,
                error: errorData.error || 'Error al consultar MapGIS',
                mensaje: errorData.mensaje || 'No se encontró información para este CBML en MapGIS.',
                cbml
            }, { 
                status: res.status,
                headers: setCookieHeaders 
            });
        }

        const data = await res.json();
        console.log(`[API MapGIS] ✅ Consulta exitosa para CBML: ${cbml}`);
        
        return json(data, { headers: setCookieHeaders });

    } catch (error) {
        console.error('[API MapGIS] Error:', error);
        return json({ 
            error: 'Error al consultar MapGIS',
            mensaje: error instanceof Error ? error.message : 'Error desconocido',
            cbml
        }, { status: 500 });
    }
}
