import { Fragment, useState } from 'react';
import { Link, useLocation } from '@remix-run/react';
import { useAuthContext } from '~/components/auth/AuthProvider';

interface NavigationItem {
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-6 4h4" />
            </svg>
        )
    },
    {
        name: 'Proyectos',
        href: '/projects',
        icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        )
    },
    {
        name: 'Usuarios',
        href: '/users',
        adminOnly: true,
        icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
        )
    },
    {
        name: 'Configuración',
        href: '/settings',
        icon: ({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )
    }
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

function MobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:hidden"
            onClick={onClick}
        >
            <span className="sr-only">Abrir menú</span>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    );
}

function UserDropdown() {
    const { user, logout } = useAuthContext();

    if (!user) return null;

    return (
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                        {user.first_name[0]}{user.last_name[0]}
                    </span>
                </div>
            </div>
            <div className="hidden md:block">
                <div className="ml-4 flex items-baseline space-x-4">
                    <span className="text-sm font-medium text-gray-700">
                        {user.first_name} {user.last_name}
                    </span>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user } = useAuthContext();
    const location = useLocation();

    const filteredNavigation = navigation.filter(item => {
        if (item.adminOnly && user?.role !== 'admin') {
            return false;
        }
        return true;
    });

    return (
        <>
            {/* Mobile sidebar overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 flex sm:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
                    <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                type="button"
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={onClose}
                            >
                                <span className="sr-only">Cerrar sidebar</span>
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <SidebarContent navigation={filteredNavigation} currentPath={location.pathname} />
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden sm:flex sm:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
                        <SidebarContent navigation={filteredNavigation} currentPath={location.pathname} />
                    </div>
                </div>
            </div>
        </>
    );
}

function SidebarContent({ navigation, currentPath }: { navigation: NavigationItem[], currentPath: string }) {
    return (
        <div className="flex flex-col flex-grow">
            <div className="flex items-center flex-shrink-0 px-4">
                <h2 className="text-lg font-semibold text-gray-900">360Lateral</h2>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                    const isActive = currentPath === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`${isActive
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                        >
                            {item.icon && (
                                <item.icon
                                    className={`${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                        } mr-3 flex-shrink-0 h-6 w-6`}
                                />
                            )}
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex overflow-hidden bg-gray-100">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                {/* Top navigation */}
                <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
                    <MobileMenuButton onClick={() => setSidebarOpen(true)} />
                    <div className="flex-1 px-4 flex justify-between items-center">
                        <div className="flex-1 flex">
                            {/* Search bar could go here */}
                        </div>
                        <div className="ml-4 flex items-center md:ml-6">
                            <UserDropdown />
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    {children}
                </main>
            </div>
        </div>
    );
}