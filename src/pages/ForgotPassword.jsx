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

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError('');
      setSuccess(false);

      if (!email.trim()) {
        setError(
          'Vui lòng nhập email.'
        );

        return;
      }

      try {
        setSubmitting(true);

        await forgotPassword(
          email
            .trim()
            .toLowerCase()
        );

        /*
         * Không tiết lộ email có tồn tại
         * hay không.
         */
        setSuccess(true);
      } catch (err) {
        setError(
          err.message ||
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
          hệ thống sẽ gửi hướng dẫn
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
            đã được gửi.
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