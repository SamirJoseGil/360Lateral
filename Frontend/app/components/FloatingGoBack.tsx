import { useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";

export default function FloatingGoBack() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Mostrar el botón si hay historial
        setIsVisible(window.history.length > 1);
    }, []);

    if (!isVisible) return null;

    return (
        <button
            onClick={() => navigate(-1)}
            className="fixed bottom-6 left-6 z-50 p-3 bg-lateral-600 text-white rounded-full shadow-lg hover:bg-lateral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lateral-500 transition-all duration-200 hover:scale-110"
            aria-label="Volver atrás"
        >
            <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                />
            </svg>
        </button>
    );
}
