import {
  apiRequest,
} from './apiClient';

export function normalizeNotification(
  item = {}
) {
  return {
    id:
      item.id ??
      item.notification_id,

    type:
      String(
        item.type || 'SYSTEM'
      ).toUpperCase(),

    title:
      item.title ||
      'Thông báo',

    message:
      item.message ||
      item.content ||
      '',

    isRead:
      Boolean(
        item.is_read ??
          item.read ??
          false
      ),

    videoId:
      item.video_id ??
      null,

    transactionId:
      item.transaction_id ??
      null,

    createdAt:
      item.created_at ??
      null,
  };
}

export async function getNotifications({
  limit = 10,
} = {}) {
  const query =
    new URLSearchParams({
      limit: String(limit),
    });

  const data =
    await apiRequest(
      `/notifications?${query.toString()}`
    );

  if (Array.isArray(data)) {
    const items =
      data.map(
        normalizeNotification
      );

    return {
      items,

      unreadCount:
        items.filter(
          (item) =>
            !item.isRead
        ).length,
    };
  }

  const rawItems =
    data?.items ??
    data?.notifications ??
    [];

  return {
    items:
      rawItems.map(
        normalizeNotification
      ),

    unreadCount:
      Number(
        data?.unread_count ??
          rawItems.filter(
            (item) =>
              !(
                item.is_read ??
                item.read
              )
          ).length
      ),
  };
}

export function markNotificationRead(
  notificationId
) {
  return apiRequest(
    `/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
    }
  );
}

export function markAllNotificationsRead() {
  return apiRequest(
    '/notifications/read-all',
    {
      method: 'POST',
    }
  );
}