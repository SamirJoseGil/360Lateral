import { useState, useEffect } from "react";

interface WelcomeModalProps {
    role: "owner" | "developer";
    userName: string;
    isFirstLogin: boolean;
    onClose: () => void;
}

export function WelcomeModal({ role, userName, isFirstLogin, onClose }: WelcomeModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isFirstLogin) {
            // Pequeño delay para la animación
            setTimeout(() => setIsVisible(true), 300);
        }
    }, [isFirstLogin]);

    if (!isFirstLogin || !isVisible) return null;

    const content = {
        owner: {
            title: "¡Bienvenido a 360Lateral, Propietario!",
            icon: (
                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            description: `Hola ${userName}, gracias por unirte a nuestra plataforma.`,
            features: [
                {
                    title: "Registra tus Lotes",
                    description: "Agrega información detallada de tus propiedades para comenzar.",
                    icon: "📍"
                },
                {
                    title: "Sube Documentación",
                    description: "Adjunta escrituras, planos y certificados necesarios.",
                    icon: "📄"
                },
                {
                    title: "Validación Administrativa",
                    description: "Nuestro equipo revisará y aprobará tu información.",
                    icon: "✓"
                },
                {
                    title: "Análisis Urbanístico",
                    description: "Solicita análisis profesionales con IA de tus lotes.",
                    icon: "📊"
                },
                {
                    title: "Visibilidad",
                    description: "Desarrolladores podrán encontrar tus lotes aprobados.",
                    icon: "👁️"
                }
            ],
            primaryAction: "Registrar mi Primer Lote",
            secondaryAction: "Explorar Dashboard"
        },
        developer: {
            title: "¡Bienvenido a 360Lateral, Desarrollador!",
            icon: (
                <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            description: `Hola ${userName}, comienza a encontrar oportunidades de desarrollo.`,
            features: [
                {
                    title: "Busca Lotes",
                    description: "Filtra por ubicación, área, precio y tratamiento POT.",
                    icon: "🔍"
                },
                {
                    title: "Favoritos",
                    description: "Guarda y organiza las propiedades que te interesan.",
                    icon: "❤️"
                },
                {
                    title: "Análisis Detallado",
                    description: "Accede a información urbanística completa de cada lote.",
                    icon: "📈"
                },
                {
                    title: "Criterios de Inversión",
                    description: "Define tus preferencias para recibir recomendaciones.",
                    icon: "🎯"
                }
            ],
            primaryAction: "Buscar Lotes",
            secondaryAction: "Explorar Dashboard"
        }
    };

    const currentContent = content[role];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay con animación */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div 
                    className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden transform transition-all duration-300 scale-100"
                    style={{ animation: "slideIn 0.3s ease-out" }}
                >
                    {/* Header con gradiente */}
                    <div className={`${role === 'owner' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-indigo-600 to-indigo-700'} p-8 text-white`}>
                        <div className="flex items-center justify-center mb-4">
                            {currentContent.icon}
                        </div>
                        <h2 className="text-3xl font-bold text-center mb-2">
                            {currentContent.title}
                        </h2>
                        <p className="text-center text-blue-100 text-lg">
                            {currentContent.description}
                        </p>
                    </div>

                    {/* Contenido */}
                    <div className="p-8">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                ¿Qué puedes hacer aquí?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentContent.features.map((feature, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <span className="text-2xl flex-shrink-0">{feature.icon}</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">
                                                {feature.title}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tip adicional */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Tip:</strong> {role === 'owner' 
                                            ? 'Completa la información de tus lotes para recibir validación más rápida.' 
                                            : 'Configura tus criterios de inversión para recibir recomendaciones personalizadas.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    // Navegar a la acción principal
                                    window.location.href = role === 'owner' 
                                        ? '/owner/lotes/nuevo' 
                                        : '/developer/search';
                                }}
                                className={`flex-1 ${role === 'owner' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
                            >
                                {currentContent.primaryAction}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-semibold transition-colors"
                            >
                                {currentContent.secondaryAction}
                            </button>
                        </div>
                    </div>

                    {/* Botón de cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Estilos para animación */}
            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
