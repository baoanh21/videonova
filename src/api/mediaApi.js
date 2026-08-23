import {
  apiRequest,
} from './apiClient';

import {
  getAccessToken,
} from '../utils/authStorage';

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api/v1'
).replace(/\/$/, '');

function resolveMediaUrl(path) {
  if (!path) {
    return '';
  }

  if (
    /^https?:\/\//i.test(path)
  ) {
    return path;
  }

  if (
    path.startsWith(
      '/api/v1/'
    )
  ) {
    return (
      API_URL +
      path.slice(
        '/api/v1'.length
      )
    );
  }

  if (
    path.startsWith('/')
  ) {
    return API_URL + path;
  }

  return `${API_URL}/${path}`;
}

async function fetchMediaOnce(
  path
) {
  const token =
    getAccessToken();

  const headers =
    new Headers();

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  return fetch(
    resolveMediaUrl(path),
    {
      headers,
    }
  );
}

export async function getMediaBlob(
  path
) {
  let response =
    await fetchMediaOnce(
      path
    );

  /*
   * Nếu access token hết hạn,
   * gọi một API protected bình thường.
   *
   * apiClient sẽ tự refresh token,
   * sau đó thử tải media lại.
   */
  if (
    response.status === 401
  ) {
    await apiRequest(
      '/users/me'
    );

    response =
      await fetchMediaOnce(
        path
      );
  }

  if (!response.ok) {
    throw new Error(
      `Không thể tải media (${response.status}).`
    );
  }

  return response.blob();
}

export async function getMediaObjectUrl(
  path
) {
  const blob =
    await getMediaBlob(
      path
    );

  return URL.createObjectURL(
    blob
  );
}

export async function downloadMedia(
  path,
  filename = 'videonova.mp4'
) {
  const objectUrl =
    await getMediaObjectUrl(
      path
    );

  const link =
    document.createElement(
      'a'
    );

  link.href = objectUrl;
  link.download = filename;

  document.body.appendChild(
    link
  );

  link.click();
  link.remove();

  URL.revokeObjectURL(
    objectUrl
  );
}