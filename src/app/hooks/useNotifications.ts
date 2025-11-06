import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Notification {
  _id: string;
  type: 'MESSAGE' | 'INVITATION' | 'SYSTEM' | 'DOCUMENT' | 'ACTION';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true); 
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.log('🔄 Chargement des notifications...');
      const response = await fetch('/api/notifications');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📨 Notifications chargées:', data.notifications?.length || 0);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setLastUpdate(new Date());
      } else {
        console.error('❌ Erreur réponse API:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetchNotifications();

    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [session, fetchNotifications]);

  const emitAction = useCallback(async (actionData: {
    type: string;
    title: string;
    message: string;
    metadata?: any;
    targetUserId?: string;
  }) => {
    try {
      console.log('🚀 Émission action:', actionData.type);
      
      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ACTION',
          title: actionData.title,
          message: actionData.message,
          metadata: actionData.metadata,
          userId: actionData.targetUserId || session?.user?.id
        }),
      });

      const result = await response.json();
      console.log('📤 Action créée en base:', result);

      if (response.ok) {
        setTimeout(() => fetchNotifications(), 500);
      } else {
        console.error('❌ Erreur création action:', result.error);
      }
    } catch (error) {
      console.error('❌ Erreur émission action:', error);
    }
  }, [session, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erreur tout marquer comme lu:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const wasUnread = notifications.find(n => n._id === notificationId)?.read === false;
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    lastUpdate,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
    emitAction 
  };
}