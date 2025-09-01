import React from "react";

export type StatusType = "loading" | "success" | "error";

interface StatusModalProps {
    isOpen: boolean;
    onClose?: () => void;
    type: StatusType;
    title: string;
    message: string;
    redirectUrl?: string;
    redirectText?: string;
}

export default function StatusModal({
    isOpen,
    onClose,
    type,
    title,
    message,
    redirectUrl,
    redirectText
}: StatusModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex items-center mb-4">
                    {type === "loading" && (
                        <div className="mr-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {type === "success" && (
                        <div className="mr-4 rounded-full bg-green-100 p-2">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}

                    {type === "error" && (
                        <div className="mr-4 rounded-full bg-red-100 p-2">
                            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}

                    <h3 className="text-lg font-bold">{title}</h3>
                </div>

                <p className="text-gray-600 mb-6">{message}</p>

                <div className="flex justify-end">
                    {type === "loading" ? (
                        <p className="text-sm text-gray-500">Por favor espere...</p>
                    ) : (
                        <>
                            {redirectUrl ? (
                                <a
                                    href={redirectUrl}
                                    className={`px-4 py-2 rounded-md text-white ${type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    {redirectText || "Continuar"}
                                </a>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className={`px-4 py-2 rounded-md text-white ${type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    Cerrar
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}