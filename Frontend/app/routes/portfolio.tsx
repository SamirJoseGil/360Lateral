import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";
import { recordEvent } from "~/services/stats.server";

// Tipos para los servicios
type Service = {
    id: number;
    title: string;
    description: string;
    icon: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);

    try {
        // Registrar visita a la página de portafolio
        await recordEvent(request, {
            type: "view",
            name: "portfolio_page",
            value: {
                user_id: user?.id || "anonymous"
            }
        });

        // Datos estáticos de servicios
        const services: Service[] = [
            {
                id: 1,
                title: "Resultoría",
                description: "Acompañamiento de Expertos para dar solución a uno o varios problemas corporativos.",
                icon: "chart-line"
            },
            {
                id: 2,
                title: "Estructuración y gerencia",
                description: "Acompañamiento de Expertos para estructurar y gerenciar proyectos.",
                icon: "building"
            },
            {
                id: 3,
                title: "Comités Laterales",
                description: "Acompañamiento de Expertos en la toma de decisiones primarias de las compañías para dar valor alternativo.",
                icon: "users"
            },
            {
                id: 4,
                title: "Desarrollo de negocios",
                description: "Acompañamiento en la integración de dueños de lotes con desarrolladores.",
                icon: "handshake"
            }
        ];

        return json({ user, services });
    } catch (error) {
        console.error("Error registrando visita:", error);
        return json({ user, services: [] });
    }
}

export default function NuestroPortfolio() {
    const { user, services } = useLoaderData<typeof loader>();

    // Renderizar icono basado en el nombre
    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case 'chart-line':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16h16" />
                    </svg>
                );
            case 'building':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            case 'users':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                );
            case 'handshake':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
        }
    };

    return (
        <div className="pt-16 overflow-hidden">
            {/* Hero Section - Completamente rediseñado */}
            <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-lateral-600 via-lateral-700 to-lateral-900">
                {/* Animaciones de fondo */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-naranja-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-bounce"></div>
                    <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-naranja-500/5 rounded-full blur-2xl animate-pulse"></div>
                </div>

                <div className="container relative z-10 text-center text-white">
                    <div className="max-w-5xl mx-auto">
                        {/* Badge animado */}
                        <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
                            <svg className="w-5 h-5 mr-3 text-naranja-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Soluciones Innovadoras</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
                            Nuestro
                            <span className="bg-gradient-to-r from-naranja-400 to-naranja-600 bg-clip-text text-transparent block md:inline md:ml-4">
                                Portafolio
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-4xl mx-auto leading-relaxed">
                            Soluciones integrales y personalizadas para el sector inmobiliario y de construcción
                            con un enfoque innovador y{" "}
                            <span className="font-bold text-naranja-400">resultados comprobados</span>.
                        </p>

                        {/* Métricas destacadas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="text-2xl md:text-3xl font-bold text-naranja-400 mb-1">500+</div>
                                <div className="text-sm opacity-80">Proyectos</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="text-2xl md:text-3xl font-bold text-naranja-400 mb-1">$30B</div>
                                <div className="text-sm opacity-80">Valor generado</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="text-2xl md:text-3xl font-bold text-naranja-400 mb-1">150+</div>
                                <div className="text-sm opacity-80">Clientes</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="text-2xl md:text-3xl font-bold text-naranja-400 mb-1">45+</div>
                                <div className="text-sm opacity-80">Años exp.</div>
                            </div>
                        </div>

                        <Link
                            to="/contact"
                            className="bg-naranja-500 hover:bg-naranja-600 text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl inline-flex items-center"
                        >
                            Trabajemos Juntos
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Image Gallery - Rediseñada */}
            <section className="py-20 bg-gray-50">
                <div className="container">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-6">Proyectos Destacados</h2>
                            <p className="text-xl text-gray-600">Una muestra de nuestro trabajo en diferentes sectores</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                                <div className="aspect-[4/3] overflow-hidden">
                                    <img
                                        src="https://placehold.co/600x450/2E4E9D/FFFFFF/png?text=Proyecto+Inmobiliario"
                                        alt="Proyecto Inmobiliario"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-lateral-900/80 via-lateral-900/20 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Desarrollo Inmobiliario</h3>
                                    <p className="text-sm opacity-90">Proyectos residenciales y comerciales de gran escala</p>
                                </div>
                                <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-full p-2">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                                <div className="aspect-[4/3] overflow-hidden">
                                    <img
                                        src="https://placehold.co/600x450/FF6B35/FFFFFF/png?text=Desarrollo+Urbano"
                                        alt="Desarrollo Urbano"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-naranja-900/80 via-naranja-900/20 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Desarrollo Urbano</h3>
                                    <p className="text-sm opacity-90">Planificación y desarrollo de espacios urbanos sostenibles</p>
                                </div>
                                <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-full p-2">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                                <div className="aspect-[4/3] overflow-hidden">
                                    <img
                                        src="https://placehold.co/600x450/132C70/FFFFFF/png?text=Infraestructura"
                                        alt="Infraestructura"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-lateral-900/80 via-lateral-900/20 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 text-white">
                                    <h3 className="text-xl font-bold mb-2">Infraestructura</h3>
                                    <p className="text-sm opacity-90">Proyectos de infraestructura crítica y transporte</p>
                                </div>
                                <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-full p-2">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section - Completamente rediseñada */}
            <section className="py-20 bg-white">
                <div className="container">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-8">
                                Conectamos con{" "}
                                <span className="bg-gradient-to-r from-lateral-500 to-naranja-500 bg-clip-text text-transparent">
                                    diferentes servicios
                                </span>
                            </h2>
                            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                                Exploramos soluciones innovadoras y personalizadas que se adaptan a cada
                                proyecto, garantizando resultados sostenibles y de alto impacto.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {services.map((service, index) => (
                                <div key={service.id} className="group bg-gray-50 hover:bg-white rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-gray-100">
                                    <div className="flex items-start space-x-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-lateral-400 to-naranja-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <div className="text-white text-2xl">
                                                {renderIcon(service.icon)}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-lateral-600 transition-colors duration-300">
                                                {service.title}
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed mb-4">
                                                {service.description}
                                            </p>
                                            <div className="w-12 h-1 bg-gradient-to-r from-lateral-400 to-naranja-400 rounded-full group-hover:w-16 transition-all duration-300"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Resultores Section - Rediseñada */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-8">
                                Somos{" "}
                                <span className="bg-gradient-to-r from-lateral-500 to-naranja-500 bg-clip-text text-transparent">
                                    Resultores
                                </span>
                            </h2>
                            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                                Enfrentamos todo tipo de retos en el sector de la construcción, transformando
                                cada desafío en una oportunidad para crear valor y generar impacto positivo.
                            </p>
                        </div>

                        {/* Valores principales */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                            <div className="group bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-lateral-400 to-lateral-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-2xl mb-4 text-gray-900">Eficiencia</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Optimizamos cada etapa del proyecto para maximizar recursos y tiempo,
                                    garantizando la entrega de resultados excepcionales.
                                </p>
                            </div>

                            <div className="group bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-naranja-400 to-naranja-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-2xl mb-4 text-gray-900">Calidad</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Nos comprometemos con los más altos estándares en cada solución,
                                    manteniendo la excelencia como nuestro sello distintivo.
                                </p>
                            </div>

                            <div className="group bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-lateral-600 to-lateral-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-2xl mb-4 text-gray-900">Compromiso</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Acompañamiento constante y enfocado al éxito del proyecto,
                                    construyendo relaciones duraderas con nuestros clientes.
                                </p>
                            </div>
                        </div>

                        {/* Descripción detallada */}
                        <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h3 className="text-3xl font-bold mb-6 text-gray-900">
                                        Transformamos retos en oportunidades
                                    </h3>
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        En 360 Lateral combinamos experiencia, creatividad y enfoque estratégico para
                                        resolver los desafíos más complejos del sector de la construcción.
                                    </p>
                                    <p className="text-gray-600 leading-relaxed">
                                        Transformamos cada reto en una oportunidad, ofreciendo soluciones efectivas
                                        que generan valor, optimizan recursos y garantizan resultados sostenibles.
                                    </p>
                                </div>
                                <div className="relative">
                                    <div className="w-full h-80 bg-gradient-to-br from-lateral-100 via-gray-100 to-naranja-100 rounded-3xl flex items-center justify-center relative overflow-hidden">
                                        <div className="text-8xl opacity-20">🎯</div>
                                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-lateral-500 rounded-full opacity-20"></div>
                                        <div className="absolute -top-4 -left-4 w-16 h-16 bg-naranja-500 rounded-full opacity-15"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-16 bg-white">
                <div className="container">
                    <h2 className="text-3xl font-bold mb-12 text-center">Conoce nuestros procesos</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-lateral-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-lateral-500 text-white rounded-full flex items-center justify-center mr-3">
                                    <span className="font-bold">1</span>
                                </div>
                                <h3 className="font-bold text-lg">Diagnóstico</h3>
                            </div>
                            <p className="text-gris-600">
                                Tenemos una visión integral para entender su necesidad, problema o riesgo.
                            </p>
                        </div>

                        <div className="bg-lateral-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-lateral-500 text-white rounded-full flex items-center justify-center mr-3">
                                    <span className="font-bold">2</span>
                                </div>
                                <h3 className="font-bold text-lg">Propuesta y reporte</h3>
                            </div>
                            <p className="text-gris-600">
                                Presentamos opciones claras para la mejor solución.
                            </p>
                        </div>

                        <div className="bg-lateral-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-lateral-500 text-white rounded-full flex items-center justify-center mr-3">
                                    <span className="font-bold">3</span>
                                </div>
                                <h3 className="font-bold text-lg">Definición del asesor</h3>
                            </div>
                            <p className="text-gris-600">
                                Seleccionamos el mejor asesor y nuestro equipo de expertos te ayudan a integrar la solución.
                            </p>
                        </div>

                        <div className="bg-lateral-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-lateral-500 text-white rounded-full flex items-center justify-center mr-3">
                                    <span className="font-bold">4</span>
                                </div>
                                <h3 className="font-bold text-lg">Ejecución</h3>
                            </div>
                            <p className="text-gris-600">
                                Trabajamos contigo durante todo el proceso para ver los resultados en tiempo real.
                            </p>
                        </div>

                        <div className="bg-lateral-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-lateral-500 text-white rounded-full flex items-center justify-center mr-3">
                                    <span className="font-bold">5</span>
                                </div>
                                <h3 className="font-bold text-lg">Seguimiento y mejora</h3>
                            </div>
                            <p className="text-gris-600">
                                Seguimiento a los resultados y a la iteración de mejora al plan de acción y su impacto en la compañía.
                            </p>
                        </div>

                        <div className="bg-lateral-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-lateral-500 text-white rounded-full flex items-center justify-center mr-3">
                                    <span className="font-bold">6</span>
                                </div>
                                <h3 className="font-bold text-lg">Revisión final</h3>
                            </div>
                            <p className="text-gris-600">
                                Analizamos los resultados y te ofrecemos consejos para un proyecto futuro exitoso.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Areas of Expertise */}
            <section className="py-16 bg-gradient-lateral text-white">
                <div className="container">
                    <h2 className="text-3xl font-bold mb-12 text-center">Somos Expertos en</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover-lift">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Desarrollo Inmobiliario</h3>
                            <p className="text-white/80">
                                Proyectos residenciales, comerciales y de uso mixto.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover-lift">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Infraestructura</h3>
                            <p className="text-white/80">
                                Proyectos de gran escala con impacto urbano y social.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover-lift">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Inversiones</h3>
                            <p className="text-white/80">
                                Estructuración financiera y maximización de retornos.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover-lift">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Gestión de Riesgos</h3>
                            <p className="text-white/80">
                                Análisis y mitigación de riesgos en proyectos complejos.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action - Rediseñada */}
            <section className="py-20 bg-gradient-to-br from-lateral-600 via-lateral-700 to-naranja-500 text-white relative overflow-hidden">
                {/* Elementos decorativos */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-80 h-80 bg-white/5 rounded-full blur-2xl"></div>
                </div>

                <div className="container relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                            ¿Tienes un reto?{" "}
                            <span className="block md:inline">Tomemos un café</span>
                        </h2>
                        <p className="text-xl md:text-2xl mb-12 opacity-90 leading-relaxed max-w-3xl mx-auto">
                            A través de una serie de preguntas podemos simplificar las complejas
                            problemáticas de las empresas para comenzar un proceso de cambio estructural.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link
                                to="/contact"
                                className="bg-white text-lateral-600 hover:bg-gray-100 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl inline-flex items-center justify-center"
                            >
                                Contáctanos
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                to="/about"
                                className="border-2 border-white text-white hover:bg-white hover:text-lateral-600 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300"
                            >
                                Conoce Más
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
