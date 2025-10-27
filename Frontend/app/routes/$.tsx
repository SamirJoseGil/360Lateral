import { Link, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";

export default function NotFound() {
    const navigate = useNavigate();
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        // Verificar si hay historial para volver
        setCanGoBack(window.history.length > 1);
    }, []);

    const handleGoBack = () => {
        if (canGoBack) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-lateral-50 flex items-center justify-center px-4 py-36">
            <div className="max-w-2xl w-full py-16">
                {/* Ilustración 404 */}
                <div className="text-center mb-8">
                    <div className="relative inline-block">
                        {/* Número 404 grande */}
                        <h1 className="text-9xl font-bold text-lateral-200 select-none">
                            404
                        </h1>
                        
                        {/* Elementos decorativos flotantes */}
                        <div className="absolute -top-4 -left-4 w-16 h-16 bg-naranja-500 bg-opacity-20 rounded-full animate-pulse"></div>
                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-lateral-500 bg-opacity-20 rounded-full animate-pulse delay-75"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <svg className="w-32 h-32 text-lateral-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                    <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-lateral-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-lateral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Página no encontrada
                        </h2>
                        
                        <p className="text-lg text-gray-600 mb-2">
                            Lo sentimos, la página que buscas no existe o ha sido movida.
                        </p>
                        
                        <p className="text-sm text-gray-500">
                            Puede que el enlace esté roto o que la página haya sido eliminada.
                        </p>
                    </div>

                    {/* Búsqueda de ayuda */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            ¿Qué puedes hacer?
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Verificar que la URL esté escrita correctamente</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Volver a la página anterior e intentar de nuevo</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Ir al inicio y buscar desde el menú principal</span>
                            </li>
                        </ul>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={handleGoBack}
                            className="inline-flex items-center justify-center px-6 py-3 bg-lateral-600 text-white text-base font-medium rounded-lg hover:bg-lateral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lateral-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            {canGoBack ? 'Volver atrás' : 'Ir al inicio'}
                        </button>

                        <Link
                            to="/"
                            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 text-base font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Ir al inicio
                        </Link>
                    </div>

                    {/* Enlaces útiles */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-3">Enlaces útiles:</p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <Link to="/about" className="text-lateral-600 hover:text-lateral-700 font-medium transition-colors">
                                Acerca de
                            </Link>
                            <span className="text-gray-300">•</span>
                            <Link to="/contact" className="text-lateral-600 hover:text-lateral-700 font-medium transition-colors">
                                Contacto
                            </Link>
                            <span className="text-gray-300">•</span>
                            <Link to="/terminos" className="text-lateral-600 hover:text-lateral-700 font-medium transition-colors">
                                Términos
                            </Link>
                            <span className="text-gray-300">•</span>
                            <Link to="/privacidad" className="text-lateral-600 hover:text-lateral-700 font-medium transition-colors">
                                Privacidad
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Branding footer */}
                <div className="text-center mt-8">
                    <Link to="/" className="inline-block">
                        <span className="text-2xl font-display font-bold text-lateral-600 hover:text-lateral-700 transition-colors">
                            360<span className="text-naranja-500">Lateral</span>
                        </span>
                    </Link>
                    <p className="text-sm text-gray-500 mt-2">
                        Plataforma de gestión urbanística
                    </p>
                </div>
            </div>
        </div>
    );
}
