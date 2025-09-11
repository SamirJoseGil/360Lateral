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
        <div className="pt-16">
            {/* Hero Section */}
            <section className="hero-section py-16 md:py-24">
                <div className="container relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Nuestro Portafolio
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
                            Soluciones integrales y personalizadas para el sector inmobiliario y de construcción
                        </p>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute top-0 right-0 bg-lateral-400/20 w-96 h-96 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 bg-lateral-600/20 w-96 h-96 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
                </div>
            </section>

            {/* Image Grid Section */}
            <section className="py-12 bg-gris-100">
                <div className="container">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-64 bg-lateral-500 rounded-lg shadow-lateral overflow-hidden hover-lift">
                            <img
                                src="https://placehold.co/600x400/2E4E9D/FFFFFF/png?text=Proyecto+Inmobiliario"
                                alt="Proyecto Inmobiliario"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="h-64 bg-naranja-500 rounded-lg shadow-lateral overflow-hidden hover-lift">
                            <img
                                src="https://placehold.co/600x400/FF6B35/FFFFFF/png?text=Desarrollo+Urbano"
                                alt="Desarrollo Urbano"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="h-64 bg-lateral-700 rounded-lg shadow-lateral overflow-hidden hover-lift">
                            <img
                                src="https://placehold.co/600x400/132C70/FFFFFF/png?text=Infraestructura"
                                alt="Infraestructura"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-16 bg-white">
                <div className="container">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Conectamos con diferentes servicios dependiendo de tus necesidades
                        </h2>
                        <p className="text-xl text-gris-600 max-w-3xl mx-auto">
                            Exploramos soluciones innovadoras y personalizadas que se adaptan a cada
                            proyecto, garantizando resultados sostenibles y de alto impacto.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                        {services.map(service => (
                            <div key={service.id} className="flex gap-6 items-start">
                                <div className="bg-lateral-100 p-4 rounded-lg text-lateral-500 flex-shrink-0">
                                    {renderIcon(service.icon)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                                    <p className="text-gris-600">{service.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* We Are "Resultores" Section */}
            <section className="py-16 bg-lateral-50">
                <div className="container">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold mb-6 text-center">
                            Somos resultores, enfrentamos todo tipo de retos en el sector de la construcción
                        </h2>
                        <p className="text-lg text-gris-700 mb-10 text-center">
                            En 360 Lateral combinamos experiencia, creatividad y enfoque estratégico para
                            resolver los desafíos más complejos del sector de la construcción. Transformamos
                            cada reto en una oportunidad, ofreciendo soluciones efectivas que generan valor,
                            optimizan recursos y garantizan resultados sostenibles.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-lateral hover-lift">
                                <div className="w-14 h-14 bg-lateral-100 text-lateral-500 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl mb-3">Eficiencia</h3>
                                <p className="text-gris-600">
                                    Optimizamos cada etapa del proyecto para maximizar recursos y tiempo.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-lateral hover-lift">
                                <div className="w-14 h-14 bg-lateral-100 text-lateral-500 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl mb-3">Calidad</h3>
                                <p className="text-gris-600">
                                    Nos comprometemos con los más altos estándares en cada solución.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-lateral hover-lift">
                                <div className="w-14 h-14 bg-lateral-100 text-lateral-500 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl mb-3">Compromiso</h3>
                                <p className="text-gris-600">
                                    Acompañamiento constante y enfocado al éxito del proyecto.
                                </p>
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

            {/* Call to Action */}
            <section className="py-16 bg-white">
                <div className="container">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-6 text-gris-900">¿Tienes un reto? Tomemos un café mientras lo hablamos</h2>
                        <p className="text-lg mb-8 text-gris-600">
                            A través de una serie de preguntas podemos simplificar las complejas
                            problemáticas de las empresas para comenzar un proceso de cambio estructural.
                        </p>
                        <Link to="/contact" className="btn btn-primary text-lg px-8 py-3">
                            Contáctanos
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
