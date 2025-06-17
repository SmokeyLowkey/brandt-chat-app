'use client';

import { useState, useEffect } from 'react';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { Bell, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const { notifications, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  
  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > lastNotificationCount) {
      // Get new notifications
      const newNotifications = notifications.slice(0, notifications.length - lastNotificationCount);
      
      // Show toast for document notifications
      newNotifications.forEach(notification => {
        if (notification.type.startsWith('document_')) {
          toast(
            <div className="flex flex-col gap-1">
              <p className="font-medium">{notification.title}</p>
              <p className="text-sm">{notification.message}</p>
              <p className="text-xs text-gray-500">
                By {notification.user.name || notification.user.email}
              </p>
            </div>,
            {
              duration: 5000,
              icon: notification.type === 'document_uploaded' 
                ? <FileText className="h-5 w-5 text-blue-500" />
                : notification.type === 'document_processed'
                  ? <CheckCircle className="h-5 w-5 text-green-500" />
                  : <AlertCircle className="h-5 w-5 text-red-500" />,
            }
          );
        }
      });
      
      // Update count
      setLastNotificationCount(notifications.length);
    }
  }, [notifications, lastNotificationCount]);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Notifications</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => markAsRead(notification.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'document_uploaded':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'document_processed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'document_processing_failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <li 
      className={`p-4 hover:bg-gray-50 cursor-pointer ${notification.read ? 'opacity-75' : 'bg-blue-50'}`}
      onClick={onRead}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {notification.title}
          </p>
          <p className="text-sm text-gray-500">
            {notification.message}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
            <p className="text-xs text-gray-500">
              {notification.user.name || notification.user.email}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}