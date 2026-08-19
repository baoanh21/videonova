import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  useAuth,
} from '../context/AuthContext';

function Brand() {
  return (
    <Link
      to="/"
      className="auth-brand"
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
  );
}

export default function Login() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    login,
    isAuthenticated,
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    remember,
    setRemember,
  ] = useState(true);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', {
        replace: true,
      });
    }
  }, [
    isAuthenticated,
    navigate,
  ]);

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError('');

      if (!email.trim()) {
        setError(
          'Vui lòng nhập email.'
        );

        return;
      }

      if (!password) {
        setError(
          'Vui lòng nhập mật khẩu.'
        );

        return;
      }

      try {
        setSubmitting(true);

        await login({
          email:
            email
              .trim()
              .toLowerCase(),

          password,
          remember,
        });

        const destination =
          location.state?.from ||
          '/';

        navigate(
          destination,
          {
            replace: true,
          }
        );
      } catch (err) {
        if (
          err.status === 401
        ) {
          setError(
            'Email hoặc mật khẩu không đúng.'
          );
        } else {
          setError(
            err.message ||
              'Không thể đăng nhập.'
          );
        }
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Brand />

        <div className="auth-visual-copy">
          <span>
            <Icon
              name="sparkles"
              className="w-4 h-4"
            />

            AI VIDEO CREATION
          </span>

          <h2>
            Biến ý tưởng tĩnh
            <br />
            thành{' '}
            <em>
              chuyển động.
            </em>
          </h2>

          <p>
            Nền tảng tạo video từ
            hình ảnh bằng AI.
          </p>
        </div>

        <div className="auth-demo-card">
          <div className="auth-demo-image thumb-1">
            <button
              type="button"
            >
              <Icon
                name="play"
                className="w-7 h-7"
              />
            </button>
          </div>

          <div>
            <span>
              Video được tạo bằng
              VideoNova
            </span>

            <strong>
              Tokyo cinematic motion
            </strong>
          </div>
        </div>

        <small className="auth-copyright">
          © 2026 VideoNova.
        </small>
      </div>

      <main className="auth-form-side">
        <div className="auth-mobile-brand">
          <Brand />
        </div>

        <form
          className="auth-form"
          onSubmit={
            handleSubmit
          }
        >
          <span className="auth-kicker">
            CHÀO MỪNG TRỞ LẠI
          </span>

          <h1>
            Đăng nhập vào VideoNova
          </h1>

          <p>
            Tiếp tục tạo và quản lý
            video AI của bạn.
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
                autoComplete="email"
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

          <label>
            <div className="label-line">
              <span>
                Mật khẩu
              </span>

              <Link to="/forgot-password">
                Quên mật khẩu?
              </Link>
            </div>

            <div className="input-icon">
              <Icon
                name="lock"
                className="w-[18px] h-[18px]"
              />

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                autoComplete="current-password"
                value={
                  password
                }
                placeholder="Nhập mật khẩu"
                onChange={(event) =>
                  setPassword(
                    event.target
                      .value
                  )
                }
              />

              <button
                type="button"
                className="input-end password-toggle"
                onClick={() =>
                  setShowPassword(
                    (value) =>
                      !value
                  )
                }
              >
                <Icon
                  name="eye"
                  className="w-[18px] h-[18px]"
                />
              </button>
            </div>
          </label>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) =>
                setRemember(
                  event.target
                    .checked
                )
              }
            />

            <div
              className={`fake-checkbox ${
                remember
                  ? 'checked'
                  : ''
              }`}
            >
              {remember && (
                <Icon
                  name="check"
                  className="w-3 h-3"
                />
              )}
            </div>

            <span>
              Ghi nhớ đăng nhập
            </span>
          </label>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary full large"
            disabled={
              submitting
            }
          >
            {submitting
              ? 'Đang đăng nhập...'
              : 'Đăng nhập'}

            {!submitting && (
              <Icon
                name="arrowRight"
                className="w-4 h-4"
              />
            )}
          </button>

          <div className="auth-switch">
            Chưa có tài khoản?{' '}

            <Link to="/register">
              Tạo tài khoản
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}