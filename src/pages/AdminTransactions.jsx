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
  getAdminTransactions,
} from '../api/adminApi';

const PAGE_SIZE = 10;

function formatMoney(
  value,
  currency = 'VND'
) {
  const amount =
    Number(value || 0);

  if (amount === 0) {
    return '—';
  }

  return new Intl.NumberFormat(
    'vi-VN',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

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

function getStatusLabel(status) {
  const normalized =
    String(
      status || ''
    ).toUpperCase();

  const map = {
    COMPLETED:
      'Thành công',

    PENDING:
      'Đang chờ',

    FAILED:
      'Thất bại',

    REFUNDED:
      'Đã hoàn',
  };

  return (
    map[normalized] ||
    status ||
    'Không xác định'
  );
}

function getTypeLabel(type) {
  const normalized =
    String(
      type || ''
    ).toUpperCase();

  const map = {
    CREDIT:
      'Cộng credit',

    DEBIT:
      'Sử dụng credit',

    REFUND:
      'Hoàn credit',

    ADJUSTMENT:
      'Điều chỉnh',
  };

  return (
    map[normalized] ||
    type ||
    'Giao dịch'
  );
}

function normalizeTransaction(
  item = {}
) {
  return {
    id:
      item.id ||
      item.transaction_id ||
      '',

    type:
      String(
        item.type ||
        item.transaction_type ||
        ''
      ).toUpperCase(),

    status:
      String(
        item.status ||
        ''
      ).toUpperCase(),

    description:
      item.description ||
      '-',

    creditAmount:
      Number(
        item.creditAmount ??
        item.credit_amount ??
        0
      ),

    balanceAfter:
      Number(
        item.balanceAfter ??
        item.balance_after ??
        0
      ),

    amount:
      Number(
        item.amount ??
        0
      ),

    currency:
      item.currency ||
      'VND',

    createdAt:
      item.createdAt ??
      item.created_at ??
      null,

    user:
      item.user ||
      null,
  };
}

export default function AdminTransactions() {
  const [
    transactions,
    setTransactions,
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

  const loadTransactions =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const data =
          await getAdminTransactions({
            page,
            limit:
              PAGE_SIZE,
            search,
            order: 'desc',
          });

        const items =
          Array.isArray(
            data?.items
          )
            ? data.items
            : [];

        setTransactions(
          items.map(
            normalizeTransaction
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
            'Không thể tải giao dịch hệ thống.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      search,
    ]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleSearch =
    (event) => {
      event.preventDefault();

      setPage(1);

      setSearch(
        searchInput.trim()
      );
    };

  return (
    <div className="page-wrap admin-page">
      <PageHeader
        eyebrow="TÀI CHÍNH HỆ THỐNG"
        title="Giao dịch credit"
        description="Theo dõi toàn bộ giao dịch credit và thanh toán trong hệ thống."
        action={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={
              loadTransactions
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

      <div className="table-toolbar">
        <form
          className="search-field wide"
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
            placeholder="Tìm theo nội dung hoặc email người dùng..."
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

        {search && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearch('');
              setSearchInput('');
              setPage(1);
            }}
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {loading ? (
        <section className="table-card">
          <EmptyState
            icon="clock"
            title="Đang tải giao dịch"
            description="Đang lấy giao dịch hệ thống từ máy chủ."
          />
        </section>
      ) : error ? (
        <section className="table-card">
          <EmptyState
            icon="x"
            title="Không thể tải giao dịch"
            description={error}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  loadTransactions
                }
              >
                Thử lại
              </button>
            }
          />
        </section>
      ) : transactions.length ===
        0 ? (
        <section className="table-card">
          <EmptyState
            icon="receipt"
            title="Không có giao dịch"
            description={
              search
                ? 'Không tìm thấy giao dịch phù hợp.'
                : 'Hệ thống chưa có giao dịch.'
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
                    Mã giao dịch
                  </th>

                  <th>
                    Người dùng
                  </th>

                  <th>
                    Loại
                  </th>

                  <th>
                    Nội dung
                  </th>

                  <th>
                    Credit
                  </th>

                  <th>
                    Số dư sau
                  </th>

                  <th>
                    Số tiền
                  </th>

                  <th>
                    Trạng thái
                  </th>

                  <th>
                    Thời gian
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map(
                  (transaction) => {
                    const positive =
                      transaction.creditAmount >
                      0;

                    return (
                      <tr
                        key={
                          transaction.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              transaction.id
                            }
                          </strong>
                        </td>

                        <td>
                          <div>
                            <strong>
                              {transaction.user
                                ?.fullName ||
                                transaction.user
                                  ?.email ||
                                '-'}
                            </strong>

                            {transaction.user
                              ?.fullName &&
                              transaction.user
                                ?.email && (
                                <div>
                                  {
                                    transaction
                                      .user
                                      .email
                                  }
                                </div>
                              )}
                          </div>
                        </td>

                        <td>
                          {getTypeLabel(
                            transaction.type
                          )}
                        </td>

                        <td>
                          {
                            transaction.description
                          }
                        </td>

                        <td>
                          <span
                            className={
                              positive
                                ? 'credit-plus'
                                : 'credit-minus'
                            }
                          >
                            {positive
                              ? '+'
                              : ''}
                            {
                              transaction.creditAmount
                            }
                          </span>
                        </td>

                        <td>
                          {transaction.balanceAfter.toLocaleString(
                            'vi-VN'
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            transaction.amount,
                            transaction.currency
                          )}
                        </td>

                        <td>
                          <StatusBadge
                            status={getStatusLabel(
                              transaction.status
                            )}
                          />
                        </td>

                        <td>
                          {formatDateTime(
                            transaction.createdAt
                          )}
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
              giao dịch
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