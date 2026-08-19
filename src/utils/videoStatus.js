//Backend nên dùng trạng thái kỹ thuật bằng tiếng Anh. UI mới chuyển sang tiếng Việt.
const VIDEO_STATUS = {
  PENDING: {
    label: 'Đang chờ',
    tone: 'warning',
  },

  QUEUED: {
    label: 'Đang chờ',
    tone: 'warning',
  },

  PROCESSING: {
    label: 'Đang xử lý',
    tone: 'warning',
  },

  COMPLETED: {
    label: 'Hoàn tất',
    tone: 'success',
  },

  FAILED: {
    label: 'Thất bại',
    tone: 'danger',
  },
};

export function normalizeVideoStatus(status) {
  return String(status || '').toUpperCase();
}

export function getVideoStatusLabel(status) {
  const normalized =
    normalizeVideoStatus(status);

  return (
    VIDEO_STATUS[normalized]?.label ||
    status ||
    'Không xác định'
  );
}

export function isVideoProcessing(status) {
  return [
    'PENDING',
    'QUEUED',
    'PROCESSING',
  ].includes(
    normalizeVideoStatus(status)
  );
}

export function isVideoCompleted(status) {
  return (
    normalizeVideoStatus(status) ===
    'COMPLETED'
  );
}

export function isVideoFailed(status) {
  return (
    normalizeVideoStatus(status) ===
    'FAILED'
  );
}