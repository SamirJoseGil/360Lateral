/**
 * API Route para notificaciones
 * Actúa como proxy entre el frontend y el backend
 */
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { 
    getNotifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead,
    getRecentNotifications
} from "~/services/notifications.server";
import { getUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    
    if (!user) {
        return json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    try {
        switch (action) {
            case 'unread_count':
                const count = await getUnreadCount(request);
                return json({ count });
            
            case 'recent':
                const recent = await getRecentNotifications(request);
                return json(recent);
            
            default:
                // Obtener todas las notificaciones con paginación
                const page = parseInt(url.searchParams.get('page') || '1');
                const pageSize = parseInt(url.searchParams.get('page_size') || '20');
                const isRead = url.searchParams.get('is_read');
                
                const notifications = await getNotifications(request, {
                    page,
                    page_size: pageSize,
                    is_read: isRead === 'true' ? true : isRead === 'false' ? false : undefined
                });
                
                return json(notifications);
        }
    } catch (error) {
        console.error('[API Notifications] Error:', error);
        return json({ error: 'Error al obtener notificaciones' }, { status: 500 });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const user = await getUser(request);
    
    if (!user) {
        return json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const action = formData.get('action') as string;
    const notificationId = formData.get('notificationId') as string;
    
    try {
        switch (action) {
            case 'mark_read':
                if (!notificationId) {
                    return json({ error: 'ID de notificación requerido' }, { status: 400 });
                }
                const success = await markAsRead(request, notificationId);
                return json({ success });
            
            case 'mark_all_read':
                const marked = await markAllAsRead(request);
                return json({ success: true, marked });
            
            default:
                return json({ error: 'Acción no válida' }, { status: 400 });
        }
    } catch (error) {
        console.error('[API Notifications] Action error:', error);
        return json({ error: 'Error al procesar acción' }, { status: 500 });
    }
}
