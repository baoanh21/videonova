import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
} from '../utils/authStorage';

const API_URL =
  import.meta.env.VITE_API_URL
    ?.replace(/\/$/, '');

/*
 * Dùng chung một refresh request.
 *
 * Trang chủ có thể gọi cùng lúc:
 * - /users/me
 * - /credits/balance
 * - /videos
 * - /notifications
 *
 * Nếu access token hết hạn, không được
 * để tất cả request cùng refresh token,
 * vì backend rotate refresh token.
 */
let refreshPromise = null;

const NO_AUTO_REFRESH_PATHS =
  new Set([
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
  ]);


export class ApiError extends Error {
  constructor(
    message,
    status = 0,
    data = null
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}


async function readResponseData(
  response
) {
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text =
      await response.text();

    return text || null;
  } catch {
    return null;
  }
}


/*
 * Kiểm tra token hiện tại được lưu
 * trong localStorage hay sessionStorage
 * để sau khi refresh vẫn giữ đúng
 * lựa chọn "Ghi nhớ đăng nhập".
 */
function shouldRememberSession() {
  return Boolean(
    localStorage.getItem(
      'access_token'
    ) ||
    localStorage.getItem(
      'refresh_token'
    )
  );
}


/*
 * Gọi backend để đổi refresh token
 * thành access token mới.
 */
async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    (async () => {
      const refreshToken =
        getRefreshToken();

      if (!refreshToken) {
        return null;
      }

      let response;

      try {
        response = await fetch(
          `${API_URL}/auth/refresh`,
          {
            method: 'POST',

            credentials:
              'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                refresh_token:
                  refreshToken,
              }),
          }
        );
      } catch {
        throw new ApiError(
          'Không thể kết nối tới máy chủ.',
          0
        );
      }

      const data =
        await readResponseData(
          response
        );

      if (!response.ok) {
        clearAuthTokens();

        const message =
          data?.detail ||
          data?.message ||
          'Phiên đăng nhập đã hết hạn.';

        throw new ApiError(
          message,
          response.status,
          data
        );
      }

      const newAccessToken =
        data?.access_token ||
        data?.accessToken;

      const newRefreshToken =
        data?.refresh_token ||
        data?.refreshToken ||
        refreshToken;

      if (!newAccessToken) {
        clearAuthTokens();

        throw new ApiError(
          'Backend không trả access_token mới.',
          401,
          data
        );
      }

      saveAuthTokens(
        {
          accessToken:
            newAccessToken,

          refreshToken:
            newRefreshToken,
        },
        shouldRememberSession()
      );

      return newAccessToken;
    })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}


export async function apiRequest(
  path,
  options = {}
) {
  if (!API_URL) {
    throw new ApiError(
      'Thiếu VITE_API_URL. Hãy kiểm tra file .env.',
      0
    );
  }

  const {
    body,
    headers = {},
    ...requestOptions
  } = options;

  const requestHeaders =
    new Headers(headers);

  const token =
    getAccessToken();

  if (token) {
    requestHeaders.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  let requestBody = body;

  if (
    body &&
    !(body instanceof FormData) &&
    typeof body === 'object'
  ) {
    requestHeaders.set(
      'Content-Type',
      'application/json'
    );

    requestBody =
      JSON.stringify(body);
  }


  /*
   * Hàm gửi request.
   * Dùng lại để retry sau refresh.
   */
  const sendRequest =
    async () => {
      try {
        return await fetch(
          `${API_URL}${path}`,
          {
            credentials:
              'include',

            ...requestOptions,

            headers:
              requestHeaders,

            body:
              requestBody,
          }
        );
      } catch {
        throw new ApiError(
          'Không thể kết nối tới máy chủ.',
          0
        );
      }
    };


  let response =
    await sendRequest();


  /*
   * Access token hết hạn:
   *
   * 401
   *   ↓
   * refresh token
   *   ↓
   * lưu token mới
   *   ↓
   * retry request đúng 1 lần
   */
  if (
    response.status === 401 &&
    !NO_AUTO_REFRESH_PATHS.has(
      path
    )
  ) {
    const newAccessToken =
      await refreshAccessToken();

    if (newAccessToken) {
      requestHeaders.set(
        'Authorization',
        `Bearer ${newAccessToken}`
      );

      response =
        await sendRequest();
    }
  }


  const data =
    await readResponseData(
      response
    );


  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Lỗi máy chủ (${response.status})`;

    throw new ApiError(
      message,
      response.status,
      data
    );
  }

  return data;
}