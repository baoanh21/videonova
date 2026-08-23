import {
  useMemo,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  EmptyState,
  PageHeader,
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

import {
  downloadMedia,
} from '../api/mediaApi';

import {
  cancelVideo,
  deleteVideo,
} from '../api/videoApi';

import useProtectedMediaUrl
  from '../hooks/useProtectedMediaUrl';

const FILTERS = [
  {
    key: 'all',
    label: 'Tất cả',
  },
  {
    key: 'completed',
    label: 'Hoàn tất',
  },
  {
    key: 'processing',
    label: 'Đang xử lý',
  },
  {
    key: 'failed',
    label: 'Thất bại',
  },
];

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
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

function getMeta(video) {
  const duration =
    video.duration
      ? `${video.duration} giây`
      : '-';

  return `${duration} • ${
    video.aspectRatio
  }`;
}

function ProtectedVideoCover({
  video,
  children,
}) {
  const thumbnailObjectUrl =
    useProtectedMediaUrl(
      video.thumbnailUrl
    );

  return (
    <Link
      to={`/videos/${video.id}`}
      className="video-cover"
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
      {children}
    </Link>
  );
}

function VideoDownloadButton({
  video,
}) {
  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const handleDownload =
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (
        !video.outputVideoUrl ||
        downloading
      ) {
        return;
      }

      try {
        setDownloading(true);

        await downloadMedia(
          video.outputVideoUrl,
          `videonova-${video.id}.mp4`
        );
      } catch (err) {
        console.error(
          'Không thể tải video:',
          err
        );
      } finally {
        setDownloading(false);
      }
    };

  return (
    <button
      type="button"
      onClick={
        handleDownload
      }
      disabled={
        downloading
      }
      title={
        downloading
          ? 'Đang tải video'
          : 'Tải video'
      }
    >
      <Icon
        name={
          downloading
            ? 'clock'
            : 'download'
        }
        className="w-4 h-4"
      />
    </button>
  );
}

function VideoManageButton({
  video,
  processing,
  onChanged,
  onMessage,
}) {
  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const handleAction =
    async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (actionLoading) {
        return;
      }

      const isCancel =
        processing;

      const confirmed =
        window.confirm(
          isCancel
            ? `Hủy tác vụ "${video.title}"?`
            : `Xóa "${video.title}" khỏi Video của tôi?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        onMessage('');

        if (isCancel) {
          await cancelVideo(
            video.id
          );

          onMessage(
            'Đã hủy tác vụ tạo video.'
          );
        } else {
          await deleteVideo(
            video.id
          );

          onMessage(
            'Đã xóa video.'
          );
        }

        await onChanged();
      } catch (err) {
        onMessage(
          err?.message ||
            (isCancel
              ? 'Không thể hủy video.'
              : 'Không thể xóa video.')
        );
      } finally {
        setActionLoading(false);
      }
    };

  return (
    <button
      type="button"
      onClick={
        handleAction
      }
      disabled={
        actionLoading
      }
      title={
        actionLoading
          ? 'Đang xử lý'
          : processing
            ? 'Hủy tạo video'
            : 'Xóa video'
      }
      aria-label={
        processing
          ? 'Hủy tạo video'
          : 'Xóa video'
      }
    >
      <Icon
        name={
          actionLoading
            ? 'clock'
            : 'x'
        }
        className="w-4 h-4"
      />
    </button>
  );
}

export default function MyVideos() {
  const {
    videos,
    videoTotal,
    loading,
    error,
    refreshAll,
  } = useAppData();

  const [
    activeFilter,
    setActiveFilter,
  ] = useState('all');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    sort,
    setSort,
  ] = useState('newest');

  const [
    actionMessage,
    setActionMessage,
  ] = useState('');

  const counts = useMemo(
    () => ({
      all:
        videoTotal ||
        videos.length,

      completed:
        videos.filter(
          (video) =>
            isVideoCompleted(
              video.status
            )
        ).length,

      processing:
        videos.filter(
          (video) =>
            isVideoProcessing(
              video.status
            )
        ).length,

      failed:
        videos.filter(
          (video) =>
            isVideoFailed(
              video.status
            )
        ).length,
    }),
    [
      videos,
      videoTotal,
    ]
  );

  const visibleVideos =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      let result =
        videos.filter(
          (video) => {
            if (
              activeFilter ===
              'completed'
            ) {
              return isVideoCompleted(
                video.status
              );
            }

            if (
              activeFilter ===
              'processing'
            ) {
              return isVideoProcessing(
                video.status
              );
            }

            if (
              activeFilter ===
              'failed'
            ) {
              return isVideoFailed(
                video.status
              );
            }

            return true;
          }
        );

      if (keyword) {
        result =
          result.filter(
            (video) => {
              const title =
                video.title
                  ?.toLowerCase() ||
                '';

              const prompt =
                video.prompt
                  ?.toLowerCase() ||
                '';

              return (
                title.includes(
                  keyword
                ) ||
                prompt.includes(
                  keyword
                )
              );
            }
          );
      }

      return [...result].sort(
        (a, b) => {
          const dateA =
            new Date(
              a.createdAt || 0
            ).getTime();

          const dateB =
            new Date(
              b.createdAt || 0
            ).getTime();

          if (
            sort === 'oldest'
          ) {
            return (
              dateA - dateB
            );
          }

          return (
            dateB - dateA
          );
        }
      );
    }, [
      videos,
      activeFilter,
      search,
      sort,
    ]);

  if (loading) {
    return (
      <div className="page-wrap">
        <PageHeader
          eyebrow="THƯ VIỆN CÁ NHÂN"
          title="Video của tôi"
          description="Đang tải danh sách video..."
        />

        <section className="panel">
          <EmptyState
            icon="clock"
            title="Đang tải video"
            description="VideoNova đang lấy dữ liệu từ máy chủ."
          />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrap">
        <PageHeader
          eyebrow="THƯ VIỆN CÁ NHÂN"
          title="Video của tôi"
          description="Quản lý các tác vụ tạo video của bạn."
        />

        <section className="panel">
          <EmptyState
            icon="x"
            title="Không thể tải video"
            description={error}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  refreshAll()
                    .catch(
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
        eyebrow="THƯ VIỆN CÁ NHÂN"
        title="Video của tôi"
        description="Theo dõi các video đang chờ, đang xử lý và đã hoàn tất."
        action={
          <Link
            to="/create"
            className="btn btn-primary"
          >
            <Icon
              name="plus"
              className="w-4 h-4"
            />

            Tạo video mới
          </Link>
        }
      />

      {actionMessage && (
        <div className="auth-success">
          {actionMessage}
        </div>
      )}

      <div className="library-toolbar">
        <div className="tabs">
          {FILTERS.map(
            (filter) => (
              <button
                type="button"
                key={filter.key}
                className={
                  activeFilter ===
                  filter.key
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActiveFilter(
                    filter.key
                  )
                }
              >
                {filter.label}{' '}
                {
                  counts[
                    filter.key
                  ]
                }
              </button>
            )
          )}
        </div>

        <div className="toolbar-right">
          <div className="search-field">
            <Icon
              name="search"
              className="w-4 h-4"
            />

            <input
              type="search"
              value={search}
              placeholder="Tìm kiếm video..."
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
            />
          </div>

          <select
            className="filter-button"
            value={sort}
            onChange={(event) =>
              setSort(
                event.target
                  .value
              )
            }
          >
            <option value="newest">
              Mới nhất
            </option>

            <option value="oldest">
              Cũ nhất
            </option>
          </select>
        </div>
      </div>

      {videos.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon="video"
            title="Chưa có video"
            description="Bạn chưa tạo video nào. Hãy bắt đầu với hình ảnh đầu tiên."
            action={
              <Link
                to="/create"
                className="btn btn-primary"
              >
                <Icon
                  name="plus"
                  className="w-4 h-4"
                />

                Tạo video đầu tiên
              </Link>
            }
          />
        </section>
      ) : visibleVideos.length ===
        0 ? (
        <section className="panel">
          <EmptyState
            icon="search"
            title="Không tìm thấy video"
            description="Không có video nào phù hợp với bộ lọc hoặc từ khóa hiện tại."
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearch('');
                  setActiveFilter(
                    'all'
                  );
                }}
              >
                Xóa bộ lọc
              </button>
            }
          />
        </section>
      ) : (
        <div className="video-grid">
          {visibleVideos.map(
            (video) => {
              const statusLabel =
                getVideoStatusLabel(
                  video.status
                );

              const processing =
                isVideoProcessing(
                  video.status
                );

              const completed =
                isVideoCompleted(
                  video.status
                );

              const failed =
                isVideoFailed(
                  video.status
                );

              const canceled =
                video.status ===
                'CANCELED';

              const progress =
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      video.progress ||
                        0
                    )
                  )
                );

              return (
                <article
                  className="video-card"
                  key={video.id}
                >
                  <ProtectedVideoCover
                    video={video}
                  >
                    {completed && (
                      <div className="cover-actions">
                        <span className="play-circle">
                          <Icon
                            name="play"
                            className="w-5 h-5"
                          />
                        </span>
                      </div>
                    )}

                    {processing && (
                      <div className="processing-overlay">
                        <div className="spinner" />

                        <strong>
                          {video.status ===
                          'PROCESSING'
                            ? 'Đang tạo video...'
                            : 'Đang chờ xử lý...'}
                        </strong>

                        {video.status ===
                        'PROCESSING' ? (
                          <>
                            <span>
                              {
                                progress
                              }
                              %
                            </span>

                            <div className="processing-bar">
                              <i
                                style={{
                                  width:
                                    `${progress}%`,
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <span>
                            {video.queuePosition
                              ? `Vị trí hàng đợi: ${video.queuePosition}`
                              : 'Tác vụ đã được đưa vào hàng đợi'}
                          </span>
                        )}
                      </div>
                    )}

                    {failed && (
                      <div className="failed-overlay">
                        <div>
                          <Icon
                            name="x"
                            className="w-5 h-5"
                          />
                        </div>

                        <span>
                          Tạo video thất bại
                        </span>
                      </div>
                    )}

                    {canceled && (
                      <div className="failed-overlay">
                        <div>
                          <Icon
                            name="x"
                            className="w-5 h-5"
                          />
                        </div>

                        <span>
                          Video đã được hủy
                        </span>
                      </div>
                    )}

                    {!video.thumbnailUrl &&
                      !processing &&
                      !failed &&
                      !canceled && (
                        <div className="empty-preview">
                          <div>
                            <Icon
                              name="video"
                              className="w-7 h-7"
                            />
                          </div>
                        </div>
                      )}
                  </ProtectedVideoCover>

                  <div className="video-card-body">
                    <div className="video-title-row">
                      <Link
                        to={`/videos/${video.id}`}
                      >
                        {
                          video.title
                        }
                      </Link>

                      <VideoManageButton
                        video={video}
                        processing={
                          processing
                        }
                        onChanged={
                          refreshAll
                        }
                        onMessage={
                          setActionMessage
                        }
                      />
                    </div>

                    <div className="video-meta-row">
                      <StatusBadge
                        status={
                          statusLabel
                        }
                      />

                      <span>
                        {getMeta(
                          video
                        )}
                      </span>
                    </div>

                    <div className="video-card-footer">
                      <span>
                        {formatDate(
                          video.createdAt
                        )}
                      </span>

                      <div>
                        {completed &&
                          video.outputVideoUrl && (
                            <VideoDownloadButton
                              video={video}
                            />
                          )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}