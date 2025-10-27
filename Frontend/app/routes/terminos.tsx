import { Link } from "@remix-run/react";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-lateral-50 py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Banner de demostración */}
                <div className="mb-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                <strong>Documento de Demostración</strong> - Estos términos son de ejemplo y no constituyen un acuerdo legal real.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
                        Términos y Condiciones
                    </h1>
                    <p className="text-lg text-gray-600">
                        Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Contenido */}
                <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
                    <div className="prose prose-lg max-w-none">
                        {/* Sección 1 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">1</span>
                                Aceptación de los Términos
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                Al acceder y utilizar la plataforma 360<span className="text-naranja-500">Lateral</span>, usted acepta estar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, no debe utilizar nuestra plataforma.
                            </p>
                        </section>

                        {/* Sección 2 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">2</span>
                                Descripción del Servicio
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                360Lateral es una plataforma de gestión urbanística que proporciona:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                <li>Gestión integral de lotes urbanos</li>
                                <li>Análisis urbanístico automatizado</li>
                                <li>Consulta de normativas POT</li>
                                <li>Gestión documental de proyectos</li>
                                <li>Herramientas de búsqueda avanzada</li>
                            </ul>
                        </section>

                        {/* Sección 3 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">3</span>
                                Registro y Cuenta de Usuario
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Para utilizar ciertos servicios de la plataforma, debe crear una cuenta proporcionando información precisa y completa. Usted es responsable de:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                <li>Mantener la confidencialidad de su cuenta y contraseña</li>
                                <li>Todas las actividades que ocurran bajo su cuenta</li>
                                <li>Notificar inmediatamente cualquier uso no autorizado</li>
                            </ul>
                        </section>

                        {/* Sección 4 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">4</span>
                                Uso Aceptable
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Al utilizar nuestra plataforma, usted se compromete a:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                <li>No violar ninguna ley o regulación aplicable</li>
                                <li>No infringir los derechos de propiedad intelectual</li>
                                <li>No cargar contenido malicioso o virus</li>
                                <li>No intentar acceder de forma no autorizada a sistemas</li>
                                <li>No utilizar la plataforma para fines fraudulentos</li>
                            </ul>
                        </section>

                        {/* Sección 5 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">5</span>
                                Propiedad Intelectual
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                Todo el contenido, características y funcionalidad de la plataforma son propiedad exclusiva de 360Lateral y están protegidos por derechos de autor, marcas registradas y otras leyes de propiedad intelectual.
                            </p>
                        </section>

                        {/* Sección 6 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">6</span>
                                Limitación de Responsabilidad
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                La plataforma se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos responsables de daños directos, indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de usar la plataforma.
                            </p>
                        </section>

                        {/* Sección 7 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">7</span>
                                Modificaciones
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en la plataforma. El uso continuo de la plataforma después de dichas modificaciones constituye su aceptación de los nuevos términos.
                            </p>
                        </section>

                        {/* Sección 8 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">8</span>
                                Ley Aplicable
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier disputa relacionada con estos términos será sometida a la jurisdicción exclusiva de los tribunales de Medellín, Colombia.
                            </p>
                        </section>

                        {/* Sección 9 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">9</span>
                                Contacto
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 ml-4">
                                <p className="text-gray-700">Email: <a href="mailto:legal@lateral360.com" className="text-lateral-600 hover:text-lateral-700 font-medium">legal@lateral360.com</a></p>
                                <p className="text-gray-700">Teléfono: +57 (4) 123-4567</p>
                                <p className="text-gray-700">Dirección: Calle 10 Sur #48-20, Medellín, Colombia</p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center space-y-4">
                    <div className="flex justify-center space-x-4">
                        <Link to="/privacidad" className="text-lateral-600 hover:text-lateral-700 font-medium">
                            Política de Privacidad
                        </Link>
                        <span className="text-gray-400">•</span>
                        <Link to="/contact" className="text-lateral-600 hover:text-lateral-700 font-medium">
                            Contacto
                        </Link>
                    </div>
                    <p className="text-gray-600">
                        <Link to="/" className="text-lateral-600 hover:text-lateral-700 font-medium">
                            ← Volver al inicio
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
