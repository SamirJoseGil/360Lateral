import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from '@remix-run/react';
import { useAuthContext } from '~/components/auth/AuthProvider';
import { useForm } from '~/hooks/useForm';
import { LoginCredentials } from '~/types/auth';
import { normalizeRole, getDashboardPath } from '~/utils/navPermissions';

export default function Login() {
  const { login, isAuthenticated, user, authError: contextAuthError } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref para controlar redirecciones
  const redirectAttemptedRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener la ruta de redirección desde el state o usar dashboard según rol
  const from = location.state?.from?.pathname;

  // Log cuando se monta el componente
  useEffect(() => {
    console.log("🔑 Login: Componente montado", {
      from,
      isAuthenticated,
      user: user ? { email: user.email } : null,
      redirectAttempted: redirectAttemptedRef.current
    });

    // Cleanup al desmontar
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      console.log("🔑 Login: Componente desmontado");
    };
  }, []);

  // Sincronizar errores del contexto
  useEffect(() => {
    if (contextAuthError) {
      console.debug("Login: Error de autenticación recibido del contexto", contextAuthError);
      setApiError(contextAuthError);
    }
  }, [contextAuthError]);

  // Redireccionar si ya está autenticado - con protección contra bucles
  useEffect(() => {
    // Log para depuración
    console.debug("Login: Verificando redirección automática", {
      isAuthenticated,
      redirectAttempted: redirectAttemptedRef.current,
      user: user?.email
    });

    // Evitar múltiples intentos de redirección
    if (redirectAttemptedRef.current) {
      console.debug("Login: Redirección ya intentada, evitando bucle");
      return;
    }

    if (isAuthenticated && user) {
      console.log("Login: Usuario ya autenticado, preparando redirección");

      // Marcar que ya intentamos redireccionar
      redirectAttemptedRef.current = true;

      try {
        const role = normalizeRole(user.role);
        const dashboardPath = role ? getDashboardPath(role) : '/dashboard';

        console.log(`Login: Redirigiendo a ${from || dashboardPath}`);

        // Timeout para asegurar que el log se complete antes de la redirección
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(from || dashboardPath, { replace: true });
        }, 100);
      } catch (error) {
        console.error("Login: Error al redireccionar", error);
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, from]);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid
  } = useForm<LoginCredentials>(
    { email: '', password: '' },
    {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      password: {
        required: true,
        minLength: 8
      }
    }
  );

  const onSubmit = async (formData: LoginCredentials) => {
    console.group('Login Submit');

    if (!isValid || isSubmitting) {
      console.warn('⚠️ Formulario inválido o ya en proceso de envío', { isValid, isSubmitting, errors });
      console.groupEnd();
      return;
    }

    console.log('🔑 Iniciando proceso de login manual', { email: formData.email });
    setIsSubmitting(true);
    setApiError(null);

    try {
      console.debug('📤 Enviando credenciales al servidor');
      const response = await login(formData);

      // Mostrar mensaje de éxito brevemente
      const userName = response.user.first_name || response.user.first_name || 'Usuario';
      console.log('✅ Login exitoso', {
        userId: response.user.id,
        userName,
        userRole: response.user.role
      });

      setLoginSuccess(`Bienvenido, ${userName}!`);

      // La redirección se maneja en el useEffect
    } catch (error) {
      console.error('❌ Error durante login manual', error);
      setApiError(error instanceof Error ? error.message : 'Error en el inicio de sesión');
    } finally {
      setIsSubmitting(false);
      console.groupEnd();
    }
  };

  // Solución para prevenir errores de hidratación
  const loginText = "Iniciar sesion"; // Sin tilde para evitar problemas de codificación

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {loginText}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {apiError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {apiError}
          </div>
        )}

        {loginSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {loginSuccess}
          </div>
        )}

        <form className="space-y-6" noValidate onSubmit={(e) => {
          e.preventDefault();
          console.log("📝 Formulario de login enviado");
          handleSubmit(onSubmit)();
        }}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Correo electronico
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${touched.email && errors.email ? 'ring-red-300' : 'ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
              />
            </div>
            {touched.email && errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Contraseña
              </label>
              <div className="text-sm">
                <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${touched.password && errors.password ? 'ring-red-300' : 'ring-gray-300'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
              />
            </div>
            {touched.password && errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300"
            >
              {isSubmitting ? 'Iniciando...' : 'Iniciar sesion'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-2 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-700 font-medium">Estado de autenticación:</p>
          <p className="text-xs text-gray-500">
            {isAuthenticated
              ? `✅ Autenticado como: ${user?.email} (${user?.role})`
              : "❌ No autenticado"}
          </p>
          {apiError && (
            <p className="text-xs text-red-500 mt-1">Error: {apiError}</p>
          )}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          ¿No tienes una cuenta?{' '}
          <Link to="/auth/register" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Registrate aqui
          </Link>
        </p>
      </div>
    </div>
  );
}