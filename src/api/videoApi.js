import { apiRequest } from './apiClient';
import {
  normalizeVideoStatus,
} from '../utils/videoStatus';

export function normalizeVideo(video = {}) {
  return {
    id:
      video.id ??
      video.video_id,

    title:
      video.title ||
      video.name ||
      'Video chưa đặt tên',

    status:
      normalizeVideoStatus(
        video.status
      ),

    progress: Number(
      video.progress ?? 0
    ),

    duration: Number(
      video.duration ?? 0
    ),

    aspectRatio:
      video.aspect_ratio ||
      video.ratio ||
      '-',

    model:
      video.model || '-',

    style:
      video.style || '-',

    prompt:
      video.prompt || '',

    creditCost: Number(
      video.credit_cost ?? 0
    ),

    queuePosition:
      video.queue_position ?? null,

    thumbnailUrl:
      video.thumbnail_url ||
      video.input_image_url ||
      null,

    inputImageUrl:
      video.input_image_url ||
      null,

    outputVideoUrl:
      video.output_video_url ||
      video.video_url ||
      null,

    error:
      video.error ||
      video.error_message ||
      null,

    createdAt:
      video.created_at ||
      null,

    completedAt:
      video.completed_at ||
      null,
  };
}

export async function createVideo(
  formData
) {
  const data = await apiRequest(
    '/videos',
    {
      method: 'POST',
      body: formData,
    }
  );

  return normalizeVideo(data);
}

export async function getVideos({
  page = 1,
  limit = 100,
} = {}) {
  const query =
    new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

  const data = await apiRequest(
    `/videos?${query.toString()}`
  );

  /*
   * Backend có thể trả:
   *
   * [
   *   {...}
   * ]
   *
   * hoặc:
   *
   * {
   *   items: [...],
   *   total: 20
   * }
   */

  if (Array.isArray(data)) {
    return {
      items:
        data.map(normalizeVideo),

      total:
        data.length,

      summary:
        null,
    };
  }

  const rawItems =
    data?.items ??
    data?.videos ??
    [];

  return {
    items:
      rawItems.map(
        normalizeVideo
      ),

    total:
      Number(
        data?.total ??
        rawItems.length
      ),

    summary:
      data?.summary ??
      null,
  };
}

export async function getVideo(
  videoId
) {
  const data = await apiRequest(
    `/videos/${videoId}`
  );

  return normalizeVideo(data);
}

export async function getVideoStatus(videoId) {
  const data = await apiRequest(
    `/videos/${videoId}/status`
  );

  return normalizeVideo(data);
}

export async function cancelVideo(
  videoId
) {
  const data =
    await apiRequest(
      `/videos/${videoId}/cancel`,
      {
        method: 'POST',
      }
    );

  return normalizeVideo(data);
}

export function deleteVideo(
  videoId
) {
  return apiRequest(
    `/videos/${videoId}`,
    {
      method: 'DELETE',
    }
  );
}