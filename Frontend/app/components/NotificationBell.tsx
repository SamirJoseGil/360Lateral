import { useNotifications } from '~/contexts/NotificationContext';
import { useNavigate } from '@remix-run/react';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, showPanel, setShowPanel } = useNotifications();
    const navigate = useNavigate();

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 border-red-500';
            case 'high': return 'bg-orange-100 border-orange-500';
            case 'normal': return 'bg-blue-100 border-blue-500';
            default: return 'bg-gray-100 border-gray-500';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'lote_aprobado':
                return '🎉';
            case 'lote_rechazado':
                return '❌';
            case 'documento_validado':
                return '✅';
            case 'documento_rechazado':
                return '❌';
            case 'solicitud_respondida':
                return '💬';
            default:
                return '📢';
        }
    };

    const handleNotificationClick = (notification: any) => {
        // Marcar como leída
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Cerrar panel
        setShowPanel(false);

        // Navegar si hay URL
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    return (
        <div className="relative">
            {/* Botón de campana */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notificaciones"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Badge de contador */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform bg-red-600 rounded-full animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel de notificaciones */}
            {showPanel && (
                <>
                    {/* Overlay para cerrar al hacer clic fuera */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPanel(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 max-h-[600px] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Notificaciones
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Marcar todas como leídas
                                </button>
                            )}
                        </div>

                        {/* Lista de notificaciones */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-gray-500 font-medium">No tienes notificaciones</p>
                                    <p className="text-sm text-gray-400 mt-1">Te avisaremos cuando haya algo nuevo</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icono */}
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${getPriorityColor(notification.priority)}`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                {/* Contenido */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {notification.title}
                                                        </p>
                                                        {!notification.is_read && (
                                                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {notification.time_ago}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer - Eliminado el link "Ver todas" ya que no hay página de notificaciones */}
                    </div>
                </>
            )}
        </div>
    );
}
