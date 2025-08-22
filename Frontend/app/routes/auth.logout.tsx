import { useEffect } from 'react';
import { Navigate } from '@remix-run/react';
import { useAuthContext } from '~/components/auth/AuthProvider';

export default function Logout() {
    const { logout } = useAuthContext();

    useEffect(() => {
        const performLogout = async () => {
            await logout();
        };

        performLogout();
    }, [logout]);

    return <Navigate to="/auth/login" replace />;
}
