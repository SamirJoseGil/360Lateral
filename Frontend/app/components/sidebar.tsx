import { NavLink } from "@remix-run/react";
import { useState } from "react";

type SidebarOption = {
    to: string;
    label: string;
    icon: string;
};

type SidebarProps = {
    options: SidebarOption[];
    user: any;
};

// Función para renderizar iconos según el nombre
function renderIcon(iconName: string) {
    switch (iconName) {
        case "dashboard":
            return (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            );
        case "users":
            return (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            );
        case "check-circle":
            return (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case "chart-bar":
            return (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            );
        default:
            return (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            );
    }
}

export default function Sidebar({ options, user }: SidebarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Sidebar para pantallas medianas y grandes */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
                    <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center flex-shrink-0 px-4">
                            <span className="text-xl font-bold">Lateral360</span>
                        </div>

                        {/* Información del usuario */}
                        <div className="px-4 py-4 border-b">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                    {user?.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{user?.name}</div>
                                    <div className="text-sm text-gray-500">{user?.email}</div>
                                </div>
                            </div>
                        </div>

                        {/* Navegación */}
                        <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                            {options.map((option) => (
                                <NavLink
                                    key={option.to}
                                    to={option.to}
                                    className={({ isActive }) =>
                                        `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <span className="mr-3">{renderIcon(option.icon)}</span>
                                    {option.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Footer del sidebar */}
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <NavLink to="/" className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div>
                                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                        Ir al Inicio
                                    </p>
                                </div>
                            </div>
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* Botón de menú para móviles */}
            <div className="md:hidden fixed top-0 left-0 z-30 p-4">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                    <span className="sr-only">Abrir sidebar</span>
                    {!isMobileMenuOpen ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Sidebar móvil */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 flex z-40">
                    {/* Overlay oscuro */}
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>

                    {/* Panel del sidebar */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <span className="sr-only">Cerrar sidebar</span>
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <div className="flex-shrink-0 flex items-center px-4">
                                <span className="text-xl font-bold">Lateral360</span>
                            </div>

                            {/* Información del usuario */}
                            <div className="px-4 py-4 border-b">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                        {user?.name?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{user?.name}</div>
                                        <div className="text-sm text-gray-500">{user?.email}</div>
                                    </div>
                                </div>
                            </div>

                            <nav className="mt-5 px-2 space-y-1">
                                {options.map((option) => (
                                    <NavLink
                                        key={option.to}
                                        to={option.to}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`
                                        }
                                    >
                                        <span className="mr-4">{renderIcon(option.icon)}</span>
                                        {option.label}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>

                        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                            <NavLink
                                to="/"
                                className="flex items-center"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <div>
                                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-base font-medium text-gray-700 hover:text-gray-900">
                                        Ir al Inicio
                                    </p>
                                </div>
                            </NavLink>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}