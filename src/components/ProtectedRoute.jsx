/*import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import {
  useAuth,
} from '../context/AuthContext';

export default function ProtectedRoute() {
  const {
    initializing,
    isAuthenticated,
  } = useAuth();

  const location =
    useLocation();

  if (initializing) {
    return (
      <div className="route-loading">
        <div className="spinner" />

        <span>
          Đang kiểm tra đăng nhập...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
} */

  //  TEST ONLY - BỎ KHI BACKEND HOÀN THÀNH

  import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import {
  useAuth,
} from '../context/AuthContext';

export default function ProtectedRoute() {
  const {
    initializing,
    isAuthenticated,
  } = useAuth();

  const location =
    useLocation();

  const testMode =
    import.meta.env.DEV &&
    import.meta.env
      .VITE_FRONTEND_TEST_MODE ===
      'true';

  /*
   * Chỉ bypass auth khi chạy
   * npm run dev.
   *
   * Production build không dùng.
   */
  if (testMode) {
    return <Outlet />;
  }

  if (initializing) {
    return (
      <div className="route-loading">
        <div className="spinner" />

        <span>
          Đang kiểm tra đăng nhập...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}