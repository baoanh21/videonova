import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import {
  useAuth,
} from '../context/AuthContext';

export default function AdminRoute() {
  const {
    user,
    initializing,
  } = useAuth();

  if (initializing) {
    return (
      <div className="route-loading">
        <div className="spinner" />

        <span>
          Đang kiểm tra quyền truy cập...
        </span>
      </div>
    );
  }

  const role =
    String(
      user?.role || ''
    ).toLowerCase();

  if (role !== 'admin') {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}