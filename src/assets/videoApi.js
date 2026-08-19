import { apiRequest } from '../api/apiClient';

export async function createVideo(formData) {
  return apiRequest('/videos', {
    method: 'POST',
    body: formData,
  });
}

export async function getVideos({
  page = 1,
  limit = 100,
} = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const data = await apiRequest(
    `/videos?${query.toString()}`
  );

  // Hỗ trợ cả response dạng array và pagination object.
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      summary: null,
    };
  }

  const items =
    data?.items ??
    data?.videos ??
    [];

  return {
    items,
    total:
      data?.total ??
      items.length,

    summary:
      data?.summary ??
      null,
  };
}

export function getVideo(videoId) {
  return apiRequest(`/videos/${videoId}`);
}

export function getVideoStatus(videoId) {
  return apiRequest(
    `/videos/${videoId}/status`
  );
}

export function retryVideo(videoId) {
  return apiRequest(
    `/videos/${videoId}/retry`,
    {
      method: 'POST',
    }
  );
}