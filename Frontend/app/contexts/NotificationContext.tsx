import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFetcher } from '@remix-run/react';

type Notification = {
    id: string;
    type: string;
    type_display: string;
    title: string;
    message: string;
    priority: string;
    priority_display: string;
    is_read: boolean;
    action_url?: string;
    created_at: string;
    time_ago: string;
    data?: any;
};

type NotificationContextType = {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    showPanel: boolean;
    setShowPanel: (show: boolean) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    
    // ✅ Usar fetcher para llamadas autenticadas al API route
    const notificationsFetcher = useFetcher();
    const countFetcher = useFetcher();
    const actionFetcher = useFetcher();

    // ✅ Función para obtener notificaciones
    const fetchNotifications = () => {
        setLoading(true);
        
        // Obtener notificaciones
        notificationsFetcher.load('/api/notifications');
        
        // Obtener contador
        countFetcher.load('/api/notifications?action=unread_count');
    };

    // ✅ Actualizar estado cuando se reciban notificaciones
    useEffect(() => {
        if (notificationsFetcher.data && !notificationsFetcher.data.error) {
            const data = notificationsFetcher.data as any;
            setNotifications(data.results || data);
            setLoading(false);
        }
    }, [notificationsFetcher.data]);

    // ✅ Actualizar contador cuando se reciba
    useEffect(() => {
        if (countFetcher.data && !countFetcher.data.error) {
            const data = countFetcher.data as any;
            setUnreadCount(data.count || 0);
        }
    }, [countFetcher.data]);

    // ✅ Marcar como leída
    const markAsRead = (id: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Enviar al servidor
        const formData = new FormData();
        formData.append('action', 'mark_read');
        formData.append('notificationId', id);
        
        actionFetcher.submit(formData, {
            method: 'POST',
            action: '/api/notifications'
        });
    };

    // ✅ Marcar todas como leídas
    const markAllAsRead = () => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        
        // Enviar al servidor
        const formData = new FormData();
        formData.append('action', 'mark_all_read');
        
        actionFetcher.submit(formData, {
            method: 'POST',
            action: '/api/notifications'
        });
    };

    // ✅ Polling cada 30 segundos
    useEffect(() => {
        fetchNotifications();
        
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                showPanel,
                setShowPanel,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
