import {
  useEffect,
  useRef,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import Icon from './Icon';

import {
  useNotifications,
} from '../context/NotificationContext';

function getNotificationIcon(
  type
) {
  const map = {
    VIDEO_COMPLETED:
      'check',

    VIDEO_FAILED:
      'x',

    LOW_CREDIT:
      'wallet',

    PAYMENT_SUCCESS:
      'receipt',

    CREDIT_ADDED:
      'sparkles',
  };

  return (
    map[type] ||
    'bell'
  );
}

function formatTime(value) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

export default function NotificationMenu({
  open,
  onClose,
}) {
  const navigate =
    useNavigate();

  const handleNotification =
    async (
      notification
    ) => {
      try {
        if (
          !notification.isRead
        ) {
          await markRead(
            notification.id
          );
        }
      } catch {
        // Không chặn điều hướng.
      }

      onClose();

      if (
        notification.videoId
      ) {
        navigate(
          `/videos/${notification.videoId}`
        );

        return;
      }

      if (
        notification.transactionId
      ) {
        navigate(
          '/transactions'
        );

        return;
      }

      if (
        notification.type ===
        'LOW_CREDIT'
      ) {
        navigate(
          '/billing'
        );
      }
    };

  if (!open) {
    return null;
  }

  return (
    <div
      className="notification-dropdown"
    >
      <div className="notification-header">
        <div>
          <h3>
            Thông báo
          </h3>

          <span>
            {unreadCount > 0
              ? `${unreadCount} chưa đọc`
              : 'Không có thông báo mới'}
          </span>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() =>
              markAllRead()
                .catch(() => {})
            }
          >
            Đọc tất cả
          </button>
        )}
      </div>

      <div className="notification-body">
        {loading ? (
          <div className="notification-empty">
            <div className="spinner" />

            <span>
              Đang tải thông báo...
            </span>
          </div>
        ) : error ? (
          <div className="notification-empty">
            <Icon
              name="x"
              className="w-5 h-5"
            />

            <span>
              {error}
            </span>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                refreshNotifications()
                  .catch(
                    () => {}
                  )
              }
            >
              Thử lại
            </button>
          </div>
        ) : notifications.length ===
          0 ? (
          <div className="notification-empty">
            <Icon
              name="bell"
              className="w-6 h-6"
            />

            <strong>
              Chưa có thông báo
            </strong>

            <span>
              Khi video hoàn tất hoặc
              có thay đổi quan trọng,
              thông báo sẽ xuất hiện
              tại đây.
            </span>
          </div>
        ) : (
          notifications.map(
            (
              notification
            ) => (
              <button
                type="button"
                key={
                  notification.id
                }
                className={`notification-item ${
                  notification.isRead
                    ? ''
                    : 'unread'
                }`}
                onClick={() =>
                  handleNotification(
                    notification
                  )
                }
              >
                <div
                  className={`notification-type-icon type-${notification.type.toLowerCase()}`}
                >
                  <Icon
                    name={getNotificationIcon(
                      notification.type
                    )}
                    className="w-4 h-4"
                  />
                </div>

                <div className="notification-content">
                  <div>
                    <strong>
                      {
                        notification.title
                      }
                    </strong>

                    {!notification.isRead && (
                      <i className="notification-unread-dot" />
                    )}
                  </div>

                  <p>
                    {
                      notification.message
                    }
                  </p>

                  <span>
                    {formatTime(
                      notification.createdAt
                    )}
                  </span>
                </div>
              </button>
            )
          )
        )}
      </div>
    </div>
  );
}