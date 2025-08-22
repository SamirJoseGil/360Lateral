import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth';
import { UserService } from '../services/users';
import type { User, LoginData, RegisterData } from '../types';

/**
 * Ejemplo de componente que usa los servicios configurados
 * Demuestra la conectividad con el backend Django
 */
export function TestConnection() {
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');
    const [user, setUser] = useState<User | null>(null);

    /**
     * Test de conectividad con el backend
     */
    const testConnection = async () => {
        setStatus('testing');
        setMessage('Probando conexión con el backend...');

        try {
            // Verificar si ya está autenticado
            if (AuthService.isAuthenticated()) {
                const currentUser = await AuthService.getCurrentUser();
                setUser(currentUser);
                setMessage(`✅ Conectado exitosamente como: ${currentUser.first_name} ${currentUser.last_name} (${currentUser.role})`);
                setStatus('success');
                return;
            }

            // Si no está autenticado, mostrar estado
            setMessage('❌ No hay sesión activa. Necesita hacer login.');
            setStatus('error');

        } catch (error: any) {
            console.error('Connection test failed:', error);
            setMessage(`❌ Error de conexión: ${error.message || 'No se pudo conectar al backend'}`);
            setStatus('error');
        }
    };

    /**
     * Test de login con credenciales de prueba
     */
    const testLogin = async () => {
        setStatus('testing');
        setMessage('Probando login...');

        const testCredentials: LoginData = {
            email: 'admin@test.com',
            password: 'TestPass123!'
        };

        try {
            const response = await AuthService.login(testCredentials);
            setUser(response.user);
            setMessage(`✅ Login exitoso: ${response.user.first_name} ${response.user.last_name}`);
            setStatus('success');
        } catch (error: any) {
            console.error('Login test failed:', error);

            let errorMessage = 'Error de login';
            if (error.status_code === 429) {
                errorMessage = 'Rate limit alcanzado. Intente más tarde.';
            } else if (error.field_errors) {
                errorMessage = `Errores de validación: ${Object.keys(error.field_errors).join(', ')}`;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMessage(`❌ ${errorMessage}`);
            setStatus('error');
        }
    };

    /**
     * Test de obtener lista de usuarios
     */
    const testUsersList = async () => {
        setStatus('testing');
        setMessage('Probando obtener lista de usuarios...');

        try {
            const users = await UserService.getUsers();
            setMessage(`✅ Usuarios obtenidos exitosamente: ${users.count} usuario(s)`);
            setStatus('success');
        } catch (error: any) {
            console.error('Users list test failed:', error);

            let errorMessage = 'Error al obtener usuarios';
            if (error.status_code === 401) {
                errorMessage = 'No autenticado. Haga login primero.';
            } else if (error.status_code === 403) {
                errorMessage = 'Sin permisos para ver otros usuarios.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMessage(`❌ ${errorMessage}`);
            setStatus('error');
        }
    };

    /**
     * Logout
     */
    const testLogout = async () => {
        setStatus('testing');
        setMessage('Cerrando sesión...');

        try {
            await AuthService.logout();
            setUser(null);
            setMessage('✅ Sesión cerrada exitosamente');
            setStatus('success');
        } catch (error: any) {
            console.error('Logout test failed:', error);
            setMessage(`❌ Error al cerrar sesión: ${error.message || 'Error desconocido'}`);
            setStatus('error');
        }
    };

    // Test inicial al cargar
    useEffect(() => {
        testConnection();
    }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>🔧 Test de Conexión - Frontend → Backend</h2>

            <div style={{ marginBottom: '20px' }}>
                <h3>Estado de Conexión:</h3>
                <div style={{
                    padding: '10px',
                    borderRadius: '4px',
                    backgroundColor: status === 'success' ? '#d4edda' : status === 'error' ? '#f8d7da' : '#fff3cd',
                    border: `1px solid ${status === 'success' ? '#c3e6cb' : status === 'error' ? '#f5c6cb' : '#ffeaa7'}`
                }}>
                    {status === 'testing' && '🔄 '}
                    {message}
                </div>
            </div>

            {user && (
                <div style={{ marginBottom: '20px' }}>
                    <h3>👤 Usuario Actual:</h3>
                    <ul>
                        <li><strong>Nombre:</strong> {user.first_name} {user.last_name}</li>
                        <li><strong>Email:</strong> {user.email}</li>
                        <li><strong>Rol:</strong> {user.role}</li>
                        <li><strong>Activo:</strong> {user.is_active ? 'Sí' : 'No'}</li>
                        <li><strong>Fecha registro:</strong> {new Date(user.date_joined).toLocaleDateString()}</li>
                    </ul>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                    onClick={testConnection}
                    disabled={status === 'testing'}
                    style={{ padding: '8px 16px' }}
                >
                    🔄 Test Conexión
                </button>

                <button
                    onClick={testLogin}
                    disabled={status === 'testing'}
                    style={{ padding: '8px 16px' }}
                >
                    🔑 Test Login
                </button>

                <button
                    onClick={testUsersList}
                    disabled={status === 'testing' || !AuthService.isAuthenticated()}
                    style={{ padding: '8px 16px' }}
                >
                    👥 Test Lista Usuarios
                </button>

                <button
                    onClick={testLogout}
                    disabled={status === 'testing' || !AuthService.isAuthenticated()}
                    style={{ padding: '8px 16px' }}
                >
                    🚪 Logout
                </button>
            </div>

            <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
                <h4>📋 Checklist de Configuración:</h4>
                <ul>
                    <li>✅ Backend Django corriendo en http://localhost:8000</li>
                    <li>✅ Frontend configurado para conectarse al backend</li>
                    <li>✅ Servicios de autenticación implementados</li>
                    <li>✅ Rate limiting del lado del cliente</li>
                    <li>✅ Manejo automático de tokens JWT</li>
                    <li>✅ Validaciones según documentación</li>
                </ul>

                <p><strong>Para probar:</strong></p>
                <ol>
                    <li>Asegúrese de que el backend esté corriendo</li>
                    <li>Cree un usuario admin en Django</li>
                    <li>Use las credenciales en "Test Login"</li>
                </ol>
            </div>
        </div>
    );
}