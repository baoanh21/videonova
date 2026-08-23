import {
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  forgotPassword,
} from '../api/authApi';

export default function ForgotPassword() {
  const [email, setEmail] =
    useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    resetToken,
    setResetToken,
  ] = useState('');

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError('');
      setSuccess(false);
      setResetToken('');

      if (!email.trim()) {
        setError(
          'Vui lòng nhập email.'
        );

        return;
      }

      try {
        setSubmitting(true);

        const result =
          await forgotPassword(
            email
              .trim()
              .toLowerCase()
          );

        /*
         * Backend development có thể trả
         * reset_token để test local.
         * Production sẽ không trả token này.
         */
        if (
          result?.reset_token
        ) {
          setResetToken(
            result.reset_token
          );
        }

        /*
         * Không tiết lộ email có tồn tại
         * hay không.
         */
        setSuccess(true);
      } catch (err) {
        setError(
          err?.message ||
            'Không thể gửi yêu cầu.'
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
          Quên mật khẩu?
        </h1>

        <p>
          Nhập email đã đăng ký.
          Nếu tài khoản tồn tại,
          hệ thống sẽ tạo hướng dẫn
          đặt lại mật khẩu.
        </p>

        <label>
          <span>Email</span>

          <div className="input-icon">
            <Icon
              name="mail"
              className="w-[18px] h-[18px]"
            />

            <input
              type="email"
              value={email}
              placeholder="name@example.com"
              onChange={(event) =>
                setEmail(
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
            Nếu email tồn tại,
            hướng dẫn đặt lại mật khẩu
            đã được tạo.
          </div>
        )}

        {resetToken && (
          <div className="auth-success">
            <strong>
              Chế độ development:
            </strong>

            <div
              style={{
                marginTop: 8,
                overflowWrap:
                  'anywhere',
              }}
            >
              Reset token:{' '}
              {resetToken}
            </div>

            <Link
              to={`/reset-password?token=${encodeURIComponent(
                resetToken
              )}`}
              className="btn btn-secondary full"
              style={{
                marginTop: 12,
              }}
            >
              Đi tới đặt lại mật khẩu
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting
          }
          className="btn btn-primary full large"
        >
          {submitting
            ? 'Đang gửi...'
            : 'Gửi hướng dẫn'}
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