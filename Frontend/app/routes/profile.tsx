import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useEffect } from "react";
import { ProtectedRoute, useAuthContext } from "~/components/auth/AuthProvider";
import AppLayout from "~/components/layout/AppLayout";
import { useForm, commonValidations } from "~/hooks/useForm";
import { authService } from "~/services/authNew";
import type { ApiUser } from "~/services/authNew";

interface ActionData {
  error?: string;
  success?: boolean;
  message?: string;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;

    if (!first_name || !last_name) {
      return json<ActionData>(
        { error: "Nombre y apellido son requeridos" },
        { status: 400 }
      );
    }

    // Get current user to get the ID
    const currentUser = await authService.getProfile();

    const updateData = {
      first_name,
      last_name,
      ...(phone && { phone }),
      ...(company && { company }),
    };

    await authService.updateProfile(currentUser.id, updateData);

    return json<ActionData>({
      success: true,
      message: "Perfil actualizado exitosamente",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return json<ActionData>(
      {
        error:
          error instanceof Error ? error.message : "Error al actualizar el perfil",
      },
      { status: 400 }
    );
  }
};

export default function Profile() {
  const { user, refreshUser } = useAuthContext();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const {
    data,
    errors,
    setValue,
    validateField,
    validateAll,
    isValid,
  } = useForm<{
    first_name: string;
    last_name: string;
    phone: string;
    company: string;
  }>(
    {
      first_name: "",
      last_name: "",
      phone: "",
      company: "",
    },
    {
      first_name: {
        required: true,
        rules: [commonValidations.minLength(2)],
      },
      last_name: {
        required: true,
        rules: [commonValidations.minLength(2)],
      },
      phone: {
        rules: [commonValidations.phone],
      },
    }
  );

  const isSubmitting = navigation.state === "submitting";

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setValue("first_name", user.first_name || "");
      setValue("last_name", user.last_name || "");
      setValue("phone", user.phone || "");
      setValue("company", user.company || "");
    }
  }, [user, setValue]);

  // Refresh user data after successful update
  useEffect(() => {
    if (actionData?.success) {
      refreshUser();
    }
  }, [actionData?.success, refreshUser]);

  const handleSubmit = (e: React.FormEvent) => {
    if (!validateAll()) {
      e.preventDefault();
      return false;
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Información Personal
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Actualiza tu información de perfil y datos de contacto.
                  </p>
                </div>
              </div>

              <div className="mt-5 md:mt-0 md:col-span-2">
                <Form method="post" onSubmit={handleSubmit}>
                  <div className="shadow sm:rounded-md sm:overflow-hidden">
                    <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                      {/* Success Message */}
                      {actionData?.success && (
                        <div className="rounded-md bg-green-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg
                                className="h-5 w-5 text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-800">
                                {actionData.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
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
                              <p className="text-sm font-medium text-red-800">
                                {actionData.error}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* User Info Card */}
                      <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-md">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Email
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {user?.email}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Username
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {user?.username}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Rol
                            </dt>
                            <dd className="mt-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.role === "admin"
                                    ? "bg-red-100 text-red-800"
                                    : user?.role === "owner"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                              >
                                {user?.role === "admin"
                                  ? "Administrador"
                                  : user?.role === "owner"
                                    ? "Propietario"
                                    : "Desarrollador"}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Fecha de registro
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {user?.date_joined
                                ? new Date(user.date_joined).toLocaleDateString(
                                  "es-ES"
                                )
                                : "N/A"}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Editable Fields */}
                      <div className="grid grid-cols-6 gap-6">
                        <div className="col-span-6 sm:col-span-3">
                          <label
                            htmlFor="first_name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Nombre
                          </label>
                          <input
                            type="text"
                            name="first_name"
                            id="first_name"
                            value={data.first_name}
                            onChange={(e) => setValue("first_name", e.target.value)}
                            onBlur={() => validateField("first_name")}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            disabled={isSubmitting}
                          />
                          {errors.first_name && (
                            <p className="mt-2 text-sm text-red-600">
                              {errors.first_name[0]}
                            </p>
                          )}
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <label
                            htmlFor="last_name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Apellido
                          </label>
                          <input
                            type="text"
                            name="last_name"
                            id="last_name"
                            value={data.last_name}
                            onChange={(e) => setValue("last_name", e.target.value)}
                            onBlur={() => validateField("last_name")}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            disabled={isSubmitting}
                          />
                          {errors.last_name && (
                            <p className="mt-2 text-sm text-red-600">
                              {errors.last_name[0]}
                            </p>
                          )}
                        </div>

                        <div className="col-span-6 sm:col-span-4">
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={data.phone}
                            onChange={(e) => setValue("phone", e.target.value)}
                            onBlur={() => validateField("phone")}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="+57 300 123 4567"
                            disabled={isSubmitting}
                          />
                          {errors.phone && (
                            <p className="mt-2 text-sm text-red-600">
                              {errors.phone[0]}
                            </p>
                          )}
                        </div>

                        <div className="col-span-6">
                          <label
                            htmlFor="company"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Empresa
                          </label>
                          <input
                            type="text"
                            name="company"
                            id="company"
                            value={data.company}
                            onChange={(e) => setValue("company", e.target.value)}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="Mi Empresa S.A.S"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || !isValid}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
