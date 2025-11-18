/**
 * Servicio para gestionar notificaciones desde el servidor
 * Maneja autenticación mediante cookies
 */
import { fetchWithAuth } from "~/utils/auth.server";

const API_URL = process.env.API_URL || 'http://localhost:8000';

export type Notification = {
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

export type NotificationResponse = {
    results: Notification[];
    count: number;
    next: string | null;
    previous: string | null;
};

/**
 * Obtener notificaciones del usuario autenticado
 */
export async function getNotifications(
    request: Request,
    options?: {
        page?: number;
        page_size?: number;
        is_read?: boolean;
    }
): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.page_size) params.append('page_size', options.page_size.toString());
    if (options?.is_read !== undefined) params.append('is_read', options.is_read.toString());
    
    const url = `${API_URL}/api/notifications/?${params.toString()}`;
    
    const { res, setCookieHeaders } = await fetchWithAuth(request, url, {
        method: 'GET',
    });
    
    if (!res.ok) {
        console.error(`[Notifications] Error fetching notifications: ${res.status}`);
        return {
            results: [],
            count: 0,
            next: null,
            previous: null
        };
    }
    
    const data = await res.json();
    
    return {
        results: data.results || data,
        count: data.count || data.length || 0,
        next: data.next || null,
        previous: data.previous || null
    };
}

/**
 * Obtener conteo de notificaciones no leídas
 */
export async function getUnreadCount(request: Request): Promise<number> {
    const { res } = await fetchWithAuth(request, `${API_URL}/api/notifications/unread_count/`, {
        method: 'GET',
    });
    
    if (!res.ok) {
        console.error(`[Notifications] Error fetching unread count: ${res.status}`);
        return 0;
    }
    
    const data = await res.json();
    return data.count || 0;
}

/**
 * Marcar notificación como leída
 */
export async function markAsRead(request: Request, notificationId: string): Promise<boolean> {
    const { res } = await fetchWithAuth(
        request,
        `${API_URL}/api/notifications/${notificationId}/mark_read/`,
        {
            method: 'POST',
        }
    );
    
    return res.ok;
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllAsRead(request: Request): Promise<number> {
    const { res } = await fetchWithAuth(
        request,
        `${API_URL}/api/notifications/mark_all_read/`,
        {
            method: 'POST',
        }
    );
    
    if (!res.ok) {
        console.error(`[Notifications] Error marking all as read: ${res.status}`);
        return 0;
    }
    
    const data = await res.json();
    return data.marked || 0;
}

/**
 * Obtener notificaciones recientes (últimas 10)
 */
export async function getRecentNotifications(request: Request): Promise<Notification[]> {
    const { res } = await fetchWithAuth(request, `${API_URL}/api/notifications/recent/`, {
        method: 'GET',
    });
    
    if (!res.ok) {
        console.error(`[Notifications] Error fetching recent: ${res.status}`);
        return [];
    }
    
    const data = await res.json();
    return data;
}
