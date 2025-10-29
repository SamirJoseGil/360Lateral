// app/components/Navbar.tsx
import { Link, NavLink, useFetcher, useRouteLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";

export default function Navbar() {
    // Obtener usuario desde el root loader
    const rootData = useRouteLoaderData<{ user: any }>("root");
    const user = rootData?.user;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const logoutFetcher = useFetcher();

    // Detectar scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cerrar menús al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('#user-menu-button') && !target.closest('#user-menu')) {
                setIsProfileOpen(false);
            }
            if (!target.closest('#mobile-menu-button') && !target.closest('#mobile-menu')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // CRÍTICO: Manejar logout sin revalidaciones infinitas
    useEffect(() => {
        if (logoutFetcher.state === "idle" && logoutFetcher.data !== undefined) {
            console.log("Logout completed, forcing page reload");

            // Limpiar almacenamiento local
            localStorage.clear();
            sessionStorage.clear();

            // CRÍTICO: Forzar recarga completa SOLO UNA VEZ
            if (!window.location.href.includes('?logout=true')) {
                window.location.href = "/?logout=true";
            }
        }
    }, [logoutFetcher.state, logoutFetcher.data]);

    // CRÍTICO: ELIMINAR este useEffect que causa el loop
    // NO revalidar automáticamente, el sistema ya se encarga de eso

    // Función para cerrar sesión - MEJORADA
    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        console.log("=== LOGOUT START ===");

        setIsProfileOpen(false);
        setIsMenuOpen(false);

        // Limpiar storage inmediatamente
        localStorage.clear();
        sessionStorage.clear();

        // Usar fetcher para hacer la petición
        logoutFetcher.submit({}, {
            method: "post",
            action: "/api/auth/logout"
        });
    };

    // Determinar enlaces de navegación
    const getNavLinks = () => {
        if (!user) {
            return [
                { to: "/", label: "Inicio" },
                { to: "/about", label: "Acerca de" },
                { to: "/contact", label: "Contacto" },
            ];
        }

        // Enlaces según rol
        const dashboardLink = { to: `/${user.role}`, label: "Dashboard" };

        const commonLinks = [
            { to: "/about", label: "Acerca de" },
            { to: "/contact", label: "Contacto" },
        ];

        return [dashboardLink, ...commonLinks];
    };

    const navLinks = getNavLinks();

    // Obtener iniciales del usuario
    const getUserInitials = () => {
        if (user?.first_name && user?.last_name) {
            return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
        }
        if (user?.name) {
            const names = user.name.split(' ');
            return names.length > 1
                ? `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase()
                : user.name.substring(0, 2).toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return "U";
    };

    // Obtener nombre para mostrar
    const getDisplayName = () => {
        if (user?.first_name && user?.last_name) {
            return `${user.first_name} ${user.last_name}`;
        }
        if (user?.name) {
            return user.name;
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return "Usuario";
    };

    // Obtener nombre del rol
    const getRoleName = () => {
        switch (user?.role) {
            case 'admin':
                return 'Administrador';
            case 'owner':
                return 'Propietario';
            case 'developer':
                return 'Desarrollador';
            default:
                return user?.role || 'Usuario';
        }
    };

    const isLoggingOut = logoutFetcher.state === "submitting" || logoutFetcher.state === "loading";

    return (
        <nav className={`navbar-lateral w-full fixed top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lateral py-2' : 'py-4'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-12">
                    {/* Botón de menú móvil */}
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <button
                            id="mobile-menu-button"
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gris-500 hover:text-lateral-500 hover:bg-gris-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lateral-500 transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-expanded={isMenuOpen}
                        >
                            <span className="sr-only">{isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
                            {isMenuOpen ? (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Logo y navegación de escritorio */}
                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex flex-shrink-0 items-center">
                            <Link to="/" className="transition-transform hover:scale-105">
                                <span className="text-lateral-500 font-display font-bold text-xl">
                                    360<span className="text-naranja-500">Lateral</span>
                                </span>
                            </Link>
                        </div>
                        <div className="hidden sm:ml-8 sm:block">
                            <div className="flex space-x-4">
                                {navLinks.map((link) => (
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
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción - MEJORADO */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        {user && !isLoggingOut ? (
                            // Usuario autenticado
                            <div className="relative ml-3">
                                <button
                                    id="user-menu-button"
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    type="button"
                                    className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-lateral-400 focus:ring-offset-2 transition-all hover:scale-105"
                                    aria-expanded={isProfileOpen}
                                    aria-haspopup="true"
                                >
                                    <span className="sr-only">Abrir menú de usuario</span>
                                    <div className="h-9 w-9 rounded-full bg-gradient-lateral flex items-center justify-center text-white font-medium shadow-lg">
                                        {getUserInitials()}
                                    </div>
                                    <svg className="hidden sm:block h-5 w-5 text-gris-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isProfileOpen && (
                                    <div
                                        id="user-menu"
                                        className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-white py-1 shadow-lateral ring-1 ring-black ring-opacity-5 focus:outline-none animate-fadeIn"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-menu-button"
                                    >
                                        {/* Header del menú */}
                                        <div className="px-4 py-3 border-b border-gris-200">
                                            <div className="font-medium text-gris-900 truncate">
                                                {getDisplayName()}
                                            </div>
                                            <div className="text-sm text-gris-500 truncate">{user.email}</div>
                                            <div className="mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full bg-lateral-100 text-lateral-700">
                                                {getRoleName()}
                                            </div>
                                        </div>

                                        {/* Opciones del menú */}
                                        <div className="py-1">
                                            <Link
                                                to={`/${user.role}`}
                                                className="flex items-center px-4 py-2 text-sm text-gris-700 hover:bg-gris-50 hover:text-lateral-500 transition-colors"
                                                role="menuitem"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>
                                                Dashboard
                                            </Link>

                                            <Link
                                                to="/profile"
                                                className="flex items-center px-4 py-2 text-sm text-gris-700 hover:bg-gris-50 hover:text-lateral-500 transition-colors"
                                                role="menuitem"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Mi Perfil
                                            </Link>

                                            <div className="border-t border-gris-200 my-1"></div>

                                            <button
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                role="menuitem"
                                            >
                                                {isLoggingOut ? (
                                                    <>
                                                        <svg className="animate-spin mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Cerrando sesión...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        Cerrar sesión
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Usuario no autenticado
                            <div className="flex space-x-3">
                                <Link
                                    to="/login"
                                    className="btn btn-outline px-4 py-2 text-sm font-medium"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary px-4 py-2 text-sm font-medium"
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
                <div id="mobile-menu" className="sm:hidden border-t border-gris-200 bg-white shadow-lg animate-fadeIn">
                    <div className="space-y-1 px-4 py-3">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `block py-2 px-3 rounded-md text-base font-medium transition-colors ${isActive
                                        ? "bg-lateral-50 text-lateral-600"
                                        : "text-gris-700 hover:bg-gris-50 hover:text-lateral-500"
                                    }`
                                }
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.label}
                            </NavLink>
                        ))}

                        {user && (
                            <>
                                <div className="border-t border-gris-200 my-2"></div>
                                <Link
                                    to="/profile"
                                    className="block py-2 px-3 rounded-md text-base font-medium text-gris-700 hover:bg-gris-50 hover:text-lateral-500 transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Mi Perfil
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full text-left block py-2 px-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}