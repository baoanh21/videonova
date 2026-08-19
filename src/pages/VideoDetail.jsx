import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  EmptyState,
  StatusBadge,
} from '../components/UI';

import {
  getVideo,
  getVideoStatus,
} from '../api/videoApi';

import {
  getVideoStatusLabel,
  isVideoCompleted,
  isVideoFailed,
  isVideoProcessing,
} from '../utils/videoStatus';

const POLL_INTERVAL =
  Number(
    import.meta.env.VITE_API_POLL_INTERVAL
  ) || 3000;

function formatDateTime(value) {
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

export default function VideoDetail() {
  const { id } = useParams();

  const [video, setVideo] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [copied, setCopied] =
    useState(false);

  const loadVideo =
    useCallback(async () => {
      if (!id) return;

      try {
        setError('');

        const data =
          await getVideo(id);

        setVideo(data);
      } catch (err) {
        setError(
          err.message ||
            'Không thể tải thông tin video.'
        );
      } finally {
        setLoading(false);
      }
    }, [id]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  /*
   * Poll trạng thái thật từ backend.
   *
   * Không có setTimeout giả lập queue.
   */
  useEffect(() => {
    if (
      !video ||
      !isVideoProcessing(
        video.status
      )
    ) {
      return;
    }

    let cancelled = false;

    const checkStatus =
      async () => {
        try {
          const statusData =
            await getVideoStatus(id);

          if (cancelled) {
            return;
          }

          setVideo((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              ...statusData,
            };
          });

          /*
           * Khi job hoàn tất/thất bại,
           * lấy lại full video để nhận
           * output_video_url, metadata...
           */
          if (
            isVideoCompleted(
              statusData.status
            ) ||
            isVideoFailed(
              statusData.status
            )
          ) {
            const fullVideo =
              await getVideo(id);

            if (!cancelled) {
              setVideo(
                fullVideo
              );
            }
          }
        } catch (err) {
          /*
           * Không xóa video đang hiển thị
           * chỉ vì một request polling lỗi.
           */
          console.error(
            'Không thể cập nhật trạng thái video:',
            err
          );
        }
      };

    const interval =
      setInterval(
        checkStatus,
        POLL_INTERVAL
      );

    return () => {
      cancelled = true;

      clearInterval(
        interval
      );
    };
  }, [
    id,
    video?.status,
  ]);

  const handleCopyPrompt =
    async () => {
      if (!video?.prompt) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          video.prompt
        );

        setCopied(true);

        setTimeout(
          () =>
            setCopied(false),
          1500
        );
      } catch {
        setCopied(false);
      }
    };

  if (loading) {
    return (
      <div className="page-wrap">
        <section className="panel">
          <EmptyState
            icon="clock"
            title="Đang tải video"
            description="Đang lấy thông tin video từ máy chủ."
          />
        </section>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="page-wrap">
        <section className="panel">
          <EmptyState
            icon="x"
            title="Không thể tải video"
            description={
              error ||
              'Video không tồn tại.'
            }
            action={
              <div className="detail-error-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    loadVideo
                  }
                >
                  <Icon
                    name="refresh"
                    className="w-4 h-4"
                  />

                  Thử lại
                </button>

                <Link
                  to="/videos"
                  className="btn btn-secondary"
                >
                  Quay lại
                </Link>
              </div>
            }
          />
        </section>
      </div>
    );
  }

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

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          video.progress || 0
        )
      )
    );

  const statusLabel =
    getVideoStatusLabel(
      video.status
    );

  return (
    <div className="page-wrap">
      <div className="breadcrumb">
        <Link to="/videos">
          Video của tôi
        </Link>

        <span>/</span>

        <span>
          {video.title}
        </span>
      </div>

      <div className="detail-heading">
        <div>
          <h1>
            {video.title}
          </h1>

          <div>
            <StatusBadge
              status={
                statusLabel
              }
            />

            <span>
              Đã tạo lúc{' '}
              {formatDateTime(
                video.createdAt
              )}
            </span>
          </div>
        </div>

        <div className="detail-actions">
          {failed && (
            <Link
              to="/create"
              className="btn btn-secondary"
            >
              <Icon
                name="refresh"
                className="w-4 h-4"
              />

              Tạo video khác
            </Link>
          )}

          {completed &&
            video.outputVideoUrl && (
              <a
                href={
                  video.outputVideoUrl
                }
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <Icon
                  name="download"
                  className="w-4 h-4"
                />

                Tải video
              </a>
            )}
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel video-player">
          {completed &&
          video.outputVideoUrl ? (
            <video
              className="real-video"
              src={
                video.outputVideoUrl
              }
              poster={
                video.thumbnailUrl ||
                undefined
              }
              controls
              playsInline
            >
              Trình duyệt của bạn
              không hỗ trợ phát video.
            </video>
          ) : processing ? (
            <div className="detail-processing-state">
              <div className="spinner" />

              <h2>
                {video.status ===
                'PROCESSING'
                  ? 'Đang tạo video'
                  : 'Video đang trong hàng đợi'}
              </h2>

              {video.status ===
              'PROCESSING' ? (
                <>
                  <strong className="detail-progress-number">
                    {progress}%
                  </strong>

                  <div className="detail-progress-bar">
                    <i
                      style={{
                        width:
                          `${progress}%`,
                      }}
                    />
                  </div>

                  <p>
                    Video đang được xử lý.
                    Bạn có thể rời trang
                    và quay lại sau.
                  </p>
                </>
              ) : (
                <>
                  {video.queuePosition && (
                    <strong className="detail-progress-number">
                      #
                      {
                        video.queuePosition
                      }
                    </strong>
                  )}

                  <p>
                    {video.queuePosition
                      ? `Vị trí hiện tại trong hàng đợi: ${video.queuePosition}`
                      : 'Tác vụ đã được gửi vào hàng đợi xử lý.'}
                  </p>
                </>
              )}
            </div>
          ) : failed ? (
            <div className="detail-failed-state">
              <div className="failed-icon">
                <Icon
                  name="x"
                  className="w-6 h-6"
                />
              </div>

              <h2>
                Tạo video thất bại
              </h2>

              <p>
                {video.error ||
                  'Hệ thống không thể tạo video này.'}
              </p>

              <Link
                to="/create"
                className="btn btn-primary"
              >
                Tạo video khác
              </Link>
            </div>
          ) : (
            <div className="detail-processing-state">
              <Icon
                name="video"
                className="w-8 h-8"
              />

              <h2>
                Video chưa sẵn sàng
              </h2>
            </div>
          )}
        </section>

        <aside className="detail-side">
          <section className="panel detail-panel">
            <h2>
              Thông tin video
            </h2>

            <dl>
              <div>
                <dt>
                  Trạng thái
                </dt>

                <dd>
                  {statusLabel}
                </dd>
              </div>

              <div>
                <dt>
                  Thời lượng
                </dt>

                <dd>
                  {video.duration
                    ? `${video.duration} giây`
                    : '-'}
                </dd>
              </div>

              <div>
                <dt>
                  Tỷ lệ khung hình
                </dt>

                <dd>
                  {
                    video.aspectRatio
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Độ phân giải
                </dt>

                <dd>
                  {
                    video.resolution
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Mô hình AI
                </dt>

                <dd>
                  {video.model}
                </dd>
              </div>

              <div>
                <dt>
                  Credit đã dùng
                </dt>

                <dd>
                  {
                    video.creditCost
                  }{' '}
                  credit
                </dd>
              </div>

              {processing && (
                <div>
                  <dt>
                    Tiến độ
                  </dt>

                  <dd>
                    {progress}%
                  </dd>
                </div>
              )}

              {video.queuePosition && (
                <div>
                  <dt>
                    Vị trí queue
                  </dt>

                  <dd>
                    #
                    {
                      video.queuePosition
                    }
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="panel detail-panel">
            <h2>
              Ảnh đầu vào
            </h2>

            {video.inputImageUrl ? (
              <div
                className="source-image"
                style={{
                  backgroundImage:
                    `url("${video.inputImageUrl}")`,
                  backgroundSize:
                    'cover',
                  backgroundPosition:
                    'center',
                }}
              />
            ) : (
              <div className="source-image">
                <Icon
                  name="image"
                  className="w-5 h-5"
                />
              </div>
            )}

            <span className="file-name">
              {video.inputFileName ||
                'Ảnh đầu vào'}
            </span>
          </section>
        </aside>
      </div>

      <section className="panel prompt-detail">
        <div>
          <span>
            PROMPT ĐÃ SỬ DỤNG
          </span>

          <h2>
            Mô tả chuyển động
          </h2>
        </div>

        <p>
          {video.prompt ||
            'Không có prompt.'}
        </p>

        {video.prompt && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={
              handleCopyPrompt
            }
          >
            <Icon
              name={
                copied
                  ? 'check'
                  : 'copy'
              }
              className="w-4 h-4"
            />

            {copied
              ? 'Đã sao chép'
              : 'Sao chép prompt'}
          </button>
        )}
      </section>
    </div>
  );
}