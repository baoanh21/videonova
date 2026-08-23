import {
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  resetPassword,
} from '../api/authApi';

export default function ResetPassword() {
  const [
    searchParams,
  ] = useSearchParams();

  const initialToken =
    useMemo(
      () =>
        searchParams.get(
          'token'
        ) || '',
      [searchParams]
    );

  const [
    token,
    setToken,
  ] = useState(
    initialToken
  );

  const [
    newPassword,
    setNewPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState(false);

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError('');
      setSuccess(false);

      if (!token.trim()) {
        setError(
          'Thiếu mã đặt lại mật khẩu.'
        );

        return;
      }

      if (
        newPassword.length < 8
      ) {
        setError(
          'Mật khẩu phải có ít nhất 8 ký tự.'
        );

        return;
      }

      if (
        !/[A-Za-z]/.test(
          newPassword
        ) ||
        !/\d/.test(
          newPassword
        )
      ) {
        setError(
          'Mật khẩu phải có ít nhất 1 chữ và 1 số.'
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setError(
          'Mật khẩu xác nhận không khớp.'
        );

        return;
      }

      try {
        setSubmitting(true);

        await resetPassword({
          token:
            token.trim(),

          newPassword,
        });

        setSuccess(true);

        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setError(
          err?.message ||
            'Không thể đặt lại mật khẩu.'
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div className="simple-auth">
      <Link
        to="/"
        className="auth-brand centered"
      >
        <div className="brand-mark">
          <span>V</span>
          <i />
        </div>

        <div>
          <h1>VIDEONOVA</h1>
          <p>AI Video Studio</p>
        </div>
      </Link>

      <form
        className="simple-auth-card"
        onSubmit={
          handleSubmit
        }
      >
        <div className="simple-auth-icon">
          <Icon
            name="lock"
            className="w-6 h-6"
          />
        </div>

        <h1>
          Đặt lại mật khẩu
        </h1>

        <p>
          Nhập mã đặt lại mật khẩu
          và mật khẩu mới cho tài khoản.
        </p>

        <label>
          <span>
            Mã đặt lại mật khẩu
          </span>

          <div className="input-icon">
            <Icon
              name="shield"
              className="w-[18px] h-[18px]"
            />

            <input
              type="text"
              value={token}
              placeholder="Nhập reset token"
              onChange={(event) =>
                setToken(
                  event.target
                    .value
                )
              }
            />
          </div>
        </label>

        <label>
          <span>
            Mật khẩu mới
          </span>

          <div className="input-icon">
            <Icon
              name="lock"
              className="w-[18px] h-[18px]"
            />

            <input
              type="password"
              value={
                newPassword
              }
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
              onChange={(event) =>
                setNewPassword(
                  event.target
                    .value
                )
              }
            />
          </div>
        </label>

        <label>
          <span>
            Xác nhận mật khẩu
          </span>

          <div className="input-icon">
            <Icon
              name="lock"
              className="w-[18px] h-[18px]"
            />

            <input
              type="password"
              value={
                confirmPassword
              }
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              onChange={(event) =>
                setConfirmPassword(
                  event.target
                    .value
                )
              }
            />
          </div>
        </label>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            Đặt lại mật khẩu thành công.
            Bạn có thể đăng nhập bằng
            mật khẩu mới.
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            success
          }
          className="btn btn-primary full large"
        >
          {submitting
            ? 'Đang cập nhật...'
            : success
              ? 'Đã cập nhật'
              : 'Đặt lại mật khẩu'}
        </button>

        <Link
          to="/login"
          className="back-login"
        >
          ← Quay lại đăng nhập
        </Link>
      </form>
    </div>
  );
}