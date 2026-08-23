import {
  useEffect,
  useState,
} from 'react';

import {
  createCheckout,
  getCreditPackages,
} from '../api/billingApi';

import Icon from '../components/Icon';

import {
  EmptyState,
  PageHeader,
  SectionTitle,
} from '../components/UI';

import {
  useAppData,
} from '../context/AppDataContext';

function formatMoney(
  value,
  currency = 'VND'
) {
  return new Intl.NumberFormat(
    'vi-VN',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value || 0)
  );
}

function getUnitPrice(
  price,
  credits
) {
  const creditCount =
    Number(credits || 0);

  if (creditCount <= 0) {
    return '';
  }

  const unit =
    Math.round(
      Number(price || 0) /
        creditCount
    );

  return `${unit.toLocaleString(
    'vi-VN'
  )} ₫ / credit`;
}

export default function Billing() {
  const {
    credit,
    refreshCredit,
  } = useAppData();

  const [
    packages,
    setPackages,
  ] = useState([]);

  const [
    paymentEnabled,
    setPaymentEnabled,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    checkoutError,
    setCheckoutError,
  ] = useState('');

  const [
    buyingPackageId,
    setBuyingPackageId,
  ] = useState('');

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState('bank');

  const balance =
    Number(
      credit?.balance ?? 0
    );

  const freeRemaining =
    Number(
      credit?.freeRemaining ?? 0
    );

  const freeLimit =
    Number(
      credit?.freeLimit ?? 0
    );

  const freeUsed =
    Number(
      credit?.freeUsed ?? 0
    );

  const paidCredit =
    Number(
      credit?.paidCredit ?? 0
    );

  const freeProgress =
    freeLimit > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              freeUsed /
              freeLimit
            ) * 100
          )
        )
      : 0;

  useEffect(() => {
    let cancelled = false;

    const loadPackages =
      async () => {
        try {
          setError('');
          setLoading(true);

          const result =
            await getCreditPackages();

          if (cancelled) {
            return;
          }

          setPackages(
            result.items
          );

          setPaymentEnabled(
            result.paymentEnabled
          );
        } catch (err) {
          if (cancelled) {
            return;
          }

          setError(
            err?.message ||
              'Không thể tải các gói credit.'
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBuy =
    async (packageId) => {
      setCheckoutError('');

      if (!paymentEnabled) {
        setCheckoutError(
          'Thanh toán hiện chưa được bật trên hệ thống.'
        );

        return;
      }

      try {
        setBuyingPackageId(
          packageId
        );

        const result =
          await createCheckout({
            packageId,
            paymentMethod,
          });

        if (
          result.checkoutUrl
        ) {
          window.location.assign(
            result.checkoutUrl
          );
        }

        await refreshCredit?.();
      } catch (err) {
        setCheckoutError(
          err?.message ||
            'Không thể tạo phiên thanh toán.'
        );
      } finally {
        setBuyingPackageId('');
      }
    };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="CREDIT & THANH TOÁN"
        title="Quản lý credit"
        description="Theo dõi số dư và mua thêm credit khi bạn cần tạo nhiều video hơn."
      />

      <div className="credit-overview">
        <section className="balance-card">
          <div className="balance-icon">
            <Icon
              name="sparkles"
              className="w-6 h-6"
            />
          </div>

          <div>
            <span>
              Tổng credit khả dụng
            </span>

            <strong>
              {balance}{' '}
              <small>
                credit
              </small>
            </strong>

            <p>
              Bao gồm{' '}
              {freeRemaining}{' '}
              credit miễn phí và{' '}
              {paidCredit}{' '}
              credit đã mua.
            </p>
          </div>

          <a
            href="#plans"
            className="btn btn-light"
          >
            Xem gói credit
          </a>
        </section>

        <section className="daily-card panel">
          <div className="daily-head">
            <div>
              <span>
                Credit miễn phí
              </span>

              <strong>
                {freeUsed}{' '}
                <small>
                  / {freeLimit}
                </small>
              </strong>
            </div>

            <div className="daily-icon">
              <Icon
                name="clock"
                className="w-5 h-5"
              />
            </div>
          </div>

          <div className="daily-progress">
            <i
              style={{
                width:
                  `${freeProgress}%`,
              }}
            />
          </div>

          <p>
            Còn{' '}
            {freeRemaining}{' '}
            credit miễn phí
          </p>
        </section>
      </div>

      <div id="plans">
        <SectionTitle
          title="Chọn gói credit"
          description={
            paymentEnabled
              ? 'Chọn gói phù hợp với nhu cầu sử dụng.'
              : 'Các gói hiện có trên hệ thống. Thanh toán trực tuyến chưa được bật.'
          }
        />
      </div>

      {loading ? (
        <section className="panel">
          <EmptyState
            icon="clock"
            title="Đang tải gói credit"
            description="Đang lấy dữ liệu từ máy chủ."
          />
        </section>
      ) : error ? (
        <section className="panel">
          <EmptyState
            icon="x"
            title="Không thể tải gói credit"
            description={error}
          />
        </section>
      ) : packages.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon="sparkles"
            title="Chưa có gói credit"
            description="Backend hiện chưa cung cấp gói credit nào."
          />
        </section>
      ) : (
        <div className="plans-grid">
          {packages.map(
            (item) => {
              const badge =
                item.badge ||
                (
                  item.featured
                    ? 'PHỔ BIẾN'
                    : null
                );

              return (
                <article
                  key={item.id}
                  className={
                    `plan-card ${
                      item.featured
                        ? 'featured'
                        : ''
                    }`
                  }
                >
                  {badge && (
                    <span className="plan-badge">
                      {badge}
                    </span>
                  )}

                  <div className="plan-head">
                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      {item.description ||
                        'Gói credit dành cho nhu cầu tạo video.'}
                    </p>
                  </div>

                  <div className="plan-credit">
                    <strong>
                      {item.credits.toLocaleString(
                        'vi-VN'
                      )}
                    </strong>

                    <span>
                      credit
                    </span>
                  </div>

                  <div className="plan-price">
                    <strong>
                      {formatMoney(
                        item.price,
                        item.currency
                      )}
                    </strong>

                    <span>
                      {getUnitPrice(
                        item.price,
                        item.credits
                      )}
                    </span>
                  </div>

                  <ul>
                    <li>
                      <Icon
                        name="check"
                        className="w-4 h-4"
                      />

                      Credit được cộng vào tài khoản sau thanh toán
                    </li>

                    <li>
                      <Icon
                        name="check"
                        className="w-4 h-4"
                      />

                      Dùng cho hệ thống tạo video
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      handleBuy(
                        item.id
                      )
                    }
                    disabled={
                      !paymentEnabled ||
                      buyingPackageId ===
                        item.id
                    }
                    className={
                      `btn full ${
                        item.featured
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`
                    }
                  >
                    {buyingPackageId ===
                    item.id
                      ? 'Đang xử lý...'
                      : paymentEnabled
                        ? 'Chọn gói này'
                        : 'Thanh toán chưa bật'}
                  </button>
                </article>
              );
            }
          )}
        </div>
      )}

      {checkoutError && (
        <div className="auth-error transaction-message">
          {checkoutError}
        </div>
      )}

      <section className="panel payment-section">
        <SectionTitle
          title="Phương thức thanh toán"
          description={
            paymentEnabled
              ? 'Chọn phương thức thanh toán.'
              : 'Backend hiện chưa được cấu hình cổng thanh toán.'
          }
        />

        <div className="payment-methods">
          <button
            type="button"
            className={
              `payment-item ${
                paymentMethod ===
                'bank'
                  ? 'selected'
                  : ''
              }`
            }
            onClick={() =>
              setPaymentMethod(
                'bank'
              )
            }
          >
            <div className="radio">
              {paymentMethod ===
                'bank' && (
                <i />
              )}
            </div>

            <div className="pay-logo bank">
              BANK
            </div>

            <div>
              <strong>
                Chuyển khoản ngân hàng
              </strong>

              <span>
                Thanh toán qua ngân hàng
              </span>
            </div>
          </button>

          <button
            type="button"
            className={
              `payment-item ${
                paymentMethod ===
                'momo'
                  ? 'selected'
                  : ''
              }`
            }
            onClick={() =>
              setPaymentMethod(
                'momo'
              )
            }
          >
            <div className="radio">
              {paymentMethod ===
                'momo' && (
                <i />
              )}
            </div>

            <div className="pay-logo momo">
              M
            </div>

            <div>
              <strong>
                Ví MoMo
              </strong>

              <span>
                Thanh toán qua ví điện tử
              </span>
            </div>
          </button>

          <button
            type="button"
            className={
              `payment-item ${
                paymentMethod ===
                'card'
                  ? 'selected'
                  : ''
              }`
            }
            onClick={() =>
              setPaymentMethod(
                'card'
              )
            }
          >
            <div className="radio">
              {paymentMethod ===
                'card' && (
                <i />
              )}
            </div>

            <div className="pay-logo card">
              <Icon
                name="card"
                className="w-5 h-5"
              />
            </div>

            <div>
              <strong>
                Thẻ ngân hàng
              </strong>

              <span>
                Visa, Mastercard, JCB
              </span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}