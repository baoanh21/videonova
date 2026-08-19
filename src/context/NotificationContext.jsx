import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationApi';

const NotificationContext =
  createContext(null);

const POLL_INTERVAL =
  Number(
    import.meta.env
      .VITE_NOTIFICATION_POLL_INTERVAL
  ) || 8000;

export function NotificationProvider({
  children,
}) {
  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const refreshNotifications =
    useCallback(async () => {
      try {
        setError('');

        const result =
          await getNotifications();

        setNotifications(
          result.items
        );

        setUnreadCount(
          result.unreadCount
        );

        return result;
      } catch (err) {
        setError(
          err.message ||
            'Không thể tải thông báo.'
        );

        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    refreshNotifications()
      .catch(() => {});
  }, [
    refreshNotifications,
  ]);

  /*
   * Đây là polling backend thật,
   * không phải tạo notification giả.
   */
  useEffect(() => {
    const interval =
      setInterval(() => {
        refreshNotifications()
          .catch(() => {});
      }, POLL_INTERVAL);

    return () =>
      clearInterval(interval);
  }, [
    refreshNotifications,
  ]);

  const markRead =
    useCallback(
      async (
        notificationId
      ) => {
        const target =
          notifications.find(
            (item) =>
              item.id ===
              notificationId
          );

        if (
          !target ||
          target.isRead
        ) {
          return;
        }

        await markNotificationRead(
          notificationId
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notificationId
                  ? {
                      ...item,
                      isRead:
                        true,
                    }
                  : item
            )
        );

        setUnreadCount(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        );
      },
      [notifications]
    );

  const markAllRead =
    useCallback(async () => {
      if (
        unreadCount === 0
      ) {
        return;
      }

      await markAllNotificationsRead();

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              isRead: true,
            })
          )
      );

      setUnreadCount(0);
    }, [
      unreadCount,
    ]);

  const value =
    useMemo(
      () => ({
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markRead,
        markAllRead,
      }),
      [
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markRead,
        markAllRead,
      ]
    );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context =
    useContext(
      NotificationContext
    );

  if (!context) {
    throw new Error(
      'useNotifications phải nằm trong NotificationProvider'
    );
  }

  return context;
}