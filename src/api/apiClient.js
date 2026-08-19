import {
  getAccessToken,
} from '../utils/authStorage';

const API_URL =
  import.meta.env.VITE_API_URL
    ?.replace(/\/$/, '');

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

  let response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        credentials: 'include',
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

  let data = null;

  if (
    response.status !== 204
  ) {
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
        data =
          await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        const text =
          await response.text();

        data =
          text || null;
      } catch {
        data = null;
      }
    }
  }

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