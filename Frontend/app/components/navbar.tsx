// app/components/Navbar.tsx
import { Link, NavLink, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useEffect } from "react";

// Definir tipo de props para Navbar
type NavbarProps = {
    user?: any; // Tipo más específico según tu estructura de usuario
};

export default function Navbar({ user }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Definir la estructura de respuesta esperada del endpoint de logout
    type LogoutResponse = {
        success: boolean;
        message?: string;
        shouldRefresh?: boolean;
        redirectTo?: string;
    };

    const logoutFetcher = useFetcher<LogoutResponse>();
    const navigate = useNavigate();

    // Detectar scroll para cambiar estilos de navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Monitorear el estado del fetcher para saber cuando completó la acción de logout
    useEffect(() => {
        if (logoutFetcher.state === "idle" && logoutFetcher.data?.success) {
            // La solicitud de logout se completó exitosamente
            console.log("Logout successful, force refreshing page");

            // Limpiar cualquier información de usuario en almacenamiento local
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');

            // Redirigir a la página principal
            if (logoutFetcher.data?.redirectTo) {
                window.location.href = logoutFetcher.data.redirectTo;
            } else {
                // Si no hay ruta específica, ir al inicio
                window.location.href = "/";
            }
        }
    }, [logoutFetcher.state, logoutFetcher.data]);

    // Función para cerrar sesión usando fetcher con recarga forzada
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

    // Enlaces de navegación según el rol del usuario
    const getNavLinks = () => {
        if (!user) return [];

        switch (user.role) {
            case "admin":
                return [
                    { to: "/admin", label: "Dashboard" },
                    { to: "/admin/usuarios", label: "Usuarios" },
                    { to: "/admin/validacion", label: "Validación" },
                    { to: "/admin/pot", label: "POT" },
                    { to: "/admin/system", label: "Sistema" },
                ];
            case "owner":
                return [
                    { to: "/owner", label: "Dashboard" },
                    { to: "/owner/lotes", label: "Mis Lotes" },
                    { to: "/owner/documentos", label: "Documentos" },
                    {/*{ to: "/owner/ofertas", label: "Ofertas" }, */ }
                ];
            case "developer":
                return [
                    { to: "/developer", label: "Dashboard" },
                    { to: "/developer/search", label: "Búsqueda" },
                    { to: "/developer/favorites", label: "Favoritos" },
                    {/* { to: "/developer/analysis", label: "Análisis" }, */ }
                ];
            default:
                return [];
        }
    };

    const navLinks = getNavLinks().filter((link) => typeof link.to === "string");

    return (
        <nav className={`navbar-lateral w-full fixed top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lateral py-2' : 'py-4'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    {/* Botón de menú móvil */}
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gris-500 hover:text-lateral-500 hover:bg-gris-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lateral-500"
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
                                <div className="h-10 flex items-center">
                                    <span className="text-lateral-500 font-display font-bold text-xl">
                                        360<span className="text-naranja-500">Lateral</span>
                                    </span>
                                </div>
                            </Link>
                        </div>
                        <div className="hidden sm:ml-8 sm:block">
                            <div className="flex space-x-4">
                                {user ? (
                                    // Si hay usuario autenticado, mostrar los enlaces según su rol
                                    navLinks.map((link) => (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            className={({ isActive }) =>
                                                isActive
                                                    ? "nav-link-active"
                                                    : "nav-link"
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
                                                    ? "nav-link-active"
                                                    : "nav-link"
                                            }
                                        >
                                            Acerca de
                                        </NavLink>
                                        <NavLink
                                            to="/nuestro-portfolio"
                                            className={({ isActive }) =>
                                                isActive
                                                    ? "nav-link-active"
                                                    : "nav-link"
                                            }
                                        >
                                            Nuestro Portafolio
                                        </NavLink>
                                        <NavLink
                                            to="/nosotros"
                                            className={({ isActive }) =>
                                                isActive
                                                    ? "nav-link-active"
                                                    : "nav-link"
                                            }
                                        >
                                            Nosotros
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
                                    className="flex rounded-full focus:outline-none focus:ring-2 focus:ring-lateral-400 focus:ring-offset-2"
                                    id="user-menu-button"
                                >
                                    <span className="sr-only">Abrir menú de usuario</span>
                                    <div className="h-9 w-9 rounded-full bg-lateral-500 flex items-center justify-center text-white font-medium">
                                        {user.name ? user.name.charAt(0) : "U"}
                                    </div>
                                </button>

                                {isProfileOpen && (
                                    <div
                                        className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lateral ring-1 ring-black ring-opacity-5 focus:outline-none"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-menu-button"
                                    >
                                        <div className="px-4 py-2 text-sm text-gris-900 border-b">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-gris-500 text-xs">{user.email}</div>
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gris-700 hover:bg-gris-50 hover:text-lateral-500"
                                            role="menuitem"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            Mi Perfil
                                        </Link>
                                        {/* <Link
                                            to="/settings"
                                            className="block px-4 py-2 text-sm text-gris-700 hover:bg-gris-50 hover:text-lateral-500"
                                            role="menuitem"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            Ajustes
                                        </Link> */}
                                        <logoutFetcher.Form method="post" action="/api/auth/logout">
                                            <button
                                                type="submit"
                                                className="block w-full text-left px-4 py-2 text-sm text-gris-700 hover:bg-gris-50 hover:text-naranja-500"
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
                            <div className="flex space-x-3">
                                <Link
                                    to="/login"
                                    className="btn btn-outline"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                >
                                    Registrarse
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Menú móvil */}
            {
                isMenuOpen && (
                    <div className="sm:hidden border-t border-gris-200 bg-white shadow-lg">
                        <div className="space-y-1 px-4 py-3">
                            {user ? (
                                // Si hay usuario autenticado, mostrar los enlaces según su rol
                                navLinks.map((link) => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        className={({ isActive }) =>
                                            isActive
                                                ? "block py-2 font-medium text-lateral-500"
                                                : "block py-2 text-gris-700 hover:text-lateral-500"
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
                                                ? "block py-2 font-medium text-lateral-500"
                                                : "block py-2 text-gris-700 hover:text-lateral-500"
                                        }
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Acerca de
                                    </NavLink>
                                    <NavLink
                                        to="/contact"
                                        className={({ isActive }) =>
                                            isActive
                                                ? "block py-2 font-medium text-lateral-500"
                                                : "block py-2 text-gris-700 hover:text-lateral-500"
                                        }
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Contacto
                                    </NavLink>
                                </>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Mostrar estado del logout para depuración */}
            {
                logoutFetcher.state !== "idle" && (
                    <div className="hidden">Cerrando sesión: {logoutFetcher.state}</div>
                )
            }
        </nav >
    );
}