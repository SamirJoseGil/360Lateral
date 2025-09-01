import { useState, useEffect } from "react";
import { Link } from "@remix-run/react";
import type { Lote } from "~/services/lotes.server";

interface RequiredDocumentsNoticeProps {
    lote: Lote;
    className?: string;
}

export default function RequiredDocumentsNotice({ lote, className = "" }: RequiredDocumentsNoticeProps) {
    const [timeLeft, setTimeLeft] = useState<string>("Calculando...");
    const [progress, setProgress] = useState<number>(0);

    // Required documents based on backend data
    const docsRequired = {
        ctl: lote.doc_ctl_subido === true,
        planos: lote.doc_planos_subido === true,
        topografia: lote.doc_topografia_subido === true,
    };

    // Alternatively, use the documentos_requeridos field if provided by the API
    const docsStatus = lote.documentos_requeridos || docsRequired;

    // Calculate completion percentage
    const completedDocs = Object.values(docsStatus).filter(Boolean).length;
    const totalDocs = Object.values(docsStatus).length;
    const completionPercentage = Math.round((completedDocs / totalDocs) * 100);

    // Format time remaining
    useEffect(() => {
        if (!lote.tiempo_restante && !lote.limite_tiempo_docs) {
            setTimeLeft("Tiempo no especificado");
            return;
        }

        // If we have tiempo_restante directly from API
        if (lote.tiempo_restante !== undefined) {
            updateTimeDisplay(lote.tiempo_restante);

            // Update the timer every second
            const interval = setInterval(() => {
                setTimeLeft(prev => {
                    const remainingSeconds = parseTimeString(prev) - 1;
                    if (remainingSeconds <= 0) {
                        clearInterval(interval);
                        return "Tiempo expirado";
                    }
                    return formatTime(remainingSeconds);
                });

                // Update progress
                const initialTime = 12 * 60 * 60; // 12 hours in seconds
                const remainingSeconds = parseTimeString(timeLeft);
                const newProgress = Math.max(0, Math.min(100, (1 - (remainingSeconds / initialTime)) * 100));
                setProgress(newProgress);
            }, 1000);

            return () => clearInterval(interval);
        }

        // If we have limite_tiempo_docs
        if (lote.limite_tiempo_docs) {
            const updateTime = () => {
                const now = new Date();
                const limit = new Date(lote.limite_tiempo_docs!);
                const diffSeconds = Math.max(0, Math.floor((limit.getTime() - now.getTime()) / 1000));

                updateTimeDisplay(diffSeconds);

                // Update progress
                const initialTime = 12 * 60 * 60; // 12 hours in seconds
                const elapsed = initialTime - diffSeconds;
                const newProgress = Math.max(0, Math.min(100, (elapsed / initialTime) * 100));
                setProgress(newProgress);

                if (diffSeconds <= 0) {
                    setTimeLeft("Tiempo expirado");
                    return false; // Stop interval
                }
                return true; // Continue interval
            };

            // Initial update
            const shouldContinue = updateTime();

            // Setup interval if time hasn't expired
            let interval: NodeJS.Timeout | null = null;
            if (shouldContinue) {
                interval = setInterval(() => {
                    const shouldContinue = updateTime();
                    if (!shouldContinue && interval) {
                        clearInterval(interval);
                    }
                }, 1000);
            }

            return () => {
                if (interval) clearInterval(interval);
            };
        }
    }, [lote.tiempo_restante, lote.limite_tiempo_docs]);

    // Helper function to update the time display
    const updateTimeDisplay = (seconds: number) => {
        setTimeLeft(formatTime(seconds));
    };

    // Helper function to parse time string like "11:59:59" to seconds
    const parseTimeString = (timeString: string): number => {
        if (timeString === "Calculando..." || timeString === "Tiempo expirado" || timeString === "Tiempo no especificado") {
            return 0;
        }

        const parts = timeString.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
    };

    // Helper function to format seconds to HH:MM:SS
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    };

    // Determine if we should show warning (time under 2 hours)
    const showWarning = timeLeft !== "Tiempo expirado" && timeLeft !== "Calculando..." &&
        timeLeft !== "Tiempo no especificado" && parseTimeString(timeLeft) < 2 * 60 * 60;

    // Determine if all documents are uploaded
    const allDocsUploaded = completedDocs === totalDocs;

    return (
        <div className={`rounded-lg shadow ${allDocsUploaded ? 'bg-green-50 border border-green-200' : 'bg-white'} ${className}`}>
            <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Documentos Requeridos</h3>

                    {!allDocsUploaded && (
                        <div className="flex items-center">
                            <span className={`text-sm font-medium ${showWarning ? 'text-red-600' : 'text-gray-700'}`}>
                                Tiempo restante: {timeLeft}
                            </span>
                        </div>
                    )}
                </div>

                {/* Status message */}
                {allDocsUploaded ? (
                    <p className="mt-1 text-sm text-green-700">
                        Todos los documentos requeridos han sido subidos. El lote está ahora activo.
                    </p>
                ) : (
                    <p className="mt-1 text-sm text-gray-700">
                        Debes subir los siguientes documentos para activar el lote. El lote se eliminará automáticamente si no se suben todos los documentos dentro del tiempo establecido.
                    </p>
                )}
            </div>

            {/* Progress bar */}
            {!allDocsUploaded && (
                <div className="px-4 py-2 bg-gray-50">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full ${showWarning ? 'bg-red-500' : 'bg-blue-600'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-right mt-1 text-gray-500">
                        {completedDocs} de {totalDocs} documentos subidos ({completionPercentage}%)
                    </p>
                </div>
            )}

            <div className="px-4 py-4 sm:p-6">
                <div className="space-y-4">
                    {/* CTL Document */}
                    <div className="flex items-center">
                        <div className={`flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full ${docsStatus.ctl ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {docsStatus.ctl ? (
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <span className="text-xs font-medium">1</span>
                            )}
                        </div>
                        <div className="ml-3">
                            <h4 className="text-base font-medium text-gray-900">CTL (Certificado de Tradición y Libertad)</h4>
                            <p className="text-sm text-gray-500">
                                {docsStatus.ctl
                                    ? "Documento subido correctamente"
                                    : "Sube el certificado que muestra el historial de propiedad del lote"}
                            </p>
                        </div>
                    </div>

                    {/* Planos Document */}
                    <div className="flex items-center">
                        <div className={`flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full ${docsStatus.planos ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {docsStatus.planos ? (
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <span className="text-xs font-medium">2</span>
                            )}
                        </div>
                        <div className="ml-3">
                            <h4 className="text-base font-medium text-gray-900">Planos</h4>
                            <p className="text-sm text-gray-500">
                                {docsStatus.planos
                                    ? "Documento subido correctamente"
                                    : "Sube los planos arquitectónicos o técnicos del lote"}
                            </p>
                        </div>
                    </div>

                    {/* Levantamiento Topográfico Document */}
                    <div className="flex items-center">
                        <div className={`flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full ${docsStatus.topografia ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {docsStatus.topografia ? (
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <span className="text-xs font-medium">3</span>
                            )}
                        </div>
                        <div className="ml-3">
                            <h4 className="text-base font-medium text-gray-900">Levantamiento topográfico</h4>
                            <p className="text-sm text-gray-500">
                                {docsStatus.topografia
                                    ? "Documento subido correctamente"
                                    : "Sube el levantamiento topográfico con medidas precisas del terreno"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 rounded-b-lg flex justify-between items-center">
                <div className="text-sm">
                    {!allDocsUploaded && (
                        <span className="text-gray-500">
                            El lote permanecerá en estado <span className="font-medium text-yellow-600">incomplete</span> hasta subir todos los documentos
                        </span>
                    )}

                    {allDocsUploaded && (
                        <span className="text-green-600 font-medium">
                            Documentación completa
                        </span>
                    )}
                </div>

                <Link
                    to={`/owner/lote/${lote.id}/documentos`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {allDocsUploaded ? "Administrar documentos" : "Subir documentos"}
                </Link>
            </div>
        </div>
    );
}