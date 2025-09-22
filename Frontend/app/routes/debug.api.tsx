import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getApiDebugInfo } from "~/utils/api";
import { getEnvDebugInfo } from "~/env.server";

export const loader: LoaderFunction = async () => {
    const serverDebugInfo = getEnvDebugInfo();

    // Intentar hacer una petición al backend para verificar conectividad
    let backendStatus = 'unknown';
    let backendError = null;

    try {
        const response = await fetch(`${serverDebugInfo.API_BASE_URL.replace('/api', '')}/`, {
            method: 'GET',
            timeout: 5000,
        });
        backendStatus = response.ok ? 'connected' : `error-${response.status}`;
    } catch (error) {
        backendStatus = 'disconnected';
        backendError = error instanceof Error ? error.message : 'Unknown error';
    }

    return json({
        server: serverDebugInfo,
        backendStatus,
        backendError,
        timestamp: new Date().toISOString(),
    });
};

export default function DebugApi() {
    const data = useLoaderData<typeof loader>();
    const clientDebugInfo = getApiDebugInfo();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">🔍 API Debug Information</h1>

            <div className="grid gap-6">
                {/* Server Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">🖥️ Server (SSR) Configuration</h2>
                    <pre className="bg-white p-3 rounded text-sm overflow-auto">
                        {JSON.stringify(data.server, null, 2)}
                    </pre>
                </div>

                {/* Client Info */}
                <div className="bg-green-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">🌐 Client Configuration</h2>
                    <pre className="bg-white p-3 rounded text-sm overflow-auto">
                        {JSON.stringify(clientDebugInfo, null, 2)}
                    </pre>
                </div>

                {/* Backend Status */}
                <div className={`p-4 rounded-lg ${data.backendStatus === 'connected' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <h2 className="text-lg font-semibold mb-3">🔗 Backend Connection Status</h2>
                    <div className="space-y-2">
                        <p><strong>Status:</strong>
                            <span className={`ml-2 px-2 py-1 rounded text-sm ${data.backendStatus === 'connected' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                }`}>
                                {data.backendStatus}
                            </span>
                        </p>
                        {data.backendError && (
                            <p><strong>Error:</strong> <code className="bg-white px-2 py-1 rounded">{data.backendError}</code></p>
                        )}
                        <p><strong>Timestamp:</strong> {data.timestamp}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">🛠️ Actions</h2>
                    <div className="space-x-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Refresh
                        </button>
                        <a
                            href="http://localhost:8000/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
                        >
                            Test Backend Direct
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
