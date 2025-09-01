import { useEffect, useState } from "react";

interface LoadingModalProps {
    title: string;
    message: string;
    progress: number;
    startTime: number | null;
}

export default function LoadingModal({ title, message, progress, startTime }: LoadingModalProps) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Actualizar el contador de segundos transcurridos
    useEffect(() => {
        if (!startTime) return;

        const interval = setInterval(() => {
            setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">{title}</h3>

                <div className="mb-4">
                    <p className="text-gray-600 mb-2">{message}</p>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Animación de carga */}
                <div className="flex justify-center my-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>

                <p className="text-center text-sm text-gray-500">
                    Tiempo transcurrido: {elapsedSeconds} segundos
                </p>
            </div>
        </div>
    );
}