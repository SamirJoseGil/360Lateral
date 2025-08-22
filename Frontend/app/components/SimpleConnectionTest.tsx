import { useEffect, useState } from 'react';

/**
 * Componente de test simple para verificar conectividad básica
 */
export function SimpleConnectionTest() {
    const [status, setStatus] = useState('Iniciando...');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    useEffect(() => {
        const testBasicFetch = async () => {
            addLog('🔍 Iniciando test de conectividad básica');

            try {
                // Test 1: Verificar que fetch existe
                if (typeof fetch === 'undefined') {
                    addLog('❌ fetch no está disponible');
                    setStatus('Error: fetch no disponible');
                    return;
                }
                addLog('✅ fetch está disponible');

                // Test 2: Verificar variables de entorno
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                addLog(`🌍 API URL: ${apiUrl}`);

                // Test 3: Hacer request básico sin autenticación
                addLog('📡 Haciendo request de prueba...');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(`${apiUrl}/api/auth/login/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: 'test@test.com',
                        password: 'wrongpassword'
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                addLog(`📨 Respuesta recibida: ${response.status}`);

                if (response.status === 400 || response.status === 401) {
                    addLog('✅ Backend responde correctamente (error 400/401 esperado)');
                    setStatus('✅ Conectividad OK');
                } else {
                    addLog(`⚠️ Respuesta inesperada: ${response.status}`);
                    setStatus('⚠️ Conectividad parcial');
                }

            } catch (error: any) {
                addLog(`❌ Error: ${error.message}`);

                if (error.name === 'AbortError') {
                    addLog('⏰ Timeout - Backend no responde');
                    setStatus('❌ Timeout');
                } else if (error.message?.includes('fetch')) {
                    addLog('🚨 Error de red - ¿Backend corriendo?');
                    setStatus('❌ Sin conectividad');
                } else {
                    addLog(`💥 Error desconocido: ${error}`);
                    setStatus('❌ Error desconocido');
                }
            }
        };

        testBasicFetch();
    }, []);

    return (
        <div style={{
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'monospace'
        }}>
            <h2>🔧 Test de Conectividad Simple</h2>

            <div style={{
                padding: '10px',
                margin: '10px 0',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px'
            }}>
                <strong>Estado:</strong> {status}
            </div>

            <div style={{
                maxHeight: '400px',
                overflow: 'auto',
                backgroundColor: '#1e1e1e',
                color: '#fff',
                padding: '10px',
                borderRadius: '4px'
            }}>
                <h3 style={{ color: '#fff' }}>📋 Logs:</h3>
                {logs.map((log, index) => (
                    <div key={index} style={{ fontSize: '12px', margin: '2px 0' }}>
                        {log}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px', fontSize: '14px' }}>
                <h4>📝 Instrucciones:</h4>
                <ol>
                    <li>Si ves "✅ Conectividad OK", el backend está funcionando</li>
                    <li>Si ves "❌ Timeout" o "Sin conectividad", el backend no está corriendo</li>
                    <li>Verificar que Django esté corriendo en: <code>http://localhost:8000</code></li>
                </ol>
            </div>
        </div>
    );
}