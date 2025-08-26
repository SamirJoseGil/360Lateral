// filepath: d:\Accesos Directos\Escritorio\frontendx\app\routes\owner.lote.$id.documentos.subir.tsx
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, Link } from "@remix-run/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { getLoteById, uploadDocumento } from "~/services/lotes.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    const loteId = params.id;
    if (!loteId) {
        return redirect("/owner/mis-lotes");
    }

    try {
        // Obtener información del lote
        const { lote, headers } = await getLoteById(request, loteId);

        return json({
            user,
            lote,
            headers
        });
    } catch (error) {
        console.error(`Error obteniendo lote ${loteId}:`, error);
        return redirect("/owner/mis-lotes");
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    // Verificar que el usuario esté autenticado y sea propietario
    const user = await getUser(request);
    if (!user) {
        return redirect("/login");
    }

    if (user.role !== "owner") {
        return redirect(`/${user.role}`);
    }

    const loteId = params.id;
    if (!loteId) {
        return redirect("/owner/mis-lotes");
    }

    try {
        // Procesar el formulario
        const formData = await request.formData();

        // Verificar que se ha enviado un archivo
        const archivo = formData.get("archivo");
        if (!archivo || !(archivo instanceof File) || archivo.size === 0) {
            return json({
                error: "Debe seleccionar un archivo para subir",
                values: {
                    tipo: formData.get("tipo"),
                    descripcion: formData.get("descripcion")
                }
            });
        }

        // Verificar que se ha seleccionado un tipo
        const tipo = formData.get("tipo");
        if (!tipo) {
            return json({
                error: "Debe seleccionar un tipo de documento",
                values: {
                    tipo: formData.get("tipo"),
                    descripcion: formData.get("descripcion")
                }
            });
        }

        // Crear un nuevo FormData para enviar al servidor
        const serverFormData = new FormData();
        serverFormData.append("file", archivo);
        serverFormData.append("tipo", tipo.toString());

        const descripcion = formData.get("descripcion");
        if (descripcion) {
            serverFormData.append("descripcion", descripcion.toString());
        }

        // Subir el documento
        const resultado = await uploadDocumento(request, loteId, serverFormData);

        // Redirigir a la página de documentos del lote
        return redirect(`/owner/lote/${loteId}/documentos`, {
            headers: resultado.headers
        });
    } catch (error) {
        console.error(`Error subiendo documento para el lote ${loteId}:`, error);
        return json({
            error: "Error al subir el documento. Por favor intente nuevamente.",
            values: Object.fromEntries(await request.formData())
        });
    }
}

export default function SubirDocumento() {
    const { lote } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center">
                <Link
                    to={`/owner/lote/${lote.id}/documentos`}
                    className="mr-4 text-indigo-600 hover:text-indigo-900"
                >
                    ← Volver a documentos
                </Link>
                <h1 className="text-2xl font-bold">Subir Documento</h1>
            </div>

            <div className="mb-4 text-sm">
                <p>Lote: <span className="font-medium">{lote.nombre}</span></p>
                <p>Dirección: <span className="font-medium">{lote.direccion}</span></p>
            </div>

            {actionData?.error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{actionData.error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Form method="post" encType="multipart/form-data" className="p-6">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo de Documento *</label>
                            <div className="mt-1">
                                <select
                                    name="tipo"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    defaultValue={typeof actionData?.values?.tipo === "string" ? actionData.values.tipo : ""}
                                    required
                                >
                                    <option value="">Seleccionar tipo de documento</option>
                                    <option value="escritura">Escritura</option>
                                    <option value="plano">Plano</option>
                                    <option value="certificado_libertad">Certificado de Libertad</option>
                                    <option value="impuesto_predial">Impuesto Predial</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Archivo *</label>
                            <div className="mt-1 flex items-center">
                                <input
                                    type="file"
                                    name="archivo"
                                    id="archivo"
                                    className="sr-only"
                                    onChange={handleFileChange}
                                    required
                                />
                                <label
                                    htmlFor="archivo"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                >
                                    <div className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm">
                                        {selectedFile ? selectedFile.name : "Seleccionar archivo"}
                                    </div>
                                </label>
                                {selectedFile && (
                                    <span className="ml-2 text-sm text-gray-500">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Formatos permitidos: PDF, JPG, PNG. Tamaño máximo: 10MB
                            </p>
                        </div>

                        <div>
                            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                                Descripción (opcional)
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    rows={3}
                                    placeholder="Añada una descripción del documento..."
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    defaultValue={typeof actionData?.values?.descripcion === "string" ? actionData.values.descripcion : ""}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link
                                to={`/owner/lote/${lote.id}/documentos`}
                                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {isSubmitting ? "Subiendo..." : "Subir Documento"}
                            </button>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}