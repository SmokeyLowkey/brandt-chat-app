'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTenant } from '@/providers/tenant-provider';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  read: boolean;
  createdAt: string;
  tenantId: string; // Add tenantId property
  user: {
    name: string | null;
    email: string;
  };
}

export function useNotifications() {
  const { data: session } = useSession();
  const { tenantId } = useTenant();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Poll for new notifications
  const pollNotifications = async () => {
    if (!session || !tenantId) return;
    
    try {
      // Build URL with query parameters
      let url = `/api/tenants/${tenantId}/notifications?limit=10`;
      if (lastChecked) {
        url += `&since=${encodeURIComponent(lastChecked)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from API: ${response.status} ${errorText}`);
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      if (data.notifications && data.notifications.length > 0) {
        // Add new notifications to the list
        setNotifications(prev => {
          // Filter out duplicates
          const newNotifications = data.notifications.filter(
            (newNotif: Notification) => !prev.some(existingNotif => existingNotif.id === newNotif.id)
          );
          
          return [...newNotifications, ...prev];
        });
      }
      
      // Update last checked timestamp
      setLastChecked(new Date().toISOString());
    } catch (error) {
      console.error('Error polling for notifications:', error);
    }
  };
  
  // Start polling when session and tenantId are available
  useEffect(() => {
    if (!session || !tenantId) return;
    
    // Initial poll
    pollNotifications();
    
    // Start polling interval
    pollingIntervalRef.current = setInterval(pollNotifications, 5000); // Poll every 5 seconds
    setIsPolling(true);
    
    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setIsPolling(false);
    };
  }, [session, tenantId]);
  
  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // First check if the notification exists in our local state
      const notification = notifications.find(notif => notif.id === notificationId);
      
      if (!notification) {
        console.warn(`Notification ${notificationId} not found in local state`);
        return false;
      }
      
      // Use the notification's tenant ID
      // Fall back to the current tenant ID if not available
      const notificationTenantId = notification.tenantId || tenantId;
      
      console.log(`Marking notification ${notificationId} as read for tenant ${notificationTenantId}`);
      
      // Optimistically update the UI
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read: true }
            : notif
        )
      );
      
      // Make the API request
      const response = await fetch(`/api/tenants/${notificationTenantId}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        // If the request fails, log the error but don't revert the UI change
        // This provides a better user experience
        const errorText = await response.text();
        console.error(`Error response from API: ${response.status} ${errorText}`);
        
        // If the notification was not found (404), we can just keep the optimistic update
        if (response.status !== 404) {
          console.warn('Non-404 error when marking notification as read, but keeping optimistic UI update');
        }
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };
  
  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };
  
  return {
    notifications,
    isPolling,
    markAsRead,
    clearAll,
    refresh: pollNotifications,
  };
}