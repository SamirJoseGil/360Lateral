import { useNavigate } from "@remix-run/react";

interface GoBackButtonProps {
    label?: string;
    className?: string;
    fallbackUrl?: string;
}

export default function GoBackButton({ 
    label = "Volver atrás", 
    className = "",
    fallbackUrl = "/"
}: GoBackButtonProps) {
    const navigate = useNavigate();

    const handleGoBack = () => {
        // Si hay historial, ir atrás; si no, ir a fallbackUrl
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(fallbackUrl);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoBack}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lateral-500 transition-colors ${className}`}
        >
            <svg 
                className="w-5 h-5 mr-2 -ml-1" 
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
            {label}
        </button>
    );
}
