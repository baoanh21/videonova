import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import Icon from '../components/Icon';

import {
  PageHeader,
} from '../components/UI';

import {
  useAppData,
} from '../context/AppDataContext';

import {
  createVideo,
} from '../api/videoApi';


const SelectCard = ({
  label,
  value,
  icon,
  options,
  onChange,
}) => {
  const selectedLabel =
    options.find(
      (option) =>
        option.value === value
    )?.label || value;

  return (
    <label
      className="field-card"
      style={{
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>

      <div>
        <Icon
          name={icon}
          className="w-[18px] h-[18px]"
        />

        <strong>
          {selectedLabel}
        </strong>

        <Icon
          name="chevronDown"
          className="w-4 h-4 field-chevron"
        />
      </div>

      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

const MODEL_OPTIONS = [
  {
    value: 'Wan 2.1',
    label: 'Wan 2.1',
  },
];

const DURATION_OPTIONS = [
  {
    value: '5',
    label: '5 giây',
  },
  {
    value: '10',
    label: '10 giây',
  },
];

const ASPECT_RATIO_OPTIONS = [
  {
    value: '16:9',
    label: '16:9',
  },
  {
    value: '9:16',
    label: '9:16',
  },
  {
    value: '1:1',
    label: '1:1',
  },
];

const STYLE_OPTIONS = [
  {
    value: 'cinematic',
    label: 'Điện ảnh',
  },
  {
    value: 'natural',
    label: 'Tự nhiên',
  },
];


export default function CreateVideo() {
  const navigate =
    useNavigate();

  const fileInputRef =
    useRef(null);

  const {
    credit,
    refreshCredit,
    refreshVideos,
  } = useAppData();

  const [
    image,
    setImage,
  ] = useState(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState('');

  const [
    prompt,
    setPrompt,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    model,
    setModel,
  ] = useState('Wan 2.1');

  const [
    duration,
    setDuration,
  ] = useState('5');

  const [
    aspectRatio,
    setAspectRatio,
  ] = useState('16:9');

  const [
    style,
    setStyle,
  ] = useState('cinematic');

  const [
    enhanceQuality,
    setEnhanceQuality,
  ] = useState(true);


  const creditCost = 10;

  const creditBalance =
    typeof credit === 'number'
      ? credit
      : Number(
          credit?.balance ?? 0
        );


  /*
   * Tạo preview ảnh local.
   * Không cần backend.
   */
  useEffect(() => {
    if (!image) {
      setPreviewUrl('');

      return undefined;
    }

    const objectUrl =
      URL.createObjectURL(
        image
      );

    setPreviewUrl(
      objectUrl
    );

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [image]);


  /*
   * Kiểm tra ảnh hợp lệ.
   */
  const validateImage = (
    file
  ) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        'Chỉ hỗ trợ JPG, PNG hoặc WEBP.'
      );

      return false;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {
      setError(
        'Ảnh không được vượt quá 10 MB.'
      );

      return false;
    }

    return true;
  };


  const selectImage = (
    file
  ) => {
    if (!file) {
      return;
    }

    setError('');

    if (
      !validateImage(file)
    ) {
      return;
    }

    setImage(file);
  };


  /*
   * Chọn ảnh từ máy.
   */
  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    selectImage(file);

    /*
     * Cho phép chọn lại
     * cùng một file.
     */
    event.target.value = '';
  };


  /*
   * Kéo thả ảnh.
   */
  const handleDrop = (
    event
  ) => {
    event.preventDefault();

    const file =
      event.dataTransfer
        .files?.[0];

    selectImage(file);
  };


  /*
   * Xóa ảnh đang chọn.
   */
  const handleRemoveImage = (
    event
  ) => {
    event.stopPropagation();

    setImage(null);
    setPreviewUrl('');
    setError('');

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };


  /*
   * Mở cửa sổ chọn ảnh.
   */
  const openFilePicker = (
    event
  ) => {
    if (event) {
      event.stopPropagation();
    }

    fileInputRef
      .current
      ?.click();
  };


  /*
   * Gửi yêu cầu tạo video.
   */
  const handleCreateVideo =
    async () => {
      setError('');

      if (!image) {
        setError(
          'Vui lòng chọn hình ảnh trước.'
        );

        return;
      }

      if (
        !prompt.trim()
      ) {
        setError(
          'Vui lòng nhập mô tả chuyển động.'
        );

        return;
      }

      try {
        setSubmitting(true);

        const formData =
          new FormData();

        formData.append(
          'image',
          image
        );

        formData.append(
          'prompt',
          prompt.trim()
        );

        formData.append(
          'model',
          model
        );

        formData.append(
          'duration',
          duration
        );

        formData.append(
          'aspect_ratio',
          aspectRatio
        );

        formData.append(
          'style',
          style
        );

        formData.append(
          'enhance_quality',
          String(
            enhanceQuality
          )
        );

        const video =
          await createVideo(
            formData
          );

        await Promise.allSettled([
          refreshCredit?.(),
          refreshVideos?.(),
        ]);

        if (video?.id) {
          navigate(
            `/videos/${video.id}`
          );

          return;
        }

        navigate('/videos');
      } catch (err) {
        setError(
          err?.message ||
            'Không thể tạo video.'
        );
      } finally {
        setSubmitting(false);
      }
    };


  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="AI IMAGE TO VIDEO"
        title="Tạo video mới"
        description="Biến một hình ảnh thành video AI theo phong cách và chuyển động bạn mong muốn."
      />


      <div className="creator-grid">
        <div className="creator-main">

          {/* ======================== */}
          {/* STEP 01 - CHỌN HÌNH ẢNH */}
          {/* ======================== */}

          <section className="panel step-panel">
            <div className="step-heading">
              <span className="step-number">
                01
              </span>

              <div>
                <h2>
                  Chọn hình ảnh đầu vào
                </h2>

                <p>
                  Ảnh rõ nét, đúng chủ thể
                  sẽ giúp video ổn định hơn.
                </p>
              </div>
            </div>


            <input
              ref={fileInputRef}
              id="video-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handleImageChange
              }
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip:
                  'rect(0, 0, 0, 0)',
                whiteSpace:
                  'nowrap',
                border: 0,
              }}
            />


            <div
              className="upload-zone"
              role="button"
              tabIndex={0}
              onClick={
                openFilePicker
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    'Enter' ||
                  event.key === ' '
                ) {
                  event.preventDefault();

                  openFilePicker();
                }
              }}
              onDragOver={(
                event
              ) => {
                event.preventDefault();
              }}
              onDrop={
                handleDrop
              }
              style={{
                cursor:
                  'pointer',
                overflow:
                  'hidden',
              }}
            >

              {previewUrl ? (
                /*
                 * ĐÃ CHỌN ẢNH
                 */
                <div
                  style={{
                    width: '100%',
                  }}
                >
                  <img
                    src={
                      previewUrl
                    }
                    alt="Ảnh đã chọn"
                    style={{
                      display:
                        'block',
                      width:
                        '100%',
                      maxHeight:
                        '420px',
                      objectFit:
                        'contain',
                      borderRadius:
                        '14px',
                      margin:
                        '0 auto',
                    }}
                  />


                  {/*
                   * Không hiển thị
                   * tên file nữa.
                   */}


                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      gap: '10px',
                      flexWrap:
                        'wrap',
                      marginTop:
                        '18px',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={
                        openFilePicker
                      }
                    >
                      <Icon
                        name="upload"
                        className="w-4 h-4"
                      />

                      Chọn ảnh khác
                    </button>


                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={
                        handleRemoveImage
                      }
                    >
                      <Icon
                        name="x"
                        className="w-4 h-4"
                      />

                      Xóa ảnh
                    </button>
                  </div>
                </div>
              ) : (
                /*
                 * CHƯA CHỌN ẢNH
                 */
                <>
                  <div className="upload-icon">
                    <Icon
                      name="upload"
                      className="w-6 h-6"
                    />
                  </div>


                  <h3>
                    Kéo thả ảnh vào đây
                  </h3>


                  {/*
                   * Không còn button
                   * "Chọn ảnh từ thiết bị".
                   *
                   * Người dùng chỉ cần
                   * click cả vùng này.
                   */}

                  <p>
                    hoặc{' '}
                    <span
                      style={{
                        color:
                          '#8b86ff',
                        fontWeight:
                          500,
                      }}
                    >
                      nhấn vào đây để chọn ảnh
                    </span>
                  </p>


                  <small>
                    PNG, JPG, WEBP • tối
                    đa 10 MB
                  </small>
                </>
              )}
            </div>


            <div className="upload-note">
              <Icon
                name="sparkles"
                className="w-4 h-4"
              />

              <span>
                Mẹo: Ảnh có chủ thể rõ,
                đủ sáng và ít vật thể
                chồng lấp thường cho kết
                quả tốt hơn.
              </span>
            </div>
          </section>


          {/* ======================= */}
          {/* STEP 02 - NHẬP PROMPT */}
          {/* ======================= */}

          <section className="panel step-panel">
            <div className="step-heading">
              <span className="step-number">
                02
              </span>

              <div>
                <h2>
                  Mô tả chuyển động
                </h2>

                <p>
                  Cho AI biết chủ thể,
                  camera và bối cảnh nên
                  chuyển động như thế nào.
                </p>
              </div>
            </div>


            <div className="prompt-box">
              <textarea
                value={prompt}
                maxLength={500}
                onChange={(
                  event
                ) => {
                  setPrompt(
                    event.target.value
                  );

                  if (error) {
                    setError('');
                  }
                }}
                placeholder="Ví dụ: Camera tiến chậm về phía trước, nhân vật khẽ quay đầu..."
              />


              <div className="prompt-footer">
                <button
                  type="button"
                  className="prompt-helper"
                  onClick={() => {
                    setPrompt(
                      'Camera tiến chậm về phía trước, chuyển động tự nhiên, ánh sáng điện ảnh'
                    );
                  }}
                >
                  <Icon
                    name="sparkles"
                    className="w-4 h-4"
                  />

                  Gợi ý prompt
                </button>


                <span>
                  {prompt.length} / 500
                </span>
              </div>
            </div>


            <div className="prompt-tags">
              <span>
                Gợi ý nhanh:
              </span>

              {[
                'Camera zoom chậm',
                'Chuyển động tự nhiên',
                'Ánh sáng điện ảnh',
                'Giữ khuôn mặt ổn định',
              ].map((text) => (
                <button
                  type="button"
                  key={text}
                  onClick={() => {
                    setPrompt(
                      (
                        current
                      ) =>
                        current
                          ? `${current}, ${text}`
                          : text
                    );

                    setError('');
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </section>


          {/* ========================== */}
          {/* STEP 03 - THIẾT LẬP VIDEO */}
          {/* ========================== */}

          <section className="panel step-panel">
            <div className="step-heading">
              <span className="step-number">
                03
              </span>

              <div>
                <h2>
                  Thiết lập video
                </h2>

                <p>
                  Tùy chỉnh video đầu ra
                  trước khi gửi tác vụ.
                </p>
              </div>
            </div>


            <div className="settings-grid">
              <SelectCard
                label="Mô hình AI"
                value={model}
                icon="sparkles"
                options={
                  MODEL_OPTIONS
                }
                onChange={
                  setModel
                }
              />

              <SelectCard
                label="Thời lượng"
                value={duration}
                icon="clock"
                options={
                  DURATION_OPTIONS
                }
                onChange={
                  setDuration
                }
              />

              <SelectCard
                label="Tỷ lệ khung hình"
                value={
                  aspectRatio
                }
                icon="video"
                options={
                  ASPECT_RATIO_OPTIONS
                }
                onChange={
                  setAspectRatio
                }
              />

              <SelectCard
                label="Phong cách"
                value={style}
                icon="image"
                options={
                  STYLE_OPTIONS
                }
                onChange={
                  setStyle
                }
              />
            </div>


            <div className="advanced-row">
              <div>
                <strong>
                  Tăng cường chất lượng
                </strong>

                <span>
                  Ưu tiên độ chi tiết và
                  chuyển động ổn định hơn
                </span>
              </div>

              <div
                className={
                  `toggle ${
                    enhanceQuality
                      ? 'on'
                      : ''
                  }`
                }
                role="checkbox"
                aria-checked={
                  enhanceQuality
                }
                tabIndex={0}
                onClick={() => {
                  setEnhanceQuality(
                    (current) =>
                      !current
                  );
                }}
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault();

                    setEnhanceQuality(
                      (current) =>
                        !current
                    );
                  }
                }}
                style={{
                  cursor:
                    'pointer',
                }}
              >
                <i />
              </div>
            </div>
          </section>
        </div>


        {/* ======================= */}
        {/* BÊN PHẢI - PREVIEW */}
        {/* ======================= */}

        <aside className="creator-side">
          <section className="panel preview-panel sticky-panel">
            <div className="preview-title">
              <h2>
                Xem trước tác vụ
              </h2>

              <span>
                BẢN NHÁP
              </span>
            </div>


            {previewUrl ? (
              <div
                className="empty-preview"
                style={{
                  overflow:
                    'hidden',
                }}
              >
                <img
                  src={previewUrl}
                  alt="Ảnh xem trước"
                  style={{
                    display:
                      'block',
                    width: '100%',
                    maxHeight:
                      '260px',
                    objectFit:
                      'cover',
                    borderRadius:
                      '12px',
                  }}
                />

                {/*
                 * Bỏ tên file.
                 * Bỏ luôn dòng
                 * "Hình ảnh đã sẵn sàng"
                 * để preview sạch hơn.
                 */}
              </div>
            ) : (
              <div className="empty-preview">
                <div>
                  <Icon
                    name="image"
                    className="w-7 h-7"
                  />
                </div>

                <strong>
                  Chưa có hình ảnh
                </strong>

                <span>
                  Ảnh bạn chọn sẽ xuất
                  hiện tại đây.
                </span>
              </div>
            )}


            <div className="summary-list">
              <div>
                <span>
                  Mô hình
                </span>

                <strong>
                  {
                    MODEL_OPTIONS.find(
                      (option) =>
                        option.value ===
                        model
                    )?.label
                  }
                </strong>
              </div>


              <div>
                <span>
                  Thời lượng
                </span>

                <strong>
                  {
                    DURATION_OPTIONS.find(
                      (option) =>
                        option.value ===
                        duration
                    )?.label
                  }
                </strong>
              </div>


              <div>
                <span>
                  Tỷ lệ
                </span>

                <strong>
                  {aspectRatio}
                </strong>
              </div>


              <div>
                <span>
                  Chất lượng
                </span>

                <strong>
                  {enhanceQuality
                    ? 'Tăng cường'
                    : 'Tiêu chuẩn'}
                </strong>
              </div>
            </div>


            <div className="cost-box">
              <div>
                <span>
                  Chi phí dự kiến
                </span>

                <strong>
                  {creditCost}{' '}

                  <small>
                    credit
                  </small>
                </strong>
              </div>


              <div className="balance-line">
                <span>
                  Số dư hiện tại
                </span>

                <strong>
                  {creditBalance}{' '}
                  credit
                </strong>
              </div>
            </div>


            {error && (
              <p
                style={{
                  color:
                    '#ef4444',
                  marginBottom:
                    '12px',
                  fontSize:
                    '14px',
                }}
              >
                {error}
              </p>
            )}


            <button
              type="button"
              className="btn btn-primary full large"
              onClick={
                handleCreateVideo
              }
              disabled={
                submitting
              }
            >
              <Icon
                name="sparkles"
                className="w-4 h-4"
              />

              {submitting
                ? 'Đang gửi...'
                : 'Tạo video'}
            </button>


            <p className="microcopy">
              Khi tạo video, tác vụ sẽ
              được đưa vào hàng đợi và
              credit tương ứng sẽ được
              sử dụng.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}