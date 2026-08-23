import {
  apiRequest,
} from './apiClient';

function buildPaginationQuery({
  page = 1,
  limit = 10,
  search = '',
  order = 'desc',
} = {}) {
  const query =
    new URLSearchParams();

  query.set(
    'page',
    String(page)
  );

  query.set(
    'limit',
    String(limit)
  );

  query.set(
    'order',
    order === 'asc'
      ? 'asc'
      : 'desc'
  );

  if (search.trim()) {
    query.set(
      'search',
      search.trim()
    );
  }

  return query.toString();
}

export function getAdminDashboard() {
  return apiRequest(
    '/admin/dashboard'
  );
}

export function getAdminUsers({
  page = 1,
  limit = 10,
  search = '',
  order = 'desc',
} = {}) {
  const query =
    buildPaginationQuery({
      page,
      limit,
      search,
      order,
    });

  return apiRequest(
    `/admin/users?${query}`
  );
}

export function setAdminUserLocked(
  userId,
  locked
) {
  return apiRequest(
    `/admin/users/${userId}/lock`,
    {
      method: 'PATCH',

      body: {
        locked:
          Boolean(locked),
      },
    }
  );
}

export function grantAdminCredits(
  userId,
  {
    credits,
    reason,
  }
) {
  return apiRequest(
    `/admin/users/${userId}/credits`,
    {
      method: 'POST',

      body: {
        credits:
          Number(credits),

        reason:
          String(
            reason || ''
          ),
      },
    }
  );
}

export function getAdminVideos({
  page = 1,
  limit = 10,
  search = '',
  order = 'desc',
  status = '',
} = {}) {
  const query =
    new URLSearchParams();

  query.set(
    'page',
    String(page)
  );

  query.set(
    'limit',
    String(limit)
  );

  query.set(
    'order',
    order === 'asc'
      ? 'asc'
      : 'desc'
  );

  if (search.trim()) {
    query.set(
      'search',
      search.trim()
    );
  }

  if (status) {
    query.set(
      'status',
      status
    );
  }

  return apiRequest(
    `/admin/videos?${query.toString()}`
  );
}

export function deleteAdminVideo(
  videoId
) {
  return apiRequest(
    `/admin/videos/${videoId}`,
    {
      method: 'DELETE',
    }
  );
}

export function getAdminFailedJobs({
  page = 1,
  limit = 10,
  search = '',
  order = 'desc',
} = {}) {
  const query =
    buildPaginationQuery({
      page,
      limit,
      search,
      order,
    });

  return apiRequest(
    `/admin/jobs/failed?${query}`
  );
}

export function getAdminTransactions({
  page = 1,
  limit = 10,
  search = '',
  order = 'desc',
} = {}) {
  const query =
    buildPaginationQuery({
      page,
      limit,
      search,
      order,
    });

  return apiRequest(
    `/admin/transactions?${query}`
  );
}

export function getAdminAuditLogs({
  page = 1,
  limit = 10,
  order = 'desc',
} = {}) {
  const query =
    buildPaginationQuery({
      page,
      limit,
      order,
    });

  return apiRequest(
    `/admin/audit-logs?${query}`
  );
}