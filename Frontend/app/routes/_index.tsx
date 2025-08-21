import type { MetaFunction } from "@remix-run/node";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative">
      {/* Fondo blur decorativo */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3/4 h-96 bg-blue-200 opacity-30 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-64 bg-purple-200 opacity-20 blur-2xl rounded-full"></div>
      </div>
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Section */}
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900 mb-6 drop-shadow-lg">
                <span className="block">Gestión integral de</span>
                <span className="block text-blue-600 bg-blue-100 bg-opacity-60 rounded-xl px-2 py-1 mt-2 shadow-lg">
                  lotes inmobiliarios
                </span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-xl">
                Plataforma innovadora que conecta propietarios, desarrolladores y
                administradores para optimizar la gestión y comercialización de
                lotes urbanos.
              </p>
              {/* Explicación de roles */}
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  ¿Quién eres?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white/80 backdrop-blur-md shadow-xl p-6 rounded-2xl border border-blue-100 flex flex-col items-center transition hover:scale-105 hover:shadow-2xl">
                    <h3 className="font-bold text-blue-700 text-lg mb-2">
                      Dueño de Lote
                    </h3>
                    <p className="text-sm text-gray-500 text-center">
                      Registra y gestiona tus propiedades, sube documentos y
                      recibe ofertas.
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md shadow-xl p-6 rounded-2xl border border-purple-100 flex flex-col items-center transition hover:scale-105 hover:shadow-2xl">
                    <h3 className="font-bold text-purple-700 text-lg mb-2">
                      Desarrollador
                    </h3>
                    <p className="text-sm text-gray-500 text-center">
                      Busca oportunidades de inversión, analiza viabilidad y
                      contacta propietarios.
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md shadow-xl p-6 rounded-2xl border border-green-100 flex flex-col items-center transition hover:scale-105 hover:shadow-2xl">
                    <h3 className="font-bold text-green-700 text-lg mb-2">
                      Administrador
                    </h3>
                    <p className="text-sm text-gray-500 text-center">
                      Supervisa la plataforma, valida documentos y genera
                      estadísticas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Imagen decorativa */}
            <div className="flex justify-center items-center">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-blue-100 bg-white/60 backdrop-blur-lg">
                <img
                  className="w-full h-96 object-cover"
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80"
                  alt="Gestión de lotes"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}