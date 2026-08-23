import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Icon from '../components/Icon';

import {
  PageHeader,
  SectionTitle,
} from '../components/UI';

import {
  useAuth,
} from '../context/AuthContext';

import {
  updateProfile,
  uploadAvatar,
} from '../api/userApi';

import useProtectedMediaUrl
  from '../hooks/useProtectedMediaUrl';

const MAX_AVATAR_SIZE =
  5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

function formatMemberDate(
  value
) {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  ).format(date);
}

export default function Profile() {
  const {
    user,
    reloadUser,
  } = useAuth();

  const fileInputRef =
    useRef(null);

  const [
    fullName,
    setFullName,
  ] = useState('');

  const [
    displayName,
    setDisplayName,
  ] = useState('');

  const [
    phone,
    setPhone,
  ] = useState('');

  const [
    language,
    setLanguage,
  ] = useState('vi');

  const [
    avatarFile,
    setAvatarFile,
  ] = useState(null);

  const [
    avatarPreview,
    setAvatarPreview,
  ] = useState('');

  const [
    avatarVersion,
    setAvatarVersion,
  ] = useState(0);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  useEffect(() => {
    if (!user) return;

    setFullName(
      user.fullName || ''
    );

    setDisplayName(
      user.displayName ||
        user.fullName ||
        ''
    );

    setPhone(
      user.phone || ''
    );

    setLanguage(
      user.language || 'vi'
    );
  }, [user]);

  /*
   * Tạo preview local.
   *
   * Ảnh này chưa upload lên server.
   */
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('');
      return;
    }

    const objectUrl =
      URL.createObjectURL(
        avatarFile
      );

    setAvatarPreview(
      objectUrl
    );

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [avatarFile]);

  const initials =
    useMemo(() => {
      return (
        user?.fullName
          ?.split(' ')
          .filter(Boolean)
          .slice(-2)
          .map((word) =>
            word[0]?.toUpperCase()
          )
          .join('') ||
        'U'
      );
    }, [user?.fullName]);

  const protectedAvatarPath =
    user?.avatarUrl
      ? `${user.avatarUrl}${
          user.avatarUrl.includes('?')
            ? '&'
            : '?'
        }v=${avatarVersion}`
      : '';

  const avatarObjectUrl =
    useProtectedMediaUrl(
      protectedAvatarPath
    );

  const currentAvatar =
    avatarPreview ||
    avatarObjectUrl ||
    '';

  const handleAvatarChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setError('');
      setSuccess('');

      if (
        !ALLOWED_AVATAR_TYPES.includes(
          file.type
        )
      ) {
        setError(
          'Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WEBP.'
        );

        event.target.value =
          '';

        return;
      }

      if (
        file.size >
        MAX_AVATAR_SIZE
      ) {
        setError(
          'Ảnh đại diện không được vượt quá 5 MB.'
        );

        event.target.value =
          '';

        return;
      }

      setAvatarFile(file);
    };

  const handleCancel = () => {
    setFullName(
      user?.fullName || ''
    );

    setDisplayName(
      user?.displayName ||
        user?.fullName ||
        ''
    );

    setPhone(
      user?.phone || ''
    );

    setLanguage(
      user?.language ||
        'vi'
    );

    setAvatarFile(null);

    setError('');
    setSuccess('');

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError('');
      setSuccess('');

      if (
        !fullName.trim()
      ) {
        setError(
          'Họ và tên không được để trống.'
        );

        return;
      }

      if (
        !displayName.trim()
      ) {
        setError(
          'Tên hiển thị không được để trống.'
        );

        return;
      }

      try {
        setSaving(true);

        /*
         * 1. Cập nhật thông tin chữ.
         */
        await updateProfile({
          fullName:
            fullName.trim(),

          displayName:
            displayName.trim(),

          phone:
            phone.trim(),

          language,
        });

        /*
         * 2. Nếu user có chọn
         * avatar mới thì upload.
         */
        const uploadedNewAvatar =
          Boolean(avatarFile);

        if (avatarFile) {
          await uploadAvatar(
            avatarFile
          );
        }

        /*
         * 3. GET /users/me lại.
         *
         * AuthContext cập nhật,
         * Topbar cũng đổi theo.
         */
        await reloadUser();

        /*
         * URL avatar backend luôn là
         * /users/me/avatar, nên sau khi
         * upload cần đổi query version
         * để hook fetch lại ảnh mới.
         */
        if (uploadedNewAvatar) {
          setAvatarVersion(
            (current) =>
              current + 1
          );
        }

        setAvatarFile(null);

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            '';
        }

        setSuccess(
          'Thông tin hồ sơ đã được cập nhật.'
        );
      } catch (err) {
        if (
          err.status === 413
        ) {
          setError(
            'Ảnh đại diện quá lớn.'
          );
        } else if (
          err.status === 422
        ) {
          setError(
            'Thông tin hồ sơ không hợp lệ.'
          );
        } else {
          setError(
            err.message ||
              'Không thể cập nhật hồ sơ.'
          );
        }
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="page-wrap narrow">
      <PageHeader
        eyebrow="TÀI KHOẢN CÁ NHÂN"
        title="Hồ sơ của bạn"
        description="Quản lý thông tin và ảnh đại diện của tài khoản."
      />

      <section className="panel profile-hero">
        <div
          className={`large-avatar ${
            currentAvatar
              ? 'has-image'
              : ''
          }`}
        >
          {currentAvatar ? (
            <img
              src={
                currentAvatar
              }
              alt="Ảnh đại diện"
            />
          ) : (
            initials
          )}
        </div>

        <div>
          <h2>
            {user?.fullName ||
              'Người dùng'}
          </h2>

          <p>
            {user?.email}
          </p>

          <span className="profile-tag">
            Thành viên từ{' '}
            {formatMemberDate(
              user?.createdAt
            )}
          </span>
        </div>

        <div className="profile-avatar-actions">
          <input
            ref={
              fileInputRef
            }
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={
              handleAvatarChange
            }
          />

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            <Icon
              name="upload"
              className="w-4 h-4"
            />

            Đổi ảnh đại diện
          </button>

          <small>
            JPG, PNG hoặc WEBP •
            tối đa 5 MB
          </small>
        </div>
      </section>

      <form
        className="panel form-panel"
        onSubmit={
          handleSubmit
        }
      >
        <SectionTitle
          title="Thông tin cá nhân"
          description="Thông tin này được dùng để nhận diện tài khoản của bạn."
        />

        <div className="form-grid">
          <label>
            <span>
              Họ và tên
            </span>

            <input
              value={
                fullName
              }
              onChange={(
                event
              ) =>
                setFullName(
                  event.target
                    .value
                )
              }
            />
          </label>

          <label>
            <span>
              Tên hiển thị
            </span>

            <input
              value={
                displayName
              }
              onChange={(
                event
              ) =>
                setDisplayName(
                  event.target
                    .value
                )
              }
            />
          </label>

          <label className="full-field">
            <span>
              Địa chỉ email
            </span>

            <div className="input-icon">
              <Icon
                name="mail"
                className="w-[18px] h-[18px]"
              />

              <input
                type="email"
                value={
                  user?.email ||
                  ''
                }
                disabled
                readOnly
              />

              {user?.emailVerified && (
                <em>
                  ĐÃ XÁC MINH
                </em>
              )}
            </div>
          </label>

          <label>
            <span>
              Số điện thoại
            </span>

            <input
              type="tel"
              value={phone}
              placeholder="Chưa cập nhật"
              onChange={(
                event
              ) =>
                setPhone(
                  event.target
                    .value
                )
              }
            />
          </label>

          <label>
            <span>
              Ngôn ngữ
            </span>

            <select
              value={
                language
              }
              onChange={(
                event
              ) =>
                setLanguage(
                  event.target
                    .value
                )
              }
            >
              <option value="vi">
                Tiếng Việt
              </option>

              <option value="en">
                English
              </option>
            </select>
          </label>
        </div>

        {error && (
          <div className="auth-error profile-message">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success profile-message">
            {success}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving}
            onClick={
              handleCancel
            }
          >
            Hủy thay đổi
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? 'Đang lưu...'
              : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </div>
  );
}