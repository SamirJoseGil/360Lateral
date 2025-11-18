import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);

    try {
        return json({ user });
    } catch (error) {
        console.error("Error registrando visita:", error);
        return json({ user });
    }
}

export default function About() {
    const { user } = useLoaderData<typeof loader>();

    return (
        <div className="pt-16">
            {/* Hero Section */}
            <section className="hero-section py-16 md:py-24">
                <div className="container relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Somos Resultores
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
                            Una firma colombiana de consultoría especializada en asesorar y resolver
                            retos del sector constructor e inmobiliario.
                        </p>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute top-0 right-0 bg-lateral-400/20 w-96 h-96 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 bg-lateral-600/20 w-96 h-96 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
                </div>
            </section>

            {/* About Us Content */}
            <section className="py-16 bg-white">
                <div className="container">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-lg mb-8 text-gris-700">
                            Somos una firma colombiana de consultoría especializada en asesorar y resolver
                            retos del sector constructor e inmobiliario. Reunimos a 35 profesionales con una
                            vasta experiencia de más de 45 años y un historial destacado en la ejecución de
                            algunos de los proyectos más importantes y complejos del país y la región.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                            <div className="rounded-lg overflow-hidden shadow-lateral">
                                <img
                                    src="https://placehold.co/600x400/2E4E9D/FFFFFF/png?text=Equipo+360Lateral"
                                    alt="Equipo de 360Lateral"
                                    className="w-full h-72 object-cover"
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-lateral-700">Asesoramos y resolvemos tus retos inmobiliarios y de construcción</h2>
                                <p className="text-gris-700 mb-4">
                                    A nivel de infraestructura: aeropuertos, puentes y vías, proyectos de generación de energía, túneles,
                                    muelles, plantas industriales, concesiones viales, líneas de metro, metrocables y
                                    transporte público.
                                </p>
                                <p className="text-gris-700">
                                    A nivel inmobiliario y de edificaciones: proyectos residenciales, hoteles, parques logísticos, centros comerciales,
                                    edificios de oficinas, clínicas, activos standalone y activos de vivienda en renta.
                                </p>
                            </div>
                        </div>

                        <div className="mb-16">
                            <h2 className="text-3xl font-bold mb-6 text-center">Nuestra cultura</h2>
                            <div className="bg-lateral-50 p-8 rounded-lg">
                                <p className="text-gris-700 mb-6">
                                    Nuestra cultura organizacional se enfoca en el crecimiento integral de cada uno
                                    de nosotros, fomentando el desarrollo de nuestro potencial y un entorno de
                                    trabajo agradable. Creemos que somos el centro de nuestra estrategia, ya que cada uno
                                    aporta valor con su autenticidad y talento, características que no pueden ser
                                    imitadas.
                                </p>
                                <p className="text-gris-700">
                                    Esta visión nos convierte en una empresa consciente que busca proyectos
                                    con sentido humano, donde podemos desplegar toda nuestra pasión y creatividad.
                                    Nuestro objetivo es crear un entorno que inspire el máximo rendimiento y
                                    desarrollo personal, haciendo de 360Lateral un lugar donde disfrutemos del trabajo y
                                    cultivemos nuestros talentos.
                                </p>
                            </div>
                        </div>

                        <div className="mb-16">
                            <h2 className="text-3xl font-bold mb-6 text-center">Nuestro camino</h2>
                            <p className="text-gris-700 mb-6">
                                A lo largo de nuestra trayectoria, hemos logrado generar más de COP $30 mil
                                millones en beneficios para nuestros clientes, convirtiéndonos en un referente de la
                                industria. Nuestra capacidad para atraer y retener al mejor talento nos permite
                                ofrecer soluciones de alta calidad que mejoran la competitividad en el mercado.
                            </p>
                            <p className="text-gris-700">
                                Gracias a nuestra filosofía de seleccionar proyectos con un propósito claro y
                                humano, logramos ofrecer servicios más valiosos para nuestros clientes. Además,
                                creemos que la generación de valor debe estar alineada proporcionalmente con
                                nuestros esfuerzos, lo que refuerza nuestra posición competitiva en el sector de la
                                construcción e inmobiliario.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Culture Section */}
            <section className="py-16 bg-gris-100">
                <div className="container">
                    <h2 className="text-3xl font-bold mb-12 text-center">Cultura</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-lg p-8 shadow-lateral text-center hover-lift">
                            <div className="w-16 h-16 bg-lateral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-lateral-500 text-2xl font-bold">1</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Propósito</h3>
                            <p className="text-gris-600">
                                Crecimiento integral, desarrollo del potencial y disfrute laboral de cada
                                experto 360 Lateral
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-8 shadow-lateral text-center hover-lift">
                            <div className="w-16 h-16 bg-lateral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-lateral-500 text-2xl font-bold">2</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Método</h3>
                            <p className="text-gris-600">
                                Resultoría efectiva a nuestros clientes
                            </p>
                        </div>

                        <div className="bg-white rounded-lg p-8 shadow-lateral text-center hover-lift">
                            <div className="w-16 h-16 bg-lateral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-lateral-500 text-2xl font-bold">3</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Estrategia</h3>
                            <p className="text-gris-600">
                                Conectar con la lateralidad del sector
                            </p>
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

            {/* Quote Section */}
            <section className="py-16 bg-lateral-800 text-white">
                <div className="container">
                    <div className="max-w-3xl mx-auto text-center">
                        <blockquote className="text-2xl mb-8 italic">
                            "Hoy en día, la persona que aporta valor a través de su talento se ha convertido en el centro de la estrategia de las empresas conscientes."
                        </blockquote>
                        <p className="font-semibold text-xl">Borja Vilaseca</p>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 bg-gradient-lateral text-white">
                <div className="container">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-6">¿Tienes un reto? Tomemos un café mientras lo hablamos</h2>
                        <p className="text-xl mb-8 opacity-90">
                            A través de una serie de preguntas podemos simplificar las complejas
                            problemáticas de las empresas para comenzar un proceso de cambio estructural.
                        </p>
                        <Link to="/contact" className="btn bg-white text-lateral-500 hover:bg-gris-100 text-lg px-8 py-3">
                            Contáctanos
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
