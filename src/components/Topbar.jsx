import {
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import Icon from './Icon';

import NotificationMenu from './NotificationMenu';

import {
  useAuth,
} from '../context/AuthContext';

import {
  useAppData,
} from '../context/AppDataContext';

import {
  useNotifications,
} from '../context/NotificationContext';

export default function Topbar({
  onMenu,
}) {
  const navigate =
    useNavigate();

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);

  const {
    user,
    logout,
  } = useAuth();

  const {
    credit,
  } = useAppData();

  const {
    unreadCount,
  } = useNotifications();

  const initials =
    user?.fullName
      ?.split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((word) =>
        word[0]?.toUpperCase()
      )
      .join('') || 'U';

  const handleLogout =
    async () => {
      await logout();

      navigate(
        '/login',
        {
          replace: true,
        }
      );
    };

  return (
    <header className="topbar">
      <button
        type="button"
        className="menu-button"
        onClick={onMenu}
        aria-label="Mở menu"
      >
        <Icon name="menu" />
      </button>

      <div className="top-search">
        <Icon
          name="search"
          className="w-[18px] h-[18px]"
        />

        <span>
          Tìm video, giao dịch...
        </span>

        <kbd>
          ⌘ K
        </kbd>
      </div>

      <div className="topbar-actions">
        <div className="notification-wrapper">
          <button
            type="button"
            className="icon-button notification-button"
            aria-label="Thông báo"
            aria-expanded={
              notificationOpen
            }
            onClick={() =>
              setNotificationOpen(
                (current) =>
                  !current
              )
            }
          >
            <Icon
              name="bell"
              className="w-[19px] h-[19px]"
            />

            {unreadCount >
              0 && (
              <span className="notification-badge">
                {unreadCount > 99
                  ? '99+'
                  : unreadCount}
              </span>
            )}
          </button>

          <NotificationMenu
            open={
              notificationOpen
            }
            onClose={() =>
              setNotificationOpen(
                false
              )
            }
          />
        </div>

        <Link
          className="mini-credit"
          to="/billing"
        >
          <Icon
            name="sparkles"
            className="w-4 h-4"
          />

          <strong>
            {credit?.balance ??
              0}
          </strong>

          <span>
            credit
          </span>
        </Link>

        <Link
          to="/profile"
          className="profile-chip"
        >
          <div
            className={`avatar ${
              user?.avatarUrl
                ? 'has-image'
                : ''
            }`}
          >
            {user?.avatarUrl ? (
              <img
                src={
                  user.avatarUrl
                }
                alt=""
              />
            ) : (
              initials
            )}
          </div>

          <div>
            <strong>
              {user?.displayName ||
                user?.fullName ||
                user?.email}
            </strong>

            <span>
              {user?.plan ===
              'free'
                ? 'Gói miễn phí'
                : user?.plan}
            </span>
          </div>

          <Icon
            name="chevronDown"
            className="w-4 h-4"
          />
        </Link>

        <button
          type="button"
          className="icon-button logout-button"
          aria-label="Đăng xuất"
          title="Đăng xuất"
          onClick={
            handleLogout
          }
        >
          <Icon
            name="logout"
            className="w-[19px] h-[19px]"
          />
        </button>
      </div>
    </header>
  );
}