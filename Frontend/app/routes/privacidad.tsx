import { Link } from "@remix-run/react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-lateral-50 py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Banner de demostración */}
                <div className="mb-8 bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-purple-700">
                                <strong>Política de Ejemplo</strong> - Esta es una política de privacidad de demostración y no representa prácticas reales de tratamiento de datos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
                        Política de Privacidad
                    </h1>
                    <p className="text-lg text-gray-600">
                        Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Contenido */}
                <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
                    <div className="prose prose-lg max-w-none">
                        {/* Introducción */}
                        <section className="mb-8">
                            <div className="bg-lateral-50 border-l-4 border-lateral-500 p-6 rounded-r-lg mb-6">
                                <h2 className="text-xl font-bold text-lateral-900 mb-2">Compromiso con su Privacidad</h2>
                                <p className="text-lateral-700">
                                    En 360<span className="text-naranja-600">Lateral</span>, nos comprometemos a proteger su privacidad y manejar sus datos personales de manera responsable y transparente, cumpliendo con todas las leyes aplicables de protección de datos.
                                </p>
                            </div>
                        </section>

                        {/* Sección 1 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">1</span>
                                Información que Recopilamos
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Recopilamos diferentes tipos de información para proporcionar y mejorar nuestros servicios:
                            </p>
                            
                            <div className="ml-4 space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">Información de Cuenta</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                                        <li>Nombre completo y datos de contacto</li>
                                        <li>Dirección de correo electrónico</li>
                                        <li>Número de teléfono</li>
                                        <li>Información de empresa (para desarrolladores)</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">Información de Uso</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                                        <li>Direcciones IP y datos de ubicación</li>
                                        <li>Tipo de navegador y dispositivo</li>
                                        <li>Páginas visitadas y tiempo de permanencia</li>
                                        <li>Interacciones con la plataforma</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">Información de Lotes y Proyectos</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                                        <li>Datos de lotes urbanos</li>
                                        <li>Documentos cargados</li>
                                        <li>Análisis urbanísticos realizados</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Sección 2 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">2</span>
                                Cómo Utilizamos su Información
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Utilizamos la información recopilada para:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                <li>Proporcionar, mantener y mejorar nuestros servicios</li>
                                <li>Procesar sus solicitudes y transacciones</li>
                                <li>Enviar comunicaciones importantes sobre su cuenta</li>
                                <li>Personalizar su experiencia en la plataforma</li>
                                <li>Realizar análisis y estadísticas de uso</li>
                                <li>Detectar y prevenir fraudes o actividades sospechosas</li>
                                <li>Cumplir con obligaciones legales</li>
                            </ul>
                        </section>

                        {/* Sección 3 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">3</span>
                                Compartir Información
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                No vendemos su información personal. Podemos compartir su información únicamente en las siguientes circunstancias:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                <li><strong>Con su consentimiento:</strong> Cuando usted nos autoriza expresamente</li>
                                <li><strong>Proveedores de servicios:</strong> Con terceros que nos ayudan a operar la plataforma</li>
                                <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o autoridad competente</li>
                                <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos y seguridad</li>
                            </ul>
                        </section>

                        {/* Sección 4 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">4</span>
                                Seguridad de los Datos
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold text-green-900">Encriptación SSL/TLS</span>
                                    </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold text-green-900">Almacenamiento seguro</span>
                                    </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold text-green-900">Acceso restringido</span>
                                    </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold text-green-900">Monitoreo continuo</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sección 5 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">5</span>
                                Sus Derechos
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Usted tiene los siguientes derechos sobre sus datos personales:
                            </p>
                            <div className="space-y-3 ml-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 bg-lateral-100 rounded-full flex items-center justify-center mt-1">
                                        <svg className="w-4 h-4 text-lateral-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">Derecho de Acceso</p>
                                        <p className="text-gray-600 text-sm">Solicitar una copia de sus datos personales</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 bg-lateral-100 rounded-full flex items-center justify-center mt-1">
                                        <svg className="w-4 h-4 text-lateral-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">Derecho de Rectificación</p>
                                        <p className="text-gray-600 text-sm">Corregir información inexacta o incompleta</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 bg-lateral-100 rounded-full flex items-center justify-center mt-1">
                                        <svg className="w-4 h-4 text-lateral-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">Derecho de Supresión</p>
                                        <p className="text-gray-600 text-sm">Solicitar la eliminación de sus datos personales</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 bg-lateral-100 rounded-full flex items-center justify-center mt-1">
                                        <svg className="w-4 h-4 text-lateral-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">Derecho de Portabilidad</p>
                                        <p className="text-gray-600 text-sm">Recibir sus datos en formato estructurado</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 bg-lateral-100 rounded-full flex items-center justify-center mt-1">
                                        <svg className="w-4 h-4 text-lateral-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-900">Derecho de Oposición</p>
                                        <p className="text-gray-600 text-sm">Oponerse al tratamiento de sus datos</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sección 6 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">6</span>
                                Cookies y Tecnologías Similares
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso y personalizar contenido. Puede gestionar sus preferencias de cookies en la configuración de su navegador.
                            </p>
                        </section>

                        {/* Sección 7 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">7</span>
                                Retención de Datos
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                Conservamos su información personal solo durante el tiempo necesario para cumplir con los fines descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
                            </p>
                        </section>

                        {/* Sección 8 */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-lateral-100 rounded-lg flex items-center justify-center text-lateral-600 mr-3 text-sm">8</span>
                                Contacto y Consultas
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Para ejercer sus derechos o realizar consultas sobre esta política de privacidad:
                            </p>
                            <div className="bg-lateral-50 rounded-lg p-6 ml-4">
                                <p className="text-gray-700 mb-2"><strong>Email:</strong> <a href="mailto:privacidad@lateral360.com" className="text-lateral-600 hover:text-lateral-700 font-medium">privacidad@lateral360.com</a></p>
                                <p className="text-gray-700 mb-2"><strong>Teléfono:</strong> +57 (4) 123-4567</p>
                                <p className="text-gray-700"><strong>Dirección:</strong> Calle 10 Sur #48-20, Medellín, Colombia</p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center space-y-4">
                    <div className="flex justify-center space-x-4">
                        <Link to="/terminos" className="text-lateral-600 hover:text-lateral-700 font-medium">
                            Términos y Condiciones
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
