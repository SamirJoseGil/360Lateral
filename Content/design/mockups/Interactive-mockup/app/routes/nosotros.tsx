import { Link } from "@remix-run/react";
import Navbar from "~/components/Navbar";

export default function Nosotros() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar currentPath="/nosotros" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Somos <span className="text-orange-400">Resultores</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Transformamos la gestión inmobiliaria con tecnología innovadora y resultados tangibles
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Nuestra Misión</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Revolucionar la gestión de propiedades y lotes mediante soluciones tecnológicas 
              intuitivas que simplifican procesos complejos, aumentan la transparencia y 
              conectan a desarrolladores, administradores y propietarios en un ecosistema digital eficiente.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Nuestra Visión</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Ser la plataforma líder en América Latina para la gestión integral de propiedades 
              inmobiliarias, reconocida por su innovación, confiabilidad y capacidad de generar 
              valor real para todos los actores del sector inmobiliario.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Transparencia</h3>
              <p className="text-gray-600">
                Creemos en la claridad total en todos nuestros procesos y comunicaciones.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovación</h3>
              <p className="text-gray-600">
                Desarrollamos constantemente nuevas soluciones para superar los desafíos del sector.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Colaboración</h3>
              <p className="text-gray-600">
                Trabajamos juntos para crear soluciones que beneficien a toda la comunidad.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Historia</h2>
          <div className="prose prose-lg text-gray-600 max-w-none">
            <p className="mb-4">
              360° LATERAL nació de la necesidad de digitalizar y simplificar la gestión inmobiliaria 
              en América Latina. Fundada por un equipo de expertos en tecnología y bienes raíces, 
              nuestra empresa identificó las ineficiencias y complejidades que enfrentaban desarrolladores, 
              administradores y propietarios en el manejo de sus propiedades.
            </p>
            <p className="mb-4">
              Desde nuestros inicios, hemos trabajado incansablemente para crear una plataforma 
              integral que no solo almacene información, sino que genere valor real a través de 
              análisis inteligentes, automatización de procesos y conectividad entre todos los 
              actores del ecosistema inmobiliario.
            </p>
            <p>
              Hoy, somos más que una plataforma tecnológica: somos resultores que transforman 
              desafíos en oportunidades, conectando personas y optimizando recursos para 
              construir un futuro inmobiliario más eficiente y transparente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}