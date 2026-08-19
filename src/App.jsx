import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import {
  AuthProvider,
} from './context/AuthContext';

import {
  AppDataProvider,
} from './context/AppDataContext';

import {
  NotificationProvider,
} from './context/NotificationContext';

import Dashboard from './pages/Dashboard';
import CreateVideo from './pages/CreateVideo';
import MyVideos from './pages/MyVideos';
import VideoDetail from './pages/VideoDetail';
import Billing from './pages/Billing';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Help from './pages/Help';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminVideos from './pages/AdminVideos';
import AdminTransactions from './pages/AdminTransactions';

import NotFound from './pages/NotFound';

import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={
              <ForgotPassword />
            }
          />

          {/* User cần đăng nhập */}
          <Route
            element={
              <ProtectedRoute />
            }
          >
            <Route
              element={
                <AppDataProvider>
                  <NotificationProvider>
                    <AppLayout />
                  </NotificationProvider>
                </AppDataProvider>
              }
            >
              <Route
                path="/"
                element={
                  <Dashboard />
                }
              />

              <Route
                path="/create"
                element={
                  <CreateVideo />
                }
              />

              <Route
                path="/videos"
                element={
                  <MyVideos />
                }
              />

              <Route
                path="/videos/:id"
                element={
                  <VideoDetail />
                }
              />

              <Route
                path="/billing"
                element={
                  <Billing />
                }
              />

              <Route
                path="/transactions"
                element={
                  <Transactions />
                }
              />

              <Route
                path="/profile"
                element={
                  <Profile />
                }
              />

              <Route
                path="/settings"
                element={
                  <Settings />
                }
              />

              <Route
                path="/help"
                element={
                  <Help />
                }
              />
            </Route>

            {/* Admin đang để nguyên,
                hiện chưa nằm trong phần
                frontend user mình tập trung */}
            <Route
              path="/admin"
              element={
                <AdminLayout />
              }
            >
              <Route
                index
                element={
                  <AdminDashboard />
                }
              />

              <Route
                path="users"
                element={
                  <AdminUsers />
                }
              />

              <Route
                path="videos"
                element={
                  <AdminVideos />
                }
              />

              <Route
                path="transactions"
                element={
                  <AdminTransactions />
                }
              />
            </Route>
          </Route>

          <Route
            path="*"
            element={
              <NotFound />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}