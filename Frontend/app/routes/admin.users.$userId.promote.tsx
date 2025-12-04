import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { getUserById } from "~/services/users.server";
import { getUser } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";
import { fetchWithAuth } from "~/utils/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const currentUser = await getUser(request);
    
    if (!currentUser || !currentUser.is_superuser) {
        throw new Response("No autorizado", { status: 403 });
    }
    
    const { userId } = params;
    const { user } = await getUserById(request, userId!);
    
    if (user.role === 'admin') {
        return redirect(`/admin/users/${userId}`);
    }
    
    return json({ user });
}

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const department = formData.get("department") as string;
    const permissions_scope = formData.get("permissions_scope") as string;
    
    try {
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/users/promote-to-admin/`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: params.userId,
                    department,
                    permissions_scope
                })
            }
        );
        
        if (!res.ok) {
            const error = await res.json();
            return json({ success: false, error: error.error }, { status: res.status });
        }
        
        const data = await res.json();
        
        return redirect(`/admin/users/${params.userId}`, {
            headers: setCookieHeaders
        });
        
    } catch (error) {
        return json({ 
            success: false, 
            error: 'Error al promover usuario' 
        }, { status: 500 });
    }
}

export default function PromoteToAdmin() {
    const { user } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    
    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Promover a Administrador
                </h1>
                
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Estás a punto de promover a <strong>{user.email}</strong> a Administrador.
                                Esta acción otorgará permisos administrativos al usuario.
                            </p>
                        </div>
                    </div>
                </div>
                
                {actionData?.error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500">
                        <p className="text-sm text-red-700">{actionData.error}</p>
                    </div>
                )}
                
                <Form method="post" className="space-y-6">
                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                            Departamento <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="department"
                            name="department"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lateral-500 focus:border-transparent"
                        >
                            <option value="">Selecciona un departamento</option>
                            <option value="ventas">Ventas</option>
                            <option value="operaciones">Operaciones</option>
                            <option value="soporte">Soporte</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="permissions_scope" className="block text-sm font-medium text-gray-700 mb-2">
                            Alcance de Permisos
                        </label>
                        <select
                            id="permissions_scope"
                            name="permissions_scope"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lateral-500 focus:border-transparent"
                        >
                            <option value="limited">Limitado</option>
                            <option value="full">Completo</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-lateral-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-lateral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Promoviendo...' : 'Promover a Admin'}
                        </button>
                        
                        <a
                            href={`/admin/users/${user.id}`}
                            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 text-center transition-colors"
                        >
                            Cancelar
                        </a>
                    </div>
                </Form>
            </div>
        </div>
    );
}
