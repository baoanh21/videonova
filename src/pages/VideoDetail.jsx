import {
  downloadMedia,
  getMediaObjectUrl,
} from '../api/mediaApi';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  EmptyState,
  StatusBadge,
} from '../components/UI';

import {
  cancelVideo,
  deleteVideo,
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
  const navigate = useNavigate();

  const [video, setVideo] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [copied, setCopied] =
    useState(false);

  const [
    inputImageObjectUrl,
    setInputImageObjectUrl,
  ] = useState('');

  const [
    outputVideoObjectUrl,
    setOutputVideoObjectUrl,
  ] = useState('');

  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState('');

  const [
    actionMessage,
    setActionMessage,
  ] = useState('');

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
   * Ảnh đầu vào là protected media.
   * Tải bằng Bearer token rồi chuyển
   * thành object URL để trình duyệt hiển thị.
   */
  useEffect(() => {
    if (!video?.inputImageUrl) {
      setInputImageObjectUrl('');

      return undefined;
    }

    let cancelled = false;
    let objectUrl = '';

    const loadInputImage =
      async () => {
        try {
          objectUrl =
            await getMediaObjectUrl(
              video.inputImageUrl
            );

          if (!cancelled) {
            setInputImageObjectUrl(
              objectUrl
            );
          }
        } catch (err) {
          console.error(
            'Không thể tải ảnh đầu vào:',
            err
          );
        }
      };

    loadInputImage();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [video?.inputImageUrl]);

  /*
   * Video đầu ra cũng là protected media.
   * Tải bằng Bearer token rồi tạo object URL
   * để thẻ <video> có thể phát bình thường.
   */
  useEffect(() => {
    if (!video?.outputVideoUrl) {
      setOutputVideoObjectUrl('');

      return undefined;
    }

    let cancelled = false;
    let objectUrl = '';

    const loadOutputVideo =
      async () => {
        try {
          objectUrl =
            await getMediaObjectUrl(
              video.outputVideoUrl
            );

          if (!cancelled) {
            setOutputVideoObjectUrl(
              objectUrl
            );
          }
        } catch (err) {
          console.error(
            'Không thể tải video đầu ra:',
            err
          );
        }
      };

    loadOutputVideo();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [video?.outputVideoUrl]);

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

  const handleDownloadVideo =
    async () => {
      if (!video?.outputVideoUrl) {
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

        setError(
          err?.message ||
            'Không thể tải video.'
        );
      } finally {
        setDownloading(false);
      }
    };

  const handleCancelVideo =
    async () => {
      if (!video?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          'Hủy tác vụ tạo video này? Credit đã dùng sẽ được hoàn lại theo xử lý của hệ thống.'
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setActionError('');
        setActionMessage('');

        const cancelledVideo =
          await cancelVideo(
            video.id
          );

        setVideo(
          cancelledVideo
        );

        setActionMessage(
          'Đã hủy tác vụ tạo video.'
        );
      } catch (err) {
        setActionError(
          err?.message ||
            'Không thể hủy video.'
        );
      } finally {
        setActionLoading(false);
      }
    };

  const handleDeleteVideo =
    async () => {
      if (!video?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          `Xóa "${video.title}" khỏi Video của tôi?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setActionError('');
        setActionMessage('');

        await deleteVideo(
          video.id
        );

        navigate(
          '/videos',
          {
            replace: true,
          }
        );
      } catch (err) {
        setActionError(
          err?.message ||
            'Không thể xóa video.'
        );

        setActionLoading(false);
      }
    };

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

  const canceled =
    video.status ===
    'CANCELED';

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

          {processing ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={
                handleCancelVideo
              }
              disabled={
                actionLoading
              }
            >
              <Icon
                name="x"
                className="w-4 h-4"
              />

              {actionLoading
                ? 'Đang hủy...'
                : 'Hủy tạo video'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={
                handleDeleteVideo
              }
              disabled={
                actionLoading
              }
            >
              <Icon
                name="x"
                className="w-4 h-4"
              />

              {actionLoading
                ? 'Đang xóa...'
                : 'Xóa video'}
            </button>
          )}

          {completed &&
            video.outputVideoUrl && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  handleDownloadVideo
                }
                disabled={
                  downloading ||
                  actionLoading
                }
              >
                <Icon
                  name="download"
                  className="w-4 h-4"
                />

                {downloading
                  ? 'Đang tải...'
                  : 'Tải video'}
              </button>
            )}
        </div>
      </div>

      {actionError && (
        <div className="auth-error">
          {actionError}
        </div>
      )}

      {actionMessage && (
        <div className="auth-success">
          {actionMessage}
        </div>
      )}

      <div className="detail-grid">
        <section className="panel video-player">
          {completed &&
          outputVideoObjectUrl ? (
            <video
              className="real-video"
              src={
                outputVideoObjectUrl
              }
              poster={
                inputImageObjectUrl ||
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
          ) : canceled ? (
            <div className="detail-processing-state">
              <Icon
                name="x"
                className="w-8 h-8"
              />

              <h2>
                Video đã được hủy
              </h2>

              <p>
                Tác vụ tạo video đã dừng.
                Bạn có thể xóa video này
                khỏi danh sách.
              </p>
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
                  {video.resolution ||
                    '-'}
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

            {inputImageObjectUrl ? (
              <div
                className="source-image"
                style={{
                  backgroundImage:
                    `url("${inputImageObjectUrl}")`,
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