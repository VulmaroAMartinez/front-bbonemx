/**
 * BB Maintenance - Contexto de Notificaciones
 * Gestiona el estado global de notificaciones del usuario
 */

'use client';

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { useQuery, useMutation } from '@/lib/graphql/hooks';
import {
  GET_NOTIFICATIONS,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
} from '@/lib/graphql/queries';
import { useAuth } from './auth-context';
import type { Notification, NotificationContextType } from '@/lib/types';

// Crear contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

interface NotificationsResponse {
  notifications: Notification[];
}

interface MarkReadResponse {
  markNotificationRead: Notification;
}

interface MarkAllReadResponse {
  markAllNotificationsRead: boolean;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth();

  // Query para obtener notificaciones
  const { data, refetch } = useQuery<NotificationsResponse>(GET_NOTIFICATIONS, {
    variables: { userId: user?.id },
    skip: !isAuthenticated || !user?.id,
    pollInterval: 30000, // Actualizar cada 30 segundos
  });

  // Mutations
  const [markReadMutation] = useMutation<MarkReadResponse, { id: string }>(MARK_NOTIFICATION_READ);
  const [markAllReadMutation] = useMutation<MarkAllReadResponse, { userId: string }>(
    MARK_ALL_NOTIFICATIONS_READ
  );

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Marcar una notificación como leída
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await markReadMutation({ variables: { id } });
        refetch();
      } catch (error) {
        console.error('[v0] Error al marcar notificación:', error);
      }
    },
    [markReadMutation, refetch]
  );

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await markAllReadMutation({ variables: { userId: user.id } });
      refetch();
    } catch (error) {
      console.error('[v0] Error al marcar todas las notificaciones:', error);
    }
  }, [user?.id, markAllReadMutation, refetch]);

  // Agregar notificación (útil para notificaciones en tiempo real)
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      // En un sistema real, esto iría al backend
      // Aquí solo refrescamos para obtener las nuevas notificaciones
      refetch();
    },
    [refetch]
  );

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook para usar el contexto de notificaciones
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
  }
  return context;
}

// Alias para compatibilidad (useNotification)
export const useNotification = (): NotificationContextType & {
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
} => {
  const context = useNotifications();
  
  // Helper function to show toast-like notifications
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    // In a real app, this would use a toast library
    // For now, we'll add it to the notification system
    context.addNotification({
      type: type === 'success' ? 'success' : type === 'error' ? 'error' : 'info',
      title: type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : type === 'warning' ? 'Advertencia' : 'Información',
      message,
      userId: '',
    });
    
    // Also show a console message for debugging
    console.log(`[BB Maintenance] ${type.toUpperCase()}: ${message}`);
  };
  
  return {
    ...context,
    showNotification,
  };
};
