import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  try {
    // Registrar visita a la página de inicio
    await recordEvent(request, {
      type: "view",
      name: "homepage",
      value: {
        user_id: user?.id || "anonymous",
      },
    });

    return json({ user });
  } catch (error) {
    console.error("Error registrando visita:", error);
    return json({ user });
  }
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="pt-16"> {/* Espacio para la navbar fija */}
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Plataforma de gestión para lotes urbanos
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Conectamos propietarios de lotes con desarrolladores inmobiliarios mediante análisis urbanístico avanzado
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {!user ? (
                <>
                  <Link to="/register" className="btn btn-secondary text-lg px-8 py-3">
                    Comenzar ahora
                  </Link>
                  <Link to="/about" className="btn bg-white/20 hover:bg-white/30 text-white text-lg px-8 py-3">
                    Conocer más
                  </Link>
                </>
              ) : (
                <Link
                  to={`/${user.role}`}
                  className="btn btn-secondary text-lg px-8 py-3"
                >
                  Ir a mi Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-0 right-0 bg-lateral-400/20 w-96 h-96 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 bg-lateral-600/20 w-96 h-96 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gris-100">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gris-900">Nuestra plataforma</h2>
            <p className="text-xl text-gris-600 max-w-2xl mx-auto">
              Solución integral para optimizar el análisis y desarrollo de lotes urbanos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-lateral p-8 hover-lift">
              <div className="w-16 h-16 bg-lateral-100 text-lateral-500 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gris-900">Gestión de lotes</h3>
              <p className="text-gris-600">
                Registra y administra tus propiedades con toda la información clave de forma centralizada y segura.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-lateral p-8 hover-lift">
              <div className="w-16 h-16 bg-lateral-100 text-lateral-500 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gris-900">Análisis urbanístico</h3>
              <p className="text-gris-600">
                Evaluaciones detalladas del potencial de desarrollo con base en normativas vigentes y tendencias del mercado.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-lateral p-8 hover-lift">
              <div className="w-16 h-16 bg-lateral-100 text-lateral-500 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gris-900">Conexión directa</h3>
              <p className="text-gris-600">
                Facilita el contacto entre propietarios y desarrolladores para transacciones más ágiles y transparentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 md:py-20 bg-gradient-lateral text-white">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-8 lg:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para optimizar tus propiedades?</h2>
              <p className="text-xl opacity-90 max-w-xl">
                Únete a nuestra plataforma y descubre el verdadero potencial de tus lotes con análisis experto.
              </p>
            </div>
            <div>
              <Link
                to={user ? `/${user.role}` : "/register"}
                className="btn bg-white text-lateral-500 hover:bg-gris-100 text-lg px-8 py-3"
              >
                {user ? "Ir a mi Dashboard" : "Registrarme ahora"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials/Partners */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gris-900">Nuestros aliados</h2>
            <p className="text-xl text-gris-600 max-w-2xl mx-auto">
              Organizaciones que confían en nuestra plataforma
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {/* Partner logos - placeholders */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-center p-4">
                <div className="w-full h-16 bg-gris-200 rounded opacity-50"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
