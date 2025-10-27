import { ActionFunctionArgs, json } from "@remix-run/node";
import { consultarPorMatricula } from "~/services/mapgis.server";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const formData = await request.formData();
        const matricula = formData.get("matricula") as string;

        if (!matricula) {
            return json({
                success: false,
                error: "Matrícula es requerida"
            }, { status: 400 });
        }

        console.log(`🔍 API MapGIS: Buscando matrícula ${matricula}`);

        const resultado = await consultarPorMatricula(request, matricula);

        console.log(`📊 API MapGIS: Resultado:`, {
            success: resultado.success,
            encontrado: resultado.encontrado
        });

        return json(resultado);

    } catch (error) {
        console.error("❌ Error en API MapGIS:", error);
        return json({
            success: false,
            error: "Error interno del servidor"
        }, { status: 500 });
    }
}
