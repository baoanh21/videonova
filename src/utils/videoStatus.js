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

  CANCELED: {
    label: 'Đã hủy',
    tone: 'default',
  },
};

export function normalizeVideoStatus(
  status
) {
  const normalized =
    String(
      status || ''
    ).toUpperCase();

  if (
    normalized === 'SUCCEEDED'
  ) {
    return 'COMPLETED';
  }

  return normalized;
}

export function getVideoStatusLabel(
  status
) {
  const normalized =
    normalizeVideoStatus(
      status
    );

  return (
    VIDEO_STATUS[
      normalized
    ]?.label ||
    status ||
    'Không xác định'
  );
}

export function isVideoProcessing(
  status
) {
  return [
    'PENDING',
    'QUEUED',
    'PROCESSING',
  ].includes(
    normalizeVideoStatus(
      status
    )
  );
}

export function isVideoCompleted(
  status
) {
  return (
    normalizeVideoStatus(
      status
    ) === 'COMPLETED'
  );
}

export function isVideoFailed(
  status
) {
  return (
    normalizeVideoStatus(
      status
    ) === 'FAILED'
  );
}

export function isVideoCanceled(
  status
) {
  return (
    normalizeVideoStatus(
      status
    ) === 'CANCELED'
  );
}