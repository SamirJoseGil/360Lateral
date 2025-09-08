import React, { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Link, useNavigate } from "@remix-run/react";
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

export type StatusType = "loading" | "success" | "error";

export interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: StatusType;
    title: string;
    message: string;
    redirectUrl?: string;
    redirectText?: string;
    onRedirect?: (url: string) => void; // Nueva propiedad para manejar redirección programática
}

export default function StatusModal({
    isOpen,
    onClose,
    type,
    title,
    message,
    redirectUrl,
    redirectText,
    onRedirect
}: StatusModalProps) {
    const navigate = useNavigate();

    // Efecto para manejar redirección automática en caso de éxito después de 3 segundos
    useEffect(() => {
        let redirectTimer: NodeJS.Timeout | null = null;

        if (isOpen && type === "success" && redirectUrl) {
            redirectTimer = setTimeout(() => {
                console.log("Redirigiendo automáticamente a:", redirectUrl);
                if (onRedirect) {
                    onRedirect(redirectUrl);
                } else {
                    navigate(redirectUrl);
                }
            }, 3000); // Redireccionar después de 3 segundos en caso de éxito
        }

        return () => {
            if (redirectTimer) {
                clearTimeout(redirectTimer);
            }
        };
    }, [isOpen, type, redirectUrl, navigate, onRedirect]);

    if (!isOpen) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={type === "loading" ? () => { } : onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {title}
                                    </Dialog.Title>
                                    {type !== "loading" && (
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-500"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Cerrar</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center mb-4">
                                        {type === "loading" && (
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mr-3"></div>
                                        )}
                                        {type === "success" && (
                                            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" aria-hidden="true" />
                                        )}
                                        {type === "error" && (
                                            <ExclamationCircleIcon className="h-8 w-8 text-red-500 mr-3" aria-hidden="true" />
                                        )}
                                        <p className="text-sm text-gray-500">{message}</p>
                                    </div>

                                    {type === "success" && redirectUrl && redirectText && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                onClick={() => {
                                                    if (onRedirect) {
                                                        onRedirect(redirectUrl);
                                                    } else {
                                                        navigate(redirectUrl);
                                                    }
                                                }}
                                            >
                                                {redirectText}
                                            </button>
                                        </div>
                                    )}

                                    {type === "error" && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                                onClick={onClose}
                                            >
                                                {redirectText || "Entendido"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}