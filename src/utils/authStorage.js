const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getAccessToken() {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function getRefreshToken() {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  );
}

export function saveAuthTokens(
  {
    accessToken,
    refreshToken = null,
  },
  remember = true
) {
  clearAuthTokens();

  const storage = remember
    ? localStorage
    : sessionStorage;

  storage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken
  );

  if (refreshToken) {
    storage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken
    );
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  sessionStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  sessionStorage.removeItem(
    REFRESH_TOKEN_KEY
  );
}