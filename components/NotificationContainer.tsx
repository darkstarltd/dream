
import React from 'react';
import type { Notification, NotificationType } from '../types';
import { CheckCircleIcon, XCircleIconLarge, InfoCircleIcon } from './Icons';

const iconMap: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
    error: <XCircleIconLarge className="w-6 h-6 text-red-400" />,
    info: <InfoCircleIcon className="w-6 h-6 text-blue-400" />,
};

const NotificationToast: React.FC<{ notification: Notification }> = ({ notification }) => {
    return (
        <div 
            style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
            className="flex items-center bg-dark-800 border border-dark-700 rounded-lg shadow-2xl shadow-black/50 p-4 w-full max-w-sm"
        >
            <div className="flex-shrink-0 mr-3">
                {iconMap[notification.type]}
            </div>
            <p className="text-sm text-gray-200">{notification.message}</p>
        </div>
    );
};

const NotificationContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 space-y-3">
            {notifications.map(notification => (
                <NotificationToast key={notification.id} notification={notification} />
            ))}
        </div>
    );
};

export default NotificationContainer;
