import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Navigation } from "~/components/organisms/Navigation";

export const meta: MetaFunction = () => {
  return [
    { title: "Lateral 360° - Gestión de Lotes Inmobiliarios" },
    {
      name: "description",
      content: "Plataforma integral para la gestión de lotes inmobiliarios",
    },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <main>
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block xl:inline">Gestión integral de</span>
                    <span className="block text-blue-600 xl:inline">
                      {" "}
                      lotes inmobiliarios
                    </span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Plataforma innovadora que conecta propietarios,
                    desarrolladores y administradores para optimizar la gestión
                    y comercialización de lotes urbanos.
                  </p>

                  {/* Explicación de roles */}
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      ¿Quién eres?
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900">
                          Dueño de Lote
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Registra y gestiona tus propiedades, sube documentos y
                          recibe ofertas.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900">
                          Desarrollador
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Busca oportunidades de inversión, analiza viabilidad y
                          contacta propietarios.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-900">
                          Administrador
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Supervisa la plataforma, valida documentos y genera
                          estadísticas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link
                        to="/register"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                      >
                        Comenzar ahora
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        to="/login"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                      >
                        Iniciar Sesión
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <img
              className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80"
              alt="Gestión de lotes"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <span className="text-2xl font-bold text-gray-900">
                Lateral 360°
              </span>
              <p className="text-gray-500 text-base">
                Transformamos la gestión inmobiliaria con tecnología innovadora.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Producto
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-500 hover:text-gray-900"
                      >
                        Características
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-500 hover:text-gray-900"
                      >
                        Precios
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Soporte
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-500 hover:text-gray-900"
                      >
                        Términos
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-base text-gray-500 hover:text-gray-900"
                      >
                        Contacto
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "propietario":
      return "/dashboard/owner";
    case "desarrollador":
      return "/dashboard/developer";
    default:
      return "/login";
  }
}
