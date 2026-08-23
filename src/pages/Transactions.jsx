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
  StatusBadge,
} from '../components/UI';

import {
  getTransactions,
} from '../api/transactionApi';

import {
  getTransactionCreditText,
  getTransactionStatusLabel,
} from '../utils/transaction';

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

export default function Transactions() {
  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [page, setPage] =
    useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [total, setTotal] =
    useState(0);

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

  const [error, setError] =
    useState('');

  const loadTransactions =
    useCallback(async () => {
      try {
        setError('');
        setLoading(true);

        const result =
          await getTransactions({
            page,
            limit:
              PAGE_SIZE,
            search,
            order: 'desc',
          });

        setTransactions(
          result.items
        );

        setTotal(
          result.total
        );

        setTotalPages(
          result.totalPages
        );

      } catch (err) {
        setError(
          err.message ||
            'Không thể tải lịch sử giao dịch.'
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
  }, [
    loadTransactions,
  ]);

  const handleSearch =
    (event) => {
      event.preventDefault();

      setPage(1);

      setSearch(
        searchInput.trim()
      );
    };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="LỊCH SỬ GIAO DỊCH"
        title="Biến động credit"
        description="Theo dõi các lần nhận, hoàn và sử dụng credit."
      />

      <div className="table-toolbar">
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
            placeholder="Tìm theo nội dung giao dịch..."
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
            title="Đang tải giao dịch"
            description="Đang lấy lịch sử từ máy chủ."
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
                <Icon
                  name="refresh"
                  className="w-4 h-4"
                />

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
            title="Chưa có giao dịch"
            description={
              search
                ? 'Không tìm thấy giao dịch phù hợp.'
                : 'Các biến động credit sẽ xuất hiện tại đây.'
            }
            action={
              search ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                    setPage(1);
                  }}
                >
                  Xóa bộ lọc
                </button>
              ) : (
                <Link
                  to="/billing"
                  className="btn btn-primary"
                >
                  Xem gói credit
                </Link>
              )
            }
          />
        </section>
      ) : (
        <section className="table-card transaction-table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>
                    Mã giao dịch
                  </th>

                  <th>
                    Nội dung
                  </th>

                  <th>
                    Credit
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
                  (
                    transaction
                  ) => {
                    const creditText =
                      getTransactionCreditText(
                        transaction
                      );

                    const positive =
                      transaction.creditAmount >
                      0;

                    return (
                      <tr
                        key={
                          transaction.id ||
                          transaction.code
                        }
                      >
                        <td>
                          <strong>
                            {
                              transaction.code
                            }
                          </strong>
                        </td>

                        <td>
                          {transaction.videoId ? (
                            <Link
                              to={`/videos/${transaction.videoId}`}
                              className="transaction-link"
                            >
                              {
                                transaction.description
                              }
                            </Link>
                          ) : (
                            transaction.description
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              positive
                                ? 'credit-plus'
                                : 'credit-minus'
                            }
                          >
                            {
                              creditText
                            }
                          </span>
                        </td>

                        <td>
                          {formatMoney(
                            transaction.amount,
                            transaction.currency
                          )}
                        </td>

                        <td>
                          <StatusBadge
                            status={getTransactionStatusLabel(
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

              <span className="transaction-page">
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