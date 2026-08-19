import {
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  useAuth,
} from '../context/AuthContext';

export default function Register() {
  const navigate =
    useNavigate();

  const {
    register,
  } = useAuth();

  const [
    fullName,
    setFullName,
  ] = useState('');

  const [email, setEmail] =
    useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    acceptedTerms,
    setAcceptedTerms,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError('');

      if (!fullName.trim()) {
        setError(
          'Vui lòng nhập họ và tên.'
        );

        return;
      }

      if (!email.trim()) {
        setError(
          'Vui lòng nhập email.'
        );

        return;
      }

      if (
        password.length < 8
      ) {
        setError(
          'Mật khẩu phải có ít nhất 8 ký tự.'
        );

        return;
      }

      if (!acceptedTerms) {
        setError(
          'Bạn cần đồng ý với điều khoản sử dụng.'
        );

        return;
      }

      try {
        setSubmitting(true);

        const result =
          await register({
            fullName:
              fullName.trim(),

            email:
              email
                .trim()
                .toLowerCase(),

            password,
          });

        if (
          result.authenticated
        ) {
          navigate('/', {
            replace: true,
          });
        } else {
          navigate('/login', {
            replace: true,

            state: {
              registered:
                true,
            },
          });
        }
      } catch (err) {
        if (
          err.status === 409
        ) {
          setError(
            'Email này đã được sử dụng.'
          );
        } else {
          setError(
            err.message ||
              'Không thể tạo tài khoản.'
          );
        }
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div className="auth-page register-page">
      <div className="auth-visual">
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

        <div className="auth-visual-copy">
          <span>
            <Icon
              name="sparkles"
              className="w-4 h-4"
            />

            BẮT ĐẦU VỚI VIDEONOVA
          </span>

          <h2>
            Biến ảnh thành
            <br />

            <em>
              video AI.
            </em>
          </h2>

          <p>
            Tạo tài khoản để bắt
            đầu sử dụng hệ thống.
          </p>
        </div>
      </div>

      <main className="auth-form-side">
        <form
          className="auth-form register-form"
          onSubmit={
            handleSubmit
          }
        >
          <span className="auth-kicker">
            TẠO TÀI KHOẢN
          </span>

          <h1>
            Bắt đầu với VideoNova
          </h1>

          <p>
            Điền thông tin để tạo
            tài khoản.
          </p>

          <label>
            <span>Họ và tên</span>

            <div className="input-icon">
              <Icon
                name="user"
                className="w-[18px] h-[18px]"
              />

              <input
                value={
                  fullName
                }
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                onChange={(event) =>
                  setFullName(
                    event.target
                      .value
                  )
                }
              />
            </div>
          </label>

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
                autoComplete="email"
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
            <span>Mật khẩu</span>

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
                value={
                  password
                }
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
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

          <label className="terms-row">
            <input
              type="checkbox"
              checked={
                acceptedTerms
              }
              onChange={(event) =>
                setAcceptedTerms(
                  event.target
                    .checked
                )
              }
            />

            <div
              className={`fake-checkbox ${
                acceptedTerms
                  ? 'checked'
                  : ''
              }`}
            >
              {acceptedTerms && (
                <Icon
                  name="check"
                  className="w-3 h-3"
                />
              )}
            </div>

            <span>
              Tôi đồng ý với Điều
              khoản sử dụng và Chính
              sách bảo mật.
            </span>
          </label>

          {error && (
            <div className="auth-error">
              {error}
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
              ? 'Đang tạo tài khoản...'
              : 'Tạo tài khoản'}
          </button>

          <div className="auth-switch">
            Đã có tài khoản?{' '}

            <Link to="/login">
              Đăng nhập
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}