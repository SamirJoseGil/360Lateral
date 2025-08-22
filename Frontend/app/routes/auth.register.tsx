import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { authService } from "~/services/authNew";
import type { ApiRegisterData } from "~/services/authNew";

interface ActionData {
  error?: string;
  success?: boolean;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const password_confirm = formData.get("password_confirm") as string;
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;

    // Validaciones básicas
    if (!email || !username || !password || !password_confirm || !first_name || !last_name) {
      return json<ActionData>(
        { error: "Todos los campos obligatorios deben ser completados" },
        { status: 400 }
      );
    }

    if (password !== password_confirm) {
      return json<ActionData>(
        { error: "Las contraseñas no coinciden" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return json<ActionData>(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const registerData: ApiRegisterData = {
      email,
      username,
      password,
      password_confirm,
      first_name,
      last_name,
      ...(phone && { phone }),
      ...(company && { company }),
    };

    // Intentar registro usando el servicio de autenticación
    await authService.register(registerData);

    // Si el registro es exitoso, redirigir al dashboard
    return redirect("/dashboard");
  } catch (error) {
    console.error("Register error:", error);
    return json<ActionData>(
      { error: error instanceof Error ? error.message : "Error al crear la cuenta" },
      { status: 400 }
    );
  }
};

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [formData, setFormData] = useState<ApiRegisterData>({
    email: "",
    username: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    phone: "",
    company: "",
  });

  const isSubmitting = navigation.state === "submitting";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          {actionData?.error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error al crear la cuenta
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {actionData.error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Nombres */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Juan"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Apellido *
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Pérez"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="usuario@example.com"
                disabled={isSubmitting}
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nombre de usuario *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="usuario123"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                Solo letras, números y guiones. Mínimo 3 caracteres.
              </p>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mínimo 8 caracteres"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
                  Confirmar contraseña *
                </label>
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  required
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Repite la contraseña"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Campos opcionales */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="+57 300 123 4567"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Empresa
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mi Empresa S.A.S"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Validación de contraseña visual */}
          {formData.password && (
            <div className="text-xs text-gray-600">
              <p className="mb-1">La contraseña debe contener:</p>
              <ul className="list-disc list-inside space-y-1">
                <li className={formData.password.length >= 8 ? "text-green-600" : "text-red-600"}>
                  Mínimo 8 caracteres
                </li>
                <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : "text-red-600"}>
                  Una letra mayúscula
                </li>
                <li className={/[a-z]/.test(formData.password) ? "text-green-600" : "text-red-600"}>
                  Una letra minúscula
                </li>
                <li className={/\d/.test(formData.password) ? "text-green-600" : "text-red-600"}>
                  Un número
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "text-green-600" : "text-red-600"}>
                  Un carácter especial
                </li>
              </ul>
            </div>
          )}

          {/* Validación de coincidencia de contraseñas */}
          {formData.password_confirm && formData.password !== formData.password_confirm && (
            <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
          )}

          <div className="flex items-center">
            <input
              id="accept-terms"
              name="accept-terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-900">
              Acepto los{" "}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                política de privacidad
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.email ||
                !formData.username ||
                !formData.password ||
                !formData.password_confirm ||
                !formData.first_name ||
                !formData.last_name ||
                formData.password !== formData.password_confirm
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
