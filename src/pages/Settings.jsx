import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  EmptyState,
  PageHeader,
  SectionTitle,
} from '../components/UI';

import {
  useAuth,
} from '../context/AuthContext';

import {
  changePassword,
  deleteAccount,
  getSettings,
  updateSettings,
} from '../api/settingsApi';

function Toggle({
  value,
  onChange,
  disabled = false,
}) {
  return (
    <button
      type="button"
      className={`toggle ${
        value ? 'on' : ''
      }`}
      disabled={disabled}
      onClick={() =>
        onChange(!value)
      }
      aria-pressed={value}
    >
      <i />
    </button>
  );
}

function formatDate(value) {
  if (!value) {
    return 'Chưa có thông tin';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Chưa có thông tin';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

export default function Settings() {
  const navigate =
    useNavigate();

  const {
    logout,
  } = useAuth();

  const [
    settings,
    setSettings,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState('');

  const [
    savingNotifications,
    setSavingNotifications,
  ] = useState(false);

  const [
    notificationMessage,
    setNotificationMessage,
  ] = useState('');

  const [
    notificationError,
    setNotificationError,
  ] = useState('');

  const [
    showPasswordForm,
    setShowPasswordForm,
  ] = useState(false);

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState('');

  const [
    newPassword,
    setNewPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const [
    passwordError,
    setPasswordError,
  ] = useState('');

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState('');

  const [
    showDeleteForm,
    setShowDeleteForm,
  ] = useState(false);

  const [
    deleteConfirm,
    setDeleteConfirm,
  ] = useState('');

  const [
    deletePassword,
    setDeletePassword,
  ] = useState('');

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState('');

  const loadSettings =
    async () => {
      try {
        setLoading(true);
        setLoadError('');

        const data =
          await getSettings();

        setSettings(data);
      } catch (err) {
        setLoadError(
          err.message ||
            'Không thể tải cài đặt.'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateNotification =
    (key, value) => {
      setSettings(
        (current) => ({
          ...current,
          [key]: value,
        })
      );

      setNotificationMessage('');
      setNotificationError('');
    };

  const handleSaveNotifications =
    async () => {
      if (!settings) {
        return;
      }

      try {
        setSavingNotifications(
          true
        );

        setNotificationMessage('');
        setNotificationError('');

        const data =
          await updateSettings(
            settings
          );

        setSettings(data);

        setNotificationMessage(
          'Cài đặt thông báo đã được lưu.'
        );
      } catch (err) {
        setNotificationError(
          err.message ||
            'Không thể lưu cài đặt thông báo.'
        );
      } finally {
        setSavingNotifications(
          false
        );
      }
    };

  const handleChangePassword =
    async (event) => {
      event.preventDefault();

      setPasswordError('');
      setPasswordSuccess('');

      if (!currentPassword) {
        setPasswordError(
          'Vui lòng nhập mật khẩu hiện tại.'
        );

        return;
      }

      if (
        newPassword.length < 8
      ) {
        setPasswordError(
          'Mật khẩu mới phải có ít nhất 8 ký tự.'
        );

        return;
      }

      if (
        newPassword ===
        currentPassword
      ) {
        setPasswordError(
          'Mật khẩu mới phải khác mật khẩu hiện tại.'
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setPasswordError(
          'Xác nhận mật khẩu mới không khớp.'
        );

        return;
      }

      try {
        setChangingPassword(
          true
        );

        await changePassword({
          currentPassword,
          newPassword,
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setPasswordSuccess(
          'Mật khẩu đã được thay đổi.'
        );

        setSettings(
          (current) => ({
            ...current,

            lastPasswordChangedAt:
              new Date().toISOString(),
          })
        );
      } catch (err) {
        if (
          err.status === 400 ||
          err.status === 401
        ) {
          setPasswordError(
            'Mật khẩu hiện tại không đúng.'
          );
        } else {
          setPasswordError(
            err.message ||
              'Không thể đổi mật khẩu.'
          );
        }
      } finally {
        setChangingPassword(
          false
        );
      }
    };

  const handleDeleteAccount =
    async (event) => {
      event.preventDefault();

      setDeleteError('');

      if (
        deleteConfirm !==
        'XOA TAI KHOAN'
      ) {
        setDeleteError(
          'Vui lòng nhập chính xác: XOA TAI KHOAN'
        );

        return;
      }

      if (!deletePassword) {
        setDeleteError(
          'Vui lòng nhập mật khẩu để xác nhận.'
        );

        return;
      }

      try {
        setDeleting(true);

        await deleteAccount({
          password:
            deletePassword,
        });

        await logout();

        navigate(
          '/login',
          {
            replace: true,

            state: {
              accountDeleted:
                true,
            },
          }
        );
      } catch (err) {
        if (
          err.status === 400 ||
          err.status === 401
        ) {
          setDeleteError(
            'Mật khẩu xác nhận không đúng.'
          );
        } else {
          setDeleteError(
            err.message ||
              'Không thể xóa tài khoản.'
          );
        }
      } finally {
        setDeleting(false);
      }
    };

  if (loading) {
    return (
      <div className="page-wrap narrow">
        <PageHeader
          eyebrow="THIẾT LẬP TÀI KHOẢN"
          title="Cài đặt"
          description="Đang tải cài đặt tài khoản..."
        />

        <section className="panel">
          <EmptyState
            icon="clock"
            title="Đang tải cài đặt"
            description="VideoNova đang lấy thông tin từ máy chủ."
          />
        </section>
      </div>
    );
  }

  if (
    loadError ||
    !settings
  ) {
    return (
      <div className="page-wrap narrow">
        <PageHeader
          eyebrow="THIẾT LẬP TÀI KHOẢN"
          title="Cài đặt"
        />

        <section className="panel">
          <EmptyState
            icon="x"
            title="Không thể tải cài đặt"
            description={
              loadError
            }
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  loadSettings
                }
              >
                <Icon
                  name="refresh"
                  className="w-4 h-4"
                />

                Thử lại
              </button>
            }
          />
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrap narrow">
      <PageHeader
        eyebrow="THIẾT LẬP TÀI KHOẢN"
        title="Cài đặt"
        description="Điều chỉnh bảo mật và thông báo của tài khoản."
      />

      <section className="panel settings-card">
        <SectionTitle
          title="Bảo mật"
          description="Quản lý mật khẩu đăng nhập của bạn."
        />

        <div className="setting-row">
          <div className="setting-icon">
            <Icon
              name="lock"
              className="w-5 h-5"
            />
          </div>

          <div>
            <strong>
              Mật khẩu
            </strong>

            <span>
              Lần cập nhật gần nhất:{' '}
              {formatDate(
                settings
                  .lastPasswordChangedAt
              )}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setShowPasswordForm(
                (current) =>
                  !current
              )
            }
          >
            {showPasswordForm
              ? 'Đóng'
              : 'Đổi mật khẩu'}
          </button>
        </div>

        {showPasswordForm && (
          <form
            className="settings-inline-form"
            onSubmit={
              handleChangePassword
            }
          >
            <label>
              <span>
                Mật khẩu hiện tại
              </span>

              <input
                type="password"
                autoComplete="current-password"
                value={
                  currentPassword
                }
                onChange={(
                  event
                ) =>
                  setCurrentPassword(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label>
              <span>
                Mật khẩu mới
              </span>

              <input
                type="password"
                autoComplete="new-password"
                value={
                  newPassword
                }
                placeholder="Tối thiểu 8 ký tự"
                onChange={(
                  event
                ) =>
                  setNewPassword(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label>
              <span>
                Nhập lại mật khẩu mới
              </span>

              <input
                type="password"
                autoComplete="new-password"
                value={
                  confirmPassword
                }
                onChange={(
                  event
                ) =>
                  setConfirmPassword(
                    event.target
                      .value
                  )
                }
              />
            </label>

            {passwordError && (
              <div className="auth-error settings-message">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="auth-success settings-message">
                {passwordSuccess}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  changingPassword
                }
              >
                {changingPassword
                  ? 'Đang đổi...'
                  : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel settings-card">
        <SectionTitle
          title="Thông báo"
          description="Chọn các sự kiện mà VideoNova sẽ thông báo cho bạn."
        />

        <div className="setting-row">
          <div>
            <strong>
              Video hoàn tất
            </strong>

            <span>
              Thông báo khi video
              được xử lý thành công.
            </span>
          </div>

          <Toggle
            value={
              settings.videoCompleted
            }
            onChange={(value) =>
              updateNotification(
                'videoCompleted',
                value
              )
            }
          />
        </div>

        <div className="setting-row">
          <div>
            <strong>
              Video thất bại
            </strong>

            <span>
              Thông báo khi tác vụ
              video gặp lỗi.
            </span>
          </div>

          <Toggle
            value={
              settings.videoFailed
            }
            onChange={(value) =>
              updateNotification(
                'videoFailed',
                value
              )
            }
          />
        </div>

        <div className="setting-row">
          <div>
            <strong>
              Sắp hết credit
            </strong>

            <span>
              Nhắc khi số dư credit
              xuống thấp.
            </span>
          </div>

          <Toggle
            value={
              settings.lowCredit
            }
            onChange={(value) =>
              updateNotification(
                'lowCredit',
                value
              )
            }
          />
        </div>

        {settings.lowCredit && (
          <div className="setting-row">
            <div>
              <strong>
                Ngưỡng cảnh báo
              </strong>

              <span>
                Báo khi credit bằng
                hoặc thấp hơn mức này.
              </span>
            </div>

            <input
              className="settings-number-input"
              type="number"
              min="1"
              max="1000"
              value={
                settings
                  .lowCreditThreshold
              }
              onChange={(
                event
              ) =>
                setSettings(
                  (current) => ({
                    ...current,

                    lowCreditThreshold:
                      Math.max(
                        1,
                        Number(
                          event
                            .target
                            .value
                        ) || 1
                      ),
                  })
                )
              }
            />
          </div>
        )}

        <div className="setting-row">
          <div>
            <strong>
              Ưu đãi & cập nhật
            </strong>

            <span>
              Nhận tin về tính năng
              và chương trình mới.
            </span>
          </div>

          <Toggle
            value={
              settings.productUpdates
            }
            onChange={(value) =>
              updateNotification(
                'productUpdates',
                value
              )
            }
          />
        </div>

        {notificationError && (
          <div className="auth-error settings-message">
            {notificationError}
          </div>
        )}

        {notificationMessage && (
          <div className="auth-success settings-message">
            {notificationMessage}
          </div>
        )}

        <div className="settings-save-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={
              savingNotifications
            }
            onClick={
              handleSaveNotifications
            }
          >
            {savingNotifications
              ? 'Đang lưu...'
              : 'Lưu cài đặt thông báo'}
          </button>
        </div>
      </section>

      <section className="panel danger-card">
        <SectionTitle
          title="Vùng nguy hiểm"
          description="Thao tác này ảnh hưởng trực tiếp đến tài khoản và dữ liệu của bạn."
        />

        <div className="setting-row">
          <div>
            <strong>
              Xóa tài khoản
            </strong>

            <span>
              Xóa tài khoản cùng dữ
              liệu liên quan theo
              chính sách hệ thống.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() =>
              setShowDeleteForm(
                (current) =>
                  !current
              )
            }
          >
            {showDeleteForm
              ? 'Hủy'
              : 'Xóa tài khoản'}
          </button>
        </div>

        {showDeleteForm && (
          <form
            className="settings-delete-form"
            onSubmit={
              handleDeleteAccount
            }
          >
            <p>
              Để xác nhận, nhập
              <strong>
                {' '}
                XOA TAI KHOAN
              </strong>{' '}
              và mật khẩu hiện tại.
            </p>

            <label>
              <span>
                Xác nhận
              </span>

              <input
                value={
                  deleteConfirm
                }
                placeholder="XOA TAI KHOAN"
                onChange={(
                  event
                ) =>
                  setDeleteConfirm(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label>
              <span>
                Mật khẩu
              </span>

              <input
                type="password"
                value={
                  deletePassword
                }
                autoComplete="current-password"
                onChange={(
                  event
                ) =>
                  setDeletePassword(
                    event.target
                      .value
                  )
                }
              />
            </label>

            {deleteError && (
              <div className="auth-error settings-message">
                {deleteError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-danger"
              disabled={deleting}
            >
              {deleting
                ? 'Đang xử lý...'
                : 'Xác nhận xóa tài khoản'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}