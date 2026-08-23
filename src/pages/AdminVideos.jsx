import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Icon from '../components/Icon';

import {
  EmptyState,
  PageHeader,
  StatusBadge,
} from '../components/UI';

import {
  deleteAdminVideo,
  getAdminVideos,
} from '../api/adminApi';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  {
    key: '',
    label: 'Tất cả',
  },
  {
    key: 'QUEUED',
    label: 'Đang chờ',
  },
  {
    key: 'PROCESSING',
    label: 'Đang xử lý',
  },
  {
    key: 'SUCCEEDED',
    label: 'Hoàn tất',
  },
  {
    key: 'FAILED',
    label: 'Thất bại',
  },
  {
    key: 'CANCELED',
    label: 'Đã hủy',
  },
];

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

function getStatusLabel(status) {
  const normalized =
    String(
      status || ''
    ).toUpperCase();

  const map = {
    QUEUED:
      'Đang chờ',

    PROCESSING:
      'Đang xử lý',

    SUCCEEDED:
      'Hoàn tất',

    FAILED:
      'Thất bại',

    CANCELED:
      'Đã hủy',
  };

  return (
    map[normalized] ||
    status ||
    'Không xác định'
  );
}

function normalizeVideo(
  video = {}
) {
  return {
    id:
      video.id || '',

    title:
      video.title ||
      video.prompt ||
      'Video',

    prompt:
      video.prompt || '-',

    model:
      video.model || '-',

    status:
      String(
        video.status || ''
      ).toUpperCase(),

    progress:
      Number(
        video.progress ?? 0
      ),

    creditCost:
      Number(
        video.credit_cost ??
        video.creditCost ??
        0
      ),

    createdAt:
      video.created_at ??
      video.createdAt ??
      null,

    user:
      video.user || null,
  };
}

export default function AdminVideos() {
  const [
    videos,
    setVideos,
  ] = useState([]);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    status,
    setStatus,
  ] = useState('');

  const [
    searchInput,
    setSearchInput,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    deletingId,
    setDeletingId,
  ] = useState('');

  const [
    actionMessage,
    setActionMessage,
  ] = useState('');

  const loadVideos =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const data =
          await getAdminVideos({
            page,
            limit:
              PAGE_SIZE,
            search,
            status,
            order: 'desc',
          });

        const items =
          Array.isArray(
            data?.items
          )
            ? data.items
            : [];

        setVideos(
          items.map(
            normalizeVideo
          )
        );

        setTotal(
          Number(
            data?.total ?? 0
          )
        );

        setTotalPages(
          Number(
            data?.total_pages ??
              1
          )
        );
      } catch (err) {
        setError(
          err?.message ||
            'Không thể tải danh sách video.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      search,
      status,
    ]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleSearch =
    (event) => {
      event.preventDefault();

      setPage(1);

      setSearch(
        searchInput.trim()
      );
    };

  const handleFilter =
    (nextStatus) => {
      setStatus(
        nextStatus
      );

      setPage(1);
    };

  const handleDelete =
    async (video) => {
      const active =
        [
          'QUEUED',
          'PROCESSING',
        ].includes(
          video.status
        );

      if (active) {
        setActionMessage(
          'Video đang hoạt động phải được hủy trước khi xóa.'
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Xóa video "${video.title}"? Thao tác này sẽ xóa dữ liệu video khỏi hệ thống.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionMessage('');
        setDeletingId(
          video.id
        );

        await deleteAdminVideo(
          video.id
        );

        setActionMessage(
          'Đã xóa video.'
        );

        if (
          videos.length === 1 &&
          page > 1
        ) {
          setPage(
            (current) =>
              current - 1
          );
        } else {
          await loadVideos();
        }
      } catch (err) {
        setActionMessage(
          err?.message ||
            'Không thể xóa video.'
        );
      } finally {
        setDeletingId('');
      }
    };

  return (
    <div className="page-wrap admin-page">
      <PageHeader
        eyebrow="GIÁM SÁT TÁC VỤ"
        title="Tác vụ video"
        description="Theo dõi video của toàn hệ thống và quản lý dữ liệu đã hoàn tất."
        action={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={
              loadVideos
            }
          >
            <Icon
              name="refresh"
              className="w-4 h-4"
            />

            Làm mới
          </button>
        }
      />

      {actionMessage && (
        <div className="transaction-message">
          {actionMessage}
        </div>
      )}

      <div className="table-toolbar">
        <div className="tabs">
          {STATUS_FILTERS.map(
            (filter) => (
              <button
                type="button"
                key={
                  filter.key ||
                  'all'
                }
                className={
                  status ===
                  filter.key
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  handleFilter(
                    filter.key
                  )
                }
              >
                {filter.label}
              </button>
            )
          )}
        </div>

        <form
          className="search-field"
          onSubmit={
            handleSearch
          }
        >
          <Icon
            name="search"
            className="w-4 h-4"
          />

          <input
            type="search"
            value={
              searchInput
            }
            placeholder="Tìm theo nội dung video..."
            onChange={(
              event
            ) =>
              setSearchInput(
                event.target
                  .value
              )
            }
          />
        </form>
      </div>

      {loading ? (
        <section className="table-card">
          <EmptyState
            icon="clock"
            title="Đang tải video"
            description="Đang lấy danh sách video từ máy chủ."
          />
        </section>
      ) : error ? (
        <section className="table-card">
          <EmptyState
            icon="x"
            title="Không thể tải video"
            description={error}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  loadVideos
                }
              >
                Thử lại
              </button>
            }
          />
        </section>
      ) : videos.length ===
        0 ? (
        <section className="table-card">
          <EmptyState
            icon="video"
            title="Không có video"
            description={
              search ||
              status
                ? 'Không tìm thấy video phù hợp.'
                : 'Hệ thống chưa có video.'
            }
            action={
              search ||
              status ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                    setStatus('');
                    setPage(1);
                  }}
                >
                  Xóa bộ lọc
                </button>
              ) : null
            }
          />
        </section>
      ) : (
        <section className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>
                    Video
                  </th>

                  <th>
                    Người dùng
                  </th>

                  <th>
                    Mô hình
                  </th>

                  <th>
                    Credit
                  </th>

                  <th>
                    Trạng thái
                  </th>

                  <th>
                    Tiến độ
                  </th>

                  <th>
                    Thời gian
                  </th>

                  <th>
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {videos.map(
                  (video) => {
                    const active =
                      [
                        'QUEUED',
                        'PROCESSING',
                      ].includes(
                        video.status
                      );

                    const deleting =
                      deletingId ===
                      video.id;

                    return (
                      <tr
                        key={video.id}
                      >
                        <td>
                          <div>
                            <strong>
                              {
                                video.title
                              }
                            </strong>

                            <div>
                              {video.id}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>
                            <strong>
                              {video.user
                                ?.fullName ||
                                video.user
                                  ?.email ||
                                '-'}
                            </strong>

                            {video.user
                              ?.fullName &&
                              video.user
                                ?.email && (
                                <div>
                                  {
                                    video
                                      .user
                                      .email
                                  }
                                </div>
                              )}
                          </div>
                        </td>

                        <td>
                          <span className="model-chip">
                            {
                              video.model
                            }
                          </span>
                        </td>

                        <td>
                          {
                            video.creditCost
                          }
                        </td>

                        <td>
                          <StatusBadge
                            status={getStatusLabel(
                              video.status
                            )}
                          />
                        </td>

                        <td>
                          {video.progress}%
                        </td>

                        <td>
                          {formatDateTime(
                            video.createdAt
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={
                              active ||
                              deleting
                            }
                            title={
                              active
                                ? 'Video đang hoạt động không thể xóa trực tiếp'
                                : 'Xóa video'
                            }
                            onClick={() =>
                              handleDelete(
                                video
                              )
                            }
                          >
                            {deleting
                              ? 'Đang xóa...'
                              : 'Xóa'}
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              Tổng{' '}
              {total.toLocaleString(
                'vi-VN'
              )}{' '}
              video
            </span>

            <div className="pagination compact">
              <button
                type="button"
                disabled={
                  page <= 1
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
              >
                ‹
              </button>

              <span>
                Trang {page} /{' '}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page >=
                  totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                  )
                }
              >
                ›
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}