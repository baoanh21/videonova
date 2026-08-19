import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../api/authApi';

import {
  clearAuthTokens,
  getAccessToken,
  saveAuthTokens,
} from '../utils/authStorage';

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [
    initializing,
    setInitializing,
  ] = useState(true);

  const loadCurrentUser =
    useCallback(async () => {
      const token =
        getAccessToken();

      if (!token) {
        setUser(null);
        setInitializing(false);

        return null;
      }

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);

        return currentUser;
      } catch {
        clearAuthTokens();
        setUser(null);

        return null;
      } finally {
        setInitializing(false);
      }
    }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login =
    useCallback(
      async ({
        email,
        password,
        remember,
      }) => {
        const result =
          await loginUser({
            email,
            password,
          });

        saveAuthTokens(
          {
            accessToken:
              result.accessToken,

            refreshToken:
              result.refreshToken,
          },
          remember
        );

        let loggedInUser =
          result.user;

        if (!loggedInUser) {
          loggedInUser =
            await getCurrentUser();
        }

        setUser(
          loggedInUser
        );

        return loggedInUser;
      },
      []
    );

  const register =
    useCallback(
      async ({
        fullName,
        email,
        password,
      }) => {
        const result =
          await registerUser({
            fullName,
            email,
            password,
          });

        if (
          result.authenticated
        ) {
          saveAuthTokens({
            accessToken:
              result.accessToken,

            refreshToken:
              result.refreshToken,
          });

          const createdUser =
            result.user ||
            (await getCurrentUser());

          setUser(createdUser);

          return {
            authenticated:
              true,
          };
        }

        return {
          authenticated:
            false,
        };
      },
      []
    );

  const logout =
  useCallback(async () => {
    try {
      /*
       * Nếu backend có session /
       * refresh token thì yêu cầu
       * backend revoke trước.
       */
      await logoutUser();
    } catch (error) {
      /*
       * Dù backend đang tắt,
       * người dùng vẫn phải có thể
       * đăng xuất khỏi trình duyệt.
       */
      console.warn(
        'Không thể revoke session trên server:',
        error
      );
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  }, []);
  

  const value =
    useMemo(
      () => ({
        user,

        initializing,

        isAuthenticated:
          Boolean(user),

        login,
        register,
        logout,
        reloadUser:
          loadCurrentUser,
      }),
      [
        user,
        initializing,
        login,
        register,
        logout,
        loadCurrentUser,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth phải nằm trong AuthProvider'
    );
  }

  return context;
}