import { Link, NavLink, useFetcher } from "@remix-run/react";
import React, { useState } from "react";

type SidebarOption = {
    to: string;
    label: string;
    icon: string;
};

type SidebarProps = {
    options: SidebarOption[];
    user: {
        name?: string;
        email: string;
        role: string;
    };
};

type LogoutResponse = {
    success: boolean;
    message?: string;
    shouldRefresh?: boolean;
    redirectTo?: string;
};

export default function Sidebar({ options, user }: SidebarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const logoutFetcher = useFetcher<LogoutResponse>();

    const getIconSvg = (iconName: string) => {
        switch (iconName) {
            case "dashboard":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                );
            case "users":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                );
            case "search":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                );
            case "heart":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                );
            case "chart-bar":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                );
            case "document-text":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                );
            case "check-circle":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case "map":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const getDisplayName = () => {
        if (user.name) {
            return user.name.split(' ')[0];
        }
        return user.email.split('@')[0];
    };

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log("Initiating logout process");

        // Cerrar menú de perfil
        setIsProfileOpen(false);

        // Usar fetcher para enviar la solicitud al endpoint de API
        logoutFetcher.submit({}, {
            method: "post",
            action: "/api/auth/logout"
        });
    };

    return (
        <div className="w-64 bg-white shadow-md flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                    {user.role === "admin" ? "Panel Admin" :
                        user.role === "owner" ? "Panel Propietario" :
                            "Panel Desarrollador"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Bienvenido, {getDisplayName()}</p>
            </div>

            <nav className="p-4 flex-grow">
                <ul className="space-y-1">
                    {options.map((option, index) => (
                        <li key={index}>
                            <NavLink
                                to={option.to}
                                end={option.to.split('/').length <= 2} // Add end prop for main routes only
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700 transition-colors
                  ${isActive ? "bg-indigo-100 text-indigo-800 font-medium" : ""}`
                                }
                            >
                                <span className="mr-3">{getIconSvg(option.icon)}</span>
                                {option.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-200">
                <ul className="space-y-1">
                    <li>
                        <Link
                            to="/"
                            className="flex items-center px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            Inicio
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Mi Perfil
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/api/auth/logout"
                            className="flex items-center px-4 py-2 text-gray-700 rounded hover:bg-indigo-50 hover:text-indigo-700"
                            onClick={handleLogout}
                            type="submit"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm9.53 5.47a.75.75 0 00-1.06 0L8.75 10.19V6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h6a.75.75 0 000-1.5h-4.19l2.72-2.72a.75.75 0 000-1.06z" clipRule="evenodd" />
                            </svg>
                            Cerrar Sesión
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}