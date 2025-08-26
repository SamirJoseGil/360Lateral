// app/components/Navbar.tsx
import { Link, NavLink, useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";

export default function Navbar() {
    const data = useLoaderData<{ user: any }>();
    const user = data?.user;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Definir la estructura de respuesta esperada del endpoint de logout
    type LogoutResponse = {
        success: boolean;
        message?: string;
        shouldRefresh?: boolean;
    };

    const logoutFetcher = useFetcher<LogoutResponse>();
    const navigate = useNavigate();

    // Monitorear el estado del fetcher para saber cuando completó la acción de logout
    useEffect(() => {
        if (logoutFetcher.state === "idle" && logoutFetcher.data?.success) {
            // La solicitud de logout se completó exitosamente
            console.log("Logout successful, reloading page");

            // Verificar si las cookies se eliminaron realmente
            console.log("Cookies after logout response:", document.cookie);
            const hasAuthCookies = document.cookie.includes('l360_access') ||
                document.cookie.includes('l360_refresh') ||
                document.cookie.includes('l360_session');

            if (hasAuthCookies) {
                console.warn("Auth cookies still present after logout! Forcing cleanup");
                // Si las cookies aún están presentes, intentamos limpiarlas manualmente
                document.cookie = "l360_access=;max-age=0;path=/";
                document.cookie = "l360_refresh=;max-age=0;path=/";
                document.cookie = "l360_session=;max-age=0;path=/";
            }

            // Recargar la página para actualizar el estado
            window.location.href = "/";
        }
    }, [logoutFetcher.state, logoutFetcher.data]);

    // Función para cerrar sesión usando fetcher con recarga forzada
    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log("Initiating logout process");

        // Mostrar que estamos procesando
        console.log("Current cookies before logout:", document.cookie);

        // Usar fetcher para enviar la solicitud
        logoutFetcher.submit({}, {
            method: "post",
            action: "/api/auth/logout"
        });

        // Cerrar menú de perfil
        setIsProfileOpen(false);

        // Forzar recarga inmediatamente después
        // No usar un delay tan largo, ya que queremos que sea casi inmediato
        setTimeout(() => {
            console.log("Cookies after logout attempt:", document.cookie);
            console.log("Forcing page reload after logout");

            // Limpiar cualquier información de usuario en almacenamiento local si existe
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');

            // Recarga completa de la página
            window.location.href = "/";

            // Disparar un evento personalizado de logout
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }, 100); // Reducir el tiempo a 100ms
    };

    // Enlaces de navegación según el rol del usuario - versión actualizada con nuevas rutas
    const getNavLinks = () => {
        if (!user) return [];

        switch (user.role) {
            case "admin":
                return [
                    { to: "/admin", label: "Dashboard" },
                    { to: "/admin/usuarios", label: "Usuarios" },
                    { to: "/admin/validacion", label: "Validación" },
                    { to: "/admin/analisis", label: "Análisis" },
                ];
            case "owner":
                return [
                    { to: "/owner", label: "Dashboard" },
                    { to: "/owner/lotes", label: "Mis Lotes" },
                    { to: "/owner/documentos", label: "Documentos" },
                    { to: "/owner/ofertas", label: "Ofertas" },
                ];
            case "developer":
                return [
                    { to: "/developer", label: "Dashboard" },
                    { to: "/developer/busqueda", label: "Búsqueda" },
                    { to: "/developer/favoritos", label: "Favoritos" },
                    { to: "/developer/analisis", label: "Análisis" },
                ];
            default:
                return [];
        }
    };

    const navLinks = getNavLinks();

    return (
        <nav className="bg-gray-800">
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    {/* Botón de menú móvil */}
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span className="sr-only">Abrir menú principal</span>
                            <svg
                                className="block h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Logo y navegación de escritorio */}
                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex flex-shrink-0 items-center">
                            <Link to="/">
                                <span className="font-bold text-white text-xl">Lateral360</span>
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:block">
                            <div className="flex space-x-4">
                                {user ? (
                                    // Si hay usuario autenticado, mostrar los enlaces según su rol
                                    navLinks.map((link) => (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            className={({ isActive }) =>
                                                isActive
                                                    ? "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium"
                                                    : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                            }
                                        >
                                            {link.label}
                                        </NavLink>
                                    ))
                                ) : (
                                    // Si no hay usuario, mostrar enlaces públicos
                                    <>
                                        <NavLink
                                            to="/about"
                                            className={({ isActive }) =>
                                                isActive
                                                    ? "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium"
                                                    : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                            }
                                        >
                                            Acerca de
                                        </NavLink>
                                        <NavLink
                                            to="/contact"
                                            className={({ isActive }) =>
                                                isActive
                                                    ? "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium"
                                                    : "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                            }
                                        >
                                            Contacto
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        {user ? (
                            // Si hay usuario autenticado, mostrar su perfil
                            <div className="relative ml-3">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    type="button"
                                    className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                    id="user-menu-button"
                                >
                                    <span className="sr-only">Abrir menú de usuario</span>
                                    <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                                        {user.name ? user.name.charAt(0) : "U"}
                                    </div>
                                </button>

                                {isProfileOpen && (
                                    <div
                                        className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-menu-button"
                                    >
                                        <div className="px-4 py-2 text-sm text-gray-900 border-b">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-gray-500">{user.email}</div>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            Mi Perfil
                                        </Link>
                                        <Link
                                            to="/settings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            Ajustes
                                        </Link>
                                        <logoutFetcher.Form method="post" action="/api/auth/logout">
                                            <button
                                                type="submit"
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                role="menuitem"
                                                onClick={handleLogout}
                                            >
                                                Cerrar sesión
                                            </button>
                                        </logoutFetcher.Form>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Si no hay usuario autenticado, mostrar botones de login/registro
                            <div className="flex space-x-2">
                                <Link
                                    to="/login"
                                    className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-600"
                                >
                                    Registrarse
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Menú móvil */}
            {isMenuOpen && (
                <div className="sm:hidden">
                    <div className="space-y-1 px-2 pb-3 pt-2">
                        {user ? (
                            // Si hay usuario autenticado, mostrar los enlaces según su rol
                            navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) =>
                                        isActive
                                            ? "bg-gray-900 text-white block px-3 py-2 rounded-md text-base font-medium"
                                            : "text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                                    }
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </NavLink>
                            ))
                        ) : (
                            // Si no hay usuario, mostrar enlaces públicos
                            <>
                                <NavLink
                                    to="/about"
                                    className={({ isActive }) =>
                                        isActive
                                            ? "bg-gray-900 text-white block px-3 py-2 rounded-md text-base font-medium"
                                            : "text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                                    }
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Acerca de
                                </NavLink>
                                <NavLink
                                    to="/contact"
                                    className={({ isActive }) =>
                                        isActive
                                            ? "bg-gray-900 text-white block px-3 py-2 rounded-md text-base font-medium"
                                            : "text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                                    }
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Contacto
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Mostrar estado del logout para depuración */}
            {logoutFetcher.state !== "idle" && (
                <div className="hidden">Cerrando sesión: {logoutFetcher.state}</div>
            )}
        </nav>
    );
}
