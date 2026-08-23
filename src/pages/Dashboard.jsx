import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/Icon';

import {
  EmptyState,
  PageHeader,
  SectionTitle,
  StatCard,
  StatusBadge,
} from '../components/UI';

import {
  useAppData,
} from '../context/AppDataContext';

import {
  getVideoStatusLabel,
  isVideoCompleted,
  isVideoFailed,
  isVideoProcessing,
} from '../utils/videoStatus';

import useProtectedMediaUrl
  from '../hooks/useProtectedMediaUrl';

function formatVideoMeta(video) {
  const duration = video.duration
    ? `${video.duration} giây`
    : '-';

  const ratio =
    video.aspectRatio || '-';

  return `${duration} • ${ratio}`;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return '';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  ).format(date);
}

function ProtectedVideoThumb({
  video,
}) {
  const thumbnailObjectUrl =
    useProtectedMediaUrl(
      video.thumbnailUrl
    );

  return (
    <div
      className="video-thumb"
      style={
        thumbnailObjectUrl
          ? {
              backgroundImage:
                `url("${thumbnailObjectUrl}")`,
              backgroundSize:
                'cover',
              backgroundPosition:
                'center',
            }
          : undefined
      }
    >
      <Icon
        name={
          isVideoProcessing(
            video.status
          )
            ? 'clock'
            : 'play'
        }
        className="w-5 h-5"
      />
    </div>
  );
}

export default function Dashboard() {
  const {
    credit,
    videos,
    videoTotal,
    videoSummary,
    loading,
    error,
    refreshAll,
  } = useAppData();

  const stats = useMemo(() => {
    /*
     * Nếu backend đã trả summary thì ưu tiên dùng.
     *
     * Ví dụ:
     * {
     *   total: 30,
     *   completed: 20,
     *   processing: 4,
     *   pending: 3,
     *   failed: 3
     * }
     */

    if (videoSummary) {
      const completed =
        Number(
          videoSummary.succeeded ??
            videoSummary.completed ??
            0
        );

      const processing =
        Number(
          videoSummary.processing ??
            0
        );

      const pending =
        Number(
          videoSummary.pending ??
            videoSummary.queued ??
            0
        );

      const failed =
        Number(
          videoSummary.failed ??
            0
        );

      const total =
        Number(
          videoSummary.total ??
            videoTotal ??
            0
        );

      const finished =
        completed + failed;

      const successRate =
        finished > 0
          ? Math.round(
              (completed / finished) *
                100
            )
          : 0;

      return {
        total,
        completed,
        processing,
        pending,
        failed,

        active:
          processing + pending,

        successRate,
      };
    }

    /*
     * Nếu backend chưa có summary,
     * frontend tính từ danh sách GET /videos.
     */

    const completed =
      videos.filter(
        (video) =>
          isVideoCompleted(
            video.status
          )
      ).length;

    const failed =
      videos.filter(
        (video) =>
          isVideoFailed(
            video.status
          )
      ).length;

    const active =
      videos.filter(
        (video) =>
          isVideoProcessing(
            video.status
          )
      ).length;

    const pending =
      videos.filter(
        (video) =>
          ['PENDING', 'QUEUED'].includes(
            video.status
          )
      ).length;

    const processing =
      videos.filter(
        (video) =>
          video.status ===
          'PROCESSING'
      ).length;

    const finished =
      completed + failed;

    return {
      total:
        videoTotal ||
        videos.length,

      completed,
      processing,
      pending,
      failed,
      active,

      successRate:
        finished > 0
          ? Math.round(
              (completed / finished) *
                100
            )
          : 0,
    };
  }, [
    videos,
    videoTotal,
    videoSummary,
  ]);

  const recentVideos =
    useMemo(() => {
      return [...videos]
        .sort((a, b) => {
          const dateA =
            new Date(
              a.createdAt || 0
            ).getTime();

          const dateB =
            new Date(
              b.createdAt || 0
            ).getTime();

          return dateB - dateA;
        })
        .slice(0, 3);
    }, [videos]);

  if (loading) {
    return (
      <div className="page-wrap">
        <PageHeader
          eyebrow="TRUNG TÂM ĐIỀU KHIỂN"
          title="Dashboard"
          description="Đang tải dữ liệu tài khoản..."
        />

        <section className="panel">
          <EmptyState
            icon="clock"
            title="Đang tải Dashboard"
            description="VideoNova đang lấy credit và dữ liệu video từ máy chủ."
          />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrap">
        <PageHeader
          eyebrow="TRUNG TÂM ĐIỀU KHIỂN"
          title="Dashboard"
          description="Theo dõi hoạt động và tiến trình tạo video."
        />

        <section className="panel">
          <EmptyState
            icon="x"
            title="Không thể tải Dashboard"
            description={error}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  refreshAll().catch(
                    () => {}
                  );
                }}
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

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="TRUNG TÂM ĐIỀU KHIỂN"
        title="Dashboard"
        description="Theo dõi credit, video và tiến trình xử lý của bạn."
        action={
          <Link
            className="btn btn-primary"
            to="/create"
          >
            <Icon
              name="plus"
              className="w-4 h-4"
            />

            Tạo video mới
          </Link>
        }
      />

      <div className="stats-grid">
        <StatCard
          label="Credit khả dụng"
          value={
            credit?.balance ?? 0
          }
          sub="Số dư hiện tại"
          icon="sparkles"
          tone="indigo"
        />

        <StatCard
          label="Video đã tạo"
          value={stats.total}
          sub={`${stats.completed} video hoàn tất`}
          icon="video"
          tone="cyan"
        />

        <StatCard
          label="Đang xử lý"
          value={stats.active}
          sub={`${stats.pending} chờ • ${stats.processing} xử lý`}
          icon="clock"
          tone="amber"
        />

        <StatCard
          label="Tỷ lệ thành công"
          value={`${stats.successRate}%`}
          sub={`${stats.completed} thành công • ${stats.failed} thất bại`}
          icon="trend"
          tone="green"
        />
      </div>

      <section className="hero-panel">
        <div className="hero-glow hero-glow-a" />

        <div className="hero-glow hero-glow-b" />

        <div className="hero-copy">
          <span className="hero-badge">
            <Icon
              name="sparkles"
              className="w-4 h-4"
            />

            AI IMAGE TO VIDEO
          </span>

          <h2>
            Biến hình ảnh tĩnh thành
            <br />

            <em>
              video sống động.
            </em>
          </h2>

          <p>
            Tải ảnh lên, mô tả chuyển
            động và gửi tác vụ tới hệ
            thống tạo video AI.
          </p>

          <div className="hero-actions">
            <Link
              to="/create"
              className="btn btn-primary"
            >
              Bắt đầu tạo video

              <Icon
                name="arrowRight"
                className="w-4 h-4"
              />
            </Link>

            <Link
              to="/videos"
              className="btn btn-ghost"
            >
              Xem video của tôi
            </Link>
          </div>
        </div>

        <div className="hero-preview">
          <div className="preview-frame">
            <div className="preview-scene">
              <div className="scene-moon" />

              <div className="scene-mountain scene-mountain-a" />

              <div className="scene-mountain scene-mountain-b" />

              <div className="scene-road" />

              <span className="preview-chip">
                <Icon
                  name="play"
                  className="w-4 h-4"
                />

                AI VIDEO
              </span>
            </div>
          </div>

          <div className="floating-card floating-card-a">
            <div className="floating-icon">
              <Icon
                name="video"
                className="w-4 h-4"
              />
            </div>

            <div>
              <span>
                Tổng video
              </span>

              <strong>
                {stats.total}
              </strong>
            </div>
          </div>

          <div className="floating-card floating-card-b">
            <div className="floating-icon success">
              <Icon
                name="check"
                className="w-4 h-4"
              />
            </div>

            <div>
              <span>
                Hoàn tất
              </span>

              <strong>
                {stats.completed}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <SectionTitle
            title="Video gần đây"
            description="Các tác vụ mới nhất của bạn"
            action={
              <Link
                to="/videos"
                className="text-link"
              >
                Xem tất cả

                <Icon
                  name="arrowRight"
                  className="w-4 h-4"
                />
              </Link>
            }
          />

          {recentVideos.length ===
          0 ? (
            <EmptyState
              icon="video"
              title="Chưa có video"
              description="Bạn chưa tạo video nào."
              action={
                <Link
                  to="/create"
                  className="btn btn-primary"
                >
                  Tạo video đầu tiên
                </Link>
              }
            />
          ) : (
            <div className="recent-list">
              {recentVideos.map(
                (video) => {
                  const status =
                    getVideoStatusLabel(
                      video.status
                    );

                  return (
                    <Link
                      to={`/videos/${video.id}`}
                      className="recent-row"
                      key={video.id}
                    >
                      <ProtectedVideoThumb
                        video={video}
                      />

                      <div className="recent-info">
                        <strong>
                          {video.title}
                        </strong>

                        <span>
                          {formatVideoMeta(
                            video
                          )}

                          {video.createdAt
                            ? ` • ${formatDate(
                                video.createdAt
                              )}`
                            : ''}
                        </span>
                      </div>

                      <StatusBadge
                        status={status}
                      />

                      <Icon
                        name="arrowRight"
                        className="w-4 h-4 row-arrow"
                      />
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>

        <aside className="panel usage-panel">
          <SectionTitle
            title="Credit"
            description="Số dư credit của tài khoản"
          />

          <div className="usage-ring">
            <div>
              <strong>
                {credit?.balance ??
                  0}
              </strong>

              <small>
                credit khả dụng
              </small>
            </div>
          </div>

          <div className="usage-details">
            <div>
              <span>
                Credit miễn phí
              </span>

              <strong>
                {credit?.freeCredit ??
                  0}{' '}
                credit
              </strong>
            </div>

            <div>
              <span>
                Credit đã mua
              </span>

              <strong>
                {credit?.paidCredit ??
                  0}{' '}
                credit
              </strong>
            </div>

            <div>
              <span>
                Video đang chờ
              </span>

              <strong>
                {stats.pending}
              </strong>
            </div>

            <div>
              <span>
                Video đang xử lý
              </span>

              <strong>
                {stats.processing}
              </strong>
            </div>
          </div>

          <Link
            to="/billing"
            className="btn btn-secondary full"
          >
            Mua thêm credit
          </Link>
        </aside>
      </div>
    </div>
  );
}