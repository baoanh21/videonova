import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  EmptyState,
  PageHeader,
  SectionTitle,
  StatCard,
  StatusBadge,
} from '../components/UI';

import {
  getAdminDashboard,
} from '../api/adminApi';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

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

function getAdminJobStatusLabel(
  status
) {
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

export default function AdminDashboard() {
  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const data =
          await getAdminDashboard();

        setDashboard(data);
      } catch (err) {
        setError(
          err?.message ||
            'Không thể tải Dashboard quản trị.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="page-wrap admin-page">
        <PageHeader
          eyebrow="TỔNG QUAN HỆ THỐNG"
          title="Dashboard quản trị"
          description="Đang tải dữ liệu hệ thống..."
        />

        <section className="panel">
          <EmptyState
            icon="clock"
            title="Đang tải Dashboard"
            description="Đang lấy số liệu quản trị từ máy chủ."
          />
        </section>
      </div>
    );
  }

  if (
    error ||
    !dashboard
  ) {
    return (
      <div className="page-wrap admin-page">
        <PageHeader
          eyebrow="TỔNG QUAN HỆ THỐNG"
          title="Dashboard quản trị"
          description="Theo dõi hoạt động hệ thống."
        />

        <section className="panel">
          <EmptyState
            icon="x"
            title="Không thể tải Dashboard"
            description={
              error ||
              'Không có dữ liệu.'
            }
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  loadDashboard
                }
              >
                <Icon
                  name="refresh"
                  className="w-4 h-4"
                />

                Thử lại
              </button>
            }
          />
        </section>
      </div>
    );
  }

  const totals =
    dashboard.totals || {};

  const recentJobs =
    Array.isArray(
      dashboard.recent_jobs
    )
      ? dashboard.recent_jobs
      : [];

  return (
    <div className="page-wrap admin-page">
      <PageHeader
        eyebrow="TỔNG QUAN HỆ THỐNG"
        title="Dashboard quản trị"
        description="Theo dõi số liệu người dùng, video, credit và hàng đợi xử lý."
        action={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={
              loadDashboard
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

      <div className="stats-grid">
        <StatCard
          label="Người dùng"
          value={
            Number(
              totals.users ?? 0
            ).toLocaleString(
              'vi-VN'
            )
          }
          sub="Tổng tài khoản"
          icon="users"
          tone="indigo"
        />

        <StatCard
          label="Video"
          value={
            Number(
              totals.videos ?? 0
            ).toLocaleString(
              'vi-VN'
            )
          }
          sub="Tổng video hệ thống"
          icon="video"
          tone="cyan"
        />

        <StatCard
          label="Job đang hoạt động"
          value={
            Number(
              totals.active_jobs ??
                0
            ).toLocaleString(
              'vi-VN'
            )
          }
          sub="Đang chờ hoặc xử lý"
          icon="clock"
          tone="amber"
        />

        <StatCard
          label="Job thất bại"
          value={
            Number(
              totals.failed_jobs ??
                0
            ).toLocaleString(
              'vi-VN'
            )
          }
          sub="Tổng job lỗi"
          icon="x"
          tone="red"
        />
      </div>

      <div className="admin-dashboard-grid">
        <section className="panel">
          <SectionTitle
            title="Hoạt động credit"
            description="Số liệu giao dịch và credit đã sử dụng"
          />

          <div className="usage-details">
            <div>
              <span>
                Tổng giao dịch
              </span>

              <strong>
                {Number(
                  totals.transactions ??
                    0
                ).toLocaleString(
                  'vi-VN'
                )}
              </strong>
            </div>

            <div>
              <span>
                Credit đã sử dụng
              </span>

              <strong>
                {Number(
                  totals.credits_used ??
                    0
                ).toLocaleString(
                  'vi-VN'
                )}{' '}
                credit
              </strong>
            </div>
          </div>
        </section>

        <aside className="panel">
          <SectionTitle
            title="Điều hướng quản trị"
            description="Truy cập nhanh dữ liệu hệ thống"
          />

          <div className="admin-quick-links">
            <Link
              to="/admin/users"
              className="btn btn-secondary full"
            >
              Quản lý người dùng
            </Link>

            <Link
              to="/admin/videos"
              className="btn btn-secondary full"
            >
              Quản lý video
            </Link>

            <Link
              to="/admin/transactions"
              className="btn btn-secondary full"
            >
              Xem giao dịch
            </Link>
          </div>
        </aside>
      </div>

      <section className="table-card">
        <div className="table-card-head">
          <SectionTitle
            title="Tác vụ video mới nhất"
            description="Các job gần đây do backend trả về"
          />
        </div>

        {recentJobs.length ===
        0 ? (
          <EmptyState
            icon="video"
            title="Chưa có tác vụ"
            description="Hiện chưa có job video nào."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>
                    Mã job
                  </th>

                  <th>
                    Người dùng
                  </th>

                  <th>
                    Trạng thái
                  </th>

                  <th>
                    Lần thử
                  </th>

                  <th>
                    Thời gian
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentJobs.map(
                  (job) => (
                    <tr
                      key={job.id}
                    >
                      <td>
                        <strong>
                          {job.id}
                        </strong>
                      </td>

                      <td>
                        <div>
                          <strong>
                            {job.user
                              ?.fullName ||
                              job.user
                                ?.email ||
                              '-'}
                          </strong>

                          {job.user
                            ?.fullName &&
                            job.user
                              ?.email && (
                              <div>
                                {
                                  job
                                    .user
                                    .email
                                }
                              </div>
                            )}
                        </div>
                      </td>

                      <td>
                        <StatusBadge
                          status={getAdminJobStatusLabel(
                            job.status
                          )}
                        />
                      </td>

                      <td>
                        {Number(
                          job.attempts ??
                            0
                        )}
                      </td>

                      <td>
                        {formatDateTime(
                          job.created_at
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}